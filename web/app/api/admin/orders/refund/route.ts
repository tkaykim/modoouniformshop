import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const TEST_REVISE_URL = "https://testpgapi.easypay.co.kr/api/trades/revise";
const PROD_REVISE_URL = "https://pgapi.easypay.co.kr/api/trades/revise";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    const admin = createClient(url, serviceKey);

    const { orderId, amount, reason, refundInfo, reviseTypeCode: inputReviseTypeCode, reviseSubTypeCode, refundImmediate } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'missing_order_id' }, { status: 400 });

    // load order for shopOrderNo and pg info
    const { data: order, error: findErr } = await admin.from('orders').select('*').eq('id', orderId).single();
    if (findErr || !order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

    const headerMode = (req.headers.get('x-easypay-mode') || '').toLowerCase();
    const apiMode = (headerMode || (process.env.EASYPAY_API_MODE || 'prod')).toLowerCase();
    const endpoint = apiMode === 'prod' ? PROD_REVISE_URL : TEST_REVISE_URL;
    const mallId = (process.env.EASYPAY_MALL_ID as string);
    if (!mallId) return NextResponse.json({ error: 'missing_mall' }, { status: 500 });
    let pgCno = String(order?.pg_approval?.pgCno || order?.pg_return_payload?.approval?.pgCno || order?.pg_return_payload?.pgCno || '');
    if (!pgCno) {
      // Fallback: try retrieveTransaction to obtain pgCno
      try {
        const txId = String(
          order?.pg_approval?.shopTransactionId ||
          order?.pg_return_payload?.approval?.shopTransactionId ||
          order?.pg_return_payload?.shopTransactionId || ''
        );
        if (txId) {
          const d = new Date(order.created_at);
          const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
          const transactionDate = `${y}${m}${day}`;
          const r = await fetch(`${req.nextUrl.origin}/api/trades/retrieveTransaction`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mallId, shopTransactionId: txId, transactionDate }) });
          const j = await r.json().catch(()=>({}));
          if (r.ok) {
            const res = j?.result || j;
            if (String(res?.resCd) === '0000' && res?.pgCno) {
              pgCno = String(res.pgCno);
            }
          }
        }
      } catch {}
      if (!pgCno) {
        return NextResponse.json({ error: 'missing_pgCno', message: 'PG 승인거래번호를 찾을 수 없습니다.' }, { status: 400 });
      }
    }

    // Build payload for full(40) or partial(32) cancel
    const now1 = new Date();
    const yyyy = now1.getFullYear(); const mm = String(now1.getMonth()+1).padStart(2,'0'); const dd = String(now1.getDate()).padStart(2,'0');
    const cancelReqDate = `${yyyy}${mm}${dd}`;
    // Determine revise type strictly by payment method (server-enforced)
    const isPartial = amount && Number(amount) > 0 && Number(amount) < Number(order.total_amount);
    const payMethod = String(order.payment_method || '').toLowerCase();
    const isCard = payMethod === 'card';
    let reviseTypeCode: string;
    let subType: string | undefined = undefined;
    if (isCard) {
      // 카드: 취소만 허용 (전체=40, 부분=32)
      reviseTypeCode = isPartial ? '32' : '40';
    } else {
      // 비카드: 환불만 허용 (지결: 60/62, 즉시: 63)
      if (!refundInfo) {
        return NextResponse.json({ error: 'missing_refundInfo', message: '환불 경로에는 환불계좌 정보(refundInfo)가 필수입니다.' }, { status: 400 });
      }
      if (refundImmediate) {
        reviseTypeCode = '63';
        subType = isPartial ? '11' : '10'; // 계좌인증 기본값
      } else {
        reviseTypeCode = isPartial ? '62' : '60';
        subType = reviseSubTypeCode || 'RF01';
      }
    }

    // Generate daily-unique shopTransactionId per revise request (문서: 일별 Unique 권고)
    const now2 = new Date();
    const yyyy2 = now2.getFullYear(); const mm2 = String(now2.getMonth()+1).padStart(2,'0'); const dd2 = String(now2.getDate()).padStart(2,'0');
    const shopTransactionId = `${yyyy2}${mm2}${dd2}${Math.floor(Math.random()*1e9)}`;

    const payload: any = {
      mallId,
      shopTransactionId,
      pgCno,
      reviseTypeCode,
      cancelReqDate,
      reviseMessage: reason || 'refund',
    };
    if (reviseTypeCode === '32' || reviseTypeCode === '33' || reviseTypeCode === '62' || reviseTypeCode === '63') {
      const amt = Number(amount);
      if (!(amt > 0) || amt >= Number(order.total_amount)) {
        return NextResponse.json({ error: 'invalid_amount', message: '부분 처리에는 0보다 크고 총액 미만의 금액이어야 합니다.' }, { status: 400 });
      }
      payload.amount = amt;
      if (reviseTypeCode === '32' || reviseTypeCode === '33') {
        payload.remainAmount = Math.max(0, Number(order.total_amount) - Number(order.refunded_amount || 0) - amt);
      }
    }
    if (!isCard) {
      payload.reviseSubTypeCode = subType;
      payload.refundInfo = refundInfo; // { refundBankCode, refundAccountNo, refundDepositName, depositPgCno? }
    }

    // msgAuthValue는 서버 새로운 통합 revise 라우트에서 부여

    const epRes = await fetch(`${req.nextUrl.origin}/api/trades/revise`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (!epRes.ok) {
      const text = await epRes.text();
      return NextResponse.json({ error:'revise_failed', detail: text }, { status: 502 });
    }
    const data = await epRes.json();
    if (String(data?.resCd) !== '0000') {
      return NextResponse.json({ error:'revise_res_failed', detail: data }, { status: 400 });
    }
    let newRefunded = Number(order.refunded_amount || 0);
    if (reviseTypeCode === '40' || reviseTypeCode === '60') {
      newRefunded = Number(order.total_amount);
    } else if (reviseTypeCode === '32' || reviseTypeCode === '33' || reviseTypeCode === '62' || reviseTypeCode === '63') {
      newRefunded = newRefunded + Number(amount || 0);
    }
    const payment_status = (reviseTypeCode === '40') ? 'cancelled' : 'refund';
    await admin.from('orders').update({ refunded_amount: newRefunded, status: payment_status, payment_status, refund_reason: reason || null }).eq('id', orderId);
    return NextResponse.json({ ok:true, revise:data });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


