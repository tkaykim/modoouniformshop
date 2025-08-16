import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { shopOrderNo, authorizationId, returnPayload } = await req.json();
    if (!shopOrderNo) return NextResponse.json({ error: 'missing_shop_order_no' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    const admin = createClient(url, serviceKey);

    // load pending order
    const { data: order, error: findErr } = await admin.from('orders').select('*').eq('shop_order_no', shopOrderNo).single();
    if (findErr || !order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

    // create order_items from current cart snapshot for this user/session
    let cartFilter: any = {};
    if (order.user_id) cartFilter.user_id = order.user_id;
    else if (order.session_id) cartFilter.session_id = order.session_id;

    let items: any[] = [];
    if (cartFilter.user_id || cartFilter.session_id) {
      const { data: cartRows } = await admin.from('cart_items').select('*').match(cartFilter);
      items = cartRows || [];
    }

    // Load product snapshot for naming
    const productIds = Array.from(new Set(items.map((x) => x.product_id))).filter(Boolean);
    let prodMap: Record<string, any> = {};
    if (productIds.length) {
      const { data: prods } = await admin.from('products').select('id,name,slug').in('id', productIds);
      (prods || []).forEach((p: any) => { prodMap[p.id] = p; });
    }

    if (items.length) {
      const orderItems = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        product_name: prodMap[it.product_id]?.name || null,
        product_slug: prodMap[it.product_id]?.slug || null,
        selected_options: it.selected_options || null,
        unit_price: Number(it.unit_price),
        quantity: Number(it.quantity),
        total_price: Number(it.total_price),
      }));
      await admin.from('order_items').insert(orderItems);
    }

    // mark order as paid
    await admin.from('orders').update({ status: 'paid', pg_authorization_id: authorizationId || null, pg_return_payload: returnPayload || null }).eq('id', order.id);

    // clear cart
    if (cartFilter.user_id || cartFilter.session_id) {
      await admin.from('cart_items').delete().match(cartFilter);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


