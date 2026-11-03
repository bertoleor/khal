import { notFound } from 'next/navigation';

/**
 * Feature Flags System — Type-safe feature toggles for Khal Admin
 * 
 * Usage:
 *   import { isFeatureEnabled, FeatureFlags } from '@/lib/feature-flags';
 *   if (isFeatureEnabled(FeatureFlags.NEW_DASHBOARD)) { ... }
 * 
 * Flags are evaluated server-side (for SSR/SEO) and client-side (for interactivity).
 * Add new flags to the FeatureFlags enum and FLAG_DEFAULTS object.
 */

export enum FeatureFlags {
  // Dashboard
  NEW_DASHBOARD = 'new_dashboard',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  
  // Services
  SERVICE_BULK_ACTIONS = 'service_bulk_actions',
  SERVICE_IMPORT_EXPORT = 'service_import_export',
  SERVICE_AI_DESCRIPTIONS = 'service_ai_descriptions',
  
  // Appointments
  APPOINTMENT_REMINDERS = 'appointment_reminders',
  APPOINTMENT_RECURRING = 'appointment_recurring',
  APPOINTMENT_CALENDAR_VIEW = 'appointment_calendar_view',
  
  // Clients
  CLIENT_PROFILES = 'client_profiles',
  CLIENT_COMMUNICATION = 'client_communication',
  
  // System
  DARK_MODE_ONLY = 'dark_mode_only',
  EXPERIMENTAL_UI = 'experimental_ui',
  BETA_FEATURES = 'beta_features',
}

// Default flag states (can be overridden by env, DB, or user preferences)
const FLAG_DEFAULTS: Record<FeatureFlags, boolean> = {
  [FeatureFlags.NEW_DASHBOARD]: false,
  [FeatureFlags.ADVANCED_ANALYTICS]: false,
  [FeatureFlags.SERVICE_BULK_ACTIONS]: true,  // Already implemented
  [FeatureFlags.SERVICE_IMPORT_EXPORT]: false,
  [FeatureFlags.SERVICE_AI_DESCRIPTIONS]: false,
  [FeatureFlags.APPOINTMENT_REMINDERS]: false,
  [FeatureFlags.APPOINTMENT_RECURRING]: false,
  [FeatureFlags.APPOINTMENT_CALENDAR_VIEW]: false,
  [FeatureFlags.CLIENT_PROFILES]: false,
  [FeatureFlags.CLIENT_COMMUNICATION]: false,
  [FeatureFlags.DARK_MODE_ONLY]: false,
  [FeatureFlags.EXPERIMENTAL_UI]: false,
  [FeatureFlags.BETA_FEATURES]: false,
};

// Environment variable prefix for flags
const ENV_PREFIX = 'KHAL_FF_';

/**
 * Get flag value from environment variable
 * Format: KHAL_FF_<FLAG_NAME>=true|false
 */
function getEnvFlag(flag: FeatureFlags): boolean | null {
  const envKey = `${ENV_PREFIX}${flag.toUpperCase()}`;
  const value = process.env[envKey];
  if (value === undefined) return null;
  return value === 'true';
}

/**
 * Get flag value from user preferences (stored in localStorage/client-side)
 * Server-side: returns default (localStorage not available)
 */
function getUserFlag(flag: FeatureFlags): boolean | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`ff_${flag}`);
    if (stored === null) return null;
    return stored === 'true';
  } catch {
    return null;
  }
}

/**
 * Get flag value from database (async, server-side only)
 * For future: per-user or per-tenant flag overrides
 */
async function getDbFlag(flag: FeatureFlags): Promise<boolean | null> {
  // TODO: Implement when per-user flags needed
  // Could fetch from Supabase: settings table or user_preferences
  return null;
}

/**
 * Core flag evaluation - checks env > user > db > default
 * Server-side: checks env, then default
 * Client-side: checks env, user localStorage, then default
 */
export async function isFeatureEnabled(
  flag: FeatureFlags,
  options?: { userId?: string }
): Promise<boolean> {
  // 1. Environment variable (highest priority - deployment control)
  const envValue = getEnvFlag(flag);
  if (envValue !== null) return envValue;

  // 2. Database (per-user/tenant overrides)
  if (options?.userId) {
    const dbValue = await getDbFlag(flag);
    if (dbValue !== null) return dbValue;
  }

  // 3. User preference (client-side only)
  if (typeof window !== 'undefined') {
    const userValue = getUserFlag(flag);
    if (userValue !== null) return userValue;
  }

  // 4. Default (lowest priority)
  return FLAG_DEFAULTS[flag];
}

/**
 * Synchronous version for client-side only (uses cached/default values)
 * Does NOT check database or async sources
 */
export function isFeatureEnabledSync(flag: FeatureFlags): boolean {
  // 1. Environment variable
  const envValue = getEnvFlag(flag);
  if (envValue !== null) return envValue;

  // 2. User preference (localStorage)
  if (typeof window !== 'undefined') {
    const userValue = getUserFlag(flag);
    if (userValue !== null) return userValue;
  }

  // 3. Default
  return FLAG_DEFAULTS[flag];
}

/**
 * Set user preference for a flag (client-side only)
 * Persists to localStorage
 */
export function setUserFeatureFlag(flag: FeatureFlags, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`ff_${flag}`, enabled.toString());
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('feature-flag-changed', {
      detail: { flag, enabled }
    }));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

/**
 * Get all flags with their current evaluated state (for debugging/admin UI)
 */
export async function getAllFlags(userId?: string): Promise<Record<FeatureFlags, boolean>> {
  const result = {} as Record<FeatureFlags, boolean>;
  
  for (const flag of Object.values(FeatureFlags)) {
    result[flag] = await isFeatureEnabled(flag, { userId });
  }
  
  return result;
}

/**
 * React hook for client-side feature flag usage
 */
export function useFeatureFlag(flag: FeatureFlags): boolean {
  // This would be implemented with React context in a real app
  // For now, use the sync version
  if (typeof window === 'undefined') {
    return FLAG_DEFAULTS[flag];
  }
  return isFeatureEnabledSync(flag);
}

/**
 * Feature flag context provider (for React)
 * Wraps app to provide flags via context
 */
export const FeatureFlagContext = {
  // To be implemented with React.createContext
  // Provider fetches all flags on mount and provides via context
};

/**
 * Check multiple flags at once (all must be true)
 */
export async function areAllFeaturesEnabled(
  flags: FeatureFlags[],
  options?: { userId?: string }
): Promise<boolean> {
  for (const flag of flags) {
    if (!(await isFeatureEnabled(flag, options))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if any of multiple flags are enabled
 */
export async function isAnyFeatureEnabled(
  flags: FeatureFlags[],
  options?: { userId?: string }
): Promise<boolean> {
  for (const flag of flags) {
    if (await isFeatureEnabled(flag, options)) {
      return true;
    }
  }
  return false;
}

// Export types for consumers
export type { FeatureFlags as FeatureFlagType };

// Re-export enum as const for type safety
export const FEATURE_FLAGS = FeatureFlags;
