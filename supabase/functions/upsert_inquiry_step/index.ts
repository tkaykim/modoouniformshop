// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequestBody = {
  session_id: string;
  step: number;
  payload: Record<string, any>;
  utm?: Record<string, any>;
};

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
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, { status: 405 });
  }

  let data: RequestBody;
  try {
    data = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, step, payload, utm } = data || {};
  if (!session_id || typeof step !== "number" || !payload) {
    console.warn("[edge] upsert_inquiry_step:bad-request", { session_id, step, payload });
    return jsonResponse({ error: "Missing required fields" }, { status: 400 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[edge] upsert_inquiry_step:missing-env");
    return jsonResponse({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { "Accept-Profile": "public" } },
  });

  // Try to find existing inquiry by session
  const { data: existing, error: findError } = await supabase
    .from("inquiries")
    .select("id, last_step_completed")
    .eq("session_id", session_id)
    .maybeSingle();

  if (findError) {
    console.error("[edge] upsert_inquiry_step:find:error", findError.message);
    return jsonResponse({ error: findError.message }, { status: 500 });
  }

  const nextLast = Math.max(step, existing?.last_step_completed ?? 0);
  const updateCols: Record<string, any> = { ...payload, utm, last_step_completed: nextLast };
  // Strip undefined to avoid overwriting with null/undefined
  Object.keys(updateCols).forEach((k) => updateCols[k] === undefined && delete updateCols[k]);

  if (!existing) {
    const insertPayload = { session_id, ...updateCols };
    const { data: inserted, error: insertError } = await supabase
      .from("inquiries")
      .insert(insertPayload)
      .select("id, last_step_completed")
      .single();
    if (insertError) {
      console.error("[edge] upsert_inquiry_step:insert:error", insertError.message);
      return jsonResponse({ error: insertError.message }, { status: 500 });
    }
    return jsonResponse({ inquiryId: inserted.id, last_step_completed: inserted.last_step_completed });
  }

  const { data: updated, error: updateError } = await supabase
    .from("inquiries")
    .update(updateCols)
    .eq("session_id", session_id)
    .select("id, last_step_completed")
    .single();
  if (updateError) {
    console.error("[edge] upsert_inquiry_step:update:error", updateError.message);
    return jsonResponse({ error: updateError.message }, { status: 500 });
  }
  return jsonResponse({ inquiryId: updated.id, last_step_completed: updated.last_step_completed });
});

