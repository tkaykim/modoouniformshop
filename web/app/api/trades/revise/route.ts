import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/trades/revise";
const PROD_URL = "https://pgapi.easypay.co.kr/api/trades/revise";

export async function POST(req: NextRequest) {
  try {
    const mallId = process.env.EASYPAY_MALL_ID as string;
    const secretKey = process.env.EASYPAY_SECRET_KEY as string;
    const apiMode = (process.env.EASYPAY_API_MODE || 'prod').toLowerCase();
    if (!mallId || !secretKey) return NextResponse.json({ resCd: "9999", resMsg: "server_misconfigured" }, { status: 500 });

    const body = await req.json();
    const shopTransactionId = String(body.shopTransactionId || "");
    const pgCno = String(body.pgCno || "");
    const reviseTypeCode = String(body.reviseTypeCode || "");
    const cancelReqDate = String(body.cancelReqDate || "");
    // amount/remainAmount/refundInfo/reviseSubTypeCode 등은 조건부
    if (!shopTransactionId || !pgCno || !reviseTypeCode || !cancelReqDate) {
      return NextResponse.json({ resCd: "4000", resMsg: "missing_fields" }, { status: 400 });
    }

    // msgAuthValue = HMAC-SHA256(pgCno|shopTransactionId)
    const raw = `${pgCno}|${shopTransactionId}`;
    const msgAuthValue = crypto.createHmac('sha256', secretKey).update(raw).digest('hex');

    // 문서 스펙 외 임의 필드 제거하여 전달 (창작 금지 원칙 준수)
    const allowedKeys = new Set(['mallId','shopTransactionId','pgCno','cancelPgCno','reviseTypeCode','reviseSubTypeCode','amount','remainAmount','clientIp','clientId','cancelReqDate','msgAuthValue','reviseMessage','refundQueryFlag','basketUsed','taxInfo','refundInfo']);
    const sanitized: any = {};
    Object.keys(body || {}).forEach(k => { if (allowedKeys.has(k)) sanitized[k] = (body as any)[k]; });
    const payload: any = { ...sanitized, mallId, msgAuthValue };

    const endpoint = apiMode === 'prod' ? PROD_URL : TEST_URL;
    const epRes = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await epRes.json().catch(()=>({}));
    if (!epRes.ok) return NextResponse.json({ resCd: "5000", resMsg: "revise_failed", detail: data }, { status: 502 });
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ resCd: "9999", resMsg: e?.message || 'unknown_error' }, { status: 500 });
  }
}


