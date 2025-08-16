"use client";
import { useState, useEffect } from 'react';
import { DatabaseOrder } from '../../types/orders';
import { fetchOrderDetail } from '../../lib/ordersApi';
import { X, Package, CreditCard, Truck, User, MapPin, Clock, DollarSign } from 'lucide-react';

interface OrderDetailPanelProps {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailPanel = ({ orderNumber, isOpen, onClose }: OrderDetailPanelProps) => {
  const [order, setOrder] = useState<DatabaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderNumber) {
      loadOrderDetail();
    }
  }, [isOpen, orderNumber]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError(null);
    
    const { order: orderData, error: fetchError } = await fetchOrderDetail(orderNumber);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setOrder(orderData);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'shipped': return 'bg-green-100 text-green-800';
      case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': case 'refunded': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">주문 상세정보</h2>
              <p className="text-sm text-gray-600 mt-1">주문번호: {orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 내용 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc]"></div>
                <span className="ml-3 text-gray-600">주문 정보를 불러오는 중...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={loadOrderDetail}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            {order && !loading && (
              <div className="space-y-6">
                {/* 주문 기본 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-[#0052cc]" />
                    주문 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">주문일시:</span>
                      <p className="font-medium">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">주문 상태:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">작업 상태:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.work_status)}`}>
                        {order.work_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">배송 상태:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.shipping_status)}`}>
                        {order.shipping_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 고객 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User size={20} className="text-[#0052cc]" />
                    주문자 정보
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">주문자명:</span>
                      <p className="font-medium">{order.order_name || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처:</span>
                      <p className="font-medium">{order.order_phone || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">이메일:</span>
                      <p className="font-medium">{order.order_email || '정보 없음'}</p>
                    </div>
                  </div>
                </div>

                {/* 배송 정보 */}
                {(order.receiver_name || order.addr1) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Truck size={20} className="text-[#0052cc]" />
                      배송 정보
                    </h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">수령인:</span>
                        <p className="font-medium">{order.receiver_name || order.order_name || '정보 없음'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">연락처:</span>
                        <p className="font-medium">{order.receiver_phone || order.order_phone || '정보 없음'}</p>
                      </div>
                      {order.addr1 && (
                        <div>
                          <span className="text-gray-500">배송주소:</span>
                          <p className="font-medium">
                            {order.zip_code && `(${order.zip_code}) `}
                            {order.addr1}
                            {order.addr2 && ` ${order.addr2}`}
                          </p>
                        </div>
                      )}
                      {order.shipping_memo && (
                        <div>
                          <span className="text-gray-500">배송메모:</span>
                          <p className="font-medium">{order.shipping_memo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 결제 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-[#0052cc]" />
                    결제 정보
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">상품금액:</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">배송비:</span>
                      <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                    </div>
                    {order.refunded_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">환불금액:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(order.refunded_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-medium">총 결제금액:</span>
                      <span className="font-bold text-lg text-[#0052cc]">{formatCurrency(order.total_amount - order.refunded_amount)}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500">결제방법:</span>
                      <p className="font-medium">{order.payment_method || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">결제상태:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 취소/환불 사유 */}
                {(order.cancel_reason || order.refund_reason) && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <h3 className="text-lg font-medium text-red-900 mb-4">취소/환불 정보</h3>
                    {order.cancel_reason && (
                      <div className="mb-2">
                        <span className="text-red-600 text-sm">취소 사유:</span>
                        <p className="text-red-800 font-medium">{order.cancel_reason}</p>
                      </div>
                    )}
                    {order.refund_reason && (
                      <div>
                        <span className="text-red-600 text-sm">환불 사유:</span>
                        <p className="text-red-800 font-medium">{order.refund_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
