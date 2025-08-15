"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type FixedRow = { id: string; section_type: "top" | "bottom" | "hero" | string; title?: string | null; content: string; is_active: boolean; updated_at?: string };

export default function FixedContentPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FixedRow[]>([]);
  const [loading, setLoading] = useState(true);

  // forms
  const [topTitle, setTopTitle] = useState("");
  const [topContent, setTopContent] = useState("");
  const [bottomTitle, setBottomTitle] = useState("");
  const [bottomContent, setBottomContent] = useState("");
  const [topImgFile, setTopImgFile] = useState<File | null>(null);
  const [topImgAlt, setTopImgAlt] = useState("");
  const [bottomImgFile, setBottomImgFile] = useState<File | null>(null);
  const [bottomImgAlt, setBottomImgAlt] = useState("");
  
  // hero banner forms
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImgFile, setHeroImgFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fixed_content")
      .select("id, section_type, title, content, is_active, updated_at")
      .order("updated_at", { ascending: false } as any);
    if (!error && data) setRows(data as FixedRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentTop = rows.find(r => r.section_type === "top" && r.is_active);
  const currentBottom = rows.find(r => r.section_type === "bottom" && r.is_active);
  const heroBanners = rows.filter(r => r.section_type === "hero" && r.is_active);

  const saveFixed = async (type: "top" | "bottom") => {
    try {
      // deactivate old
      await supabase.from("fixed_content").update({ is_active: false }).eq("section_type", type);
      const payload = {
        section_type: type,
        title: type === "top" ? (topTitle || null) : (bottomTitle || null),
        content: type === "top" ? topContent : bottomContent,
        is_active: true,
      };
      const { error } = await supabase.from("fixed_content").insert([payload]);
      if (error) throw error;
      setTopTitle(""); setTopContent(""); setBottomTitle(""); setBottomContent("");
      await load();
      alert("저장되었습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`저장 실패: ${msg}`);
    }
  };

  const deleteRow = async (row: FixedRow) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("fixed_content").delete().eq("id", row.id);
    if (error) return alert(`삭제 실패: ${error.message}`);
    await load();
  };

  const appendImage = async (type: 'top' | 'bottom') => {
    try {
      const file = type === 'top' ? topImgFile : bottomImgFile;
      if (!file) return alert('이미지 파일을 선택하세요');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `fixed/${type}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('path', path);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      const alt = (type === 'top' ? topImgAlt : bottomImgAlt) || '';
      const escAlt = alt.replace(/"/g, '&quot;');
      const tag = `<p><img src="${url}" alt="${escAlt}"/></p>`;
      if (type === 'top') {
        setTopContent(prev => `${prev || ''}${tag}`);
        setTopImgFile(null);
        setTopImgAlt('');
      } else {
        setBottomContent(prev => `${prev || ''}${tag}`);
        setBottomImgFile(null);
        setBottomImgAlt('');
      }
      alert('이미지가 내용에 삽입되었습니다. 적용 버튼을 눌러 저장하세요.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`이미지 삽입 실패: ${msg}`);
    }
  };

  const addHeroBanner = async () => {
    try {
      if (!heroImgFile) return alert('이미지 파일을 선택하세요');
      
      // Upload image
      const ext = heroImgFile.name.split('.').pop() || 'jpg';
      const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const fd = new FormData();
      fd.append('file', heroImgFile);
      fd.append('path', path);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();

      // Save to database
      const { error } = await supabase.from('fixed_content').insert([{
        section_type: 'hero',
        title: heroTitle || null,
        content: url, // Store image URL in content field
        is_active: true,
      }]);
      if (error) throw error;

      setHeroTitle('');
      setHeroImgFile(null);
      await load();
      alert('히어로 배너가 추가되었습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`히어로 배너 추가 실패: ${msg}`);
    }
  };

  const deleteHeroBanner = async (id: string) => {
    if (!confirm('히어로 배너를 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('fixed_content').delete().eq('id', id);
      if (error) throw error;
      await load();
      alert('히어로 배너가 삭제되었습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`삭제 실패: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼 l 단체복, 커스텀 굿즈 제작 전문" className="h-7 w-auto mr-3" />
              <h1 className="text-2xl font-bold">고정 상세페이지 관리</h1>
            </div>
            <button className="text-blue-600" onClick={() => router.push("/admin/products")}>상품 목록</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TOP */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">상단 고정 내용</h2>
          {currentTop ? (
            <div className="mb-4 text-sm text-gray-600">
              <div className="font-medium">현재 적용중</div>
              {currentTop.title && <div className="mt-1">제목: {currentTop.title}</div>}
              <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: currentTop.content }} />
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500">적용중인 상단 내용이 없습니다.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">제목(선택)</label>
              <input value={topTitle} onChange={e=>setTopTitle(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm text-gray-700">내용(HTML)</label>
              <textarea rows={4} value={topContent} onChange={e=>setTopContent(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm text-gray-700">이미지 삽입</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e=>setTopImgFile(e.target.files?.[0]||null)} />
                <input placeholder="이미지 alt" value={topImgAlt} onChange={e=>setTopImgAlt(e.target.value)} className="border rounded px-2 py-1" />
                <button type="button" onClick={()=>appendImage('top')} className="px-3 py-2 border rounded hover:bg-gray-50">삽입</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">업로드 후 상단 내용에 이미지를 추가합니다. 저장하려면 아래 적용 버튼을 누르세요.</p>
            </div>
          </div>
          <div className="mt-3 text-right">
            <button onClick={() => saveFixed("top")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">상단 적용</button>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">하단 고정 내용</h2>
          {currentBottom ? (
            <div className="mb-4 text-sm text-gray-600">
              <div className="font-medium">현재 적용중</div>
              {currentBottom.title && <div className="mt-1">제목: {currentBottom.title}</div>}
              <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: currentBottom.content }} />
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500">적용중인 하단 내용이 없습니다.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">제목(선택)</label>
              <input value={bottomTitle} onChange={e=>setBottomTitle(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm text-gray-700">내용(HTML)</label>
              <textarea rows={4} value={bottomContent} onChange={e=>setBottomContent(e.target.value)} className="mt-1 border rounded px-2 py-1 w-full" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm text-gray-700">이미지 삽입</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e=>setBottomImgFile(e.target.files?.[0]||null)} />
                <input placeholder="이미지 alt" value={bottomImgAlt} onChange={e=>setBottomImgAlt(e.target.value)} className="border rounded px-2 py-1" />
                <button type="button" onClick={()=>appendImage('bottom')} className="px-3 py-2 border rounded hover:bg-gray-50">삽입</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">업로드 후 하단 내용에 이미지를 추가합니다. 저장하려면 아래 적용 버튼을 누르세요.</p>
            </div>
          </div>
          <div className="mt-3 text-right">
            <button onClick={() => saveFixed("bottom")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">하단 적용</button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">히스토리</div>
          {loading ? (
            <div className="px-4 py-6">로딩중...</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-4 py-2 w-20">영역</th>
                  <th className="px-4 py-2 w-64">제목</th>
                  <th className="px-4 py-2">내용</th>
                  <th className="px-4 py-2 w-16">상태</th>
                  <th className="px-4 py-2 w-24">관리</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.length === 0 ? (
                  <tr><td className="px-4 py-3" colSpan={5}>내역이 없습니다.</td></tr>
                ) : rows.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2">{row.section_type === 'top' ? '상단' : '하단'}</td>
                    <td className="px-4 py-2">{row.title || '-'}</td>
                    <td className="px-4 py-2"><div className="max-h-24 overflow-hidden text-ellipsis whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: row.content }} /></td>
                    <td className="px-4 py-2">{row.is_active ? <span className="text-green-700">활성</span> : <span className="text-gray-500">비활성</span>}</td>
                    <td className="px-4 py-2">
                      <button className="text-red-600" onClick={()=>deleteRow(row)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Hero Banners Management */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">히어로 배너 관리</h2>
          
          {/* Add Hero Banner Form */}
          <div className="mb-6 p-4 border rounded">
            <h3 className="font-medium mb-3">새 히어로 배너 추가</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">배너 제목 (선택사항)</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="배너 제목 입력"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">배너 이미지</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroImgFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
              <button
                onClick={addHeroBanner}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!heroImgFile}
              >
                배너 추가
              </button>
            </div>
          </div>

          {/* Current Hero Banners */}
          <div>
            <h3 className="font-medium mb-3">현재 히어로 배너 ({heroBanners.length}개)</h3>
            {heroBanners.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                등록된 히어로 배너가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heroBanners.map((banner) => (
                  <div key={banner.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video relative bg-gray-100">
                      <img
                        src={banner.content}
                        alt={banner.title || '히어로 배너'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm mb-1">
                        {banner.title || '제목 없음'}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {banner.updated_at ? new Date(banner.updated_at).toLocaleDateString('ko-KR') : ''}
                      </div>
                      <button
                        onClick={() => deleteHeroBanner(banner.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

