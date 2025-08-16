import { NextRequest, NextResponse } from "next/server";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/ep9/trades/webpay";
const PROD_URL = "https://pgapi.easypay.co.kr/api/ep9/trades/webpay";

export async function POST(req: NextRequest) {
  try {
    const mallId = process.env.EASYPAY_MALL_ID as string;
    const apiMode = (process.env.EASYPAY_API_MODE || 'prod').toLowerCase();
    if (!mallId) return NextResponse.json({ resCd: "9999", resMsg: "server_misconfigured" }, { status: 500 });

    const { amount, goodsName, deviceTypeCode, shopOrderNo, orderDraft }: { amount: number; goodsName?: string; deviceTypeCode?: string; shopOrderNo?: string; orderDraft?: any } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ resCd: "4000", resMsg: "invalid_amount" }, { status: 400 });

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const orderNo = shopOrderNo && String(shopOrderNo).trim() ? String(shopOrderNo) : `${yyyy}${mm}${dd}${Math.floor(Math.random()*1e9)}`;

    const origin = req.nextUrl.origin;
    const returnUrl = `${origin}/payments/easypay/return`;

    const payload = {
      mallId,
      payMethodTypeCode: "11",
      currency: "00",
      amount: Number(amount),
      clientTypeCode: "00",
      returnUrl,
      deviceTypeCode: deviceTypeCode === 'mobile' ? 'mobile' : 'pc',
      shopOrderNo: orderNo,
      orderInfo: { goodsName: goodsName || "주문" },
    } as any;

    const endpoint = apiMode === 'prod' ? PROD_URL : TEST_URL;
    const epRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await epRes.json().catch(() => ({}));
    if (!epRes.ok) return NextResponse.json({ resCd: "5000", resMsg: "webpay_failed", detail: data }, { status: 502 });
    // 주문 Draft 생성
    if (orderDraft && orderNo) {
      try {
        await fetch(`${req.nextUrl.origin}/api/orders/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(req.headers.get('x-cart-session-id')?{ 'x-cart-session-id': req.headers.get('x-cart-session-id') as string}: {}) },
          body: JSON.stringify({ shopOrderNo: orderNo, orderDraft })
        });
      } catch {}
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ resCd: "9999", resMsg: e?.message || 'unknown_error' }, { status: 500 });
  }
}


