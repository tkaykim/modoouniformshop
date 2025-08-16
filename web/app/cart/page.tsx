"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/lib/supabaseClient";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemRow {
	id: string;
	created_at: string;
	user_id: string | null;
	session_id: string | null;
	product_id: string;
	selected_options: Record<string, any> | null;
	quantity: number;
	unit_price: number;
	total_price: number;
}

interface ProductMeta {
	id: string;
	name: string;
	slug: string;
	base_price: number;
	sale_price?: number | null;
}

interface ProductThumb {
	product_id: string;
	url: string;
}

export default function CartPage() {
	const [items, setItems] = useState<CartItemRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [productMap, setProductMap] = useState<Record<string, ProductMeta>>({});
	const [thumbMap, setThumbMap] = useState<Record<string, string>>({});

	const [paying, setPaying] = useState(false);
	const [payResult, setPayResult] = useState<any>(null);

	// 주문자 정보
	const [orderName, setOrderName] = useState("");
	const [orderPhone, setOrderPhone] = useState("");
	const [orderEmail, setOrderEmail] = useState("");

	// 배송 정보
	const [shippingMethod, setShippingMethod] = useState<'parcel'|'quick'|'pickup'>("parcel");
	const [sameAsOrderer, setSameAsOrderer] = useState(true);

	// 배송지 정보
	const [receiverName, setReceiverName] = useState("");
	const [receiverPhone, setReceiverPhone] = useState("");
	const [zipCode, setZipCode] = useState("");
	const [addr1, setAddr1] = useState("");
	const [addr2, setAddr2] = useState("");

	// 사용자 주소록 로딩 (주문자와 동일 체크 시 노출)
	const [addressBook, setAddressBook] = useState<any[]>([]);
	useEffect(() => {
		(async () => {
			try {
				const { data: authRes } = await supabase.auth.getUser();
				const userId = authRes?.user?.id;
				if (!userId) return;
				const res = await fetch(`/api/addresses?userId=${userId}`);
				const json = await res.json();
				if (json?.items) setAddressBook(json.items);
			} catch {}
		})();
	}, []);

	// 결제 방법
	const [paymentMethod, setPaymentMethod] = useState<'card'|'kakao'|'bank'>("card");

	// 동의
	const [agreeAll, setAgreeAll] = useState(false);
	const [agreeProduct, setAgreeProduct] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [agreePrivacy, setAgreePrivacy] = useState(false);

	const SHIPPING_FEE = 3000;
	const FORM_STATE_KEY = "cart_form_state_v1";

	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);
			try {
				let sessionId = "";
				try {
					sessionId = localStorage.getItem("cart_session_id") || "";
				} catch {}

				const userRes = await supabase.auth.getUser();
				const userId = userRes.data.user?.id || null;

				// Load cart items for user and/or session separately then merge
				const queries: Promise<any>[] = [];
				if (userId) {
					queries.push(
						supabase
							.from("cart_items")
							.select("id, created_at, user_id, session_id, product_id, selected_options, quantity, unit_price, total_price")
							.eq("user_id", userId)
					);
				}
				if (sessionId) {
					queries.push(
						supabase
							.from("cart_items")
							.select("id, created_at, user_id, session_id, product_id, selected_options, quantity, unit_price, total_price")
							.eq("session_id", sessionId)
					);
				}
				if (queries.length === 0) {
					setItems([]);
					setProductMap({});
					setThumbMap({});
					setLoading(false);
					return;
				}

				const results = await Promise.all(queries);
				const rows: CartItemRow[] = results
					.flatMap((r) => (r.error ? [] : (r.data || [])))
					// dedupe by id just in case
					.reduce((acc: CartItemRow[], row: CartItemRow) => {
						if (!acc.find((x) => x.id === row.id)) acc.push(row);
						return acc;
					}, [])
					// latest first
					.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

				setItems(rows);

				// Load product metas and thumbnails in batch
				const productIds = Array.from(new Set(rows.map((r) => r.product_id)));
				if (productIds.length) {
					const [prodRes, imgRes] = await Promise.all([
						supabase
							.from("products")
							.select("id, name, slug, base_price, sale_price")
							.in("id", productIds),
						supabase
							.from("product_images")
							.select("product_id, url, is_primary, sort_order")
							.in("product_id", productIds)
							.order("is_primary", { ascending: false })
							.order("sort_order", { ascending: true }),
					]);

					if (!prodRes.error) {
						const map: Record<string, ProductMeta> = {};
						(prodRes.data || []).forEach((p: any) => {
							map[p.id] = {
								id: p.id,
								name: p.name,
								slug: p.slug,
								base_price: Number(p.base_price || 0),
								sale_price: p.sale_price != null ? Number(p.sale_price) : null,
							};
						});
						setProductMap(map);
					}
					if (!imgRes.error) {
						const map: Record<string, string> = {};
						(imgRes.data || []).forEach((im: any) => {
							if (!map[im.product_id]) map[im.product_id] = im.url;
						});
						setThumbMap(map);
					}
				} else {
					setProductMap({});
					setThumbMap({});
				}
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				setError(msg);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	// Load saved form state (to persist across payment/refresh)
	useEffect(() => {
		try {
			const raw = typeof window !== 'undefined' ? localStorage.getItem(FORM_STATE_KEY) : null;
			if (!raw) return;
			const data = JSON.parse(raw || '{}');
			if (data.orderName) setOrderName(data.orderName);
			if (data.orderPhone) setOrderPhone(data.orderPhone);
			if (data.orderEmail) setOrderEmail(data.orderEmail);
			if (data.shippingMethod) setShippingMethod(data.shippingMethod);
			if (typeof data.sameAsOrderer === 'boolean') setSameAsOrderer(data.sameAsOrderer);
			if (data.receiverName) setReceiverName(data.receiverName);
			if (data.receiverPhone) setReceiverPhone(data.receiverPhone);
			if (data.zipCode) setZipCode(data.zipCode);
			if (data.addr1) setAddr1(data.addr1);
			if (data.addr2) setAddr2(data.addr2);
			if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
			if (typeof data.agreeAll === 'boolean') setAgreeAll(data.agreeAll);
			if (typeof data.agreeProduct === 'boolean') setAgreeProduct(data.agreeProduct);
			if (typeof data.agreeTerms === 'boolean') setAgreeTerms(data.agreeTerms);
			if (typeof data.agreePrivacy === 'boolean') setAgreePrivacy(data.agreePrivacy);
		} catch {}
	}, []);

	// Save form state on change
	useEffect(() => {
		try {
			const toSave = {
				orderName,
				orderPhone,
				orderEmail,
				shippingMethod,
				sameAsOrderer,
				receiverName,
				receiverPhone,
				zipCode,
				addr1,
				addr2,
				paymentMethod,
				agreeAll,
				agreeProduct,
				agreeTerms,
				agreePrivacy,
			};
			if (typeof window !== 'undefined') {
				localStorage.setItem(FORM_STATE_KEY, JSON.stringify(toSave));
			}
		} catch {}
	}, [orderName, orderPhone, orderEmail, shippingMethod, sameAsOrderer, receiverName, receiverPhone, zipCode, addr1, addr2, paymentMethod, agreeAll, agreeProduct, agreeTerms, agreePrivacy]);

	const subtotal = useMemo(() => {
		return items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.quantity), 0);
	}, [items]);

	const shippingFee = useMemo(() => {
		if (items.length === 0) return 0;
		return shippingMethod === 'parcel' ? SHIPPING_FEE : 0;
	}, [items.length, shippingMethod]);

	const total = useMemo(() => {
		if (items.length === 0) return 0;
		return subtotal + shippingFee;
	}, [subtotal, items.length, shippingFee]);

	const updateQuantity = async (rowId: string, nextQty: number) => {
		const item = items.find((i) => i.id === rowId);
		if (!item) return;
		const safeQty = Math.max(1, Math.min(9999, Math.floor(nextQty || 1)));
		if (safeQty === item.quantity) return;
		setUpdating(rowId);
		try {
			const nextTotal = Number(item.unit_price) * safeQty;
			const { error } = await supabase
				.from("cart_items")
				.update({ quantity: safeQty, total_price: nextTotal })
				.eq("id", rowId);
			if (error) throw error;
			setItems((prev) => prev.map((x) => (x.id === rowId ? { ...x, quantity: safeQty, total_price: nextTotal } : x)));
		} catch (e) {
			alert("수량 변경 실패");
		} finally {
			setUpdating(null);
		}
	};

	const removeItem = async (rowId: string) => {
		setUpdating(rowId);
		try {
			const { error } = await supabase.from("cart_items").delete().eq("id", rowId);
			if (error) throw error;
			setItems((prev) => prev.filter((x) => x.id !== rowId));
		} catch (e) {
			alert("삭제 실패");
		} finally {
			setUpdating(null);
		}
	};

	const clearAll = async () => {
		if (!confirm("장바구니를 모두 비우시겠습니까?")) return;
		try {
			const ids = items.map((x) => x.id);
			if (ids.length === 0) return;
			// Supabase 최대 in 절 고려: 1000개 제한 내
			const { error } = await supabase.from("cart_items").delete().in("id", ids);
			if (error) throw error;
			setItems([]);
		} catch (e) {
			alert("장바구니 비우기 실패");
		}
	};

	const requestPayment = async () => {
		if (!canPay) {
			let msg = '결제를 진행하려면 다음을 확인해주세요:\n';
			const missing: string[] = [];
			if (!orderName.trim()) missing.push('주문자 이름');
			if (!orderPhone.trim()) missing.push('주문자 연락처');
			if (!orderEmail.trim()) missing.push('주문자 이메일');
			else if (!/.+@.+\..+/.test(orderEmail)) missing.push('이메일 형식');
			if (!agreeProduct) missing.push('주문제작 상품 동의');
			if (!agreeTerms) missing.push('이용약관 동의');
			if (!agreePrivacy) missing.push('개인정보 동의');
			if (!sameAsOrderer) {
				if (!receiverName.trim()) missing.push('수령인 이름');
				if (!receiverPhone.trim()) missing.push('수령인 연락처');
				if (!addr1.trim()) missing.push('주소');
			}
			msg += '- ' + missing.join('\n- ');
			alert(msg);
			return;
		}
		if (paymentMethod === 'card') {
			try {
				setPaying(true);
				setPayResult(null);
				const deviceType = typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'pc';
				const headers: Record<string, string> = { 'Content-Type': 'application/json' };
				try { const sid = localStorage.getItem('cart_session_id'); if (sid) headers['x-cart-session-id'] = sid; } catch {}
				const webpayRes = await fetch('/api/payments/easypay/webpay', {
					method: 'POST',
					headers,
					body: JSON.stringify({ amount: total, goodsName: '모두의유니폼 주문', deviceType, orderDraft: {
						orderName, orderPhone, orderEmail,
						shippingMethod, sameAsOrderer, receiverName, receiverPhone, zipCode, addr1, addr2,
						paymentMethod,
						subtotal,
						shippingFee,
						total,
					}
					}),
				});
				const webpayData = await webpayRes.json();
				if (!webpayRes.ok || webpayData?.resCd !== '0000' || !webpayData?.authPageUrl) {
					throw new Error(webpayData?.resMsg || 'webpay_failed');
				}
				// persist latest form state before opening payment
				try {
					const toSave = {
						orderName,
						orderPhone,
						orderEmail,
						shippingMethod,
						sameAsOrderer,
						receiverName,
						receiverPhone,
						zipCode,
						addr1,
						addr2,
						paymentMethod,
						agreeAll,
						agreeProduct,
						agreeTerms,
						agreePrivacy,
					};
					if (typeof window !== 'undefined') {
						localStorage.setItem(FORM_STATE_KEY, JSON.stringify(toSave));
					}
				} catch {}

				// open payment in popup, fallback to redirect if blocked
				const features = 'width=480,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
				const win = typeof window !== 'undefined' ? window.open(webpayData.authPageUrl as string, 'easypay_payment', features) : null;
				if (!win) {
					window.location.href = webpayData.authPageUrl as string;
					return;
				}
				setPaying(false);
			} catch (e: any) {
				alert(`결제창 요청 실패: ${e?.message || e}`);
				setPaying(false);
			}
			return;
		}
		if (paymentMethod === 'kakao') {
			alert('카카오페이는 준비중입니다. 신용카드 또는 계좌이체를 이용해주세요.');
			return;
		}
		if (paymentMethod === 'bank') {
			alert('계좌이체 안내:\n우리은행 1005904144208 (예금주: 피스코프)\n입금 확인 후 안내드리겠습니다.');
			return;
		}
	};

	const allAgreed = agreeProduct && agreeTerms && agreePrivacy;
	const canPay = useMemo(() => {
		if (items.length === 0) return false;
		if (!allAgreed) return false;
		if (!orderName.trim() || !orderPhone.trim() || !orderEmail.trim()) return false;
		const emailOk = /.+@.+\..+/.test(orderEmail);
		if (!emailOk) return false;
		if (!sameAsOrderer) {
			if (!receiverName.trim() || !receiverPhone.trim() || !addr1.trim()) return false;
		}
		return true;
	}, [items.length, allAgreed, orderName, orderPhone, orderEmail, sameAsOrderer, receiverName, receiverPhone, addr1]);

	return (
		<div className="min-h-screen bg-gray-50">
			<SiteHeader />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">장바구니</h1>

				{loading && (
					<div className="py-16 text-center text-gray-600">불러오는 중...</div>
				)}
				{!loading && items.length === 0 && (
					<div className="py-20 text-center">
						<div className="text-gray-600 mb-4">장바구니가 비어 있습니다.</div>
						<Link href="/shop" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">상품 보러가기</Link>
					</div>
				)}
				{!loading && items.length > 0 && (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left: Forms + Items */}
						<div className="lg:col-span-2 space-y-6">
							{/* 주문자 정보 */}
							<div className="bg-white rounded-lg shadow-sm p-4">
								<h2 className="text-lg font-semibold mb-3">주문자 정보</h2>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<input placeholder="이름" value={orderName} onChange={e=>setOrderName(e.target.value)} className="border rounded px-3 py-2" />
									<input placeholder="연락처" value={orderPhone} onChange={e=>setOrderPhone(e.target.value)} className="border rounded px-3 py-2" />
									<input placeholder="이메일" value={orderEmail} onChange={e=>setOrderEmail(e.target.value)} className="border rounded px-3 py-2" />
								</div>
							</div>

							{/* 배송 정보 */}
							<div className="bg-white rounded-lg shadow-sm p-4">
								<h2 className="text-lg font-semibold mb-3">배송정보</h2>
								<div className="flex flex-wrap gap-3 mb-3">
									<label className={`px-3 py-2 border rounded cursor-pointer ${shippingMethod==='parcel'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="ship" className="hidden" checked={shippingMethod==='parcel'} onChange={()=>setShippingMethod('parcel')} />택배
									</label>
									<label className={`px-3 py-2 border rounded cursor-pointer ${shippingMethod==='quick'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="ship" className="hidden" checked={shippingMethod==='quick'} onChange={()=>setShippingMethod('quick')} />퀵
									</label>
									<label className={`px-3 py-2 border rounded cursor-pointer ${shippingMethod==='pickup'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="ship" className="hidden" checked={shippingMethod==='pickup'} onChange={()=>setShippingMethod('pickup')} />방문수령
									</label>
								</div>
								<div className="text-sm text-gray-700 space-y-1">
									{shippingMethod==='parcel' && (
										<div>
											<div>택배: 로젠택배 / 전국지역</div>
											<div>택배상담: 로젠택배 연락처</div>
											<div>배송비: 주문건당 3,000원</div>
										</div>
									)}
									{shippingMethod==='quick' && (
										<div className="text-red-600">퀵 배송은 직접 접수하셔야 하며, 접수 시 착불로 접수하셔야 합니다.</div>
									)}
									{shippingMethod==='pickup' && (
										<div>방문수령 장소: 서울특별시 마포구 성지3길 55</div>
									)}
								</div>
							</div>

							{/* 배송지 정보 */}
							<div className="bg-white rounded-lg shadow-sm p-4">
								<h2 className="text-lg font-semibold mb-3">배송지 정보 입력</h2>
								<label className="flex items-center gap-2 mb-3 text-sm">
									<input type="checkbox" checked={sameAsOrderer} onChange={e=>setSameAsOrderer(e.target.checked)} /> 주문자와 동일
								</label>
								{sameAsOrderer && addressBook.length > 0 && (
									<div className="mb-3">
										<select className="border rounded px-3 py-2 w-full md:w-auto" onChange={(e)=>{
											const idx = parseInt(e.target.value);
											if (isNaN(idx)) return;
											const a = addressBook[idx];
											if (!a) return;
											setOrderName(a.orderer_name || "");
											setOrderPhone(a.orderer_phone || "");
											setReceiverName(a.receiver_name || "");
											setReceiverPhone(a.receiver_phone || "");
											setZipCode(a.zip_code || "");
											setAddr1(a.addr1 || "");
											setAddr2(a.addr2 || "");
										}} defaultValue={""}>
											<option value="">주소록에서 불러오기...</option>
											{addressBook.map((a, i) => (
												<option key={a.id} value={i}>{a.is_default ? "[대표] " : ""}{a.label}</option>
											))}
										</select>
									</div>
								)}
								{!sameAsOrderer && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<input placeholder="수령인 이름" value={receiverName} onChange={e=>setReceiverName(e.target.value)} className="border rounded px-3 py-2" />
										<input placeholder="수령인 연락처" value={receiverPhone} onChange={e=>setReceiverPhone(e.target.value)} className="border rounded px-3 py-2" />
										<input placeholder="우편번호" value={zipCode} onChange={e=>setZipCode(e.target.value)} className="border rounded px-3 py-2" />
										<input placeholder="주소" value={addr1} onChange={e=>setAddr1(e.target.value)} className="border rounded px-3 py-2 md:col-span-2" />
										<input placeholder="상세주소" value={addr2} onChange={e=>setAddr2(e.target.value)} className="border rounded px-3 py-2 md:col-span-2" />
									</div>
								)}
							</div>

							{/* 결제 방법 */}
							<div className="bg-white rounded-lg shadow-sm p-4">
								<h2 className="text-lg font-semibold mb-3">결제 방법 선택</h2>
								<div className="flex flex-wrap gap-3">
									<label className={`px-3 py-2 border rounded cursor-pointer ${paymentMethod==='card'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="pay" className="hidden" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} />신용카드(이지페이)
									</label>
									<label className={`px-3 py-2 border rounded cursor-pointer ${paymentMethod==='kakao'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="pay" className="hidden" checked={paymentMethod==='kakao'} onChange={()=>setPaymentMethod('kakao')} />카카오페이(준비중)
									</label>
									<label className={`px-3 py-2 border rounded cursor-pointer ${paymentMethod==='bank'?'border-blue-500 bg-blue-50':''}`}>
										<input type="radio" name="pay" className="hidden" checked={paymentMethod==='bank'} onChange={()=>setPaymentMethod('bank')} />계좌이체(무통장)
									</label>
								</div>
								{paymentMethod==='bank' && (
									<div className="mt-3 text-sm text-gray-700">
										<div>계좌번호 안내: 우리은행 1005904144208 (예금주: 피스코프)</div>
									</div>
								)}
							</div>

							{/* 동의 */}
							<div className="bg-white rounded-lg shadow-sm p-4">
								<label className="flex items-center gap-2 text-sm font-medium mb-2">
									<input type="checkbox" checked={agreeAll} onChange={e=>{ const v=e.target.checked; setAgreeAll(v); setAgreeProduct(v); setAgreeTerms(v); setAgreePrivacy(v); }} />
									아래 내용에 대해 모두 동의합니다
								</label>
								<div className="space-y-2 text-sm">
									<label className="flex items-start gap-2">
										<input type="checkbox" checked={agreeProduct} onChange={e=>{ setAgreeProduct(e.target.checked); setAgreeAll(false); }} />
										<span>
											주문제작 상품 구매 동의 (필수)<br />
											<span className="text-gray-600">상품 주문시의 미리보기 이미지는 최종 완성된 상품과 일부 다를 수 있습니다. 주문제작 상품인 관계로 취소 및 환불은 제작준비중일 때만 가능하며, 배송 완료 후 단순 변심에 의한 교환/반품은 불가합니다. 결제 전 주문내용을 반드시 확인해 주시기 바랍니다. 주문할 상품, 배송 정보를 확인하였으며, 구매에 동의하시겠습니까? (전자상거래법 제 8조 2항)</span>
										</span>
									</label>
									<label className="flex items-center gap-2">
										<input type="checkbox" checked={agreeTerms} onChange={e=>{ setAgreeTerms(e.target.checked); setAgreeAll(false); }} />
										<span>이용약관 동의 (필수) <a href="#" className="underline text-blue-600">보기</a></span>
									</label>
									<label className="flex items-center gap-2">
										<input type="checkbox" checked={agreePrivacy} onChange={e=>{ setAgreePrivacy(e.target.checked); setAgreeAll(false); }} />
										<span>개인 정보 수집 및 이용 동의 (필수) <a href="#" className="underline text-blue-600">보기</a></span>
									</label>
								</div>
							</div>

							{/* Items list */}
							<div className="bg-white rounded-lg shadow-sm overflow-hidden">
								<div className="hidden sm:block">
									<table className="min-w-full text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-3 text-left text-gray-500 font-medium">상품</th>
												<th className="px-4 py-3 text-left text-gray-500 font-medium">옵션</th>
												<th className="px-4 py-3 text-right text-gray-500 font-medium">단가</th>
												<th className="px-4 py-3 text-center text-gray-500 font-medium">수량</th>
												<th className="px-4 py-3 text-right text-gray-500 font-medium">소계</th>
												<th className="px-4 py-3"></th>
										</tr>
										</thead>
										<tbody>
											{items.map((it) => {
												const prod = productMap[it.product_id];
												const url = thumbMap[it.product_id];
												return (
													<tr key={it.id} className="border-t">
														<td className="px-4 py-4">
															<div className="flex items-center gap-3">
																<div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
																	{url ? (
																		<Image src={url} alt={prod?.name || "상품 이미지"} fill className="object-cover" unoptimized />
																	) : (
																		<div className="absolute inset-0 flex items-center justify-center text-gray-400">이미지</div>
																	)}
																</div>
																<div>
																	<Link href={`/shop/${prod?.slug || ""}`} className="font-medium text-gray-900 hover:underline">
																		{prod?.name || "상품"}
																	</Link>
																	<div className="text-xs text-gray-500 mt-1">
																		{it.selected_options ? Object.entries(it.selected_options).map(([k, v]) => (
																			<span key={k} className="mr-2">{k}: {String(v)}</span>
																		)) : ""}
																	</div>
																</div>
															</div>
														</td>
														<td className="px-4 py-4 align-top">
															<div className="sm:hidden"></div>
															<div className="hidden sm:block text-xs text-gray-500">
																{it.selected_options ? Object.entries(it.selected_options).map(([k, v]) => (
																		<div key={k}>{k}: {String(v)}</div>
																	)) : "-"}
															</div>
														</td>
														<td className="px-4 py-4 text-right whitespace-nowrap">{new Intl.NumberFormat("ko-KR").format(Number(it.unit_price))}원</td>
														<td className="px-4 py-4">
															<div className="flex items-center justify-center">
																<button disabled={updating === it.id} onClick={() => updateQuantity(it.id, it.quantity - 1)} className="w-8 h-8 border rounded-l hover:bg-gray-50 flex items-center justify-center">
																	<Minus size={14} />
																</button>
																<input
																	type="number"
																	className="w-14 h-8 text-center border-t border-b"
																	value={it.quantity}
																	min={1}
																	onChange={(e) => updateQuantity(it.id, parseInt(e.target.value) || 1)}
																/>
																<button disabled={updating === it.id} onClick={() => updateQuantity(it.id, it.quantity + 1)} className="w-8 h-8 border rounded-r hover:bg-gray-50 flex items-center justify-center">
																	<Plus size={14} />
																</button>
															</div>
														</td>
														<td className="px-4 py-4 text-right font-medium whitespace-nowrap">{new Intl.NumberFormat("ko-KR").format(Number(it.unit_price) * Number(it.quantity))}원</td>
														<td className="px-2 py-4 text-right">
															<button disabled={updating === it.id} onClick={() => removeItem(it.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
																<Trash2 size={16} />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Mobile cards */}
								<div className="sm:hidden space-y-3 p-3">
									{items.map((it) => {
										const prod = productMap[it.product_id];
										const url = thumbMap[it.product_id];
										return (
											<div key={it.id} className="bg-white rounded-lg shadow-sm p-3">
												<div className="flex gap-3">
													<div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
														{url ? (
															<Image src={url} alt={prod?.name || "상품 이미지"} fill className="object-cover" unoptimized />
														) : (
															<div className="absolute inset-0 flex items-center justify-center text-gray-400">이미지</div>
														)}
													</div>
													<div className="flex-1">
														<Link href={`/shop/${prod?.slug || ""}`} className="font-medium text-gray-900 hover:underline line-clamp-2">
															{prod?.name || "상품"}
														</Link>
														<div className="text-xs text-gray-500 mt-1">
															{it.selected_options ? Object.entries(it.selected_options).map(([k, v]) => (
																<span key={k} className="mr-2">{k}: {String(v)}</span>
															)) : ""}
														</div>
														<div className="mt-2 flex items-center justify-between">
															<div className="font-semibold text-blue-600">{new Intl.NumberFormat("ko-KR").format(Number(it.unit_price) * Number(it.quantity))}원</div>
															<button disabled={updating === it.id} onClick={() => removeItem(it.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
																<Trash2 size={16} />
															</button>
														</div>
														<div className="mt-2 flex items-center">
															<button disabled={updating === it.id} onClick={() => updateQuantity(it.id, it.quantity - 1)} className="w-8 h-8 border rounded-l hover:bg-gray-50 flex items-center justify-center">
																<Minus size={14} />
															</button>
															<input
																type="number"
																className="w-14 h-8 text-center border-t border-b"
																value={it.quantity}
																min={1}
																onChange={(e) => updateQuantity(it.id, parseInt(e.target.value) || 1)}
															/>
															<button disabled={updating === it.id} onClick={() => updateQuantity(it.id, it.quantity + 1)} className="w-8 h-8 border rounded-r hover:bg-gray-50 flex items-center justify-center">
																<Plus size={14} />
															</button>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Close left column container */}
						</div>

						{/* Right: Summary */}
						<div>
							<div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
								<h2 className="text-lg font-semibold mb-3">주문 요약</h2>
									<div className="flex justify-between text-sm text-gray-700 mb-2">
										<span>상품 합계</span>
										<span>{new Intl.NumberFormat("ko-KR").format(subtotal)}원</span>
									</div>
									<div className="flex justify-between text-sm text-gray-700 mb-2">
										<span>배송비</span>
										<span>{new Intl.NumberFormat("ko-KR").format(shippingFee)}원</span>
									</div>
									<div className="border-t my-3" />
									<div className="flex justify-between text-base font-bold text-gray-900">
										<span>총 결제금액</span>
										<span>{new Intl.NumberFormat("ko-KR").format(total)}원</span>
									</div>
									<button
										aria-disabled={!canPay}
										disabled={paying}
										onClick={requestPayment}
										className={`mt-4 w-full rounded-md py-3 font-medium text-white ${!canPay ? 'bg-blue-600/60 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
									>
										{paying ? '결제 요청 중...' : '결제하기'}
									</button>
									{payResult && (
										<pre className="mt-3 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-64">{JSON.stringify(payResult, null, 2)}</pre>
									)}
								</div>
							</div>
						</div>
					)}

				{error && (
					<div className="mt-6 text-center text-red-600">오류: {error}</div>
				)}
			</div>
		</div>
	);
}
