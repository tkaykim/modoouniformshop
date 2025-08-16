import { NextRequest, NextResponse } from "next/server";

function toObjectFromForm(form: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of form.entries()) obj[k] = typeof v === 'string' ? v : '';
  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    let payload: any = {};
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) payload = await req.json().catch(() => ({}));
    else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) payload = toObjectFromForm(await req.formData());
    else payload = await req.json().catch(() => ({}));

    const resCd = String(payload.resCd || '');
    const resMsg = String(payload.resMsg || '');
    const authorizationId = String(payload.authorizationId || '');
    const shopOrderNo = String(payload.shopOrderNo || '');

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const approvalReqDate = `${yyyy}${mm}${dd}`;
    const shopTransactionId = shopOrderNo || `${approvalReqDate}${Math.floor(Math.random()*1e9)}`;

    let approvalOk = false;
    try {
      if (authorizationId && shopOrderNo) {
        const approveRes = await fetch(`${origin}/api/payments/easypay/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorizationId, shopTransactionId, shopOrderNo, approvalReqDate })
        });
        approvalOk = approveRes.ok;
      }
    } catch {}

    // 실패/취소 시 장바구니로 복귀
    const referer = req.headers.get('referer') || `${origin}/cart`;
    if (resCd && resCd !== '0000') {
      // close popup and notify parent if opened as window
      const target = `${origin}/payments/easypay/return?resCd=${encodeURIComponent(resCd)}&resMsg=${encodeURIComponent(resMsg || '')}`;
      return NextResponse.redirect(target);
    }

    // 승인 성공이면 주문 상태 업데이트 후 완료 페이지로 리디렉션
    try {
      await fetch(`${origin}/api/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopOrderNo, authorizationId, returnPayload: payload }),
      });
    } catch {}

    const successTarget = `${origin}/orders/complete?orderNo=${encodeURIComponent(shopOrderNo)}`;
    return NextResponse.redirect(successTarget);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'return_handler_error' }, { status: 500 });
  }
}


