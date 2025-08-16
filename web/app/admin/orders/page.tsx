"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Search, X } from "lucide-react";

type Order = {
  id: string;
  created_at: string;
  status: string;
  shop_order_no: string;
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
  cancel_reason?: string | null;
  refund_reason?: string | null;
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

  const cancelOrder = async (o: Order) => {
    const reason = prompt('취소 사유를 입력하세요', o.cancel_reason || '');
    if (reason == null) return;
    await updateOrder(o.id, { status: 'cancelled', cancel_reason: reason });
  };

  const refundOrder = async (o: Order) => {
    const reason = prompt('환불 사유를 입력하세요', o.refund_reason || '');
    if (reason == null) return;
    await updateOrder(o.id, { status: 'refund', refund_reason: reason });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">주문 관리</h1>
        <button onClick={fetchOrders} className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"><RefreshCw size={16} /> 새로고침</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center border rounded px-2">
          <Search size={16} className="text-gray-500" />
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="주문번호/이름/연락처/이메일 검색" className="px-2 py-1 outline-none" />
          {filter && <button onClick={()=>setFilter("")}><X size={14} /></button>}
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="">전체 상태</option>
          <option value="pending">결제대기</option>
          <option value="paid">결제완료</option>
          <option value="cancelled">취소</option>
          <option value="refund">환불</option>
        </select>
      </div>

      {/* 칸반형 간단보기 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(o => {
          const isOpen = !!expanded[o.id];
          return (
            <div key={o.id} className="bg-white border rounded shadow-sm">
              <button onClick={()=>toggleExpand(o.id)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                <div className="text-left">
                  <div className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                  <div className="font-medium">#{o.shop_order_no} • {o.order_name || '주문자'}</div>
                  <div className="text-sm text-gray-600">{o.status.toUpperCase()} • {o.payment_method || '결제수단'} • {o.total_amount.toLocaleString()}원</div>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {isOpen && (
                <div className="px-3 py-2 border-t text-sm">
                  <div className="mb-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="font-semibold mb-1">주문자</div>
                      <div>{o.order_name} • {o.order_phone}</div>
                      <div className="text-gray-600">{o.order_email}</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">배송</div>
                      <div>{(o.shipping_method || '').toUpperCase()}</div>
                      <div>{o.receiver_name} • {o.receiver_phone}</div>
                      <div className="text-gray-600">{o.addr1} {o.addr2}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {o.status === 'paid' && (
                      <button onClick={()=>refundOrder(o)} className="px-3 py-1.5 border rounded hover:bg-gray-50">환불</button>
                    )}
                    {o.status !== 'cancelled' && o.status !== 'refund' && (
                      <button onClick={()=>cancelOrder(o)} className="px-3 py-1.5 border rounded hover:bg-gray-50">취소</button>
                    )}
                    <a href={`/admin/orders/${o.id}`} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">상세보기</a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


