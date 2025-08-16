"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ReturnClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { if (window.opener && !window.opener.closed) window.opener.focus(); } catch {}
    try { window.close(); } catch {}
  }, [params]);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">결제 처리 중...</h1>
    </div>
  );
}


