"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChatModal } from "@/components/chat/ChatModal";
import { Menu, X } from "lucide-react";

const LOGO_URL = "https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png";
const ALT = "모두의 유니폼 l 단체복, 커스텀 굿즈 제작 전문";

export function SiteHeader({
	showNav = true,
	showConsultButton = true,
	sticky = true,
}: {
	showNav?: boolean;
	showConsultButton?: boolean;
	sticky?: boolean;
}) {
	const [openChat, setOpenChat] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className={`bg-white shadow-sm ${sticky ? "sticky top-0 z-40" : ""}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-4">
					{/* 로고 */}
					<Link href="/" className="flex items-center">
						<img src={LOGO_URL} alt={ALT} className="h-7 w-auto mr-3" />
						<div className="flex items-center">
							<h1 className="text-2xl font-bold text-gray-900">모두의 유니폼</h1>
							<span className="ml-2 text-sm text-gray-500">단체복 전문 제작</span>
						</div>
					</Link>

					{/* 데스크톱 네비게이션 */}
					<nav className="hidden md:flex items-center space-x-8">
						<a href="/shop#products" className="text-gray-700 hover:text-[--color-brand] font-medium">상품보기</a>
						<a href="/shop#reviews" className="text-gray-700 hover:text-[--color-brand] font-medium">고객후기</a>
						<a href="/shop#cases" className="text-gray-700 hover:text-[--color-brand] font-medium">제작사례</a>
						<a href="/shop#process" className="text-gray-700 hover:text-[--color-brand] font-medium">제작과정</a>
						{showConsultButton && (
							<button 
								onClick={() => setOpenChat(true)} 
								className="bg-white text-[--color-brand] px-6 py-2 rounded-full border border-[--color-brand] hover:bg-[--color-brand-50] font-medium"
							>
								무료 상담
							</button>
						)}
					</nav>

					{/* 모바일 햄버거 버튼 */}
					<button
						onClick={() => setMobileMenuOpen(true)}
						className="md:hidden p-2 rounded-md text-gray-700 hover:text-[--color-brand] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[--color-brand]"
						aria-label="메뉴 열기"
					>
						<Menu size={24} />
					</button>
				</div>
			</div>

			{/* 모바일 메뉴 오버레이 */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					{/* 배경 오버레이 */}
					<div 
						className="fixed inset-0 bg-black bg-opacity-50"
						onClick={() => setMobileMenuOpen(false)}
					/>
					
					{/* 슬라이드 메뉴 */}
					<div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
						{/* 메뉴 헤더 */}
						<div className="flex items-center justify-between p-4 border-b">
							<h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
							<button
								onClick={() => setMobileMenuOpen(false)}
								className="p-2 rounded-md text-gray-700 hover:text-[--color-brand] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[--color-brand]"
								aria-label="메뉴 닫기"
							>
								<X size={24} />
							</button>
						</div>

						{/* 메뉴 항목들 */}
						<nav className="px-4 py-6">
							<div className="space-y-4">
								<a 
									href="/shop#products" 
									className="block py-3 px-4 text-gray-700 hover:text-[--color-brand] hover:bg-gray-50 rounded-lg font-medium transition-colors"
									onClick={() => setMobileMenuOpen(false)}
								>
									상품보기
								</a>
								<a 
									href="/shop#reviews" 
									className="block py-3 px-4 text-gray-700 hover:text-[--color-brand] hover:bg-gray-50 rounded-lg font-medium transition-colors"
									onClick={() => setMobileMenuOpen(false)}
								>
									고객후기
								</a>
								<a 
									href="/shop#cases" 
									className="block py-3 px-4 text-gray-700 hover:text-[--color-brand] hover:bg-gray-50 rounded-lg font-medium transition-colors"
									onClick={() => setMobileMenuOpen(false)}
								>
									제작사례
								</a>
								<a 
									href="/shop#process" 
									className="block py-3 px-4 text-gray-700 hover:text-[--color-brand] hover:bg-gray-50 rounded-lg font-medium transition-colors"
									onClick={() => setMobileMenuOpen(false)}
								>
									제작과정
								</a>
								
								{showConsultButton && (
									<div className="pt-4 border-t border-gray-200">
										<button 
											onClick={() => {
												setOpenChat(true);
												setMobileMenuOpen(false);
											}} 
											className="w-full bg-[--color-brand] text-white py-3 px-4 rounded-lg font-medium hover:bg-[--color-brand-700] transition-colors"
										>
											무료 상담
										</button>
									</div>
								)}
							</div>
						</nav>
					</div>
				</div>
			)}

			<ChatModal open={openChat} onClose={() => setOpenChat(false)} />
		</header>
	);
}