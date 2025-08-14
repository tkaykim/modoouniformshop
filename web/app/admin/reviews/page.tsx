"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  type ReviewRow = { id:string; title:string; rating:number; author_name?:string|null; display_at:string; view_count?:number|null };
  const [list, setList] = useState<ReviewRow[]>([]);
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReviewRow>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<{ images?: string[]; author_name?: string|null; display_at: string; content?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, title, rating, author_name, display_at, view_count')
        .order('display_at', { ascending: false })
        .limit(50);
      if (data) setList(data);
    })();
  }, [session]);

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

  

  async function deleteReview(id: string) {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) setList(prev => prev.filter(r => r.id !== id));
  }

  function openEdit(r: ReviewRow) {
    setEditing(r);
    setEditForm({ title: r.title, rating: r.rating, author_name: r.author_name ?? '', view_count: r.view_count ?? 0 });
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from('reviews').update(editForm).eq('id', editing.id);
    if (!error) {
      setList(prev => prev.map(x => x.id === editing.id ? { ...x, ...(editForm as ReviewRow) } : x));
      setEditing(null);
    }
  }

  return (
    <main className="w-full max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b mb-4">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-2xl font-semibold">리뷰 관리</h1>
          <Link href="/review" className="px-3 py-2 rounded-full text-sm border bg-white hover:bg-gray-50">공개 페이지 열기</Link>
        </div>
      </div>

      <section className="border rounded-xl bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0052cc' }}>리뷰 작성</h2>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm">별점</label>
            <StarRatingInput value={form.rating} onChange={(v)=> setForm({ ...form, rating: v })} />
          </div>
          <div>
            <label className="block text-sm">작성자명 (공개 표기용, 비워두면 익명)</label>
            <input value={form.author_name} onChange={(e)=> setForm({ ...form, author_name: e.target.value })} className="border rounded px-2 py-2 text-sm w-full" placeholder="예: 홍길동" />
          </div>
          <div>
            <label className="block text-sm">표시 날짜/시간</label>
            <input type="datetime-local" value={form.display_at} onChange={(e)=> setForm({ ...form, display_at: e.target.value })} className="border rounded px-2 py-2 text-sm w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">제목</label>
            <input value={form.title} onChange={(e)=> setForm({ ...form, title: e.target.value })} className="border rounded px-2 py-2 text-sm w-full" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">내용</label>
            <textarea value={form.content} onChange={(e)=> setForm({ ...form, content: e.target.value })} className="border rounded px-2 py-2 text-sm w-full h-36" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">이미지 (최대 3장)</label>
            <input type="file" multiple accept="image/*" onChange={(e)=> setForm({ ...form, images: Array.from(e.target.files||[]) })} />
          </div>
        </div>
        <div className="mt-3">
          <button disabled={submitting || !form.title.trim() || !form.content.trim()} onClick={submit} className="px-4 py-2 rounded-full text-sm" style={{ background: '#0052cc', color: 'white' }}>저장</button>
        </div>
      </section>

      <section className="border rounded-xl bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0052cc' }}>작성된 리뷰 관리</h2>
        <div className="space-y-2">
        {list.map((r)=> (
          <div key={r.id} className="border rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.title}</span>
                <span className="text-gray-500">({r.rating}★ / {r.view_count ?? 0}회)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded-full bg-white hover:bg-gray-50"
                  onClick={async()=>{
                    if (expandedId === r.id) { setExpandedId(null); setExpandedData(null); return; }
                    const { data } = await supabase
                      .from('reviews')
                      .select('id, title, rating, content, images, author_name, display_at')
                      .eq('id', r.id)
                      .single();
                    setExpandedId(r.id);
                    setExpandedData(data);
                  }}
                >{expandedId === r.id ? '닫기' : '보기'}</button>
                <button onClick={()=> openEdit(r)} className="px-2 py-1 border rounded-full bg-white hover:bg-gray-50">수정</button>
                <button onClick={()=> deleteReview(r.id)} className="px-2 py-1 border rounded-full bg-white hover:bg-gray-50">삭제</button>
              </div>
            </div>
            {expandedId === r.id && expandedData && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                {Array.isArray(expandedData.images) && expandedData.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {expandedData.images.map((src: string, i: number)=> (
                      <div key={i} className="relative h-24 w-24 rounded overflow-hidden bg-gray-100">
                        <img src={src} alt="image" loading="lazy" decoding="async" className="h-full w-full object-cover"/>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500">{expandedData.author_name || '익명'} · {new Date(expandedData.display_at).toLocaleString('ko-KR')}</div>
                <div className="whitespace-pre-line text-sm">{expandedData.content}</div>
              </div>
            )}
          </div>
        ))}
        </div>
      </section>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-lg space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">리뷰 수정</h3>
              <button className="px-2 py-1 border rounded" onClick={()=> setEditing(null)}>닫기</button>
            </div>
            <label className="block text-sm">제목</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={editForm.title ?? ''} onChange={(e)=> setEditForm((f)=> ({...f, title: e.target.value}))} />
            <label className="block text-sm">내용</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={4} value={(expandedData?.content ?? '')} onChange={(e)=> {/* content는 목록 그리드에서 사용 안함. 보존 */}} />
            <label className="block text-sm">별점</label>
            <input type="number" min={0} max={5} className="w-full border rounded px-2 py-1 text-sm" value={editForm.rating ?? 0} onChange={(e)=> setEditForm((f)=> ({...f, rating: Number(e.target.value)}))} />
            <label className="block text-sm">조회수</label>
            <input type="number" min={0} className="w-full border rounded px-2 py-1 text-sm" value={editForm.view_count ?? 0} onChange={(e)=> setEditForm((f)=> ({...f, view_count: Math.max(0, Number(e.target.value))}))} />
            <label className="block text-sm">작성자명</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={editForm.author_name ?? ''} onChange={(e)=> setEditForm((f)=> ({...f, author_name: e.target.value}))} />
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-2 border rounded-full bg-white" onClick={()=> setEditing(null)}>취소</button>
              <button className="px-3 py-2 rounded-full" style={{ background: '#0052cc', color: 'white' }} onClick={saveEdit}>저장</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

