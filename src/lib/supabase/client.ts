import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "./public-config";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
}
