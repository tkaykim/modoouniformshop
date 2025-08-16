"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LayoutGrid, ClipboardList, PackageSearch, Star, Images, Maximize2, RefreshCw, ExternalLink } from "lucide-react";

type Tab = {
	id: string;
	label: string;
	icon: React.ComponentType<{ size?: number }>|null;
	path: string; // internal route to show in iframe
};

const TABS: Tab[] = [
	{ id: 'inquiries', label: '문의관리', icon: ClipboardList, path: '/admin' },
	{ id: 'orders', label: '주문관리', icon: LayoutGrid, path: '/admin/orders' },
	{ id: 'products', label: '상품관리', icon: PackageSearch, path: '/admin/products' },
	{ id: 'reviews', label: '리뷰관리', icon: Star, path: '/admin/reviews' },
	{ id: 'cases', label: '제작사례 관리', icon: Images, path: '/admin/cases' },
];

export default function AdminHubPage() {
	const [active, setActive] = useState<string>('inquiries');
	const [fullHeight, setFullHeight] = useState<boolean>(false);
	const iframeRef = useRef<HTMLIFrameElement|null>(null);

	const currentTab = useMemo(() => TABS.find(t => t.id === active) || TABS[0], [active]);

	useEffect(() => {
		// try to focus iframe once loaded
		const onLoad = () => { try { iframeRef.current?.contentWindow?.focus(); } catch {} };
		const el = iframeRef.current;
		if (el) el.addEventListener('load', onLoad);
		return () => { if (el) el.removeEventListener('load', onLoad); };
	}, [active]);

	const reloadFrame = () => {
		try { iframeRef.current?.contentWindow?.location?.reload(); } catch {}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<SiteHeader />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">관리자 허브</h1>
				<div className="flex flex-wrap gap-2 mb-4">
					{TABS.map(t => {
						const Icon = t.icon;
						const isActive = t.id === active;
						return (
							<button key={t.id} onClick={() => setActive(t.id)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}>
								{Icon ? <Icon size={16} /> : null}
								<span>{t.label}</span>
							</button>
						);
					})}
				</div>

				<div className="flex items-center justify-end gap-2 mb-2">
					<button onClick={() => setFullHeight(v=>!v)} className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"><Maximize2 size={16} /> {fullHeight ? '기본 높이' : '확대'}</button>
					<button onClick={reloadFrame} className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"><RefreshCw size={16} /> 새로고침</button>
					<a target="_blank" rel="noreferrer" href={currentTab.path} className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"><ExternalLink size={16} /> 새 탭에서 열기</a>
				</div>

				<div className="bg-white rounded-xl shadow-sm border overflow-hidden">
					<iframe ref={iframeRef} key={currentTab.id} src={currentTab.path} className="w-full" style={{ height: fullHeight ? 'calc(100vh - 220px)' : '70vh' }} />
				</div>
			</div>
		</div>
	);
}


