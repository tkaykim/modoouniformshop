import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
    const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE) as string;
    if (!url || !serviceRole) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    const supabase = createClient(url, serviceRole);

    const { title, description, photo, date, category } = await req.json();
    if (!title || !photo) return NextResponse.json({ error: "missing title or photo" }, { status: 400 });

    const payload = { title, description: description || "", photo, date, category: category || "" };
    const { data, error } = await supabase
      .from('portfolio')
      .insert([{ title, description: payload.description, photo, date, category, is_active: true }])
      .select('id, title, description, photo, date, category, sort_order, created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ row: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

