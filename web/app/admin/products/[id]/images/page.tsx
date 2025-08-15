"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type Product = { id: string; name: string };
type ProductImage = { id: string; url: string; alt_text?: string | null; sort_order: number; is_primary: boolean };

export default function ProductImagesPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  // URL add states
  const [urlInput, setUrlInput] = useState("");
  const [urlAltText, setUrlAltText] = useState("");
  const [urlIsPrimary, setUrlIsPrimary] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, imgs] = await Promise.all([
      supabase.from("products").select("id, name").eq("id", productId).maybeSingle(),
      supabase.from("product_images").select("id, url, alt_text, sort_order, is_primary").eq("product_id", productId).order("sort_order", { ascending: true }),
    ]);
    if (!p.error && p.data) setProduct(p.data as Product);
    if (!imgs.error && imgs.data) setItems(imgs.data as ProductImage[]);
    setLoading(false);
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  const nextSortOrder = useMemo(() => (items.length ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 0), [items]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("이미지 파일을 선택하세요");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `products/${productId}/images/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("path", path);
      const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url: publicUrl } = await res.json();

      if (isPrimary) {
        // unset others
        await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
      }
      const { error: dbErr } = await supabase.from("product_images").insert([
        { product_id: productId, url: publicUrl, alt_text: altText || null, sort_order: nextSortOrder, is_primary: isPrimary },
      ]);
      if (dbErr) throw dbErr;
      setFile(null); setAltText(""); setIsPrimary(false);
      await load();
      alert("이미지가 업로드되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`업로드 실패: ${msg}`);
    }
  };

  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert("이미지 URL을 입력하세요");
    try {
      if (urlIsPrimary) {
        await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
      }
      const { error: dbErr } = await supabase.from("product_images").insert([
        { product_id: productId, url: urlInput.trim(), alt_text: (urlAltText || null), sort_order: nextSortOrder, is_primary: urlIsPrimary },
      ]);
      if (dbErr) throw dbErr;
      setUrlInput(""); setUrlAltText(""); setUrlIsPrimary(false);
      await load();
      alert("이미지 URL이 등록되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`등록 실패: ${msg}`);
    }
  };

  const parseStoragePathFromUrl = (url: string) => {
    const marker = "/storage/v1/object/public/products/";
    const idx = url.indexOf(marker);
    if (idx < 0) return null;
    return url.substring(idx + marker.length);
  };

  const handleDelete = async (row: ProductImage) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("product_images").delete().eq("id", row.id);
      if (error) throw error;
      const path = parseStoragePathFromUrl(row.url);
      if (path) {
        await fetch('/api/storage/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: [path] }) });
      }
      await load();
      alert("삭제되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`삭제 실패: ${msg}`);
    }
  };

  const handleSetPrimary = async (row: ProductImage) => {
    try {
      await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
      await supabase.from("product_images").update({ is_primary: true }).eq("id", row.id);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`설정 실패: ${msg}`);
    }
  };

  const handleSortChange = async (row: ProductImage, value: number) => {
    try {
      await supabase.from("product_images").update({ sort_order: value }).eq("id", row.id);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`정렬 변경 실패: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼 l 단체복, 커스텀 굿즈 제작 전문" className="h-7 w-auto mr-3" />
              <h1 className="text-2xl font-bold">제품 이미지 관리</h1>
            </div>
            <button className="text-blue-600" onClick={() => router.push("/admin/products")}>목록으로</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {product && (
          <div className="mb-6 text-gray-700">대상 상품: <span className="font-semibold">{product.name}</span></div>
        )}

        {/* Uploader (파일 업로드) */}
        <form onSubmit={handleUpload} className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="font-semibold mb-3">이미지 업로드</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700">파일</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">대체 텍스트(alt)</label>
              <input value={altText} onChange={(e)=>setAltText(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPrimary} onChange={(e)=>setIsPrimary(e.target.checked)} />
              대표 이미지로 설정
            </label>
            <div className="md:text-right">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">업로드</button>
            </div>
          </div>
        </form>

        {/* Add by URL (외부 이미지 주소) */}
        <form onSubmit={handleAddByUrl} className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="font-semibold mb-3">이미지 URL로 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">이미지 주소(URL)</label>
              <input value={urlInput} onChange={(e)=>setUrlInput(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700">대체 텍스트(alt)</label>
              <input value={urlAltText} onChange={(e)=>setUrlAltText(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={urlIsPrimary} onChange={(e)=>setUrlIsPrimary(e.target.checked)} />
              대표 이미지로 설정
            </label>
            <div className="md:text-right">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">추가</button>
            </div>
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div>로딩중...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-4 py-2 w-24">미리보기</th>
                  <th className="px-4 py-2">ALT</th>
                  <th className="px-4 py-2 w-24">정렬</th>
                  <th className="px-4 py-2 w-24">대표</th>
                  <th className="px-4 py-2 w-24">관리</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.length === 0 ? (
                  <tr><td className="px-4 py-3" colSpan={5}>이미지가 없습니다.</td></tr>
                ) : items.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        <Image src={row.url} alt={row.alt_text || ""} fill className="object-cover" unoptimized />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input className="border rounded px-2 py-1 w-full" value={row.alt_text || ""} onChange={async (e)=>{ await supabase.from("product_images").update({ alt_text: e.target.value || null }).eq("id", row.id); }} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" className="border rounded px-2 py-1 w-20" value={row.sort_order}
                        onChange={(e)=> handleSortChange(row, Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-2">
                      {row.is_primary ? (
                        <span className="text-green-700">예</span>
                      ) : (
                        <button className="text-blue-600" onClick={()=>handleSetPrimary(row)}>설정</button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-red-600" onClick={()=>handleDelete(row)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

