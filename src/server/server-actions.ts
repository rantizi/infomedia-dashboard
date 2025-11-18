"use server";

import { cookies } from "next/headers";

import { createServerClient } from "@/lib/supabase";

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
  });
}

export async function getPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  const value = cookie ? cookie.value.trim() : undefined;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const TENANT_ID_COOKIE = "tenant_id";

/**
 * Try to get tenant_id from the authenticated user's membership.
 * Returns null if user is not authenticated or has no membership.
 *
 * Note: This uses the service role client which doesn't have access to user sessions.
 * For a production implementation, you'd need to create a cookie-based auth client.
 * For now, this is a placeholder that will be enhanced when auth is fully configured.
 */
async function getTenantFromUserMembership(): Promise<string | null> {
  try {
    // TODO: Implement proper cookie-based auth client to read user session
    // For now, this returns null and relies on cookie/env fallbacks
    // In production, you would:
    // 1. Read Supabase auth cookies (sb-<project-ref>-auth-token)
    // 2. Create a user-scoped client (not service role)
    // 3. Get user from session
    // 4. Query memberships table for tenant_id
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to get the first tenant from the database (development fallback only).
 * Returns null if not in development or if query fails.
 */
async function getFirstTenantFromDatabase(): Promise<string | null> {
  // Only in development mode
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("tenants").select("id").limit(1).single();

    if (error || !data) {
      return null;
    }

    return data.id as string;
  } catch {
    return null;
  }
}

/**
 * Resolve the active tenant ID for the current request.
 *
 * Priority:
 * 1. `tenant_id` cookie (set after authentication/tenant switcher)
 * 2. Tenant from authenticated user's membership (if logged in)
 * 3. `SUPABASE_DEFAULT_TENANT_ID` env (dev fallback)
 * 4. `NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID` env (legacy fallback)
 * 5. First tenant from database (development mode only)
 *
 * Throws if no tenant can be determined so that the error boundary surfaces
 * a clear message during development.
 */
export async function getActiveTenantId(): Promise<string> {
  const cookieStore = await cookies();
  const tenantFromCookie = cookieStore.get(TENANT_ID_COOKIE)?.value;
  const tenantFromMembership = await getTenantFromUserMembership();
  const fallbackTenant =
    process.env.SUPABASE_DEFAULT_TENANT_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID;
  const firstTenantFromDb = await getFirstTenantFromDatabase();

  const tenantId = tenantFromCookie ?? tenantFromMembership ?? fallbackTenant ?? firstTenantFromDb;

  if (!tenantId) {
    throw new Error(
      "Unable to resolve tenant_id. Please:\n" +
        "1. Log in to your account (tenant will be derived from your membership), OR\n" +
        "2. Set a 'tenant_id' cookie, OR\n" +
        "3. Configure SUPABASE_DEFAULT_TENANT_ID in your .env.local file.\n\n" +
        "For development, you can add to .env.local:\n" +
        "SUPABASE_DEFAULT_TENANT_ID=your-tenant-uuid-here\n\n" +
        "Or ensure you have at least one tenant in your 'tenants' table.",
    );
  }

  return tenantId;
}
