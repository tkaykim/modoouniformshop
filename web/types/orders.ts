// Supabase orders 테이블과 매핑되는 타입 정의
export interface DatabaseOrder {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  session_id?: string;
  shop_order_no: string;      // 주문번호
  status: string;             // 주문 상태
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method?: string;
  order_name?: string;        // 주문자명
  order_phone?: string;
  order_email?: string;
  shipping_method?: string;
  same_as_orderer: boolean;
  receiver_name?: string;
  receiver_phone?: string;
  zip_code?: string;
  addr1?: string;
  addr2?: string;
  pg_provider?: string;
  pg_authorization_id?: string;
  pg_approval?: any;
  pg_return_payload?: any;
  cancel_reason?: string;
  refund_reason?: string;
  work_status: string;        // 작업 상태
  shipping_status: string;    // 배송 상태
  shipping_memo?: string;
  payment_status: string;     // 결제 상태
  attributes?: any;
  cart_snapshot?: any;
  refunded_amount: number;
}

// 할일 관리에서 사용할 주문 정보 (기존 OrderInfo를 확장)
export interface OrderInfo {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
  workStatus?: string;       // 작업 상태
  paymentStatus?: string;    // 결제 상태
  shippingStatus?: string;   // 배송 상태
}

// 주문 연동 상태
export type OrderLinkStatus = 'linked' | 'unlinked' | 'pending';
