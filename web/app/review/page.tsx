"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

type Review = {
  id: string;
  rating: number;
  title: string;
  content: string;
  images: string[] | null;
  display_at: string;
  author_name?: string | null;
  view_count?: number | null;
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="text-yellow-500 text-base">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < value ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function Thumb({ src }: { src?: string }) {
  if (src) {
    return (
      <div className="relative w-full h-40 md:h-48 rounded-lg overflow-hidden">
        <Image src={src} alt="thumb" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="w-full h-40 md:h-48 rounded-lg flex items-center justify-center" style={{ background: "#0052cc" }}>
      <span className="text-white font-bold text-2xl">M</span>
    </div>
  );
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const viewedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, content, images, display_at, view_count, author_name")
        .order("display_at", { ascending: false });
      if (!error && data) setReviews(data as Review[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex]);

  async function incrementView(id: string) {
    if (viewedIdsRef.current.has(id)) return;
    try {
      const { data, error } = await supabase.rpc('increment_review_view', { review_id: id });
      if (!error && typeof data === 'number') {
        viewedIdsRef.current.add(id);
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, view_count: data } : r)));
        return;
      }
      // RPC 실패 또는 반환 형식 이상 시 서비스 라우트로 폴백
      const res = await fetch('/api/reviews/increment-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const nextCount = typeof body.view_count === 'number' ? body.view_count : undefined;
        viewedIdsRef.current.add(id);
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, view_count: nextCount ?? ((r.view_count ?? 0) + 1) } : r)));
        return;
      }
    } catch {}
    // 최종 폴백: 낙관적 UI 업데이트(서버 반영 실패 시)
    viewedIdsRef.current.add(id);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, view_count: (r.view_count ?? 0) + 1 } : r)));
  }

  function openAt(index: number) {
    setSelectedIndex(index);
    const id = reviews[index]?.id;
    if (id) incrementView(id);
  }

  function close() {
    setSelectedIndex(null);
  }

  function prev() {
    if (selectedIndex === null || reviews.length === 0) return;
    const nextIndex = (selectedIndex - 1 + reviews.length) % reviews.length;
    setSelectedIndex(nextIndex);
    const id = reviews[nextIndex]?.id;
    if (id) incrementView(id);
  }

  function next() {
    if (selectedIndex === null || reviews.length === 0) return;
    const nextIndex = (selectedIndex + 1) % reviews.length;
    setSelectedIndex(nextIndex);
    const id = reviews[nextIndex]?.id;
    if (id) incrementView(id);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">리뷰</h1>
      {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r, idx) => {
          const thumb = r.images?.[0];
          const dt = new Date(r.display_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: 'numeric', month: '2-digit', day: '2-digit' });
          // 이메일 또는 계정정보 노출 방지: author_name에 이메일 패턴 있으면 익명 처리
          const safeAuthor = (r.author_name && /@/.test(r.author_name)) ? '익명' : (r.author_name && r.author_name.length > 0 ? r.author_name : '익명');
          return (
            <button key={r.id} onClick={() => openAt(idx)} className="text-left block rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5">
              <Thumb src={thumb} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-semibold text-lg md:text-xl truncate pr-3">{r.title}</h2>
                  <StarRating value={r.rating} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                  <span>{dt}</span>
                  <span>·</span>
                  <span>{r.view_count ?? 0}회</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{safeAuthor}</div>
                <p className="text-sm md:text-base text-gray-800 line-clamp-3 leading-relaxed">
                  {r.content}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {selectedIndex !== null && reviews[selectedIndex] && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden">
            <button aria-label="close" onClick={close} className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full w-8 h-8">✕</button>
            <button aria-label="prev" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full w-9 h-9">‹</button>
            <button aria-label="next" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full w-9 h-9">›</button>
            {(() => {
              const r = reviews[selectedIndex!];
              const thumb = r.images?.[0];
              const dt = new Date(r.display_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: 'numeric', month: '2-digit', day: '2-digit' });
              const safeAuthor = (r.author_name && /@/.test(r.author_name)) ? '익명' : (r.author_name && r.author_name.length > 0 ? r.author_name : '익명');
              return (
                <>
                  {thumb ? (
                    <div className="relative w-full h-56 md:h-72">
                      <Image src={thumb} alt="thumb" fill sizes="100vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-56 md:h-72 flex items-center justify-center" style={{ background: '#0052cc' }}>
                      <span className="text-white font-bold text-3xl">M</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h1 className="font-semibold text-xl md:text-2xl pr-3">{r.title}</h1>
                      <StarRating value={r.rating} />
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-2">
                      <span>{dt}</span>
                      <span>·</span>
                      <span>{r.view_count ?? 0}회</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{safeAuthor}</div>
                    <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">{r.content}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}

