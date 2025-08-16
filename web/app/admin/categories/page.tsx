"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number | null;
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true } as any);
    if (error) setError(error.message);
    setRows((data as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    if (!name.trim() || !slug.trim()) return;
    const { error } = await supabase.from("product_categories").insert({ name: name.trim(), slug: slug.trim(), is_active: isActive });
    if (error) return alert(error.message);
    setName(""); setSlug(""); setIsActive(true);
    load();
  };

  const updateCategory = async (cat: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("product_categories").update(patch).eq("id", cat.id);
    if (error) return alert(error.message);
    setRows(prev => prev.map(r => r.id === cat.id ? { ...r, ...patch } as Category : r));
  };

  const removeCategory = async (cat: Category) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("product_categories").delete().eq("id", cat.id);
    if (error) return alert(error.message);
    setRows(prev => prev.filter(r => r.id !== cat.id));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = rows.slice();
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const [a, b] = [next[index], next[j]];
    next[index] = b; next[j] = a;
    setRows(next);
    // persist sort_order by current index
    for (let i = 0; i < next.length; i++) {
      await supabase.from("product_categories").update({ sort_order: i }).eq("id", next[i].id);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">카테고리 관리</h1>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700">이름</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">슬러그</label>
            <input value={slug} onChange={e=>setSlug(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
            <label htmlFor="active" className="text-sm text-gray-700">활성</label>
          </div>
          <button id="add-category-btn" onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">추가</button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {loading ? (
        <div>로딩중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="p-2">정렬</th>
                <th className="p-2">이름</th>
                <th className="p-2">슬러그</th>
                <th className="p-2">상태</th>
                <th className="p-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={()=>move(i,-1)}>▲</button>
                      <button className="px-2 py-1 border rounded" onClick={()=>move(i,1)}>▼</button>
                    </div>
                  </td>
                  <td className="p-2">
                    <input value={r.name} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, name:e.target.value}:x))} onBlur={()=>updateCategory(r,{ name: rows.find(x=>x.id===r.id)!.name })} className="w-full border rounded px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <input value={r.slug} onChange={e=>setRows(prev=> prev.map(x=> x.id===r.id?{...x, slug:e.target.value}:x))} onBlur={()=>updateCategory(r,{ slug: rows.find(x=>x.id===r.id)!.slug })} className="w-full border rounded px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={r.is_active} onChange={e=>{ const v=e.target.checked; setRows(prev=> prev.map(x=> x.id===r.id?{...x, is_active:v}:x)); updateCategory(r,{ is_active: v }); }} />
                      <span>{r.is_active? '활성':'비활성'}</span>
                    </label>
                  </td>
                  <td className="p-2">
                    <button className="px-3 py-1 border border-red-300 text-red-600 rounded" onClick={()=>removeCategory(r)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

