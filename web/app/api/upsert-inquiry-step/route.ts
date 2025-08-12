import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RequestBody = {
  session_id: string;
  step: number;
  payload: Record<string, unknown>;
  utm?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  try {
    const { session_id, step, payload, utm } = (await req.json()) as RequestBody;
    console.info("[api-route] upsert-inquiry-step:request", { session_id, step, payload, utm });
    if (!session_id || typeof step !== "number" || !payload) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceRole) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(url, serviceRole);
    const { data: existing, error: findError } = await supabase
      .from("inquiries")
      .select("id, last_step_completed")
      .eq("session_id", session_id)
      .maybeSingle();
    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

    const updateCols: Record<string, unknown> = { ...payload, utm, last_step_completed: step };
    Object.keys(updateCols).forEach((k) => {
      const record = updateCols as Record<string, unknown>;
      if (record[k] === undefined) delete record[k];
    });

    if (!existing) {
      const insertPayload = { session_id, ...updateCols };
      const { data: inserted, error: insertError } = await supabase
        .from("inquiries")
        .insert(insertPayload)
        .select("id, last_step_completed")
        .single();
      if (insertError) {
        console.error("[api-route] upsert-inquiry-step:insert:error", insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ inquiryId: inserted.id, last_step_completed: inserted.last_step_completed });
    }

    const { data: updated, error: updateError } = await supabase
      .from("inquiries")
      .update(updateCols)
      .eq("session_id", session_id)
      .select("id, last_step_completed")
      .single();
    if (updateError) {
      console.error("[api-route] upsert-inquiry-step:update:error", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ inquiryId: updated.id, last_step_completed: updated.last_step_completed });
  } catch (e) {
    console.error("[api-route] upsert-inquiry-step:exception", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

