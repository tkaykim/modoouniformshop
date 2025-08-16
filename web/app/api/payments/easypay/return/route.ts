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

    if (resCd && resCd !== '0000') {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      if (resMsg) u.searchParams.set('reason', resMsg);
      return NextResponse.redirect(u, 303);
    }

    if (!authorizationId || !shopOrderNo) {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      u.searchParams.set('reason', 'missing_auth');
      return NextResponse.redirect(u, 303);
    }

    // 승인 API 호출 → 주문 완료 처리 → 완료 페이지 리디렉션
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const approvalReqDate = `${yyyy}${mm}${dd}`;
    const shopTransactionId = `${approvalReqDate}${Math.floor(Math.random()*1e9)}`;

    let approval: any = null;
    try {
      const approveRes = await fetch(`${req.nextUrl.origin}/api/ep9/trades/approval`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationId, shopTransactionId, shopOrderNo, approvalReqDate })
      });
      if (!approveRes.ok) {
        const u = req.nextUrl.clone();
        u.pathname = '/cart';
        u.searchParams.set('cancelled', '1');
        u.searchParams.set('reason', 'approval_failed');
        return NextResponse.redirect(u, 303);
      }
      approval = await approveRes.json();
      if (String(approval?.resCd) !== '0000') {
        const u = req.nextUrl.clone();
        u.pathname = '/cart';
        u.searchParams.set('cancelled', '1');
        u.searchParams.set('reason', String(approval?.resMsg || 'approval_failed'));
        return NextResponse.redirect(u, 303);
      }
    } catch {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      u.searchParams.set('reason', 'approval_failed');
      return NextResponse.redirect(u, 303);
    }

    try {
      await fetch(`${req.nextUrl.origin}/api/orders/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopOrderNo, authorizationId, returnPayload: { ...payload, approval } }),
      });
    } catch {}

    const u = req.nextUrl.clone();
    u.pathname = '/orders/complete';
    u.searchParams.set('orderNo', shopOrderNo);
    return NextResponse.redirect(u, 303);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'return_handler_error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const resCd = String(sp.get('resCd') || '');
    const resMsg = String(sp.get('resMsg') || '');
    const authorizationId = String(sp.get('authorizationId') || '');
    const shopOrderNo = String(sp.get('shopOrderNo') || '');

    if (resCd && resCd !== '0000') {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      if (resMsg) u.searchParams.set('reason', resMsg);
      return NextResponse.redirect(u, 303);
    }

    if (!authorizationId || !shopOrderNo) {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      u.searchParams.set('reason', 'missing_auth');
      return NextResponse.redirect(u, 303);
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const approvalReqDate = `${yyyy}${mm}${dd}`;
    const shopTransactionId = `${approvalReqDate}${Math.floor(Math.random()*1e9)}`;

    let approval: any = null;
    try {
      const approveRes = await fetch(`${req.nextUrl.origin}/api/ep9/trades/approval`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationId, shopTransactionId, shopOrderNo, approvalReqDate })
      });
      if (!approveRes.ok) {
        const u = req.nextUrl.clone();
        u.pathname = '/cart';
        u.searchParams.set('cancelled', '1');
        u.searchParams.set('reason', 'approval_failed');
        return NextResponse.redirect(u, 303);
      }
      approval = await approveRes.json();
      if (String(approval?.resCd) !== '0000') {
        const u = req.nextUrl.clone();
        u.pathname = '/cart';
        u.searchParams.set('cancelled', '1');
        u.searchParams.set('reason', String(approval?.resMsg || 'approval_failed'));
        return NextResponse.redirect(u, 303);
      }
    } catch {
      const u = req.nextUrl.clone();
      u.pathname = '/cart';
      u.searchParams.set('cancelled', '1');
      u.searchParams.set('reason', 'approval_failed');
      return NextResponse.redirect(u, 303);
    }

    try {
      await fetch(`${req.nextUrl.origin}/api/orders/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopOrderNo, authorizationId, returnPayload: { ...Object.fromEntries(sp.entries()), approval } }),
      });
    } catch {}

    const u = req.nextUrl.clone();
    u.pathname = '/orders/complete';
    u.searchParams.set('orderNo', shopOrderNo);
    return NextResponse.redirect(u, 303);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'return_handler_error' }, { status: 500 });
  }
}


