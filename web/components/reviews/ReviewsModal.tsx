"use client";
import { useEffect, useState } from "react";
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
};

function StarRating({ value }: { value: number }) {
	return (
		<div className="text-yellow-500 text-sm">{Array.from({ length: 5 }).map((_, i) => (<span key={i}>{i < value ? "★" : "☆"}</span>))}</div>
	);
}

export function ReviewsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const [reviews, setReviews] = useState<Review[]>([]);
	useEffect(() => {
		if (!open) return;
		(async () => {
			const { data } = await supabase
				.from("reviews")
				.select("id, rating, title, content, images, display_at, author_name")
				.order("display_at", { ascending: false })
				.limit(50);
			if (data) setReviews(data as Review[]);
		})();
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
				<button aria-label="close" onClick={onClose} className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8">✕</button>
				<div className="p-5">
					<h2 className="text-lg font-semibold mb-4">리뷰 모두 보기</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-2">
						{reviews.map((r) => {
							const thumb = r.images?.[0];
							const safeAuthor = (r.author_name && /@/.test(r.author_name)) ? '익명' : (r.author_name && r.author_name.length > 0 ? r.author_name : '익명');
							return (
								<div key={r.id} className="rounded-xl overflow-hidden border bg-white">
									{thumb ? (
                                        <div className="relative w-full h-40 bg-gray-100">
                                            <Image src={thumb} alt="thumb" fill loading="lazy" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" placeholder="blur" blurDataURL={shimmer(600, 160)} />
										</div>
									) : (
										<div className="w-full h-40 flex items-center justify-center" style={{ background: '#0052cc' }}>
											<span className="text-white font-bold text-2xl">M</span>
										</div>
									)}
									<div className="p-4">
										<div className="flex items-center justify-between mb-1">
											<div className="text-xs text-gray-500 truncate max-w-[60%]">{safeAuthor}</div>
											<StarRating value={r.rating} />
										</div>
										<div className="font-semibold truncate mb-1">{r.title}</div>
										<div className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{r.content}</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

