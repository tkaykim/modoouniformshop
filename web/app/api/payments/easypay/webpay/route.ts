import { NextRequest, NextResponse } from "next/server";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/ep9/trades/webpay";
const PROD_URL = "https://pgapi.easypay.co.kr/api/ep9/trades/webpay";

export async function POST(req: NextRequest) {
  try {
    const mallId = (process.env.EASYPAY_MALL_ID as string) || "GD003712"; // fallback: provided prod MID
    const apiMode = (process.env.EASYPAY_API_MODE || "prod").toLowerCase();

    const { amount, goodsName, deviceType, orderDraft }: { amount: number; goodsName?: string; deviceType?: string; orderDraft?: any } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const shopOrderNo = `${yyyy}${mm}${dd}${Math.floor(Math.random()*1e9)}`;

    const origin = req.nextUrl.origin;
    // Send POST callback directly to API route to avoid page/route conflicts
    const returnUrl = `${origin}/api/payments/easypay/return`;

    const payload = {
      mallId,
      payMethodTypeCode: "11", // credit card
      currency: "00", // KRW
      amount: Number(amount),
      clientTypeCode: "00",
      returnUrl,
      deviceTypeCode: deviceType === 'mobile' ? 'mobile' : 'pc',
      shopOrderNo,
      orderInfo: { goodsName: goodsName || "모두의유니폼 주문" },
    } as any;

    const endpoint = apiMode === 'prod' ? PROD_URL : TEST_URL;
    const epRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await epRes.json().catch(() => ({}));
    if (!epRes.ok) {
      return NextResponse.json({ error: 'webpay_request_failed', detail: data }, { status: 502 });
    }
    // persist a pending order draft if provided
    try {
      if (orderDraft) {
        const res = await fetch(`${origin}/api/orders/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopOrderNo, orderDraft }),
        });
        // ignore failure; payment can still proceed
      }
    } catch {}

    return NextResponse.json({ ok: true, ...data, shopOrderNo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}


