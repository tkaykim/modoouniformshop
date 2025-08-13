"use client";
import Image from "next/image";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ReviewsPreview } from "@/components/reviews/ReviewsPreview";
import { useState } from "react";
import { ReviewsModal } from "@/components/reviews/ReviewsModal";

export default function Home() {
  const [openReviews, setOpenReviews] = useState(false);
  return (
    <main className="min-h-screen mx-auto p-0 md:p-4" style={{ maxWidth: 622 }}>
      <section className="w-full mx-auto">
        <Image src="/hero.gif" alt="hero" width={0} height={0} priority sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <section className="w-full mx-auto">
        <Image src="/section01.png" alt="section01" width={0} height={0} sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <ReviewsPreview onOpenAll={() => setOpenReviews(true)} />
      <section className="w-full mx-auto">
        <Image src="/compactver-page3.png" alt="review section" width={0} height={0} sizes="(max-width: 622px) 100vw, 622px" style={{ width: '100%', height: 'auto' }} />
      </section>
      <section className="w-full px-4 pb-10 mx-auto">
        <ChatContainer />
      </section>
      <ReviewsModal open={openReviews} onClose={() => setOpenReviews(false)} />
    </main>
  );
}
