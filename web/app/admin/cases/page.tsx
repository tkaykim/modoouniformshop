"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CaseRow = {
  id: string;
  title: string;
  description: string | null;
  photo: string | null;
  date: string | null;
  category: string | null;
  sort_order: number | null;
  created_at?: string | null;
};

export default function AdminCasesPage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio')
      .select('id, title, description, photo, date, category, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true } as any);
    if (error) { setLoading(false); return; }
    setRows((data as CaseRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCase = async () => {
    if (!title.trim()) return alert('제목을 입력하세요.');
    try {
      let finalPhoto = photoUrl.trim();
      if (!finalPhoto && photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const fd = new FormData();
        fd.append('file', photoFile);
        fd.append('path', path);
        fd.append('bucket', 'portfolio');
        const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(await res.text());
        const { url } = await res.json();
        finalPhoto = url;
      }
      if (!finalPhoto) return alert('사진 URL 또는 파일을 입력하세요.');

      const resp = await fetch('/api/admin/cases/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), photo: finalPhoto, date: date || null, category: category.trim() })
      });
      const json = await resp.json().catch(() => ({} as any));
      if (!resp.ok) throw new Error(json?.error || '등록 실패');

      setTitle(''); setDescription(''); setPhotoUrl(''); setPhotoFile(null); setCategory(''); setDate('');
      await load();
      alert('등록되었습니다.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`등록 실패: ${msg}`);
    }
  };

  const updateCase = async (row: CaseRow, patch: Partial<CaseRow>) => {
    const merged: CaseRow = { ...row, ...patch } as CaseRow;
    const { error } = await supabase.from('portfolio').update({ title: merged.title, description: merged.description, photo: merged.photo, date: merged.date, category: merged.category }).eq('id', row.id);
    if (error) return alert(`수정 실패: ${error.message}`);
    setRows(prev => prev.map(r => r.id === row.id ? merged : r));
  };

  const removeCase = async (row: CaseRow) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('portfolio').delete().eq('id', row.id);
    if (error) return alert(`삭제 실패: ${error.message}`);
    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = rows.slice();
    const j = index + dir; if (j < 0 || j >= next.length) return;
    const [a, b] = [next[index], next[j]]; next[index] = b; next[j] = a; setRows(next);
    for (let i = 0; i < next.length; i++) {
      const { error } = await supabase.from('portfolio').update({ sort_order: i }).eq('id', next[i].id);
      if (error) return alert(`정렬 저장 실패: ${error.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-2">제작사례 관리</h1>
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-white border-b flex justify-end">
        <button id="add-case-btn" onClick={addCase} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">저장</button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700">제목</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">카테고리</label>
          <input value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">날짜</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-700">설명</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">사진 URL</label>
          <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." />
          <p className="text-xs text-gray-500 mt-1">사진 URL을 직접 입력하거나 파일 업로드를 사용하세요.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-700">사진 파일 업로드</label>
          <input type="file" accept="image/*" onChange={e=>setPhotoFile(e.target.files?.[0] || null)} className="mt-1" />
          <p className="text-xs text-gray-500 mt-1">파일이 있으면 파일이 URL보다 우선됩니다.</p>
        </div>
        <div className="sm:col-span-2">
          <button onClick={addCase} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">저장</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">정렬</th>
              <th className="p-2">미리보기</th>
              <th className="p-2">제목</th>
              <th className="p-2">카테고리</th>
              <th className="p-2">날짜</th>
              <th className="p-2">사진 URL</th>
              <th className="p-2">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-2 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>move(i,-1)}>▲</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>move(i,1)}>▼</button>
                  </div>
                </td>
                <td className="p-2">
                  {r.photo ? (
                    <img src={r.photo} alt={r.title} className="w-40 aspect-[4/3] object-cover rounded" />
                  ) : (
                    <div className="w-40 aspect-[4/3] bg-gray-200 rounded flex items-center justify-center text-gray-400">이미지 없음</div>
                  )}
                </td>
                <td className="p-2 w-[30%]">
                  <input value={r.title} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, title:e.target.value}:x))} onBlur={()=>updateCase(r,{ title: rows.find(x=>x.id===r.id)!.title })} className="w-full border rounded px-2 py-1 mb-2" />
                  <textarea value={r.description || ''} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, description:e.target.value}:x))} onBlur={()=>updateCase(r,{ description: rows.find(x=>x.id===r.id)!.description || '' })} className="w-full border rounded px-2 py-1" rows={3} />
                </td>
                <td className="p-2">
                  <input value={r.category || ''} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, category:e.target.value}:x))} onBlur={()=>updateCase(r,{ category: rows.find(x=>x.id===r.id)!.category || '' })} className="w-full border rounded px-2 py-1" />
                </td>
                <td className="p-2">
                  <input type="date" value={r.date || ''} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, date:e.target.value}:x))} onBlur={()=>updateCase(r,{ date: rows.find(x=>x.id===r.id)!.date || '' })} className="w-full border rounded px-2 py-1" />
                </td>
                <td className="p-2">
                  <input value={r.photo || ''} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, photo:e.target.value}:x))} onBlur={()=>updateCase(r,{ photo: rows.find(x=>x.id===r.id)!.photo || '' })} className="w-full border rounded px-2 py-1" />
                </td>
                <td className="p-2 whitespace-nowrap">
                  <button className="px-3 py-1 border border-red-300 text-red-600 rounded" onClick={()=>removeCase(r)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

