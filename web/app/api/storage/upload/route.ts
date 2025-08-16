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

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const path = (form.get("path") as string) || `misc/${Date.now()}.bin`;
    const bucket = ((form.get("bucket") as string) || "products").trim();
    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: pub.publicUrl, path, bucket });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

