"use client";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-gray-50 border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">사업자 정보</h3>
            <ul className="space-y-1">
              <li>주소지: 서울특별시 마포구 새터산 4길 2, b102호</li>
              <li>전화번호: 010-2087-0621</li>
              <li>사업자등록번호: 118-08-15095</li>
              <li>대표자 이름: 김현준</li>
              <li>개인정보 책임자: 김현준</li>
              <li>통신판매업신고번호: 2021-서울마포-1399</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">BANK INFO</h3>
            <ul className="space-y-1">
              <li>우리은행</li>
              <li>1005904144208</li>
              <li>예금주: 피스코프</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">고객 지원</h3>
            <ul className="space-y-1">
              <li>운영시간: 평일 10:00 ~ 18:00</li>
              <li>점심시간: 12:00 ~ 13:00</li>
              <li className="text-gray-500">주말/공휴일 휴무</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 mt-8 border-t text-xs text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} 모두의 유니폼. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/shop" className="hover:underline">쇼핑몰</Link>
            <Link href="/portfolio" className="hover:underline">제작사례</Link>
            <a href="tel:01020870621" className="hover:underline">전화문의</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
