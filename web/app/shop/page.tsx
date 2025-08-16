"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatModal } from "@/components/chat/ChatModal";
import { SiteHeader } from "../../components/SiteHeader";
import { supabase } from "@/lib/supabaseClient";
import { 
  MessageCircle, 
  Palette, 
  Shirt, 
  Truck, 
  Target, 
  Zap, 
  CheckCircle, 
  Phone,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings
} from "lucide-react";

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

interface CaseStudy {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  category?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  display_at: string;
  author_name?: string | null;
  author?: {
    display_name?: string;
  };
}

interface HeroBanner {
  id: string;
  title: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

const caseStudies = [
  { id: 1, image: "https://via.placeholder.com/400x300", title: "대학교 학과 단체복", description: "심플하면서도 세련된 디자인", category: "대학교" },
  { id: 2, image: "https://via.placeholder.com/400x300", title: "회사 워크샵 티셔츠", description: "브랜딩이 돋보이는 기업 단체복", category: "기업" },
  { id: 3, image: "https://via.placeholder.com/400x300", title: "동아리 후드티", description: "개성 넘치는 동아리 컬러", category: "동아리" },
  { id: 4, image: "https://via.placeholder.com/400x300", title: "스포츠팀 유니폼", description: "활동성을 고려한 기능성 의류", category: "스포츠" }
];

const processSteps = [
  { step: 1, title: "상담 신청", description: "간단한 정보 입력으로 시작", icon: MessageCircle },
  { step: 2, title: "디자인 협의", description: "전문 디자이너와 1:1 상담", icon: Palette },
  { step: 3, title: "샘플 확인", description: "실제 샘플로 품질 체크", icon: Shirt },
  { step: 4, title: "제작 & 배송", description: "고품질 제작 후 빠른 배송", icon: Truck }
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminView, setAdminView] = useState<'menu'|'categories'|'products'|'reviews'|'cases'>('menu');
  
  // Hero carousel state
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [casesPage, setCasesPage] = useState(0);
  const [processPage, setProcessPage] = useState(0);
  const [viewport, setViewport] = useState<'sm'|'md'|'lg'>('sm');

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadHeroBanners();
    loadReviews();
    loadCases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Viewport detection for responsive paging
  useEffect(() => {
    const detect = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      setViewport(w < 640 ? 'sm' : w < 1024 ? 'md' : 'lg');
    };
    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  // Auto-slide for hero carousel
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories((data as unknown as Category[]) || []);
    } catch (err) {
      console.error("카테고리 로드 실패:", err);
    }
  };

  const loadHeroBanners = async () => {
    try {
      // Use fixed_content table with section_type 'hero'
      const { data, error } = await supabase
        .from("fixed_content")
        .select("id, title, content")
        .eq("section_type", "hero")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Transform content (which contains image URLs) to banners
      const banners = ((data || []) as Array<{ id: string; title?: string|null; content: string }>).map((item, index) => ({
        id: String(item.id),
        title: item.title || "",
        url: item.content,
        sort_order: index,
        is_active: true
      }));
      
      setHeroBanners(banners as HeroBanner[]);
    } catch (err) {
      console.error("히어로 배너 로드 실패:", err);
    }
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('id, title, description, photo, date, category, sort_order, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true } as any);
      if (error) throw error;
      const list: CaseStudy[] = (data || []).map((r: any) => ({
        id: String(r.id),
        title: r.title || '',
        description: r.description || '',
        image: r.photo || '',
        category: r.category || '',
      }));
      setCases(list);
    } catch (e) {
      setCases([]);
    }
  };

  const loadReviews = async () => {
    try {
      // 1차 시도: display_at 기준 + 프로필 조인
      let { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          title,
          content,
          images,
          display_at,
          author_name,
          author:profiles(display_name)
        `)
        .order("display_at", { ascending: false })
        .limit(24);

      // 조인/정렬 이슈 대비: 2차 시도 (조인 제거 + created_at 기준)
      if (error || !data || data.length === 0) {
        const alt = await supabase
          .from("reviews")
          .select("id, rating, title, content, images, display_at, author_name")
          .order("created_at", { ascending: false } as any)
          .limit(24);
        if (!alt.error) data = alt.data as any[];
      }

      const all = (data || []) as Review[];
      const photoFirst = all.filter(r => Array.isArray(r.images) && r.images.length > 0);
      const textOnly = all.filter(r => !Array.isArray(r.images) || r.images.length === 0);
      const prioritized = [...photoFirst, ...textOnly].slice(0, 8);
      setReviews(prioritized);
    } catch (err) {
      // 최종 폴백: 에러시 빈 배열로 세팅
      console.error("리뷰 로드 실패:", err);
      setReviews([]);
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
        // First get category ID from slug
        const { data: categoryData } = await supabase
          .from("product_categories")
          .select("id")
          .eq("slug", selectedCategory)
          .single();
        
        if (categoryData) {
          query = query.eq("category_id", (categoryData as any).id);
        }
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedProducts: Product[] = ((data as unknown) as Array<{
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
      }>).map((item) => {
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
    // Always show single price: sale price if exists, otherwise base price
    const displayPrice = (product.sale_price && product.sale_price < product.base_price)
      ? product.sale_price
      : product.base_price;
    return `${formatPrice(displayPrice)}원`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Unified Header */}
      <SiteHeader />

      <ChatModal open={openChat} onClose={() => setOpenChat(false)} />

      {/* Hero Section: Static single image */}
      <section className="relative h-[600px] lg:h-[700px] overflow-hidden bg-black">
        <Image
          src="https://modoouniform.com/data/skin/front/singgreen_250227/img/banner/067dee3807b22ea9e8f8cbb694d5db35_13869.png"
          alt="모두의 유니폼 히어로"
          fill
          className="object-cover"
          priority
        />
      </section>

      {/* Categories & Products Section */}
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">인기 상품</h2>
            <p className="text-lg text-gray-600">다양한 스타일의 단체복을 만나보세요</p>
          </div>

          {/* Category Filter - single line, underline only for selected, horizontal scroll */}
          <div className="mb-12 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-6 whitespace-nowrap justify-center lg:justify-center md:justify-center sm:justify-start">
              <button
                className={`appearance-none bg-transparent px-0 py-2 text-base transition-colors ${!selectedCategory
                  ? 'text-[#0052cc] border-b-2 border-[#0052cc]'
                  : 'text-gray-700 hover:text-[#0052cc] border-b-2 border-transparent'}
                `}
                onClick={() => setSelectedCategory(null)}
              >
                전체
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`appearance-none bg-transparent px-0 py-2 text-base transition-colors ${selectedCategory === c.slug
                    ? 'text-[#0052cc] border-b-2 border-[#0052cc]'
                    : 'text-gray-700 hover:text-[#0052cc] border-b-2 border-transparent'}
                  `}
                  onClick={() => setSelectedCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="상품명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 pl-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-[--color-brand] focus:border-transparent text-lg"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="relative w-full pt-[133%] bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-4"></div>
                    <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-500 text-xl mb-4">
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
                  className="text-[--color-brand] hover:opacity-80 font-medium text-lg"
                >
                  전체 상품 보기
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative w-full pt-[133%] bg-gray-100 overflow-hidden">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        className="object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center absolute inset-0 text-gray-400">
                        이미지 없음
                      </div>
                    )}
                    
                    {/* Sale Badge */}
                    {product.sale_price && product.sale_price < product.base_price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        SALE
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenChat(true);
                          }}
                          className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium hover:bg-gray-100"
                        >
                          견적문의
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    {/* Category */}
                    {product.category && (
                      <div className="text-sm text-[--color-brand] font-medium mb-2">
                        {product.category.name}
                      </div>
                    )}

                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                      {product.name}
                    </h3>

                    {/* Short Description */}
                    {product.short_description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.short_description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        {product.sale_price && product.sale_price < product.base_price ? (
                          <div>
                            <span className="text-xl font-bold text-red-600">
                              {getPriceDisplay(product)}
                            </span>
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {formatPrice(product.base_price)}원
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Photo Reviews Section */}
      <section id="reviews" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">고객 포토후기</h2>
            <p className="text-lg text-gray-600">실제 고객분들의 생생한 후기를 확인해보세요</p>
          </div>

          {(() => {
            const perPage = viewport === 'sm' ? 1 : viewport === 'md' ? 2 : 4;
            const pages = Math.ceil(reviews.length / perPage) || 1;
            const start = reviewsPage * perPage;
            const visible = reviews.slice(start, start + perPage);
            return (
              <>
                <div className={`grid gap-4 ${viewport==='lg' ? 'grid-cols-4' : viewport==='md' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {visible.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="relative aspect-square">
                        {review.images && review.images.length > 0 ? (
                          <Image
                            src={review.images[0]}
                            alt={review.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                            이미지 없음
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col h-56">
                        <div>
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={16} 
                                className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2 truncate block">{review.title}</h4>
                          <p className="text-gray-700 mb-3 line-clamp-3">{review.content}</p>
                        </div>
                        <div className="mt-auto pt-2 flex items-center justify-between text-sm text-gray-500">
                          <span className="font-medium">{review.author_name || review.author?.display_name || '익명'}</span>
                          <span>{formatDate((review as any).display_at || (review as any).created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {visible.length === 0 && (
                    <div className="text-center text-gray-500">표시할 후기가 없습니다.</div>
                  )}
                </div>
                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: pages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setReviewsPage(i)}
                        className={`w-2.5 h-2.5 rounded-full ${i === reviewsPage ? 'bg-[#0052cc]' : 'bg-gray-300'}`}
                        aria-label={`reviews page ${i+1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <div className="text-center mt-12">
            <Link href="/review" className="inline-flex items-center text-[--color-brand] hover:opacity-80 font-medium text-lg">
              더 많은 후기 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="cases" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">제작 사례</h2>
            <p className="text-lg text-gray-600">다양한 단체에서 제작한 맞춤 단체복을 만나보세요</p>
          </div>

          {(() => {
            const casesPer = viewport === 'sm' ? 1 : viewport === 'md' ? 2 : 4;
            const cPages = Math.ceil(cases.length / casesPer) || 1;
            const cStart = casesPage * casesPer;
            const visibleCases = cases.slice(cStart, cStart + casesPer);
            return (
              <>
                <div className={`grid gap-6 ${viewport==='lg' ? 'grid-cols-4' : viewport==='md' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {visibleCases.map((caseStudy) => (
                    <div key={caseStudy.id} className="group">
                      {/* Image Card */}
                      <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow mb-4">
                        <div className="relative aspect-square">
                          <Image
                            src={caseStudy.image}
                            alt={caseStudy.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                          <div className="absolute top-3 right-3 bg-[--color-brand] text-white px-3 py-1 rounded-full text-sm font-medium">
                            {caseStudy.category}
                          </div>
                        </div>
                      </div>
                      
                      {/* Text Content - Outside Card */}
                      <div className="px-2">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">{caseStudy.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{caseStudy.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {cPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: cPages }).map((_, i) => (
                      <button key={i} onClick={() => setCasesPage(i)} className={`w-2.5 h-2.5 rounded-full ${i===casesPage?'bg-[#0052cc]':'bg-gray-300'}`} aria-label={`cases page ${i+1}`} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <div className="text-center mt-12">
            <Link href="/portfolio" className="inline-flex items-center text-[--color-brand] hover:opacity-80 font-medium text-lg">
              더 많은 사례 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">제작 과정</h2>
            <p className="text-lg text-gray-600">간단한 4단계로 완성되는 맞춤 단체복</p>
          </div>

          {(() => {
            const procPer = viewport === 'sm' ? 1 : viewport === 'md' ? 2 : 4;
            const pPages = Math.ceil(processSteps.length / procPer) || 1;
            const pStart = processPage * procPer;
            const visibleProc = processSteps.slice(pStart, pStart + procPer);
            return (
              <>
                <div className={`grid gap-8 ${viewport==='lg' ? 'grid-cols-4' : viewport==='md' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {visibleProc.map((step, index) => (
                    <div key={step.step} className="text-center relative">
                      {index < processSteps.length - 1 && (
                        <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gray-200 transform -translate-x-1/2 z-0">
                          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-3 h-3 bg-[--color-brand] rounded-full"></div>
                        </div>
                      )}
                      <div className="relative z-10">
                        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[--color-brand] to-[color-mix(in_oklab,var(--color-brand)_80%,black)] rounded-full flex items-center justify-center text-white">
                          <step.icon size={48} />
                        </div>
                        <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  ))}
                </div>
                {pPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: pPages }).map((_, i) => (
                      <button key={i} onClick={() => setProcessPage(i)} className={`w-2.5 h-2.5 rounded-full ${i===processPage?'bg-[#0052cc]':'bg-gray-300'}`} aria-label={`process page ${i+1}`} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[--color-brand] to-[color-mix(in_oklab,var(--color-brand)_80%,black)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            간단한 상담만으로<br />
            <span className="text-yellow-300">제작 고민 끝!</span>
          </h2>
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
            전문 디자이너가 직접 상담드리고, 최적의 솔루션을 제안해드립니다.<br />
            지금 바로 무료 상담을 신청하세요!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button 
              onClick={() => setOpenChat(true)}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              무료 상담 신청하기
            </button>
            <button 
              onClick={() => setOpenChat(true)}
              className="border-2 border-white text-white px-8 py-4 rounded-full text-xl font-medium hover:bg-white hover:text-[--color-brand] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              카톡 상담하기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex justify-center mb-2">
                <Zap size={32} className="text-yellow-400" />
              </div>
              <div className="font-bold mb-1">빠른 응답</div>
              <div className="text-sm text-blue-200">평균 30분 내 답변</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex justify-center mb-2">
                <Palette size={32} className="text-yellow-400" />
              </div>
              <div className="font-bold mb-1">무료 디자인</div>
              <div className="text-sm text-blue-200">전문 디자이너 상담</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex justify-center mb-2">
                <CheckCircle size={32} className="text-yellow-400" />
              </div>
              <div className="font-bold mb-1">품질 보장</div>
              <div className="text-sm text-blue-200">100% 만족 보장</div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Link */}
      <div className="py-8 bg-gray-100 text-center">
        <Link
          href="/admin/products"
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 gap-2"
        >
          <Settings size={16} />
          관리자 상품 관리
        </Link>
      </div>

      {/* Admin Quick Actions Floating Button */}
      {isAdmin && (
        <>
          <button
            onClick={() => { setAdminView('menu'); setAdminPanelOpen(true); }}
            className="fixed left-5 bottom-5 z-40 px-4 py-2 bg-white text-[--color-brand] border border-[--color-brand] rounded-full shadow-lg hover:bg-[--color-brand-50]"
            aria-label="관리자 전용기능"
          >
            관리자 전용기능
          </button>

          {adminPanelOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
              <div className="bg-white w-11/12 max-w-5xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
                  <div className="font-semibold">관리자 빠른 작업</div>
                  <div className="flex items-center gap-2">
                    {adminView !== 'menu' && (
                      <button 
                        onClick={() => {
                          // iframe 내의 저장 버튼 클릭 트리거
                          const iframeSrc = `/admin/${adminView}`;
                          const iframe = document.querySelector(`iframe[src="${iframeSrc}"]`) as HTMLIFrameElement;
                          if (iframe?.contentWindow) {
                            try {
                              let saveBtn: HTMLButtonElement | null = null;
                              
                              // 각 페이지별 저장 버튼 ID로 검색
                              if (adminView === 'cases') {
                                saveBtn = iframe.contentDocument?.querySelector('#add-case-btn') as HTMLButtonElement;
                              } else if (adminView === 'categories') {
                                saveBtn = iframe.contentDocument?.querySelector('#add-category-btn') as HTMLButtonElement;
                              } else if (adminView === 'products') {
                                // 상품 페이지의 경우 모달 내 저장 버튼을 찾음
                                saveBtn = iframe.contentDocument?.querySelector('button[class*="bg-blue-600"]:contains("저장")') as HTMLButtonElement;
                                if (!saveBtn) saveBtn = iframe.contentDocument?.querySelector('button:contains("등록")') as HTMLButtonElement;
                                if (!saveBtn) saveBtn = iframe.contentDocument?.querySelector('button:contains("저장")') as HTMLButtonElement;
                              } else if (adminView === 'reviews') {
                                saveBtn = iframe.contentDocument?.querySelector('button:contains("저장")') as HTMLButtonElement;
                                if (!saveBtn) saveBtn = iframe.contentDocument?.querySelector('button:contains("등록")') as HTMLButtonElement;
                              }
                              
                              if (saveBtn) {
                                saveBtn.click();
                                alert('저장되었습니다.');
                              } else {
                                alert('저장 버튼을 찾을 수 없습니다. iframe 내에서 직접 저장해주세요.');
                              }
                            } catch (e) {
                              console.error('iframe save error:', e);
                              alert('iframe 내 저장 기능을 실행할 수 없습니다. iframe 내에서 직접 저장해주세요.');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        저장
                      </button>
                    )}
                    <button onClick={() => setAdminPanelOpen(false)} className="text-gray-500 hover:text-gray-700">닫기</button>
                  </div>
                </div>
                {adminView === 'menu' && (
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setAdminView('categories')} className="border rounded-lg p-4 text-left hover:bg-gray-50">
                      <div className="font-medium mb-1">카테고리 관리</div>
                      <div className="text-sm text-gray-600">상품 카테고리 추가/수정/삭제</div>
                    </button>
                    <button onClick={() => setAdminView('products')} className="border rounded-lg p-4 text-left hover:bg-gray-50">
                      <div className="font-medium mb-1">상품 관리</div>
                      <div className="text-sm text-gray-600">상품 등록/수정, 옵션/상세</div>
                    </button>
                    <button onClick={() => setAdminView('reviews')} className="border rounded-lg p-4 text-left hover:bg-gray-50">
                      <div className="font-medium mb-1">후기 관리</div>
                      <div className="text-sm text-gray-600">고객 후기 관리</div>
                    </button>
                    <button onClick={() => setAdminView('cases')} className="border rounded-lg p-4 text-left hover:bg-gray-50">
                      <div className="font-medium mb-1">제작사례 관리</div>
                      <div className="text-sm text-gray-600">제작사례 추가/수정/삭제</div>
                    </button>
                  </div>
                )}
                {adminView !== 'menu' && (
                  <div className="p-0">
                    {adminView === 'categories' && (
                      <iframe className="w-full h-[75vh]" src="/admin/categories" />
                    )}
                    {adminView === 'products' && (
                      <iframe className="w-full h-[75vh]" src="/admin/products" />
                    )}
                    {adminView === 'reviews' && (
                      <iframe className="w-full h-[75vh]" src="/admin/reviews" />
                    )}
                    {adminView === 'cases' && (
                      <iframe className="w-full h-[75vh]" src="/admin/cases" />
                    )}
                  </div>
                )}
                {adminView !== 'menu' && (
                  <div className="px-4 sm:px-6 py-3 border-t flex justify-between">
                    <button onClick={() => setAdminView('menu')} className="px-4 py-2 border rounded">뒤로</button>
                    <button onClick={() => setAdminPanelOpen(false)} className="px-4 py-2 bg-[--color-brand] text-white rounded">닫기</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}