"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SiteHeader } from "@/components/SiteHeader";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  photo: string | null;
  date: string | null;
  category: string | null;
  created_at?: string | null;
};

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const portfolioData = (data as PortfolioItem[]) || [];
      setItems(portfolioData);

      // 카테고리 추출
      const uniqueCategories = Array.from(
        new Set(portfolioData.map(item => item.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("포트폴리오 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">제작 사례</h1>
          <p className="text-xl lg:text-2xl text-blue-100 mb-8">
            다양한 단체복과 굿즈 제작 사례를 확인해보세요
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-gray-600">로딩 중...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-lg text-gray-600 mb-4">
                {selectedCategory === "all" 
                  ? "등록된 제작 사례가 없습니다." 
                  : `'${selectedCategory}' 카테고리에 등록된 사례가 없습니다.`}
              </div>
              <Link 
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                쇼핑몰로 돌아가기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="relative aspect-[4/3]">
                    {item.photo ? (
                      <Image
                        src={item.photo}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                        이미지 없음
                      </div>
                    )}
                    {item.category && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                        {item.category}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.date && (
                      <p className="text-sm text-gray-500">
                        제작일: {formatDate(item.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            나만의 단체복도 만들어보세요!
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            전문 디자이너와 함께 특별한 단체복을 제작해드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-yellow-400 text-gray-900 rounded-full text-lg font-bold hover:bg-yellow-300 transition-colors"
            >
              상품 둘러보기
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-full text-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
            >
              무료 상담 받기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}