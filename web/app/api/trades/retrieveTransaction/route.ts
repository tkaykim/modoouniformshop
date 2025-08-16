import { NextRequest, NextResponse } from "next/server";

const TEST_URL = "https://testpgapi.easypay.co.kr/api/trades/retrieveTransaction";
const PROD_URL = "https://pgapi.easypay.co.kr/api/trades/retrieveTransaction";

export async function POST(req: NextRequest) {
  try {
    const mallId = process.env.EASYPAY_MALL_ID as string;
    const apiMode = (process.env.EASYPAY_API_MODE || 'prod').toLowerCase();
    if (!mallId) return NextResponse.json({ resCd: "9999", resMsg: "server_misconfigured" }, { status: 500 });

    const { shopTransactionId, transactionDate } = await req.json();
    if (!shopTransactionId || !transactionDate) {
      return NextResponse.json({ resCd: "4000", resMsg: "missing_fields" }, { status: 400 });
    }

    const endpoint = apiMode === 'prod' ? PROD_URL : TEST_URL;
    const payload = { mallId, shopTransactionId, transactionDate };
    const epRes = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await epRes.json().catch(()=>({}));
    if (!epRes.ok) return NextResponse.json({ resCd: "5000", resMsg: "retrieve_failed", detail: data }, { status: 502 });
    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ resCd: "9999", resMsg: e?.message || 'unknown_error' }, { status: 500 });
  }
}


