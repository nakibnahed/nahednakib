import { createClient } from "@supabase/supabase-js";

/**
 * Service role client (bypasses RLS). Use only in API routes after auth checks.
 */
export function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}

/** Same as getServiceRoleClient but returns null if env is missing (no throw). */
export function tryGetServiceRoleClient() {
  try {
    return getServiceRoleClient();
  } catch {
    return null;
  }
}
