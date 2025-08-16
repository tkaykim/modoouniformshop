import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/ep9/trades/approval";
const PROD_URL = "https://pgapi.easypay.co.kr/api/ep9/trades/approval";

export async function POST(req: NextRequest) {
  try {
    const mallId = (process.env.EASYPAY_MALL_ID as string) || "GD003712";
    const apiMode = (process.env.EASYPAY_API_MODE || "prod").toLowerCase(); // 'test' | 'prod'
    const secretKey = process.env.EASYPAY_SECRET_KEY as string; // for msgAuthValue verification

    if (!mallId) {
      return NextResponse.json({ error: "Server misconfigured: EASYPAY_MALL_ID" }, { status: 500 });
    }

    const body = await req.json();
    const authorizationId = String(body.authorizationId || "");
    const shopTransactionId = String(body.shopTransactionId || "");
    const shopOrderNo = String(body.shopOrderNo || "");
    const approvalReqDate = String(body.approvalReqDate || ""); // yyyyMMdd

    if (!authorizationId || !shopTransactionId || !shopOrderNo || !approvalReqDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const endpoint = apiMode === "prod" ? PROD_URL : TEST_URL;

    const payload = {
      mallId,
      shopTransactionId,
      authorizationId,
      shopOrderNo,
      approvalReqDate,
    };

    const epRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // timeout can be handled outside; Next fetch supports AbortController
    });

    if (!epRes.ok) {
      const text = await epRes.text();
      return NextResponse.json({ error: "easypay_approval_failed", detail: text }, { status: 502 });
    }

    const data = await epRes.json();

    // Optional: verify msgAuthValue if secret present
    try {
      if (secretKey) {
        const pgCno = String(data.pgCno || "");
        const amount = String(data.amount || "");
        const transactionDate = String(data.transactionDate || "");
        const raw = `${pgCno}|${amount}|${transactionDate}`;
        const calc = crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
        const msgAuthValue = String(data.msgAuthValue || "").toLowerCase();
        if (pgCno && amount && transactionDate && msgAuthValue && calc !== msgAuthValue) {
          return NextResponse.json({ error: "message_auth_verification_failed" }, { status: 400 });
        }
      }
    } catch {}

    return NextResponse.json({ ok: true, approval: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown_error" }, { status: 500 });
  }
}


