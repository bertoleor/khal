import type { NextRequest } from "next/server";

// Provisional auth (CQ-04). Swapped for Supabase JWT custom claims
// (auth.jwt() -> app_metadata.role, ADMIN-04/ARCH-05) once auth is provisioned.
export type Role = "admin" | "anon";

export function getRole(request: NextRequest): Role {
  return request.cookies.get("khal_role")?.value === "admin" ? "admin" : "anon";
}
