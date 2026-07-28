import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — server-only. Never import from client components.
 * Alias of createServiceClient for admin/command code paths.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
