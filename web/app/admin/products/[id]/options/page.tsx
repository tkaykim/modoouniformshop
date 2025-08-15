"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type OptionRow = {
  id: string;
  type: "color" | "size" | string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  color_hex?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function ProductOptionsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [items, setItems] = useState<OptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  // 색상 단일 추가 폼
  const [formColor, setFormColor] = useState<Partial<OptionRow>>({ type: "color", name: "", value: "", color_hex: "#000000", price_modifier: 0, stock_quantity: 0, sort_order: 0, is_active: true });
  // 사이즈 단일 추가 폼
  const [formSize, setFormSize] = useState<Partial<OptionRow>>({ type: "size", name: "", value: "", price_modifier: 0, stock_quantity: 0, sort_order: 0, is_active: true });
  // 사이즈 세트 추가 폼
  const SIZE_SET_A = ["130","140","150","XS","S","M","L","XL","2XL","3XL","4XL","5XL"] as const;
  const SIZE_SET_B = ["130","140","150","SS","S","M","L","LL","3L","4L","5L"] as const;
  const [sizeSetKey, setSizeSetKey] = useState<'A'|'B'>('A');
  const sizeSet = useMemo(()=> (sizeSetKey === 'A' ? SIZE_SET_A : SIZE_SET_B), [sizeSetKey]);
  const [sizeSetChecks, setSizeSetChecks] = useState<Record<string, boolean>>({});
  const [sizeSetDefaults, setSizeSetDefaults] = useState<{ price_modifier: number; stock_quantity: number; is_active: boolean }>({ price_modifier: 0, stock_quantity: 0, is_active: true });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_options")
      .select("id, type, name, value, price_modifier, stock_quantity, color_hex, image_url, sort_order, is_active")
      .eq("product_id", productId)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });
    if (!error && data) setItems(data as OptionRow[]);
    setLoading(false);
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formColor.name || !formColor.value) return alert("이름과 코드(value)를 입력하세요");
    const payload = {
      product_id: productId,
      type: 'color',
      name: formColor.name,
      value: formColor.value,
      price_modifier: Number(formColor.price_modifier) || 0,
      stock_quantity: Number(formColor.stock_quantity) || 0,
      color_hex: formColor.color_hex || null,
      image_url: formColor.image_url || null,
      sort_order: Number(formColor.sort_order) || 0,
      is_active: !!formColor.is_active,
    };
    const { error } = await supabase.from("product_options").insert([payload]);
    if (error) return alert(`등록 실패: ${error.message}`);
    setFormColor({ type: 'color', name: "", value: "", color_hex: formColor.color_hex || '#000000', price_modifier: 0, stock_quantity: 0, sort_order: 0, is_active: true });
    await load();
  };

  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSize.name || !formSize.value) return alert("이름과 코드(value)를 입력하세요");
    const payload = {
      product_id: productId,
      type: 'size',
      name: formSize.name,
      value: formSize.value,
      price_modifier: Number(formSize.price_modifier) || 0,
      stock_quantity: Number(formSize.stock_quantity) || 0,
      color_hex: null,
      image_url: null,
      sort_order: Number(formSize.sort_order) || 0,
      is_active: !!formSize.is_active,
    };
    const { error } = await supabase.from("product_options").insert([payload]);
    if (error) return alert(`등록 실패: ${error.message}`);
    setFormSize({ type: 'size', name: "", value: "", price_modifier: 0, stock_quantity: 0, sort_order: 0, is_active: true });
    await load();
  };

  const toggleSizeSetCheck = (label: string) => setSizeSetChecks(prev => ({ ...prev, [label]: !prev[label] }));

  const handleAddSizeSet = async () => {
    const rows = sizeSet
      .filter(lbl => sizeSetChecks[lbl] !== false) // 기본 체크 상태는 true로 간주
      .map((lbl, idx) => ({
        product_id: productId,
        type: 'size',
        name: lbl,
        value: lbl,
        price_modifier: Number(sizeSetDefaults.price_modifier) || 0,
        stock_quantity: Number(sizeSetDefaults.stock_quantity) || 0,
        color_hex: null,
        image_url: null,
        sort_order: idx,
        is_active: !!sizeSetDefaults.is_active,
      }));
    if (rows.length === 0) return alert('추가할 사이즈가 없습니다.');
    const { error } = await supabase.from('product_options').insert(rows);
    if (error) return alert(`세트 추가 실패: ${error.message}`);
    setSizeSetChecks({});
    await load();
  };

  const handleUpdate = async (row: OptionRow, patch: Partial<OptionRow>) => {
    const { error } = await supabase.from("product_options").update(patch).eq("id", row.id);
    if (error) return alert(`수정 실패: ${error.message}`);
    await load();
  };

  const handleDelete = async (row: OptionRow) => {
    if (!confirm(`옵션 \"${row.name}\"을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from("product_options").delete().eq("id", row.id);
    if (error) return alert(`삭제 실패: ${error.message}`);
    await load();
  };

  const grouped = useMemo(() => {
    return {
      color: items.filter(i => i.type === "color"),
      size: items.filter(i => i.type === "size"),
      other: items.filter(i => i.type !== "color" && i.type !== "size"),
    };
  }, [items]);

  // Drag & Drop reorder within group
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragGroup, setDragGroup] = useState<'color'|'size'|'other'|null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  async function persistOrder(rows: OptionRow[]) {
    const updates = rows.map((r, idx) => ({ id: r.id, sort_order: idx })).filter((u, idx) => rows[idx].sort_order !== idx);
    if (updates.length === 0) return;
    await Promise.all(updates.map(u => supabase.from('product_options').update({ sort_order: u.sort_order }).eq('id', u.id)));
  }
  async function reorderWithin(groupKey: 'color'|'size'|'other', fromId: string, toId: string) {
    const source = grouped[groupKey];
    const fromIdx = source.findIndex(r => r.id === fromId);
    const toIdx = source.findIndex(r => r.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const next = source.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(prev => {
      const others = prev.filter(r => r.type !== groupKey);
      return [...others, ...next];
    });
    await persistOrder(next);
    await load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-bold">제품 옵션 관리</h1>
            <button className="text-blue-600" onClick={() => router.push("/admin/products")}>목록으로</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 색상 옵션 추가 */}
        <form onSubmit={handleCreateColor} className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">색상 옵션 추가하기</h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700">이름</label>
              <input value={formColor.name||""} onChange={e=>setFormColor(f=>({...f, name: e.target.value}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">코드(value)</label>
              <input value={formColor.value||""} onChange={e=>setFormColor(f=>({...f, value: e.target.value}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">색상 선택</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={(formColor.color_hex as string)||"#000000"} onChange={e=>setFormColor(f=>({...f, color_hex: e.target.value}))} className="h-9 w-12 p-0 border rounded" />
                <input value={(formColor.color_hex as string)||"#000000"} onChange={e=>setFormColor(f=>({...f, color_hex: e.target.value}))} className="border rounded px-2 py-1 w-28" placeholder="#000000"/>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700">가격 가산(+원)</label>
              <input type="number" value={formColor.price_modifier||0} onChange={e=>setFormColor(f=>({...f, price_modifier: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">재고</label>
              <input type="number" value={formColor.stock_quantity||0} onChange={e=>setFormColor(f=>({...f, stock_quantity: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">정렬</label>
              <input type="number" value={formColor.sort_order||0} onChange={e=>setFormColor(f=>({...f, sort_order: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">활성</label>
              <input type="checkbox" checked={!!formColor.is_active} onChange={e=>setFormColor(f=>({...f, is_active: e.target.checked}))}/>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">색상 추가</button>
            </div>
          </div>
        </form>

        {/* 사이즈 옵션 추가 */}
        <form onSubmit={handleCreateSize} className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">사이즈 옵션 추가하기</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700">이름</label>
              <input value={formSize.name||""} onChange={e=>setFormSize(f=>({...f, name: e.target.value}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">코드(value)</label>
              <input value={formSize.value||""} onChange={e=>setFormSize(f=>({...f, value: e.target.value}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">가격 가산(+원)</label>
              <input type="number" value={formSize.price_modifier||0} onChange={e=>setFormSize(f=>({...f, price_modifier: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">재고</label>
              <input type="number" value={formSize.stock_quantity||0} onChange={e=>setFormSize(f=>({...f, stock_quantity: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">정렬</label>
              <input type="number" value={formSize.sort_order||0} onChange={e=>setFormSize(f=>({...f, sort_order: Number(e.target.value)||0}))} className="mt-1 border rounded px-2 py-1 w-full"/>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">활성</label>
              <input type="checkbox" checked={!!formSize.is_active} onChange={e=>setFormSize(f=>({...f, is_active: e.target.checked}))}/>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">사이즈 추가</button>
            </div>
          </div>
        </form>

        {/* 사이즈 세트 추가 */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="font-semibold mb-3">사이즈 세트 추가</h3>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="text-sm">세트</label>
            <select value={sizeSetKey} onChange={e=>setSizeSetKey(e.target.value as 'A'|'B')} className="border rounded px-2 py-1">
              <option value="A">표준: 130~5XL (XS~XL, 2XL~5XL)</option>
              <option value="B">대체: 130~5L (SS~LL, 3L~5L)</option>
            </select>
            <label className="ml-4 text-sm">기본 가산(+원)</label>
            <input type="number" value={sizeSetDefaults.price_modifier} onChange={e=>setSizeSetDefaults(d=>({ ...d, price_modifier: Number(e.target.value)||0 }))} className="border rounded px-2 py-1 w-24"/>
            <label className="text-sm">기본 재고</label>
            <input type="number" value={sizeSetDefaults.stock_quantity} onChange={e=>setSizeSetDefaults(d=>({ ...d, stock_quantity: Number(e.target.value)||0 }))} className="border rounded px-2 py-1 w-24"/>
            <label className="text-sm">활성</label>
            <input type="checkbox" checked={sizeSetDefaults.is_active} onChange={e=>setSizeSetDefaults(d=>({ ...d, is_active: e.target.checked }))} />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {sizeSet.map(lbl => (
              <label key={lbl} className={`px-3 py-1.5 border rounded-full text-sm cursor-pointer ${sizeSetChecks[lbl] === false ? 'opacity-40' : ''}`}>
                <input type="checkbox" className="mr-1" checked={sizeSetChecks[lbl] !== false} onChange={()=> toggleSizeSetCheck(lbl)} />
                {lbl}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={handleAddSizeSet} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">세트 추가</button>
          </div>
        </div>

        {/* Tables */}
        {loading ? (
          <div>로딩중...</div>
        ) : (
          [
            { label: "색상 옵션", rows: grouped.color, showColor: true, key: 'color' as const },
            { label: "사이즈 옵션", rows: grouped.size, showColor: false, key: 'size' as const },
          ].map(section => (
            <div key={section.label} className="bg-white rounded-lg shadow mb-8 overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
                <span>{section.label}</span>
                <span className="text-xs text-gray-500">드래그하여 순서 변경</span>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-600">
                    <th className="px-4 py-2 w-10">순서</th>
                    <th className="px-4 py-2">이름</th>
                    <th className="px-4 py-2">코드</th>
                    {section.showColor && <th className="px-4 py-2">색상</th>}
                    <th className="px-4 py-2">가격 가산</th>
                    <th className="px-4 py-2">재고</th>
                    <th className="px-4 py-2">활성</th>
                    <th className="px-4 py-2">관리</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {section.rows.length === 0 ? (
                    <tr><td className="px-4 py-3" colSpan={8}>옵션이 없습니다.</td></tr>
                  ) : section.rows.flatMap(row => {
                    const beforePlaceholder = dragId && dragGroup === section.key && overId === row.id && dragId !== row.id;
                    const placeholder = beforePlaceholder ? [
                      <tr key={`${row.id}-ph`}>
                        <td colSpan={section.showColor ? 8 : 7}>
                          <div className="h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 rounded" />
                        </td>
                      </tr>
                    ] : [];
                    const dragged = dragId === row.id;
                    const mainRow = (
                      <tr
                        key={row.id}
                        className={`border-t ${dragged ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={() => { setDragId(row.id); setDragGroup(section.key); setOverId(row.id); }}
                        onDragEnter={() => { if (dragGroup === section.key) setOverId(row.id); }}
                        onDragOver={(e) => { if (dragGroup === section.key) e.preventDefault(); }}
                        onDrop={() => { if (dragGroup === section.key && dragId) reorderWithin(section.key, dragId, row.id); setDragId(null); setDragGroup(null); setOverId(null); }}
                        onDragEnd={() => { setDragId(null); setDragGroup(null); setOverId(null); }}
                      >
                        <td className="px-4 py-2 cursor-grab select-none text-gray-400">⋮⋮</td>
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.value}</td>
                        {section.showColor && (
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: row.color_hex || '#fff' }} />
                              <input className="border rounded px-2 py-1 w-28" value={row.color_hex||""} onChange={e=>handleUpdate(row,{ color_hex: e.target.value })} />
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <input type="number" className="border rounded px-2 py-1 w-24" value={row.price_modifier}
                            onChange={e=>handleUpdate(row,{ price_modifier: Number(e.target.value)||0 })} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" className="border rounded px-2 py-1 w-20" value={row.stock_quantity}
                            onChange={e=>handleUpdate(row,{ stock_quantity: Number(e.target.value)||0 })} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="checkbox" checked={row.is_active} onChange={e=>handleUpdate(row,{ is_active: e.target.checked })} />
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={()=>handleDelete(row)} className="text-red-600">삭제</button>
                        </td>
                      </tr>
                    );
                    return [...placeholder, mainRow];
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

