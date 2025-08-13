"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toKstDateTimeLocalString, kstLocalToISO } from "@/lib/time";
import { StarRatingInput } from "@/components/ui/StarRatingInput";

type NewReview = {
  rating: number;
  author_name: string;
  title: string;
  content: string;
  images: File[];
  display_at: string; // ISO datetime-local
};

export default function AdminReviewsPage() {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [form, setForm] = useState<NewReview>({ rating: 5, author_name: "", title: "", content: "", images: [], display_at: toKstDateTimeLocalString(new Date()) });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <main className="max-w-md mx-auto p-6">로그인이 필요합니다.</main>;
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const f of files.slice(0,3)) {
      const path = `${crypto.randomUUID()}-${f.name}`;
      const { error } = await supabase.storage.from('reviews').upload(path, f, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('reviews').getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
    return urls;
  }

  async function submit() {
    try {
      setSubmitting(true); setError(null);
      if (!form.title.trim() || !form.content.trim()) {
        setError('제목과 내용은 필수입니다.');
        setSubmitting(false);
        return;
      }
      const images = await uploadImages(form.images);
      const userResp = await supabase.auth.getUser();
      const user = userResp.data.user;
      const { error } = await supabase.from('reviews').insert({
        rating: form.rating,
        author_name: form.author_name.trim() ? form.author_name.trim() : null,
        title: form.title,
        content: form.content,
        images,
        author: user?.id ?? null,
        display_at: kstLocalToISO(form.display_at),
      });
      if (error) throw error;
      setForm({ rating: 5, author_name: "", title: "", content: "", images: [], display_at: toKstDateTimeLocalString(new Date()) });
      alert('리뷰가 저장되었습니다.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">리뷰 작성</h1>
        <a href="/review" className="px-3 py-2 border rounded text-sm">리뷰 목록 보기</a>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <label className="block text-sm">별점</label>
      <StarRatingInput value={form.rating} onChange={(v)=> setForm({ ...form, rating: v })} />
      <label className="block text-sm">작성자명 (공개 표기용, 비워두면 익명)</label>
      <input value={form.author_name} onChange={(e)=> setForm({ ...form, author_name: e.target.value })} className="border rounded px-2 py-1 text-sm w-full" placeholder="예: 홍길동" />
      <label className="block text-sm">제목</label>
      <input value={form.title} onChange={(e)=> setForm({ ...form, title: e.target.value })} className="border rounded px-2 py-1 text-sm w-full" required />
      <label className="block text-sm">내용</label>
      <textarea value={form.content} onChange={(e)=> setForm({ ...form, content: e.target.value })} className="border rounded px-2 py-1 text-sm w-full h-32" required />
      <label className="block text-sm">이미지 (최대 3장)</label>
      <input type="file" multiple accept="image/*" onChange={(e)=> setForm({ ...form, images: Array.from(e.target.files||[]) })} />
      <label className="block text-sm">표시 날짜/시간</label>
      <input type="datetime-local" value={form.display_at} onChange={(e)=> setForm({ ...form, display_at: e.target.value })} className="border rounded px-2 py-1 text-sm" />
      <div>
        <button disabled={submitting || !form.title.trim() || !form.content.trim()} onClick={submit} className="px-3 py-2 border rounded disabled:opacity-50">저장</button>
      </div>
    </main>
  );
}

