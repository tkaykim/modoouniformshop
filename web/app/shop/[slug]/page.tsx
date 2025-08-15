"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface ProductOption {
  id: string;
  type: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  color_hex?: string;
  image_url?: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
}

interface ProductContent {
  id: string;
  section_type: string;
  title?: string;
  content: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  base_price: number;
  sale_price?: number;
  stock_quantity: number;
  size_chart_url?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  options: Record<string, ProductOption[]>;
  content: ProductContent[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [matrixQuantities, setMatrixQuantities] = useState<Record<string, Record<string, number>>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'basic' | 'options' | 'images' | 'content'>('basic');
  const [basicName, setBasicName] = useState("");
  const [basicShort, setBasicShort] = useState("");
  const [basicDesc, setBasicDesc] = useState("");

  // use singleton supabase client

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin 권한 확인
  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) return;
        type ProfileRow = { role?: string | null };
        const prof = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const role = (prof.data as ProfileRow | null)?.role || null;
        if (role === 'admin') setIsAdmin(true);
      } catch {}
    })();
  }, []);

  const loadProduct = async () => {
    setLoading(true);
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc("get_product_with_options", {
        product_slug: slug
      });

      let productData: any | null = null;
      if (!error && data) {
        const d: any = data;
        productData = {
          ...(d.product || {}),
          category: d.category || undefined,
          images: d.images || [],
          options: d.options || {},
          content: d.content || [],
        } as Product;
      } else {
        // Fallback: build product via separate selects (robust against embedding issues)
        const prodRes = await supabase
          .from('products')
          .select('id, name, slug, description, short_description, base_price, sale_price, stock_quantity, category_id, size_chart_url')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();
        if (!prodRes.data) {
          setError('상품을 찾을 수 없습니다.');
          return;
        }
        const productId = prodRes.data.id as string;

        const [catRes, imgRes, optRes, contRes] = await Promise.all([
          supabase.from('product_categories').select('id, name, slug').eq('id', (prodRes.data as any).category_id).maybeSingle(),
          supabase.from('product_images').select('id, url, alt_text, is_primary, sort_order').eq('product_id', productId).order('sort_order'),
          supabase.from('product_options').select('id, type, name, value, price_modifier, stock_quantity, color_hex, image_url, sort_order, is_active').eq('product_id', productId).order('sort_order'),
          supabase.from('product_content').select('id, section_type, title, content, sort_order, is_active').eq('product_id', productId).order('sort_order'),
        ]);

        const byType: Record<string, ProductOption[]> = {};
        (optRes.data || []).forEach((opt: any) => {
          if (opt.is_active === false) return;
          if (!byType[opt.type]) byType[opt.type] = [];
          byType[opt.type].push(opt as ProductOption);
        });

        productData = {
          id: prodRes.data.id,
          name: prodRes.data.name,
          slug: prodRes.data.slug,
          description: prodRes.data.description,
          short_description: prodRes.data.short_description,
          base_price: prodRes.data.base_price,
          sale_price: prodRes.data.sale_price,
          stock_quantity: prodRes.data.stock_quantity,
          size_chart_url: (prodRes.data as any).size_chart_url,
          category: catRes.data ? { id: catRes.data.id, name: catRes.data.name, slug: catRes.data.slug } : undefined,
          images: imgRes.data || [],
          options: byType,
          content: (contRes.data || []).filter((c: any) => c.is_active !== false),
        } as Product;
      }

      const prod = productData as Product;
      setProduct(prod);
      // 기본정보 폼 초기값
      setBasicName(prod.name);
      setBasicShort(prod.short_description || "");
      setBasicDesc(prod.description || "");

      // Initialize selected options with first available option for each type
      const initialOptions: Record<string, string> = {};
      const optMap = (prod && prod.options) ? prod.options : {} as Record<string, ProductOption[]>;
      Object.keys(optMap).forEach(optionType => {
        const options = optMap[optionType];
        if (options && options.length > 0) {
          initialOptions[optionType] = options[0].id;
        }
      });
      setSelectedOptions(initialOptions);

      // Initialize matrix quantities (size x color)
      const sizes = optMap['size'] as ProductOption[] | undefined;
      const colors = optMap['color'] as ProductOption[] | undefined;
      if (sizes && colors) {
        const initMatrix: Record<string, Record<string, number>> = {};
        sizes.forEach(s => {
          initMatrix[s.id] = {};
          colors.forEach(c => { initMatrix[s.id][c.id] = 0; });
        });
        setMatrixQuantities(initMatrix);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : (()=>{ try { return JSON.stringify(err); } catch { return String(err); } })();
      console.error("상품 로드 실패:", msg);
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleBasicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ name: basicName, short_description: basicShort, description: basicDesc })
        .eq('id', product.id);
      if (error) throw error;
      setProduct(prev => prev ? { ...prev, name: basicName, short_description: basicShort, description: basicDesc } : prev);
      alert('기본정보가 저장되었습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`저장 실패: ${msg}`);
    }
  };

  const calculateCurrentPrice = () => {
    if (!product) return 0;
    
    const basePrice = product.sale_price || product.base_price;
    let totalModifier = 0;

    Object.entries(selectedOptions).forEach(([optionType, optionId]) => {
      const option = product.options[optionType]?.find(opt => opt.id === optionId);
      if (option) {
        totalModifier += option.price_modifier || 0;
      }
    });

    return basePrice + totalModifier;
  };

  const calculateTotalPrice = () => {
    return calculateCurrentPrice() * quantity;
  };

  const getSelectedOptionStock = () => {
    if (!product) return 0;
    
    // For simplicity, return the minimum stock among selected options
    let minStock = product.stock_quantity;
    
    Object.entries(selectedOptions).forEach(([optionType, optionId]) => {
      const option = product.options[optionType]?.find(opt => opt.id === optionId);
      if (option && option.stock_quantity < minStock) {
        minStock = option.stock_quantity;
      }
    });

    return minStock;
  };

  // 디자인 정책: 교차 행렬 대신 색상 칩 + 사이즈 버튼 UI를 우선 사용
  const hasMatrix = false;

  const getCellUnitPrice = (sizeId: string, colorId: string) => {
    if (!product) return 0;
    const base = product.sale_price || product.base_price;
    const size = (product.options as any)['size']?.find((o: ProductOption) => o.id === sizeId);
    const color = (product.options as any)['color']?.find((o: ProductOption) => o.id === colorId);
    return base + (size?.price_modifier || 0) + (color?.price_modifier || 0);
  };

  const getCellMaxStock = (sizeId: string, colorId: string) => {
    if (!product) return 0;
    const size = (product.options as any)['size']?.find((o: ProductOption) => o.id === sizeId);
    const color = (product.options as any)['color']?.find((o: ProductOption) => o.id === colorId);
    // 보수적으로 각 옵션 재고의 최소값을 사용
    return Math.max(0, Math.min(size?.stock_quantity || 0, color?.stock_quantity || 0));
  };

  const totals = useMemo(() => {
    if (!hasMatrix) {
      return { qty: quantity, price: calculateTotalPrice() };
    }
    let totalQty = 0;
    let totalPrice = 0;
    Object.entries(matrixQuantities).forEach(([sizeId, colorMap]) => {
      Object.entries(colorMap).forEach(([colorId, qty]) => {
        if (qty > 0) {
          totalQty += qty;
          totalPrice += qty * getCellUnitPrice(sizeId, colorId);
        }
      });
    });
    return { qty: totalQty, price: totalPrice };
  }, [hasMatrix, matrixQuantities, quantity]);

  const handleMatrixChange = (sizeId: string, colorId: string, nextQty: number) => {
    setMatrixQuantities(prev => {
      const next = { ...prev };
      next[sizeId] = { ...(next[sizeId] || {}) };
      next[sizeId][colorId] = Math.max(0, nextQty);
      return next;
    });
  };

  const isAddToCartDisabled = () => {
    if (hasMatrix) {
      return totals.qty <= 0;
    }
    const stock = getSelectedOptionStock();
    return stock <= 0 || quantity > stock || quantity <= 0;
  };

  const handleAddToCart = async () => {
    if (!product || isAddToCartDisabled()) return;

    try {
      // Get or create session ID for guest users
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('cart_session_id', sessionId);
      }

      if (hasMatrix) {
        // Build rows for each non-zero variant
        const rows: any[] = [];
        Object.entries(matrixQuantities).forEach(([sizeId, colorMap]) => {
          Object.entries(colorMap).forEach(([colorId, qty]) => {
            if (qty > 0) {
              rows.push({
                session_id: sessionId,
                product_id: product.id,
                selected_options: { size: sizeId, color: colorId },
                quantity: qty,
                unit_price: getCellUnitPrice(sizeId, colorId),
                total_price: qty * getCellUnitPrice(sizeId, colorId)
              });
            }
          });
        });
        if (rows.length === 0) return;
        const { error } = await supabase.from('cart_items').insert(rows);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            session_id: sessionId,
            product_id: product.id,
            selected_options: selectedOptions,
            quantity: quantity,
            unit_price: calculateCurrentPrice(),
            total_price: calculateTotalPrice()
          });
        if (error) throw error;
      }

      alert('장바구니에 추가되었습니다!');
    } catch (err) {
      console.error('장바구니 추가 실패:', err);
      alert('장바구니에 추가하는데 실패했습니다.');
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
          <p className="mt-4 text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "상품을 찾을 수 없습니다."}</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/shop" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 쇼핑몰
            </Link>
            {product.category && (
              <>
                <span className="text-gray-400 mr-2">/</span>
                <span className="text-gray-600">{product.category.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin && (
          <button
            onClick={() => { setShowAdminPanel(true); setAdminTab('basic'); }}
            className="fixed bottom-5 right-5 z-40 px-4 py-2 bg-black text-white rounded-full shadow-lg hover:bg-gray-800"
          >
            관리자 관리
          </button>
        )}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* Product Images */}
          <div className="lg:max-w-lg lg:self-start">
            <div className="aspect-w-1 aspect-h-1">
              {product.images && product.images.length > 0 ? (
                <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[currentImageIndex]?.url}
                    alt={product.images[currentImageIndex]?.alt_text || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">이미지 없음</span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 bg-gray-100 rounded-md overflow-hidden ${
                      currentImageIndex === index ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || `${product.name} 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mt-8 lg:mt-0">
            {/* Category */}
            {product.category && (
              <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
            )}

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-lg text-gray-600 mb-6">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="mb-6">
              {product.sale_price && product.sale_price < product.base_price ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(calculateCurrentPrice())}원
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.base_price)}원
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm font-semibold">
                    SALE
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(calculateCurrentPrice())}원
                </span>
              )}
            </div>

            {/* Options / Matrix */}
            {hasMatrix ? (
              <div className="mb-6 space-y-4">
                <label className="block text-sm font-medium text-gray-700">사이즈-색상 교차 옵션</label>
                <div className="overflow-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 bg-gray-50">사이즈 \ 색상</th>
                        {product.options['color']!.map(c => (
                          <th key={c.id} className="border px-2 py-1 bg-gray-50 whitespace-nowrap">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.options['size']!.map(s => (
                        <tr key={s.id}>
                          <td className="border px-2 py-1 font-medium bg-gray-50 whitespace-nowrap">{s.name}</td>
                          {product.options['color']!.map(c => {
                            const qty = matrixQuantities[s.id]?.[c.id] || 0;
                            const unit = getCellUnitPrice(s.id, c.id);
                            const max = getCellMaxStock(s.id, c.id);
                            return (
                              <td key={c.id} className="border px-2 py-1 align-top">
                                <div className="flex flex-col items-start gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={max}
                                    value={qty}
                                    onChange={(e) => handleMatrixChange(s.id, c.id, Math.min(max, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-20 border rounded px-2 py-1"
                                  />
                                  <div className="text-xs text-gray-600">단가 {formatPrice(unit)}원</div>
                                  {max === 0 && <div className="text-[10px] text-red-500">품절</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded border flex items-center justify-between">
                  <div className="text-sm text-gray-700">총 수량: <span className="font-semibold">{totals.qty}</span>개</div>
                  <div className="text-sm text-gray-700">총 금액: <span className="font-semibold text-blue-600">{formatPrice(totals.price)}원</span></div>
                </div>
              </div>
            ) : (
              product.options && Object.keys(product.options).length > 0 && (
                <div className="mb-6 space-y-4">
                  {/* Color chips */}
                  {Array.isArray((product.options as any)['color']) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="block text-sm font-medium text-gray-700">색상</span>
                        <span className="text-xs text-gray-500">{(() => {
                          const cId = (selectedOptions as any)['color'];
                          const c = ((product.options as any)['color'] as ProductOption[]).find(o => o.id === cId);
                          return c?.name || '';
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {((product.options as any)['color'] as ProductOption[]).map((c) => (
                          <button
                            key={c.id}
                            aria-selected={selectedOptions['color'] === c.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, color: c.id }))}
                            className={`w-8 h-8 rounded-full border flex-shrink-0 ${selectedOptions['color'] === c.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'} ${c.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ backgroundColor: c.color_hex || '#ffffff' }}
                            title={c.name}
                            disabled={c.stock_quantity <= 0}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size buttons */}
                  {Array.isArray((product.options as any)['size']) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">사이즈</label>
                      <div className="flex flex-wrap gap-2">
                        {((product.options as any)['size'] as ProductOption[]).map((s) => (
                          <button
                            key={s.id}
                            aria-selected={selectedOptions['size'] === s.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, size: s.id }))}
                            disabled={s.stock_quantity <= 0}
                            className={`min-w-[56px] px-4 py-2 border rounded-md text-sm font-medium ${
                              selectedOptions['size'] === s.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            } ${s.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                      {product.size_chart_url && (
                        <button type="button" onClick={() => setShowSizeChart(true)} className="mt-3 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">사이즈표 보기</button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Quantity (single variant only) */}
            {!hasMatrix && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수량
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-l-md hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={getSelectedOptionStock()}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(getSelectedOptionStock(), parseInt(e.target.value) || 1)))}
                  className="w-20 h-10 text-center border-t border-b border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setQuantity(Math.min(getSelectedOptionStock(), quantity + 1))}
                  className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-r-md hover:bg-gray-50"
                >
                  +
                </button>
                <button type="button" onClick={() => setShowPriceTable(true)} className="ml-4 px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">할인 가격표</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">1개부터 주문 가능</div>
            </div>
            )}

            {/* Shipping & Total */}
            <div className="mb-3 flex items-center justify-between text-sm text-gray-700">
              <span>배송비</span>
              <span>3,000원</span>
            </div>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">총 금액</span>
                <span className="text-2xl font-bold text-blue-600">
                  {hasMatrix ? formatPrice(totals.price) : formatPrice(calculateTotalPrice())}원
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddToCartDisabled()}
                className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
                  isAddToCartDisabled()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {getSelectedOptionStock() <= 0 ? "품절" : "장바구니 담기"}
              </button>
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                상담 문의
              </Link>
            </div>
          </div>
        </div>

        {/* Product Content */}
        {product.content && product.content.length > 0 && (
          <div className="mt-16">
            <div className="border-t border-gray-200 pt-8">
              {product.content
                .sort((a, b) => (a.section_type === 'top' ? -1 : b.section_type === 'top' ? 1 : 0))
                .map((content) => (
                  <div key={content.id} className="mb-8">
                    {content.title && (
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h2>
                    )}
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: content.content }}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Discount table modal (mockup) */}
      {showPriceTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPriceTable(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg">
            <button aria-label="close" onClick={() => setShowPriceTable(false)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8">✕</button>
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-3">할인 가격표</h3>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">수량</th>
                    <th className="border px-2 py-1 text-left">단가</th>
                  </tr>
                </thead>
                <tbody>
                  {[{qty:1,price:18900},{qty:5,price:18700},{qty:20,price:18500},{qty:30,price:18300},{qty:50,price:17900}].map(r => (
                    <tr key={r.qty}>
                      <td className="border px-2 py-1">{r.qty}개~</td>
                      <td className="border px-2 py-1">{formatPrice(r.price)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Size chart modal */}
      {showSizeChart && product?.size_chart_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeChart(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-lg">
            <button aria-label="close" onClick={() => setShowSizeChart(false)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8">✕</button>
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-3">사이즈표</h3>
              <div className="relative w-full h-[60vh] bg-gray-100 rounded overflow-hidden">
                <Image src={product.size_chart_url} alt="사이즈표" fill className="object-contain" unoptimized />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manage Modal */}
      {isAdmin && showAdminPanel && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdminPanel(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">제품 관리</div>
                <div className="text-sm text-gray-500">{product.name}</div>
              </div>
              <button aria-label="close" onClick={() => setShowAdminPanel(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-6 pt-3">
              <div className="flex gap-2 border-b">
                <button className={`px-3 py-2 text-sm ${adminTab==='basic'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=>setAdminTab('basic')}>기본정보</button>
                <button className={`px-3 py-2 text-sm ${adminTab==='options'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=>setAdminTab('options')}>옵션(색상/사이즈)</button>
                <button className={`px-3 py-2 text-sm ${adminTab==='images'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=>setAdminTab('images')}>이미지</button>
                <button className={`px-3 py-2 text-sm ${adminTab==='content'?'border-b-2 border-blue-600 text-blue-700':'text-gray-600'}`} onClick={()=>setAdminTab('content')}>상세페이지</button>
              </div>
            </div>
            <div className="p-6 overflow-auto">
              {adminTab === 'basic' && (
                <form onSubmit={handleBasicSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상품명</label>
                      <input value={basicName} onChange={(e)=>setBasicName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">간단 설명</label>
                      <input value={basicShort} onChange={(e)=>setBasicShort(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상세 설명</label>
                    <textarea rows={4} value={basicDesc} onChange={(e)=>setBasicDesc(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={()=>setShowAdminPanel(false)} className="px-4 py-2 border rounded">닫기</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
                  </div>
                </form>
              )}
              {adminTab === 'options' && (
                <div className="h-[70vh]"><iframe className="w-full h-full" src={`/admin/products/${product.id}/options`} /></div>
              )}
              {adminTab === 'images' && (
                <div className="h-[70vh]"><iframe className="w-full h-full" src={`/admin/products/${product.id}/images`} /></div>
              )}
              {adminTab === 'content' && (
                <div className="h-[70vh]"><iframe className="w-full h-full" src={`/admin/products/${product.id}/content`} /></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}