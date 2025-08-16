"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EasypayReturnPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // API에서 승인 및 완료처리를 수행 후, 성공 시 /orders/complete로 리디렉션됨
        const resCd = params.get('resCd');
        const resMsg = params.get('resMsg');
        const authorizationId = params.get('authorizationId');
        const shopOrderNo = params.get('shopOrderNo');
        // 성공 코드: 0000 → 서버에서 이미 완료처리 및 리디렉션, 혹시 GET으로 들어오면 수동 리디렉션
        if (resCd === '0000' && shopOrderNo) {
          const target = `/orders/complete?orderNo=${encodeURIComponent(shopOrderNo)}`;
          if (window.opener) {
            try { window.opener.location.replace(target); } catch {}
            window.close();
          } else {
            router.replace(target);
          }
          return;
        }
        // 실패/취소 → 장바구니로 안내 및 이유 전달
        if (resCd && resCd !== '0000') {
          const target = `/cart?cancelled=1&reason=${encodeURIComponent(resMsg || '')}`;
          if (window.opener) {
            try { window.opener.location.replace(target); } catch {}
            window.close();
          } else {
            router.replace(target);
          }
          return;
        }
        setState({ resCd, resMsg, authorizationId, shopOrderNo });
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [params, router]);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">결제 처리 중...</h1>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <pre className="bg-gray-50 p-4 rounded border text-sm overflow-auto">{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}


