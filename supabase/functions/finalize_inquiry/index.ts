// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequestBody = { session_id: string };

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, { status: 405 });

  let data: RequestBody;
  try {
    data = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id } = data || {};
  if (!session_id) {
    console.warn("[edge] finalize_inquiry:bad-request", { session_id });
    return jsonResponse({ error: "Missing session_id" }, { status: 400 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[edge] finalize_inquiry:missing-env");
    return jsonResponse({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { "Accept-Profile": "public" } },
  });

  const { data: inquiry, error: findErr } = await supabase
    .from("inquiries")
    .select("id, status")
    .eq("session_id", session_id)
    .maybeSingle();
  if (findErr) {
    console.error("[edge] finalize_inquiry:find:error", findErr.message);
    return jsonResponse({ error: findErr.message }, { status: 500 });
  }
  if (!inquiry) {
    console.warn("[edge] finalize_inquiry:not-found", { session_id });
    return jsonResponse({ error: "Inquiry not found" }, { status: 404 });
  }

  const { data: updated, error: updErr } = await supabase
    .from("inquiries")
    .update({ status: "awaiting_reply" })
    .eq("id", inquiry.id)
    .select("id, status")
    .single();
  if (updErr) {
    console.error("[edge] finalize_inquiry:update:error", updErr.message);
    return jsonResponse({ error: updErr.message }, { status: 500 });
  }

  return jsonResponse({ inquiryId: updated.id, status: updated.status });
});

