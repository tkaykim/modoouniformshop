"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { shimmer } from "@/lib/img";

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
		<div className="text-yellow-500 text-sm">
			{Array.from({ length: 5 }).map((_, i) => (
				<span key={i}>{i < value ? "★" : "☆"}</span>
			))}
		</div>
	);
}

function Thumb({ src }: { src?: string }) {
	if (src) {
		return (
            <div className="relative w-28 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={src} alt="thumb" fill priority={false} loading="lazy" sizes="160px" className="object-cover" placeholder="blur" blurDataURL={shimmer(160, 114)} />
			</div>
		);
	}
	return (
		<div className="w-28 h-20 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#0052cc" }}>
			<span className="text-white font-bold">M</span>
		</div>
	);
}

export function ReviewsPreview({ onOpenAll }: { onOpenAll: () => void }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const { data, error } = await supabase
				.from("reviews")
				.select("id, rating, title, content, images, display_at, author_name, view_count")
				.order("display_at", { ascending: false })
				.limit(8);
			if (!error && data) setReviews(data as Review[]);
			setLoading(false);
		})();
	}, []);

    const rowCount = 2;
    const perRow = Math.ceil((reviews.length || 0) / rowCount) || 1;
    const row1 = reviews.slice(0, perRow);
    const row2 = reviews.slice(perRow, perRow * 2);

	if (loading) return <div className="text-sm text-gray-500 px-4">리뷰 불러오는 중…</div>;
	if (reviews.length === 0) return null;

    function MarqueeRow({ items, reverse }: { items: Review[]; reverse?: boolean }) {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const contentRef = useRef<HTMLDivElement | null>(null);
        const isDragging = useRef(false);
        const startX = useRef(0);
        const startLeft = useRef(0);
        const dir = reverse ? -1 : 1;
        const speed = 1.2; // px per frame

        useEffect(() => {
            const cont = containerRef.current;
            const content = contentRef.current;
            if (!cont || !content) return;
            // 시작 위치 살짝 오프셋 (정/역방향 모두)
            const halfInit = content.scrollWidth / 2;
            cont.scrollLeft = reverse ? (halfInit - 1) : 1;
            let raf = 0;
            const step = () => {
                if (!isDragging.current) {
                    cont.scrollLeft += dir * speed;
                    const half = content.scrollWidth / 2;
                    if (cont.scrollLeft >= half) cont.scrollLeft -= half;
                    if (cont.scrollLeft < 0) cont.scrollLeft += half;
                }
                raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
            return () => cancelAnimationFrame(raf);
        }, [items.length, reverse]);

        useEffect(() => {
            const cont = containerRef.current;
            if (!cont) return;
            const onDown = (e: PointerEvent) => {
                isDragging.current = true;
                startX.current = e.clientX;
                startLeft.current = cont.scrollLeft;
                cont.setPointerCapture(e.pointerId);
            };
            const onMove = (e: PointerEvent) => {
                if (!isDragging.current) return;
                const dx = e.clientX - startX.current;
                cont.scrollLeft = startLeft.current - dx;
            };
            const onUp = (e: PointerEvent) => {
                isDragging.current = false;
                try { cont.releasePointerCapture(e.pointerId); } catch {}
            };
            cont.addEventListener('pointerdown', onDown);
            cont.addEventListener('pointermove', onMove);
            cont.addEventListener('pointerup', onUp);
            cont.addEventListener('pointercancel', onUp);
            return () => {
                cont.removeEventListener('pointerdown', onDown);
                cont.removeEventListener('pointermove', onMove);
                cont.removeEventListener('pointerup', onUp);
                cont.removeEventListener('pointercancel', onUp);
            };
        }, []);

        const dup = Array(4).fill(0).flatMap(() => items);
        return (
            <div ref={containerRef} className="relative w-full overflow-hidden select-none [touch-action:pan-y]">
                <div ref={contentRef} className="flex gap-3 w-max">
                    {dup.map((r, idx) => {
                        const thumb = r?.images?.[0];
                        const key = `${r?.id ?? 'placeholder'}-${reverse ? 'r2' : 'r1'}-${idx}`;
                        const safeAuthor = (r?.author_name && /@/.test(r.author_name)) ? '익명' : (r?.author_name && r?.author_name.length > 0 ? r?.author_name : '익명');
                        return (
                            <div key={key} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm flex-shrink-0">
                                <Thumb src={thumb} />
                                <div className="min-w-[140px] max-w-[220px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 truncate">{safeAuthor}</span>
                                        <StarRating value={r?.rating ?? 0} />
                                    </div>
                                    <div className="text-sm font-medium truncate">{r?.title}</div>
                                    <div className="text-xs text-gray-600 line-clamp-2">{r?.content}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <section className="w-full px-4 py-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">최근 리뷰</h2>
                <button onClick={onOpenAll} className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50">리뷰 모두 보기</button>
            </div>
            <div className="space-y-2">
                <MarqueeRow items={row1} />
                <MarqueeRow items={row2} reverse />
            </div>
            <style jsx>{``}</style>
        </section>
    );
}

