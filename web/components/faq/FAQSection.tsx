"use client";
import { useState } from "react";

type FAQItem = { q: string; a: string };

const ITEMS: FAQItem[] = [
	{
		q: "디자인 파일이 없어도 제작 가능한가요?",
		a:
			"네, 가능합니다!\n스케치, 사진, 참고이미지만 있어도 디자이너가 시안을 제작해드립니다.",
	},
	{
		q: "납기일이 급한데 빠르게 제작할 수 있나요?",
		a:
			"네, 급한 일정도 문제 없습니다.\n퀵배송 또는 직접배송 등 다양한 방식으로 대응해 드리며\n시안 확정 후 2~3일 내로 수령하시는 경우도 있습니다.",
	},
	{
		q: "최소 몇 장부터 주문 가능한가요?",
		a:
			"단 1장부터도 주문 가능합니다.\n다만 일부 품목은 최소주문 수량이 있을 수 있습니다.",
	},
	{
		q: "제작 전에 샘플을 볼 수 있나요?",
		a:
			"기본적으로 시안이미지를 안내드립니다.\n원단이나 사이즈 등 실물이 궁금하신 경우 사무실 방문을 통해\n만져보실 수 있으며 원하실 경우 별도 비용으로 샘플제작도 가능합니다.",
	},
];

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<section className="w-full px-4 py-8">
			<h2 className="text-center text-lg font-semibold mb-4">FAQ - 자주 묻는 질문</h2>
			<div className="space-y-3">
				{ITEMS.map((item, idx) => {
					const open = openIndex === idx;
					return (
						<div key={idx} className="border rounded-xl bg-white">
							<button
								className="w-full text-left px-4 py-3 flex items-center justify-between"
								onClick={() => setOpenIndex(open ? null : idx)}
								aria-expanded={open}
							>
								<span className="flex items-center gap-2">
									<span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: '#0052cc', color: 'white' }}>Q</span>
									<span className="font-medium">{item.q}</span>
								</span>
								<span className={`text-gray-500 transform transition-transform ${open ? "rotate-45" : ""}`}>+</span>
							</button>
							<div
								className="px-4 overflow-hidden transition-all duration-300"
								style={{ maxHeight: open ? 1000 : 0 }}
							>
								<div className="flex items-start gap-2 pb-3">
									<span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full border" style={{ background: 'white', color: '#0052cc', borderColor: '#0052cc' }}>A</span>
									<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.a}</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

