"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useSearchParams } from "next/navigation";

export default function OrderCompletePage() {
  const params = useSearchParams();
  const orderNo = useMemo(() => params.get('orderNo') || '', [params]);

  useEffect(() => {
    // 팝업(모달 창)에서 열렸다면 부모 창을 완료 페이지로 이동시키고 팝업 닫기
    try {
      if (typeof window !== 'undefined' && window.opener) {
        const targetUrl = `/orders/complete?orderNo=${encodeURIComponent(orderNo)}`;
        try { window.opener.location.replace(targetUrl); } catch {}
        window.close();
      }
    } catch {}
  }, [orderNo]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">결제가 완료되었습니다.</h1>
        {orderNo ? (
          <p className="mt-4 text-gray-700">주문번호: <span className="font-mono">{orderNo}</span></p>
        ) : null}
        <p className="mt-6 text-gray-600">주문서가 접수되었으며, 담당자가 확인 후 안내드리겠습니다.</p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">홈으로</Link>
          <Link href={`/orders/complete?orderNo=${encodeURIComponent(orderNo)}`} className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">내 주문 상태 보기</Link>
        </div>
      </div>
    </div>
  );
}


