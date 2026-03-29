/** Anon-Key (Dashboard → Settings → API) ist für Auth am zuverlässigsten; Publishable nur Fallback. */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local");
  return url;
}

export function getSupabasePublicKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  const key = anon || publishable;
  if (!key) {
    throw new Error(
      "Trage NEXT_PUBLIC_SUPABASE_ANON_KEY (empfohlen) oder NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local ein.",
    );
  }
  return key;
}
