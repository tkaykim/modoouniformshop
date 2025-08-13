// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers({ "Content-Type": "application/json", ...corsHeaders });
  if (init.headers) {
    const extra = new Headers(init.headers as HeadersInit);
    extra.forEach((v, k) => headers.set(k, v));
  }
  return new Response(JSON.stringify(body), { headers, ...init });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, { status: 405 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return jsonResponse({ error: "Server misconfigured" }, { status: 500 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // try to create bucket (idempotent)
  const bucketId = "reviews";
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) return jsonResponse({ error: listErr.message }, { status: 500 });
  const exists = (buckets || []).some((b: any) => b.id === bucketId);
  if (!exists) {
    const { error: createErr } = await supabase.storage.createBucket(bucketId, { public: true });
    if (createErr) return jsonResponse({ error: createErr.message }, { status: 500 });
  }
  return jsonResponse({ ok: true, bucket: bucketId, created: !exists });
});

