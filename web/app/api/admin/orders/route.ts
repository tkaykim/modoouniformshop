import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) throw new Error('server_misconfigured');
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAdmin();
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const id = req.nextUrl.searchParams.get('id') || undefined;
    const base = admin.from('orders').select('*, order_items(*)') as any;
    if (id) {
      const { data, error } = await base.eq('id', id).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 404 });
      return NextResponse.json({ ok: true, item: data });
    }
    const q = base.order('created_at', { ascending: false });
    const { data } = status ? await q.eq('status', status) : await q;
    return NextResponse.json({ ok: true, items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, patch } = body || {};
    if (!id || !patch) return NextResponse.json({ error: 'missing_payload' }, { status: 400 });
    const admin = getAdmin();
    const { data, error } = await admin.from('orders').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


