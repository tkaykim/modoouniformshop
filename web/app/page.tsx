"use client";
import Image from "next/image";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ReviewsPreview } from "@/components/reviews/ReviewsPreview";
import { useEffect, useRef, useState } from "react";
import { ReviewsModal } from "@/components/reviews/ReviewsModal";
import { useChatStore } from "@/store/chatStore";
import { FAQSection } from "@/components/faq/FAQSection";

export default function Home() {
  const [openReviews, setOpenReviews] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const reset = useChatStore((s) => s.reset);
  const setFocusedStep = useChatStore((s) => s.setFocusedStep);
  const [showConsult, setShowConsult] = useState(true);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowConsult(!entry.isIntersecting);
      },
      { root: null, threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const handleStartConsult = () => {
    reset();
    setFocusedStep(1);
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <main className="min-h-screen mx-auto p-0 md:p-4" style={{ maxWidth: 622 }}>
      <section className="w-full mx-auto">
        <Image src="/hero.gif" alt="hero" width={0} height={0} priority sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <section className="w-full mx-auto">
        <Image src="/section01.png" alt="section01" width={0} height={0} sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <ReviewsPreview onOpenAll={() => setOpenReviews(true)} />
      <FAQSection />
      <section className="w-full mx-auto">
        <Image src="/compactver-page3.png" alt="review section" width={0} height={0} sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <section ref={chatRef} className="w-full px-4 pb-20 mx-auto">
        <ChatContainer />
      </section>
      <ReviewsModal open={openReviews} onClose={() => setOpenReviews(false)} />
      {/* 하단 중앙 플로팅 말풍선 버튼 */}
      {showConsult && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-16 z-50">
          <button onClick={handleStartConsult} className="relative px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg active:scale-95 transition-transform">
            상담하기
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-blue-600 rotate-45"></span>
          </button>
        </div>
      )}
      {/* 우측 하단 홈페이지 버튼 */}
      <a href="https://modoouniform.com" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-full shadow text-sm" style={{ background: '#0052cc', color: 'white' }}>
        홈페이지&gt;
      </a>
    </main>
  );
}
