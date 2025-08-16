import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/ep9/trades/approval";
const PROD_URL = "https://pgapi.easypay.co.kr/api/ep9/trades/approval";

export async function POST(req: NextRequest) {
  try {
    const mallId = process.env.EASYPAY_MALL_ID as string;
    const secretKey = process.env.EASYPAY_SECRET_KEY as string;
    const apiMode = (process.env.EASYPAY_API_MODE || 'prod').toLowerCase();
    if (!mallId || !secretKey) return NextResponse.json({ resCd: "9999", resMsg: "server_misconfigured" }, { status: 500 });

    const body = await req.json();
    const authorizationId = String(body.authorizationId || "");
    const shopTransactionId = String(body.shopTransactionId || "");
    const shopOrderNo = String(body.shopOrderNo || "");
    const approvalReqDate = String(body.approvalReqDate || "");
    if (!authorizationId || !shopTransactionId || !shopOrderNo || !approvalReqDate) {
      return NextResponse.json({ resCd: "4000", resMsg: "missing_fields" }, { status: 400 });
    }

    const endpoint = apiMode === 'prod' ? PROD_URL : TEST_URL;
    const payload = { mallId, shopTransactionId, authorizationId, shopOrderNo, approvalReqDate };
    const epRes = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!epRes.ok) {
      const text = await epRes.text();
      return NextResponse.json({ resCd: "5000", resMsg: "approval_failed", detail: text }, { status: 502 });
    }
    const data = await epRes.json();

    // msgAuthValue 검증 (pgCno|amount|transactionDate)
    try {
      const pgCno = String(data?.pgCno || "");
      const amount = String(data?.amount || "");
      const transactionDate = String(data?.transactionDate || "");
      const msgAuthValue = String(data?.msgAuthValue || "");
      if (data?.resCd === '0000') {
        const raw = `${pgCno}|${amount}|${transactionDate}`;
        const expect = crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
        if (!msgAuthValue || expect !== msgAuthValue) {
          return NextResponse.json({ resCd: "4001", resMsg: "msgAuthValue_mismatch" }, { status: 400 });
        }
      }
    } catch {}

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ resCd: "9999", resMsg: e?.message || 'unknown_error' }, { status: 500 });
  }
}


