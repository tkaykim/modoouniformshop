import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
    const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE) as string;
    if (!url || !serviceRole) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const supabase = createClient(url, serviceRole);

    const body = await req.json();
    const paths: string[] = Array.isArray(body?.paths) ? body.paths : [];
    if (!paths.length) return NextResponse.json({ error: "paths required" }, { status: 400 });

    const { error } = await supabase.storage.from("products").remove(paths);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

