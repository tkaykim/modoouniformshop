"use client";
import { useState } from 'react';
import { ChevronDown, Plus, Link, Unlink } from 'lucide-react';
import { OrderInfo } from '../../types/tasks';

interface OrderSelectorProps {
  currentOrderNumber?: string;
  availableOrders: OrderInfo[];
  onOrderSelect: (orderNumber: string | undefined) => void;
  onCreateNewOrder?: () => void;
  isOrderLinked?: boolean;
}

export const OrderSelector = ({ 
  currentOrderNumber, 
  availableOrders, 
  onOrderSelect, 
  onCreateNewOrder,
  isOrderLinked = false 
}: OrderSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentOrder = availableOrders.find(order => order.orderNumber === currentOrderNumber);

  const handleOrderSelect = (orderNumber: string | undefined) => {
    onOrderSelect(orderNumber);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors min-w-[200px] ${
          isOrderLinked && currentOrderNumber
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isOrderLinked ? <Link size={14} /> : <Unlink size={14} />}
        <div className="flex-1 text-left">
          {currentOrder ? (
            <div>
              <div className="font-medium text-sm">{currentOrder.orderNumber}</div>
              <div className="text-xs text-gray-500 truncate">{currentOrder.customerName}</div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">주문 선택 (선택사항)</span>
          )}
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* 연동 해제 옵션 */}
          <button
            onClick={() => handleOrderSelect(undefined)}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
          >
            <Unlink size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">주문 연동 안함</span>
          </button>

          {/* 기존 주문 목록 */}
          {availableOrders.map(order => (
            <button
              key={order.orderNumber}
              onClick={() => handleOrderSelect(order.orderNumber)}
              className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-2 ${
                currentOrderNumber === order.orderNumber ? 'bg-blue-50' : ''
              }`}
            >
              <Link size={14} className="text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{order.orderNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'active' ? '진행중' : order.status === 'completed' ? '완료' : '취소'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {order.customerName} • {order.orderDate}
                  {order.totalAmount && ` • ${order.totalAmount.toLocaleString()}원`}
                </div>
              </div>
            </button>
          ))}

          {/* 새 주문 생성 옵션 */}
          {onCreateNewOrder && (
            <button
              onClick={() => {
                onCreateNewOrder();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 text-[#0052cc]"
            >
              <Plus size={14} />
              <span className="text-sm font-medium">새 주문 생성</span>
            </button>
          )}
        </div>
      )}

      {/* 클릭 외부 영역 감지 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};
