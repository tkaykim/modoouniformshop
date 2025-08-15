"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  base_price: number;
  sale_price?: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  category?: {
    id: string;
    name: string;
  };
  images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  base_price: number;
  sale_price: number;
  stock_quantity: number;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'options' | 'content'>('basic');
  const UNLIMITED_STOCK = 999999999;
  const [unlimitedStock, setUnlimitedStock] = useState(false);
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState("");

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    base_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    category_id: "",
    is_active: true,
    is_featured: false,
  });

  const supabase = createClient();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name),
          images:product_images(id, url, is_primary)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("상품 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("카테고리 로드 실패:", err);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      short_description: "",
      base_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      category_id: "",
      is_active: true,
      is_featured: false,
    });
    setEditingProduct(null);
    setShowForm(false);
    setUnlimitedStock(false);
    setPrimaryImageFile(null);
    setPrimaryImageUrl("");
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      base_price: product.base_price,
      sale_price: product.sale_price || 0,
      stock_quantity: product.stock_quantity,
      category_id: product.category?.id || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setUnlimitedStock(product.stock_quantity >= UNLIMITED_STOCK);
    setPrimaryImageFile(null);
    setPrimaryImageUrl("");
    setEditingProduct(product);
    setSelectedProduct(product);
    setActiveTab('basic');
    setProductModalOpen(true);
  };

  const openProductModal = (product: Product) => {
    // 기본정보 폼에 동일 데이터 바인딩
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      base_price: product.base_price,
      sale_price: product.sale_price || 0,
      stock_quantity: product.stock_quantity,
      category_id: product.category?.id || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setEditingProduct(product);
    setSelectedProduct(product);
    setActiveTab('basic');
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setSelectedProduct(null);
    setActiveTab('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        sale_price: formData.sale_price > 0 ? formData.sale_price : null,
        category_id: formData.category_id || null,
        stock_quantity: unlimitedStock ? UNLIMITED_STOCK : formData.stock_quantity,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(submitData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        const productId = editingProduct.id;
        if (primaryImageFile || primaryImageUrl.trim()) {
          await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
          let finalUrl = primaryImageUrl.trim();
          if (primaryImageFile) {
            const ext = primaryImageFile.name.split('.').pop() || 'jpg';
            const path = `products/${productId}/images/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
            const fd = new FormData();
            fd.append('file', primaryImageFile);
            fd.append('path', path);
            const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error(await res.text());
            const { url } = await res.json();
            finalUrl = url;
          }
          if (finalUrl) {
            await supabase.from('product_images').insert([{ product_id: productId, url: finalUrl, alt_text: formData.name, sort_order: 0, is_primary: true }]);
          }
        }
        alert("상품이 수정되었습니다.");
      } else {
        // Create new product
        const { data: created, error } = await supabase
          .from("products")
          .insert([submitData])
          .select('id')
          .single();

        if (error) throw error;
        const newId = created!.id as string;
        if (primaryImageFile || primaryImageUrl.trim()) {
          let finalUrl = primaryImageUrl.trim();
          if (primaryImageFile) {
            const ext = primaryImageFile.name.split('.').pop() || 'jpg';
            const path = `products/${newId}/images/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
            const fd = new FormData();
            fd.append('file', primaryImageFile);
            fd.append('path', path);
            const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error(await res.text());
            const { url } = await res.json();
            finalUrl = url;
          }
          if (finalUrl) {
            await supabase.from('product_images').insert([{ product_id: newId, url: finalUrl, alt_text: formData.name, sort_order: 0, is_primary: true }]);
          }
        }
        alert("상품이 등록되었습니다.");
      }

      resetForm();
      loadProducts();
    } catch (err) {
      console.error("상품 저장 실패:", err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      alert(`저장 실패: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;
      alert("상품이 삭제되었습니다.");
      loadProducts();
    } catch (err) {
      console.error("상품 삭제 실패:", err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      alert(`삭제 실패: ${errorMessage}`);
    }
  };

  const toggleProductStatus = async (product: Product, field: 'is_active' | 'is_featured') => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: !product[field] })
        .eq("id", product.id);

      if (error) throw error;
      loadProducts();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      alert(`상태 변경 실패: ${errorMessage}`);
    }
  };

  const duplicateProduct = async (product: Product) => {
    if (!confirm(`"${product.name}" 상품을 복사하시겠습니까?`)) return;
    try {
      // 1) 새 product 생성 (이름/슬러그 변형)
      const suffix = "-copy-" + Math.random().toString(36).slice(2,6);
      const newName = `${product.name} (복사)`;
      const newSlug = `${product.slug}${suffix}`;
      const { data: created, error: createErr } = await supabase
        .from('products')
        .insert([{ 
          name: newName,
          slug: newSlug,
          description: product.description,
          short_description: product.short_description,
          base_price: product.base_price,
          sale_price: product.sale_price ?? null,
          stock_quantity: product.stock_quantity,
          category_id: product.category?.id ?? null,
          is_active: false,
          is_featured: product.is_featured,
        }])
        .select('id')
        .single();
      if (createErr) throw createErr;
      const newId = created!.id as string;

      // 2) 옵션 복사
      const { data: opts } = await supabase
        .from('product_options')
        .select('type, name, value, price_modifier, stock_quantity, color_hex, image_url, sort_order, is_active')
        .eq('product_id', product.id);
      if (opts && opts.length) {
        const rows = opts.map(o => ({ ...o, product_id: newId }));
        await supabase.from('product_options').insert(rows);
      }

      // 3) 이미지 복사(메타만): 실제 파일 복사는 생략, URL만 그대로 복사
      const { data: imgs } = await supabase
        .from('product_images')
        .select('url, alt_text, sort_order, is_primary')
        .eq('product_id', product.id);
      if (imgs && imgs.length) {
        const rows = imgs.map(im => ({ ...im, product_id: newId }));
        await supabase.from('product_images').insert(rows);
      }

      // 4) 상세 콘텐츠 복사
      const { data: contents } = await supabase
        .from('product_content')
        .select('section_type, title, content, sort_order, is_active')
        .eq('product_id', product.id);
      if (contents && contents.length) {
        const rows = contents.map(c => ({ ...c, product_id: newId }));
        await supabase.from('product_content').insert(rows);
      }

      alert('상품이 복사되었습니다. (비활성 상태)');
      await loadProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`복사 실패: ${msg}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">상품 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼 l 단체복, 커스텀 굿즈 제작 전문" className="h-7 w-auto mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">상품 관리</h1>
                <p className="text-gray-600 mt-1">쇼핑몰 상품을 등록하고 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setSelectedProduct(null); setEditingProduct(null); setActiveTab('basic'); setProductModalOpen(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              상품 등록
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Form Modal (old) removed */}
        {false && (
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상품명 *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL 슬러그 *</label>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">간단 설명</label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">상세페이지는 탭에서 관리하세요.</span>
                    {selectedProduct && (
                      <button type="button" className="text-blue-600 text-sm underline" onClick={()=> setActiveTab('content')}>상세페이지로 이동</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">대표 이미지 파일</label>
                      <input type="file" accept="image/*" onChange={(e)=> setPrimaryImageFile(e.target.files?.[0]||null)} className="mt-1 block w-full" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">대표 이미지 URL</label>
                      <input value={primaryImageUrl} onChange={(e)=> setPrimaryImageUrl(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" placeholder="https://..." />
                      <p className="text-xs text-gray-500 mt-1">파일과 URL이 모두 입력되면 파일이 우선됩니다.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">카테고리</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">기본 가격 *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={formData.base_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseInt(e.target.value) || 0 }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">할인 가격</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.sale_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseInt(e.target.value) || 0 }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">재고 수량</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={unlimitedStock ? UNLIMITED_STOCK : formData.stock_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={unlimitedStock}
                        />
                        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={unlimitedStock} onChange={(e)=> setUnlimitedStock(e.target.checked)} /> 무제한</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">활성화</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">추천 상품</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "저장 중..." : (editingProduct ? "수정" : "등록")}
                    </button>
                  </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가격
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  재고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    draggable
                    onDragStart={() => (window as any).__drag_product_id = product.id}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => {
                      const dragId = (window as any).__drag_product_id as string | undefined;
                      if (!dragId || dragId === product.id) return;
                      // Reorder locally
                      const fromIdx = products.findIndex(p => p.id === dragId);
                      const toIdx = products.findIndex(p => p.id === product.id);
                      if (fromIdx < 0 || toIdx < 0) return;
                      const next = products.slice();
                      const [moved] = next.splice(fromIdx, 1);
                      next.splice(toIdx, 0, moved);
                      setProducts(next);
                      // Persist by index as sort_order
                      (async () => {
                        const updates = next.map((p, idx) => ({ id: p.id, sort_order: idx }));
                        for (const u of updates) {
                          await (await import("@/lib/supabaseClient")).supabase
                            .from("products")
                            .update({ sort_order: u.sort_order })
                            .eq("id", u.id);
                        }
                      })();
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 cursor-grab">⋮⋮</td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => openProductModal(product)}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          {product.images?.find(img => img.is_primary)?.url ? (
                            <Image
                              src={product.images.find(img => img.is_primary)!.url}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">이미지 없음</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.short_description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {product.sale_price && product.sale_price < product.base_price ? (
                          <>
                            <span className="font-medium text-red-600">
                              {formatPrice(product.sale_price)}원
                            </span>
                            <br />
                            <span className="text-gray-500 line-through text-xs">
                              {formatPrice(product.base_price)}원
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">
                            {formatPrice(product.base_price)}원
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={product.stock_quantity <= 0 ? "text-red-600" : ""}>
                        {product.stock_quantity}개
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => toggleProductStatus(product, 'is_active')}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.is_active ? "활성" : "비활성"}
                        </button>
                        {product.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            추천
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => duplicateProduct(product)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          복사
                        </button>
                        <button
                          onClick={() => { openProductModal(product); setActiveTab('options'); }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          옵션관리
                        </button>
                        <button
                          onClick={() => { openProductModal(product); setActiveTab('images'); }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          이미지
                        </button>
                        <button
                          onClick={() => { openProductModal(product); setActiveTab('content'); }}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          상세페이지
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Manage Modal (탭: 기본정보/옵션/상세페이지) */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center">
          <div className="bg-white w-11/12 max-w-5xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">제품 관리</div>
                <div className="text-sm text-gray-500">{selectedProduct ? selectedProduct.name : '신규 상품'}</div>
              </div>
              <button onClick={closeProductModal} className="text-gray-500 hover:text-gray-700">닫기</button>
            </div>
            <div className="px-6 pt-3">
              <div className="flex gap-2 border-b">
                <button className={`px-3 py-2 text-sm ${activeTab==='basic'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=>setActiveTab('basic')}>기본정보</button>
                <button className={`px-3 py-2 text-sm ${activeTab==='options'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=> selectedProduct ? setActiveTab('options') : null} disabled={!selectedProduct}>옵션</button>
                <button className={`px-3 py-2 text-sm ${activeTab==='content'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=> selectedProduct ? setActiveTab('content') : null} disabled={!selectedProduct}>상세페이지</button>
              </div>
            </div>
            <div className="p-6 overflow-auto">
              {activeTab === 'basic' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상품명 *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL 슬러그 *</label>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">간단 설명</label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">상세페이지는 탭에서 관리하세요.</span>
                    {selectedProduct && (
                      <button type="button" className="text-blue-600 text-sm underline" onClick={()=> setActiveTab('content')}>상세페이지로 이동</button>
                    )}
                  </div>

                  {/* 대표 이미지 첨부 또는 URL 입력 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">대표 이미지 파일</label>
                      <input type="file" accept="image/*" onChange={(e)=> setPrimaryImageFile(e.target.files?.[0]||null)} className="mt-1 block w-full" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">대표 이미지 URL</label>
                      <input value={primaryImageUrl} onChange={(e)=> setPrimaryImageUrl(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" placeholder="https://..." />
                      <p className="text-xs text-gray-500 mt-1">파일과 URL이 모두 입력되면 파일이 우선됩니다.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">기본 가격 *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={formData.base_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseInt(e.target.value) || 0 }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">할인 가격</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.sale_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseInt(e.target.value) || 0 }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">재고 수량</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={unlimitedStock ? UNLIMITED_STOCK : formData.stock_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={unlimitedStock}
                        />
                        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={unlimitedStock} onChange={(e)=> setUnlimitedStock(e.target.checked)} /> 무제한</label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">카테고리</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">활성화</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">추천 상품</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeProductModal} className="px-4 py-2 border rounded">닫기</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
                  </div>
                </form>
              )}
              {activeTab === 'options' && (
                <div className="h-[70vh]">
                  <iframe className="w-full h-full" src={`/admin/products/${selectedProduct.id}/options`} />
                </div>
              )}
              {activeTab === 'images' && (
                <div className="h-[70vh]">
                  <iframe className="w-full h-full" src={`/admin/products/${selectedProduct.id}/images`} />
                </div>
              )}
              {activeTab === 'content' && (
                <div className="h-[70vh]">
                  <iframe className="w-full h-full" src={`/admin/products/${selectedProduct.id}/content`} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}