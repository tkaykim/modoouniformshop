import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
	try {
		if (!supabaseAdmin) return NextResponse.json({ error: "server not configured" }, { status: 500 });
		const { id } = await req.json();
		if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
		const { data, error } = await supabaseAdmin.from("reviews").select("view_count").eq("id", id).single();
		if (error) return NextResponse.json({ error: error.message }, { status: 400 });
		const nextCount = (data?.view_count ?? 0) + 1;
		const { error: updateErr } = await supabaseAdmin.from("reviews").update({ view_count: nextCount }).eq("id", id);
		if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
		return NextResponse.json({ ok: true, view_count: nextCount });
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}

