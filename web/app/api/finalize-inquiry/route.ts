import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RequestBody = { session_id: string };

export async function POST(req: NextRequest) {
  try {
    const { session_id } = (await req.json()) as RequestBody;
    if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceRole) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabase = createClient(url, serviceRole);
    const { data: inquiry, error: findErr } = await supabase
      .from("inquiries")
      .select("id, status")
      .eq("session_id", session_id)
      .maybeSingle();
    if (findErr) {
      console.error("[api-route] finalize-inquiry:find:error", findErr.message);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }
    if (!inquiry) {
      console.warn("[api-route] finalize-inquiry:not-found", { session_id });
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const { data: updated, error: updErr } = await supabase
      .from("inquiries")
      .update({ status: "awaiting_reply" })
      .eq("id", inquiry.id)
      .select("id, status")
      .single();
    if (updErr) {
      console.error("[api-route] finalize-inquiry:update:error", updErr.message);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ inquiryId: updated.id, status: updated.status });
  } catch (e) {
    console.error("[api-route] finalize-inquiry:exception", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

