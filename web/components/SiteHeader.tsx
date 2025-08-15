"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChatModal } from "@/components/chat/ChatModal";

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
	return (
		<header className={`bg-white shadow-sm ${sticky ? "sticky top-0 z-40" : ""}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-4">
					<Link href="/" className="flex items-center">
						<img src={LOGO_URL} alt={ALT} className="h-7 w-auto mr-3" />
						<div className="flex items-center">
							<h1 className="text-2xl font-bold text-gray-900">모두의 유니폼</h1>
							<span className="ml-2 text-sm text-gray-500">단체복 전문 제작</span>
						</div>
					</Link>
					{showNav && (
						null
					)}
					<nav className="hidden md:flex items-center space-x-8">
						<a href="/shop#products" className="text-gray-700 hover:text-[--color-brand] font-medium">상품보기</a>
						<a href="/shop#reviews" className="text-gray-700 hover:text-[--color-brand] font-medium">고객후기</a>
						<a href="/shop#cases" className="text-gray-700 hover:text-[--color-brand] font-medium">제작사례</a>
						<a href="/shop#process" className="text-gray-700 hover:text-[--color-brand] font-medium">제작과정</a>
						{showConsultButton && (
							<button onClick={() => setOpenChat(true)} className="bg-white text-[--color-brand] px-6 py-2 rounded-full border border-[--color-brand] hover:bg-[--color-brand-50] font-medium">무료 상담</button>
						)}
					</nav>
				</div>
			</div>
			<ChatModal open={openChat} onClose={() => setOpenChat(false)} />
		</header>
	);
}