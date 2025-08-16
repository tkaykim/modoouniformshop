import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    const admin = createClient(url, serviceKey);

    const { days = 2, mode } = await req.json().catch(()=>({}));
    const { data: orders } = await admin.from('orders').select('id, shop_order_no, created_at, status, payment_status, pg_authorization_id, attributes').in('status', ['pending','paid']);
    const updated: any[] = [];
    for (const o of orders || []) {
      try {
        const d = new Date(o.created_at);
        const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
        const transactionDate = `${yyyy}${mm}${dd}`;
        const resp = await fetch(`${req.nextUrl.origin}/api/trades/retrieveTransaction`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(mode?{ 'x-easypay-mode': String(mode)}:{}) },
          body: JSON.stringify({ shopTransactionId: o.shop_order_no, transactionDate })
        });
        const json = await resp.json();
        if (!resp.ok) {
          await admin.from('orders').update({ payment_status: 'pending', status: 'pending', attributes: { ...(o.attributes||{}), reconcile_flag: 'PG_HTTP_ERROR' } }).eq('id', o.id);
          continue;
        }
        const resCd = String(json?.result?.resCd || json?.result?.paymentInfo?.resCd || '');
        if (resCd !== '0000') {
          await admin.from('orders').update({ payment_status: 'pending', status: 'pending', attributes: { ...(o.attributes||{}), reconcile_flag: 'PG_NOT_FOUND_OR_ERROR', pg_resCd: resCd } }).eq('id', o.id);
          continue;
        }
        const statusCode = String(json?.result?.statusCode || json?.result?.paymentInfo?.statusCode || '');
        const authorizationId = String(json?.result?.authorizationId || '');
        if (o.pg_authorization_id && authorizationId && authorizationId !== o.pg_authorization_id) {
          await admin.from('orders').update({ payment_status: 'pending', status: 'pending', attributes: { ...(o.attributes||{}), reconcile_flag: 'AUTH_ID_MISMATCH' } }).eq('id', o.id);
          continue;
        }
        let payment_status: string | null = null;
        if (statusCode === 'TS01') payment_status = 'paid';
        else if (statusCode === 'TS02') payment_status = 'cancelled';
        else if (statusCode.startsWith('RF')) payment_status = 'refund';
        if (!payment_status) {
          await admin.from('orders').update({ payment_status: 'pending', status: 'pending', attributes: { ...(o.attributes||{}), reconcile_flag: 'NO_STATUS', pg_statusCode: statusCode } }).eq('id', o.id);
          continue;
        }
        if (payment_status !== o.payment_status) {
          await admin.from('orders').update({ payment_status, status: payment_status }).eq('id', o.id);
          updated.push({ id: o.id, payment_status, statusCode });
        }
      } catch {}
    }
    return NextResponse.json({ ok: true, updated });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


