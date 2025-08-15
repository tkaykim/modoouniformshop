"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = { id: string; name: string; size_chart_url?: string | null };
type ContentRow = { id: string; section_type: string; title?: string | null; content: string; sort_order: number; is_active: boolean };

const SECTION_TYPES = [
  { value: "top", label: "상단(고정 불러오기)" },
  { value: "middle", label: "중간(직접 입력/이미지)" },
  { value: "bottom", label: "하단(고정 불러오기)" },
];

export default function ProductContentPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // editor form
  const [sectionType, setSectionType] = useState<string>("middle");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);

  // size chart
  const [sizeChartFile, setSizeChartFile] = useState<File | null>(null);

  // middle image upload
  const [middleImageFile, setMiddleImageFile] = useState<File | null>(null);
  const [middleImageAlt, setMiddleImageAlt] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [p, cont] = await Promise.all([
      supabase.from("products").select("id, name, size_chart_url").eq("id", productId).maybeSingle(),
      supabase.from("product_content").select("id, section_type, title, content, sort_order, is_active").eq("product_id", productId).order("sort_order", { ascending: true }),
    ]);
    if (!p.error && p.data) setProduct(p.data as Product);
    if (!cont.error && cont.data) setItems(cont.data as ContentRow[]);
    setLoading(false);
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  const nextSortOrder = useMemo(() => (items.length ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 0), [items]);

  const createSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalContent = content;
      if (sectionType === 'top' || sectionType === 'bottom') {
        // fetch latest active fixed content and use its content
        const { data: fixed } = await supabase
          .from('fixed_content')
          .select('content')
          .eq('section_type', sectionType)
          .eq('is_active', true)
          .order('updated_at', { ascending: false } as any)
          .limit(1)
          .maybeSingle();
        finalContent = (fixed && (fixed as any).content) || '';
      }
      if (sectionType === 'middle' && middleImageFile) {
        // upload image via API route and append <img> tag
        const ext = middleImageFile.name.split('.').pop() || 'jpg';
        const path = `products/${productId}/content/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const fd = new FormData();
        fd.append('file', middleImageFile);
        fd.append('path', path);
        const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(await res.text());
        const { url } = await res.json();
        const imgTag = `<p><img src="${url}" alt="${(middleImageAlt||'').replace(/"/g, '&quot;')}"/></p>`;
        finalContent = `${finalContent || ''}${imgTag}`;
      }

      const { error } = await supabase.from("product_content").insert([
        { product_id: productId, section_type: sectionType, title: title || null, content: finalContent, sort_order: sortOrder || nextSortOrder, is_active: active },
      ]);
      if (error) throw error;
      setSectionType("middle"); setTitle(""); setContent(""); setMiddleImageFile(null); setMiddleImageAlt(""); setSortOrder(0); setActive(true);
      await load();
      alert("섹션이 추가되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`추가 실패: ${msg}`);
    }
  };

  const updateRow = async (row: ContentRow, patch: Partial<ContentRow>) => {
    const { error } = await supabase.from("product_content").update(patch).eq("id", row.id);
    if (error) return alert(`수정 실패: ${error.message}`);
    await load();
  };

  const deleteRow = async (row: ContentRow) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("product_content").delete().eq("id", row.id);
    if (error) return alert(`삭제 실패: ${error.message}`);
    await load();
  };

  const uploadSizeChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeChartFile) return alert("파일을 선택하세요");
    try {
      const ext = sizeChartFile.name.split(".").pop() || "jpg";
      const path = `products/${productId}/size_chart/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const fd = new FormData();
      fd.append("file", sizeChartFile);
      fd.append("path", path);
      const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url: publicUrl } = await res.json();
      const { error: updErr } = await supabase.from("products").update({ size_chart_url: publicUrl }).eq("id", productId);
      if (updErr) throw updErr;
      setSizeChartFile(null);
      await load();
      alert("사이즈표가 설정되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`업로드 실패: ${msg}`);
    }
  };

  const clearSizeChart = async () => {
    if (!confirm("사이즈표를 제거하시겠습니까? (이미지 파일은 스토리지에 남을 수 있습니다)")) return;
    const { error } = await supabase.from("products").update({ size_chart_url: null }).eq("id", productId);
    if (error) return alert(`제거 실패: ${error.message}`);
    await load();
  };

  // Drag reorder within all items
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  async function persistOrder(rows: ContentRow[]) {
    const updates = rows.map((r, idx) => ({ id: r.id, sort_order: idx })).filter((u, idx) => rows[idx].sort_order !== idx);
    if (updates.length === 0) return;
    await Promise.all(updates.map(u => supabase.from('product_content').update({ sort_order: u.sort_order }).eq('id', u.id)));
  }
  async function reorder(fromId: string, toId: string) {
    const fromIdx = items.findIndex(r => r.id === fromId);
    const toIdx = items.findIndex(r => r.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const next = items.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    await persistOrder(next);
    await load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼 l 단체복, 커스텀 굿즈 제작 전문" className="h-7 w-auto mr-3" />
              <h1 className="text-2xl font-bold">제품 상세페이지 관리</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-blue-600" onClick={() => router.push("/admin/fixed-content")}>고정상세페이지 관리</button>
              <button className="text-gray-700" onClick={() => router.push("/admin/products")}>상품 목록</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {product && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-3">대상 상품: {product.name}</div>
            <form onSubmit={uploadSizeChart} className="flex flex-col md:flex-row items-start md:items-end gap-3">
              <div>
                <label className="block text-sm text-gray-700">사이즈표 이미지</label>
                <input type="file" accept="image/*" onChange={(e)=>setSizeChartFile(e.target.files?.[0]||null)} className="mt-1" />
              </div>
              <div className="md:ml-auto flex items-center gap-2">
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">업로드/변경</button>
                {product.size_chart_url && <button type="button" onClick={clearSizeChart} className="px-4 py-2 border rounded">제거</button>}
              </div>
            </form>
            {product.size_chart_url && (
              <div className="mt-3 text-sm text-gray-600">
                현재 설정됨: <a href={product.size_chart_url} target="_blank" className="text-blue-600">이미지 링크</a>
              </div>
            )}
          </div>
        )}

        {/* Create section */}
        <form onSubmit={createSection} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">섹션 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700">영역</label>
              <select value={sectionType} onChange={e=>setSectionType(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full">
                {SECTION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">제목(선택)</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-700">내용(HTML)</label>
              <textarea rows={3} value={content} onChange={e=>setContent(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            {sectionType === 'middle' && (
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-700">중간 섹션 이미지(선택)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={(e)=>setMiddleImageFile(e.target.files?.[0]||null)} />
                  <input placeholder="이미지 alt" value={middleImageAlt} onChange={e=>setMiddleImageAlt(e.target.value)} className="border rounded px-2 py-1" />
                </div>
                <p className="text-xs text-gray-500 mt-1">이미지를 업로드하면 내용 끝에 이미지가 추가됩니다.</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-700">정렬</label>
              <input type="number" value={sortOrder} onChange={e=>setSortOrder(Number(e.target.value)||0)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} /> 활성
            </label>
            <div className="md:text-right">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">추가</button>
            </div>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
            <span>섹션 목록</span>
            <span className="text-xs text-gray-500">드래그하여 순서 변경</span>
          </div>
          {loading ? (
            <div className="px-4 py-6">로딩중...</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-4 py-2 w-10">순서</th>
                  <th className="px-4 py-2 w-28">영역</th>
                  <th className="px-4 py-2 w-64">제목</th>
                  <th className="px-4 py-2">내용</th>
                  <th className="px-4 py-2 w-20">활성</th>
                  <th className="px-4 py-2 w-24">관리</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-3">섹션이 없습니다.</td></tr>
                ) : items.flatMap(row => {
                  const beforePlaceholder = dragId && overId === row.id && dragId !== row.id;
                  const placeholder = beforePlaceholder ? [
                    <tr key={`${row.id}-ph`}>
                      <td colSpan={6}><div className="h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 rounded" /></td>
                    </tr>
                  ] : [];
                  const dragged = dragId === row.id;
                  const mainRow = (
                    <tr
                      key={row.id}
                      className={`border-t ${dragged ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={() => { setDragId(row.id); setOverId(row.id); }}
                      onDragEnter={() => setOverId(row.id)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => { if (dragId) reorder(dragId, row.id); setDragId(null); setOverId(null); }}
                      onDragEnd={() => { setDragId(null); setOverId(null); }}
                    >
                      <td className="px-4 py-2 cursor-grab select-none text-gray-400">⋮⋮</td>
                      <td className="px-4 py-2">
                        <select value={row.section_type} onChange={(e)=>updateRow(row,{ section_type: e.target.value })} className="border rounded px-2 py-1">
                          {SECTION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input className="border rounded px-2 py-1 w-full" value={row.title||""} onChange={(e)=>updateRow(row,{ title: e.target.value || null })} />
                      </td>
                      <td className="px-4 py-2">
                        <textarea className="border rounded px-2 py-1 w-full" rows={3} value={row.content} onChange={(e)=>updateRow(row,{ content: e.target.value })} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input type="checkbox" checked={row.is_active} onChange={(e)=>updateRow(row,{ is_active: e.target.checked })} />
                      </td>
                      <td className="px-4 py-2">
                        <button className="text-red-600" onClick={()=>deleteRow(row)}>삭제</button>
                      </td>
                    </tr>
                  );
                  return [...placeholder, mainRow];
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

