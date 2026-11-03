'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  FeatureFlags, 
  isFeatureEnabledSync, 
  setUserFeatureFlag, 
  getAllFlags,
  type FeatureFlags as FeatureFlagType 
} from './feature-flags';

interface FeatureFlagsContextValue {
  flags: Record<FeatureFlags, boolean>;
  isEnabled: (flag: FeatureFlags) => boolean;
  setFlag: (flag: FeatureFlags, enabled: boolean) => void;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

/**
 * Provider component - wraps app to provide feature flags via context
 * Fetches all flags on mount and listens for changes
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<FeatureFlags, boolean>>({} as Record<FeatureFlags, boolean>);
  const [mounted, setMounted] = useState(false);

  // Initial sync load (synchronous)
  useEffect(() => {
    const initialFlags = {} as Record<FeatureFlags, boolean>;
    for (const flag of Object.values(FeatureFlags)) {
      initialFlags[flag] = isFeatureEnabledSync(flag);
    }
    setFlags(initialFlags);
    setMounted(true);
  }, []);

  // Listen for localStorage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('ff_')) {
        const flag = e.key.replace('ff_', '') as FeatureFlags;
        setFlags(prev => ({ ...prev, [flag]: e.newValue === 'true' }));
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const { flag, enabled } = e.detail;
      setFlags(prev => ({ ...prev, [flag]: enabled }));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feature-flag-changed', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('feature-flag-changed', handleCustomEvent as EventListener);
    };
  }, []);

  // Refresh all flags (e.g., after login/user change)
  const refreshFlags = async () => {
    const allFlags = await getAllFlags();
    setFlags(allFlags);
  };

  // Toggle a flag for current user
  const setFlag = (flag: FeatureFlags, enabled: boolean) => {
    setUserFeatureFlag(flag, enabled);
    setFlags(prev => ({ ...prev, [flag]: enabled }));
  };

  // Check if a flag is enabled
  const isEnabled = (flag: FeatureFlags): boolean => {
    return flags[flag] ?? false;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FeatureFlagsContext.Provider value={{ flags, isEnabled, setFlag, refreshFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags in components
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    // Fallback for components outside provider (SSR, etc.)
    return {
      flags: {} as Record<FeatureFlags, boolean>,
      isEnabled: (flag: FeatureFlags) => isFeatureEnabledSync(flag),
      setFlag: () => {},
      refreshFlags: async () => {},
    };
  }
  
  return context;
}

/**
 * Hook for a single feature flag (simpler API)
 */
export function useFeatureFlag(flag: FeatureFlags): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
}

/**
 * Hook for multiple feature flags (all must be enabled)
 */
export function useAllFeatureFlags(flags: FeatureFlags[]): boolean {
  const { isEnabled } = useFeatureFlags();
  return flags.every(flag => isEnabled(flag));
}

/**
 * Hook for any feature flag (at least one enabled)
 */
export function useAnyFeatureFlag(flags: FeatureFlags[]): boolean {
  const { isEnabled } = useFeatureFlags();
  return flags.some(flag => isEnabled(flag));
}

/**
 * HOC for feature-gated components
 */
export function withFeatureFlag<P extends object>(
  flag: FeatureFlags,
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
) {
  return function WithFeatureFlag(props: P) {
    const { isEnabled } = useFeatureFlags();
    
    if (!isEnabled(flag)) {
      return Fallback ? <Fallback {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Component that renders children only if flag is enabled
 */
interface FeatureGateProps {
  flag: FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const { isEnabled } = useFeatureFlags();
  
  if (!isEnabled(flag)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component that renders children if ANY of the flags are enabled
 */
interface AnyFeatureGateProps {
  flags: FeatureFlags[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyFeatureGate({ flags, children, fallback = null }: AnyFeatureGateProps) {
  const { isEnabled } = useFeatureFlags();
  
  if (!flags.some(flag => isEnabled(flag))) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component that renders children only if ALL flags are enabled
 */
interface AllFeatureGateProps {
  flags: FeatureFlags[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AllFeatureGate({ flags, children, fallback = null }: AllFeatureGateProps) {
  const { isEnabled } = useFeatureFlags();
  
  if (!flags.every(flag => isEnabled(flag))) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
