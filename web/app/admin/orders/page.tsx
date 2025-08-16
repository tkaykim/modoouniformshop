"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Order = {
  id: string;
  created_at: string;
  status: string;
  shop_order_no: string;
  payment_status?: string | null;
  order_name?: string | null;
  order_phone?: string | null;
  order_email?: string | null;
  shipping_method?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  addr1?: string | null;
  addr2?: string | null;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method?: string | null;
  pg_authorization_id?: string | null;
  pg_approval?: any;
  pg_return_payload?: any;
  cancel_reason?: string | null;
  refund_reason?: string | null;
  work_status?: string | null;
  shipping_status?: string | null;
  shipping_memo?: string | null;
  attributes?: any;
  cart_snapshot?: any;
  refunded_amount?: number;
  order_items?: Array<{
    id: string; product_id: string; product_name?: string | null; product_slug?: string | null; unit_price: number; quantity: number; total_price: number;
  }>;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [pgDetailOpen, setPgDetailOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundMode, setRefundMode] = useState<'auto'|'cancel'|'deferred'|'immediate'>("auto");
  const [refundBankCode, setRefundBankCode] = useState<string>("");
  const [refundAccountNo, setRefundAccountNo] = useState<string>("");
  const [refundDepositName, setRefundDepositName] = useState<string>("");
  const [cancelReason, setCancelReason] = useState<string>("");

  // Friendly label mappers
  const fmtPayStatus = (s?: string|null) => ({ paid: '결제완료', cancelled: '취소됨', refund: '환불됨', pending: '결제대기' }[String(s||'paid')] || String(s||'').toUpperCase());
  const fmtPayMethod = (s?: string|null) => ({ card: '신용카드', kakao: '카카오페이', bank: '계좌이체' }[String(s||'card')] || '기타');
  const fmtShipMethod = (s?: string|null) => ({ parcel: '택배', quick: '퀵 배송', pickup: '방문수령' }[String(s||'')] || '미지정');
  const fmtWorkStatus = (s?: string|null) => ({ pending: '대기', processing: '작업중', done: '완료', hold: '보류' }[String(s||'pending')] || String(s||'').toUpperCase());
  const fmtShipStatus = (s?: string|null) => ({ ready: '출고대기', shipping: '배송중', delivered: '배송완료', returned: '반품' }[String(s||'ready')] || String(s||'').toUpperCase());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = status ? `/api/admin/orders?status=${encodeURIComponent(status)}` : "/api/admin/orders";
      const res = await fetch(url);
      const json = await res.json();
      if (json?.items) setOrders(json.items);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [status]);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      setIsAdmin((prof as any)?.role === 'admin');
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return orders;
    const q = filter.toLowerCase();
    return orders.filter(o =>
      o.shop_order_no?.toLowerCase().includes(q) ||
      o.order_name?.toLowerCase().includes(q) ||
      o.order_phone?.toLowerCase().includes(q) ||
      o.order_email?.toLowerCase().includes(q)
    );
  }, [orders, filter]);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    const res = await fetch('/api/admin/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, patch }) });
    if (res.ok) fetchOrders();
  };

  const openCancel = (o: Order) => { setTargetOrder(o); setCancelReason(""); setCancelOpen(true); };
  const submitCancel = async () => {
    if (!targetOrder) return;
    const res = await fetch('/api/admin/orders/refund', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId: targetOrder.id, reason: cancelReason || 'cancel' }) });
    if (!res.ok) { const j = await res.json(); alert(`취소 실패: ${j?.error||res.status}`); return; }
    setCancelOpen(false); setTargetOrder(null); setCancelReason("");
    fetchOrders();
  };

  const openRefund = (o: Order) => { setTargetOrder(o); setRefundAmount(""); setRefundReason(""); setRefundMode('auto'); setRefundBankCode(""); setRefundAccountNo(""); setRefundDepositName(""); setRefundOpen(true); };
  const submitRefund = async () => {
    if (!targetOrder) return;
    const amountNum = refundAmount && refundAmount.trim() ? Number(refundAmount) : 0;
    const body: any = { orderId: targetOrder.id, reason: refundReason || 'refund' };
    if (amountNum > 0) body.amount = amountNum;
    // 결제수단/모드에 따라 환불 경로 선택 시 환불정보 동봉
    const isCard = String(targetOrder.payment_method||'').toLowerCase() === 'card';
    const willCancel = refundMode === 'cancel' || (refundMode === 'auto' && isCard);
    const willImmediateRefund = refundMode === 'immediate' || (refundMode === 'auto' && !isCard && false);
    if (!willCancel) {
      // 지결/즉시 환불 경로 → refundInfo 필요
      body.refundInfo = {
        refundBankCode: refundBankCode,
        refundAccountNo: refundAccountNo,
        refundDepositName: refundDepositName,
      };
      if (willImmediateRefund) body.refundImmediate = true;
    }
    const res = await fetch('/api/admin/orders/refund', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) { const j = await res.json(); alert(`환불 실패: ${j?.error||res.status}`); return; }
    setRefundOpen(false); setTargetOrder(null); setRefundAmount(""); setRefundReason("");
    fetchOrders();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">주문 관리</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white hover:bg-gray-50 shadow-sm"><RefreshCw size={16} /> 새로고침</button>
          <button onClick={async()=>{ const r=await fetch('/api/admin/orders/reconcile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({days:2})}); const j=await r.json(); if(!r.ok){alert('교차검증 실패');} else {alert(`교차검증 완료\n갱신: ${j.updated?.length||0}건`); fetchOrders();}}} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white hover:bg-gray-50 shadow-sm">PG 교차검증</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center rounded px-2 bg-white shadow-sm">
          <Search size={16} className="text-gray-500" />
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="주문번호/이름/연락처/이메일 검색" className="px-2 py-1 outline-none" />
          {filter && <button onClick={()=>setFilter("")}><X size={14} /></button>}
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded px-3 py-2 bg-white shadow-sm">
          <option value="">전체 상태</option>
          <option value="pending">결제대기</option>
          <option value="paid">결제완료</option>
          <option value="cancelled">취소</option>
          <option value="refund">환불</option>
        </select>
      </div>

      {/* 테이블 형태: 한 주문 = 한 행 */}
      <div className="overflow-auto rounded-xl shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-3 py-2 text-left w-8"></th>
              <th className="px-3 py-2 text-left">주문번호</th>
              <th className="px-3 py-2 text-left">주문일시</th>
              <th className="px-3 py-2 text-left">주문자명</th>
              <th className="px-3 py-2 text-left">상품명</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">결제금액</th>
              <th className="px-3 py-2 text-left">결제상태</th>
              <th className="px-3 py-2 text-left">작업상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const isOpen = !!expanded[o.id];
              const firstItem = o.order_items && o.order_items.length > 0 ? (o.order_items[0].product_name || o.order_items[0].product_id) : '-';
              const totalQty = (o.order_items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
              return (
                <Fragment key={o.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={()=> { setTargetOrder(o); setExpanded(prev=> ({ ...prev, [o.id]: true })); }}>
                    <td className="px-3 py-2">
                      <button onClick={(e)=> { e.stopPropagation(); toggleExpand(o.id); }} className="rounded bg-white hover:bg-gray-50 shadow-sm px-1 py-1">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">#{o.shop_order_no}</td>
                    <td className="px-3 py-2 text-gray-600">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{o.order_name || '-'}</td>
                    <td className="px-3 py-2">{firstItem}{(o.order_items && o.order_items.length > 1) ? ` 외 ${o.order_items.length - 1}건` : ''}</td>
                    <td className="px-3 py-2 text-right">{totalQty.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{o.total_amount.toLocaleString()}원</td>
                    <td className="px-3 py-2">{fmtPayStatus(o.payment_status || o.status)}</td>
                    <td className="px-3 py-2">{fmtWorkStatus(o.work_status)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td className="px-3 py-2" colSpan={9}>
                        <div className="rounded-2xl bg-white shadow-sm p-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <div className="font-semibold mb-1">상품 내역</div>
                              <div className="space-y-1">
                                {o.order_items?.map(it => (
                                  <div key={it.id} className="flex items-center justify-between">
                                    <div>{it.product_name || it.product_id} × {it.quantity}</div>
                                    <div>{it.total_price.toLocaleString()}원</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold mb-1">주문 요약</div>
                              <div className="text-gray-600">금액: {o.total_amount.toLocaleString()}원</div>
                              <div className="text-gray-600">결제상태: {fmtPayStatus(o.payment_status || o.status)}</div>
                              <div className="text-gray-600">작업상태: {fmtWorkStatus(o.work_status)}</div>
                            </div>
                            <div className="flex items-end justify-end gap-2">
                              {o.status === 'paid' && (
                                <button onClick={()=>openRefund(o)} className="px-3 py-1.5 rounded bg-white hover:bg-gray-50 shadow-sm">환불</button>
                              )}
                              {o.status !== 'cancelled' && o.status !== 'refund' && (
                                <button onClick={()=>openCancel(o)} className="px-3 py-1.5 rounded bg-white hover:bg-gray-50 shadow-sm">취소</button>
                              )}
                              <button onClick={()=>{ setTargetOrder(o); }} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">상세보기</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 상세 팝업 모달 */}
      {targetOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setTargetOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl p-4" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">주문 상세보기 • #{targetOrder.shop_order_no}</div>
              <button className="px-2 py-1 rounded bg-white shadow-sm" onClick={()=> setTargetOrder(null)}>닫기</button>
            </div>
            {/* 라벨형 요약 헤더 */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded p-3 bg-gray-50">
                <div className="text-gray-500">주문번호</div>
                <div className="font-semibold">#{targetOrder.shop_order_no}</div>
              </div>
              <div className="rounded p-3 bg-gray-50">
                <div className="text-gray-500">결제상태</div>
                <div className="font-semibold">{fmtPayStatus(targetOrder.payment_status || targetOrder.status)}</div>
              </div>
              <div className="rounded p-3 bg-gray-50">
                <div className="text-gray-500">결제수단</div>
                <div className="font-semibold">{fmtPayMethod(targetOrder.payment_method)}</div>
              </div>
              <div className="rounded p-3 bg-gray-50">
                <div className="text-gray-500">접수일시</div>
                <div className="font-semibold">{new Date(targetOrder.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded p-3 bg-white shadow-sm">
                <div className="font-semibold mb-2">상품 내역</div>
                <div className="space-y-1">
                  {targetOrder.order_items?.map(it => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div>{it.product_name || it.product_id} × {it.quantity}</div>
                      <div>{it.total_price.toLocaleString()}원</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded p-3 bg-white shadow-sm">
                <div className="font-semibold mb-2">주문자 정보</div>
                <div><span className="text-gray-500">이름</span>: {targetOrder.order_name || '-'}</div>
                <div><span className="text-gray-500">연락처</span>: {targetOrder.order_phone || '-'}</div>
                <div className="text-gray-600"><span className="text-gray-500">이메일</span>: {targetOrder.order_email || '-'}</div>
              </div>
              <div className="rounded p-3 bg-white shadow-sm">
                <div className="font-semibold mb-2">배송 정보</div>
                <div><span className="text-gray-500">배송방식</span>: {fmtShipMethod(targetOrder.shipping_method)}</div>
                <div><span className="text-gray-500">수령인</span>: {targetOrder.receiver_name || '-'}</div>
                <div><span className="text-gray-500">연락처</span>: {targetOrder.receiver_phone || '-'}</div>
                <div className="text-gray-600"><span className="text-gray-500">주소</span>: {[targetOrder.addr1, targetOrder.addr2].filter(Boolean).join(' ') || '-'}</div>
                <div className="text-gray-600"><span className="text-gray-500">배송상태</span>: {fmtShipStatus(targetOrder.shipping_status)}</div>
                {targetOrder.shipping_memo ? (
                  <div className="mt-1 text-gray-600"><span className="text-gray-500">배송메모</span>: {targetOrder.shipping_memo}</div>
                ) : null}
              </div>
              <div className="rounded p-3 bg-white shadow-sm">
                <div className="font-semibold mb-2">결제 정보</div>
                <div><span className="text-gray-500">결제상태</span>: <span className="font-semibold">{fmtPayStatus(targetOrder.payment_status || targetOrder.status)}</span></div>
                <div><span className="text-gray-500">결제수단</span>: {fmtPayMethod(targetOrder.payment_method)}</div>
                <div><span className="text-gray-500">주문합계</span>: {targetOrder.subtotal.toLocaleString()}원</div>
                <div><span className="text-gray-500">배송비</span>: {targetOrder.shipping_fee.toLocaleString()}원</div>
                <div><span className="text-gray-500">결제금액</span>: <span className="font-semibold">{targetOrder.total_amount.toLocaleString()}원</span></div>
                <div><span className="text-gray-500">환불금액</span>: {(targetOrder.refunded_amount||0).toLocaleString()}원</div>
                <div><span className="text-gray-500">실결제액</span>: {(targetOrder.total_amount - (targetOrder.refunded_amount||0)).toLocaleString()}원</div>
                {targetOrder.pg_approval?.pgCno ? (
                  <div className="mt-1 text-gray-600 flex items-center gap-2">
                    <span className="text-gray-500">승인거래번호</span>: {targetOrder.pg_approval.pgCno}
                    {isAdmin && (
                      <button className="px-2 py-1 text-xs rounded bg-white shadow-sm hover:bg-gray-50" onClick={()=> setPgDetailOpen(true)}>PG 상세</button>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="rounded border p-3">
                <div className="font-semibold mb-2">작업 상태</div>
                <div><span className="text-gray-500">작업상태</span>: {fmtWorkStatus(targetOrder.work_status)}</div>
                <div><span className="text-gray-500">관리 메모</span>: {targetOrder.attributes?.memo || '-'}</div>
              </div>
            </div>

            {/* 원시 데이터 섹션 제거 (PG 상세는 관리자 전용 모달 버튼으로 제공) */}
            <div className="mt-4 flex items-center justify-end gap-2">
              {targetOrder.status === 'paid' && (
                <button onClick={()=>{ setRefundOpen(true); }} className="px-3 py-1.5 border rounded hover:bg-gray-50">환불</button>
              )}
              {targetOrder.status !== 'cancelled' && targetOrder.status !== 'refund' && (
                <button onClick={()=>{ setCancelOpen(true); }} className="px-3 py-1.5 border rounded hover:bg-gray-50">취소</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 환불 모달 */}
      {refundOpen && targetOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="font-semibold mb-2">환불 처리</div>
            <div className="text-sm text-gray-600 mb-3">주문번호 #{targetOrder.shop_order_no}</div>
            <label className="block text-sm mb-1">처리 유형</label>
            <select className="w-full rounded px-2 py-1 mb-3 bg-white shadow-sm" value={refundMode} onChange={e=>setRefundMode(e.target.value as any)}>
              <option value="auto">자동 결정(결제수단 기준)</option>
              <option value="cancel">취소(카드)</option>
              <option value="deferred">환불(지결)</option>
              <option value="immediate">환불(즉시)</option>
            </select>
            <label className="block text-sm mb-1">환불 금액 (비우면 전액)</label>
            <input className="w-full rounded px-2 py-1 mb-3 bg-white shadow-sm" value={refundAmount} onChange={e=>setRefundAmount(e.target.value)} placeholder={`${targetOrder.total_amount}`} />
            { (refundMode === 'deferred' || refundMode === 'immediate' || (refundMode==='auto' && String(targetOrder.payment_method||'').toLowerCase()!=='card')) && (
              <div className="mb-3 rounded p-2 bg-white shadow-sm">
                <div className="text-sm font-medium mb-2">환불계좌 정보(필수)</div>
                <input className="w-full rounded px-2 py-1 mb-2 bg-white shadow-sm" placeholder="은행코드 (예: 016)" value={refundBankCode} onChange={e=>setRefundBankCode(e.target.value)} />
                <input className="w-full rounded px-2 py-1 mb-2 bg-white shadow-sm" placeholder="계좌번호" value={refundAccountNo} onChange={e=>setRefundAccountNo(e.target.value)} />
                <input className="w-full rounded px-2 py-1 bg-white shadow-sm" placeholder="예금주명" value={refundDepositName} onChange={e=>setRefundDepositName(e.target.value)} />
              </div>
            )}
            <label className="block text-sm mb-1">사유</label>
            <textarea className="w-full rounded px-2 py-1 mb-3 bg-white shadow-sm" rows={3} value={refundReason} onChange={e=>setRefundReason(e.target.value)} placeholder="고객변심 등" />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-white shadow-sm" onClick={()=>{ setRefundOpen(false); setTargetOrder(null); }}>닫기</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={submitRefund}>환불 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* 취소 모달 */}
      {cancelOpen && targetOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="font-semibold mb-2">결제 취소</div>
            <div className="text-sm text-gray-600 mb-3">주문번호 #{targetOrder.shop_order_no}</div>
            <label className="block text-sm mb-1">사유</label>
            <textarea className="w-full rounded px-2 py-1 mb-3 bg-white shadow-sm" rows={3} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="중복결제 등" />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-white shadow-sm" onClick={()=>{ setCancelOpen(false); setTargetOrder(null); }}>닫기</button>
              <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={submitCancel}>취소 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* PG 상세 모달 — 관리자 전용 */}
      {isAdmin && pgDetailOpen && targetOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setPgDetailOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl p-4" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">PG 상세 • #{targetOrder.shop_order_no}</div>
              <button className="px-2 py-1 rounded bg-white shadow-sm" onClick={()=> setPgDetailOpen(false)}>닫기</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {targetOrder.pg_approval ? (
                <div className="rounded p-3 bg-white shadow-sm">
                  <div className="font-semibold mb-2">PG 승인 상세</div>
                  <pre className="bg-gray-50 rounded p-2 overflow-auto max-h-60">{JSON.stringify(targetOrder.pg_approval, null, 2)}</pre>
                </div>
              ) : null}
              {targetOrder.pg_return_payload ? (
                <div className="rounded p-3 bg-white shadow-sm">
                  <div className="font-semibold mb-2">PG 리턴 페이로드</div>
                  <pre className="bg-gray-50 rounded p-2 overflow-auto max-h-60">{JSON.stringify(targetOrder.pg_return_payload, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


