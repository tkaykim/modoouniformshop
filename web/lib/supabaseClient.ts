import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabaseClient] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure .env.local"
  );
}

type SupabaseClientType = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __supabase__: SupabaseClientType | undefined;
}

export const supabase: SupabaseClientType = (() => {
  if (typeof window !== "undefined") {
    const g = globalThis as unknown as { __supabase__?: SupabaseClientType };
    if (!g.__supabase__) {
      g.__supabase__ = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");
    }
    return g.__supabase__ as SupabaseClientType;
  }
  // SSR/Edge: create per-request instance (no browser storage)
  return createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");
})();

