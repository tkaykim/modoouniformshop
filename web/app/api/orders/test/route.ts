import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    const admin = createClient(url, serviceKey);

    const body = await req.json().catch(()=>({}));
    const shopOrderNo = body?.shopOrderNo || `TEST${Date.now()}`;
    const sessionId = body?.sessionId || 'test-session';

    // 1) Create pending order
    const orderInsert = {
      shop_order_no: shopOrderNo,
      status: 'pending',
      subtotal: 10000,
      shipping_fee: 0,
      total_amount: 10000,
      payment_method: 'card',
      order_name: '테스트주문자',
      order_phone: '01000000000',
      order_email: 'test@example.com',
      shipping_method: 'pickup',
      receiver_name: '테스트수령인',
      receiver_phone: '01000000000',
      addr1: '서울시 마포구 성지3길 55',
      addr2: '상세주소',
      session_id: sessionId,
    } as any;
    const { data: orderRow, error: orderErr } = await admin.from('orders').insert(orderInsert).select('id').single();
    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    const orderId = orderRow!.id as string;

    // 2) Insert one order_item
    const { error: itemErr } = await admin.from('order_items').insert({
      order_id: orderId,
      product_id: null,
      product_name: '테스트 상품',
      product_slug: null,
      selected_options: { color: '블랙', size: 'L' },
      unit_price: 10000,
      quantity: 1,
      total_price: 10000,
    } as any);
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

    // 3) Mark as paid
    const { error: updErr } = await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, shopOrderNo, orderId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


