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
			<div className="relative w-28 h-20 rounded-md overflow-hidden flex-shrink-0">
				<Image src={src} alt="thumb" fill sizes="160px" className="object-cover" />
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

    return (
        <section className="w-full px-4 py-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">최근 리뷰</h2>
                <button onClick={onOpenAll} className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50">리뷰 모두 보기</button>
            </div>
            <div className="space-y-2">
                {/* 1행: 좌->우 */}
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-3 animate-marquee-slow will-change-transform">
                        {[...row1, ...row1].map((r, idx) => {
                            const thumb = r?.images?.[0];
                            const key = `${r?.id ?? 'placeholder'}-r1-${idx}`;
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
                {/* 2행: 우->좌 (reverse) */}
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-3 animate-marquee-slow-reverse will-change-transform">
                        {[...row2, ...row2].map((r, idx) => {
                            const thumb = r?.images?.[0];
                            const key = `${r?.id ?? 'placeholder'}-r2-${idx}`;
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
            </div>
            <style jsx>{`
                @keyframes marqueeX {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee-slow {
                    animation: marqueeX 30s linear infinite;
                }
                .animate-marquee-slow-reverse {
                    animation: marqueeX 30s linear infinite reverse;
                }
            `}</style>
        </section>
    );
}

