import { supabase } from './supabaseClient';
import { DatabaseOrder, OrderInfo } from '../types/orders';

/**
 * Supabase에서 주문 목록을 가져옵니다
 */
export async function fetchOrders(): Promise<{ orders: OrderInfo[], error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        shop_order_no,
        status,
        total_amount,
        order_name,
        work_status,
        payment_status,
        shipping_status
      `)
      .order('created_at', { ascending: false })
      .limit(50); // 최근 50개만 가져오기

    if (error) {
      console.error('주문 데이터 조회 오류:', error);
      return { orders: [], error: error.message };
    }

    if (!data) {
      return { orders: [], error: null };
    }

    // DatabaseOrder를 OrderInfo로 변환
    const orders: OrderInfo[] = data.map((order: any) => ({
      orderNumber: order.shop_order_no,
      customerName: order.order_name || '고객명 없음',
      orderDate: new Date(order.created_at).toISOString().split('T')[0],
      totalAmount: order.total_amount || 0,
      status: getOrderStatus(order.status, order.work_status),
      workStatus: order.work_status,
      paymentStatus: order.payment_status,
      shippingStatus: order.shipping_status,
      description: `${order.order_name || '고객명 없음'} - ${order.shop_order_no}`
    }));

    return { orders, error: null };
  } catch (err) {
    console.error('주문 데이터 조회 중 예외:', err);
    return { orders: [], error: '주문 데이터를 불러오는데 실패했습니다.' };
  }
}

/**
 * 특정 주문의 상세 정보를 가져옵니다
 */
export async function fetchOrderDetail(shopOrderNo: string): Promise<{ order: DatabaseOrder | null, error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_order_no', shopOrderNo)
      .single();

    if (error) {
      console.error('주문 상세 정보 조회 오류:', error);
      return { order: null, error: error.message };
    }

    return { order: data as DatabaseOrder, error: null };
  } catch (err) {
    console.error('주문 상세 정보 조회 중 예외:', err);
    return { order: null, error: '주문 상세 정보를 불러오는데 실패했습니다.' };
  }
}

/**
 * 주문 상태를 할일 관리용 상태로 변환
 */
function getOrderStatus(orderStatus: string, workStatus: string): 'active' | 'completed' | 'cancelled' {
  // 취소/환불된 주문
  if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
    return 'cancelled';
  }
  
  // 완료된 주문 (배송 완료 등)
  if (workStatus === 'completed' || workStatus === 'shipped') {
    return 'completed';
  }
  
  // 기본적으로 진행중
  return 'active';
}

/**
 * 실시간 주문 상태 업데이트를 위한 구독
 */
export function subscribeToOrderUpdates(callback: (payload: any) => void) {
  const subscription = supabase
    .channel('orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
