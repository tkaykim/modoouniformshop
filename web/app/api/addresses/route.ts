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
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'missing_user_id' }, { status: 400 });
    const admin = getAdmin();
    const { data } = await admin.from('user_addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    return NextResponse.json({ ok: true, items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, address } = body || {};
    if (!userId || !address) return NextResponse.json({ error: 'missing_payload' }, { status: 400 });
    const admin = getAdmin();
    if (address.is_default) {
      await admin.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }
    const { data, error } = await admin.from('user_addresses').insert({ ...address, user_id: userId }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, id, address } = body || {};
    if (!userId || !id || !address) return NextResponse.json({ error: 'missing_payload' }, { status: 400 });
    const admin = getAdmin();
    if (address.is_default) {
      await admin.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }
    const { data, error } = await admin.from('user_addresses').update(address).eq('id', id).eq('user_id', userId).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    if (!userId || !id) return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    const admin = getAdmin();
    await admin.from('user_addresses').delete().eq('id', id).eq('user_id', userId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


