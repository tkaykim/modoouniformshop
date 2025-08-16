import { Suspense } from "react";
import ReturnClient from "./ReturnClient";

export const dynamic = 'force-dynamic';

export default function EasypayReturnPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-12">결제 처리 중...</div>}>
      <ReturnClient />
    </Suspense>
  );
}


