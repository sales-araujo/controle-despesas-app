import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  _client = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  return _client;
}
