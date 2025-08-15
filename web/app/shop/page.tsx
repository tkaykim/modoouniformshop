"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatModal } from "@/components/chat/ChatModal";
import { supabase } from "@/lib/supabaseClient";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  base_price: number;
  sale_price?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  primary_image?: string;
  price_range?: {
    min: number;
    max: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState(false);

  // use singleton supabase client

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:product_categories(id, name, slug),
          images:product_images!inner(url, is_primary),
          options:product_options(price_modifier)
        `)
        .eq("is_active", true);

      if (selectedCategory) {
        query = query.eq("category.slug", selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedProducts: Product[] = (data || []).map((item: {
        id: string;
        name: string;
        slug: string;
        description: string;
        short_description: string;
        base_price: number;
        sale_price?: number;
        category?: { id: string; name: string; slug: string };
        images?: Array<{ url: string; is_primary: boolean }>;
        options?: Array<{ price_modifier?: number }>;
      }) => {
        const primaryImage = item.images?.find((img) => img.is_primary)?.url || item.images?.[0]?.url;
        
        // Calculate price range from options
        const prices = [item.base_price || 0];
        if (item.sale_price) prices.push(item.sale_price);
        if (item.options) {
          item.options.forEach((opt) => {
            if (opt.price_modifier) {
              prices.push((item.sale_price || item.base_price) + opt.price_modifier);
            }
          });
        }

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          short_description: item.short_description,
          base_price: item.base_price,
          sale_price: item.sale_price,
          category: item.category,
          primary_image: primaryImage,
          price_range: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        };
      });

      setProducts(transformedProducts);
    } catch (err) {
      console.error("상품 로드 실패:", err);
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const getPriceDisplay = (product: Product) => {
    if (product.price_range && product.price_range.min !== product.price_range.max) {
      return `${formatPrice(product.price_range.min)} ~ ${formatPrice(product.price_range.max)}원`;
    }
    const displayPrice = product.sale_price || product.base_price;
    return `${formatPrice(displayPrice)}원`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">모두의 유니폼 쇼핑몰</h1>
              <p className="text-gray-600 mt-1">단체복과 굿즈를 쉽게 주문하세요</p>
            </div>
            <button
              onClick={() => setOpenChat(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              상담하기 →
            </button>
          </div>
        </div>
      </div>

      <ChatModal open={openChat} onClose={() => setOpenChat(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="상품명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="sm:w-64">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">모든 카테고리</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  {searchQuery || selectedCategory
                    ? "검색 조건에 맞는 상품이 없습니다."
                    : "등록된 상품이 없습니다."}
                </div>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    전체 상품 보기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100">
                      {product.primary_image ? (
                        <Image
                          src={product.primary_image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          이미지 없음
                        </div>
                      )}
                      
                      {/* Sale Badge */}
                      {product.sale_price && product.sale_price < product.base_price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          SALE
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Category */}
                      {product.category && (
                        <div className="text-xs text-gray-500 mb-1">
                          {product.category.name}
                        </div>
                      )}

                      {/* Product Name */}
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Short Description */}
                      {product.short_description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          {product.sale_price && product.sale_price < product.base_price ? (
                            <div>
                              <span className="text-lg font-bold text-red-600">
                                {getPriceDisplay(product)}
                              </span>
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {formatPrice(product.base_price)}원
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {getPriceDisplay(product)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Admin Link */}
        <div className="mt-12 text-center">
          <Link
            href="/admin/products"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            관리자 상품 관리
          </Link>
        </div>
      </div>
    </div>
  );
}