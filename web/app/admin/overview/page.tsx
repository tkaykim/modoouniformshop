"use client";
import { ClipboardList, LayoutGrid, PackageSearch, Star, Images, ArrowRight } from "lucide-react";

export default function Overview() {
  return (
    <main className="w-full max-w-[1400px] mx-auto p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">관리 허브</h1>
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <a href="/admin" className="group block rounded-2xl bg-white p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-[#0052cc]" />
              <div className="font-medium">문의 관리</div>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-2 text-sm text-gray-600">신규 문의 확인, 담당 배정, 상태 업데이트</div>
        </a>
        <a href="/admin/orders" className="group block rounded-2xl bg-white p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-[#0052cc]" />
              <div className="font-medium">주문 관리</div>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-2 text-sm text-gray-600">결제상태/환불/취소, 상세 보기, 교차검증</div>
        </a>
        <a href="/admin/products" className="group block rounded-2xl bg-white p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageSearch size={18} className="text-[#0052cc]" />
              <div className="font-medium">상품 관리</div>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-2 text-sm text-gray-600">상품 기본/옵션/이미지/컨텐츠 관리</div>
        </a>
        <a href="/admin/reviews" className="group block rounded-2xl bg-white p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-[#0052cc]" />
              <div className="font-medium">리뷰 관리</div>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-2 text-sm text-gray-600">고객 리뷰 등록/노출/정렬</div>
        </a>
        <a href="/admin/cases" className="group block rounded-2xl bg-white p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Images size={18} className="text-[#0052cc]" />
              <div className="font-medium">제작사례 관리</div>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-2 text-sm text-gray-600">포트폴리오(제작사례) 등록/정렬</div>
        </a>
      </section>
    </main>
  );
}


