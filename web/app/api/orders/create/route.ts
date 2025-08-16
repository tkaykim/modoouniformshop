import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { shopOrderNo, orderDraft } = await req.json();
    if (!shopOrderNo || !orderDraft) {
      return NextResponse.json({ error: 'missing_payload' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }
    const admin = createClient(url, serviceKey);

    // get user/session if available
    let sessionId = '';
    try {
      sessionId = req.headers.get('x-cart-session-id') || orderDraft?.sessionId || '';
    } catch {}

    const orderInsert = {
      shop_order_no: shopOrderNo,
      status: 'pending',
      payment_method: orderDraft.paymentMethod || 'card',
      subtotal: Number(orderDraft.subtotal || 0),
      shipping_fee: Number(orderDraft.shippingFee || 0),
      total_amount: Number(orderDraft.total || 0),
      order_name: orderDraft.orderName || null,
      order_phone: orderDraft.orderPhone || null,
      order_email: orderDraft.orderEmail || null,
      shipping_method: orderDraft.shippingMethod || null,
      same_as_orderer: !!orderDraft.sameAsOrderer,
      receiver_name: orderDraft.receiverName || null,
      receiver_phone: orderDraft.receiverPhone || null,
      zip_code: orderDraft.zipCode || null,
      addr1: orderDraft.addr1 || null,
      addr2: orderDraft.addr2 || null,
      session_id: sessionId || null,
    } as any;

    const { data: orderRow, error: orderErr } = await admin.from('orders').insert(orderInsert).select('id').single();
    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    // Optionally snapshot cart items at this moment for display
    // Skipped here for brevity; order items will be created on completion using actual cart snapshot

    return NextResponse.json({ ok: true, id: orderRow?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


