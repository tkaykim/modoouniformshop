"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { shimmer } from "@/lib/img";
import { SiteHeader } from "@/components/SiteHeader";

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
		<div className="text-yellow-500 text-base">{Array.from({ length: 5 }).map((_, i) => (<span key={i}>{i < value ? "★" : "☆"}</span>))}</div>
	);
}

export default function ReviewDetailPage() {
	const params = useParams<{ id: string }>();
	const [review, setReview] = useState<Review | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const id = params?.id;
			if (!id) return;
			const { data } = await supabase
				.from("reviews")
				.select("id, rating, title, content, images, display_at, view_count, author_name")
				.eq("id", id)
				.single();
			if (data) setReview(data as Review);
			setLoading(false);
			// increment view
			try {
				await fetch("/api/reviews/increment-view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
			} catch {}
		})();
	}, [params?.id]);

	if (loading) return <main className="max-w-2xl mx-auto p-6">불러오는 중…</main>;
	if (!review) return <main className="max-w-2xl mx-auto p-6">리뷰가 없습니다.</main>;

	const thumb = review.images?.[0];
	const dt = new Date(review.display_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: 'numeric', month: '2-digit', day: '2-digit' });
	const safeAuthor = (review.author_name && /@/.test(review.author_name)) ? '익명' : (review.author_name && review.author_name.length > 0 ? review.author_name : '익명');

	return (
		<main className="max-w-2xl mx-auto p-6 space-y-4">
			<SiteHeader />
			<div className="rounded-2xl overflow-hidden bg-white shadow-sm">
				{thumb ? (
					<div className="relative w-full h-56 md:h-72 bg-gray-100">
						<Image src={thumb} alt="thumb" fill loading="lazy" sizes="100vw" className="object-cover" placeholder="blur" blurDataURL={shimmer(1024, 288)} />
					</div>
				) : (
					<div className="w-full h-56 md:h-72 flex items-center justify-center" style={{ background: '#0052cc' }}>
						<span className="text-white font-bold text-3xl">M</span>
					</div>
				)}
				<div className="p-5">
					<div className="flex items-start justify-between mb-1">
						<h1 className="font-semibold text-xl md:text-2xl pr-3">{review.title}</h1>
						<StarRating value={review.rating} />
					</div>
					<div className="flex items-center gap-2 text-[12px] text-gray-400 mb-2">
						<span>{dt}</span>
						<span>·</span>
						<span>{review.view_count ?? 0}회</span>
					</div>
					<div className="text-xs text-gray-500 mb-2">{safeAuthor}</div>
					<p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">{review.content}</p>
				</div>
			</div>
		</main>
	);
}

