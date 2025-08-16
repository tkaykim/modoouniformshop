export type TaskStatus = 
  | 'pending'      // 진행전
  | 'planning'     // 계획중
  | 'in_progress'  // 진행중
  | 'completed'    // 진행완료
  | 'on_hold'      // 보류
  | 'cancelled';   // 취소

export type WorkSection = 
  | 'inbound'      // 인바운드 응대 업무
  | 'sales'        // 영업 업무
  | 'design'       // 디자인 업무 (주문 연계)
  | 'procurement'  // 발주 업무
  | 'production'   // 제작 업무
  | 'shipping'     // 배송 업무
  | 'marketing'    // 마케팅 업무 (독립)
  | 'design_general'; // 일반 디자인 업무 (독립)

export interface TaskMemo {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface OrderInfo {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  orderNumber?: string;      // 주문번호 (선택적)
  taskNumber: string;        // 업무번호
  status: TaskStatus;
  section: WorkSection;
  assignee: string;          // 담당자
  dueDate?: string;          // 마감일
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  memos: TaskMemo[];         // 업무메모
  sectionDetails?: Record<string, any>; // 각 파트별 세부정보
  createdAt: string;
  updatedAt: string;
  isOrderLinked?: boolean;   // 주문 연동 여부
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

export const WORK_SECTIONS: Record<WorkSection, string> = {
  inbound: '인바운드 응대',
  sales: '영업',
  design: '디자인 (주문)',
  procurement: '발주',
  production: '제작',
  shipping: '배송',
  marketing: '마케팅',
  design_general: '일반 디자인'
};

// 메인 플로우 (주문 기반 연계 업무)
export const MAIN_FLOW_SECTIONS: WorkSection[] = [
  'inbound', 'sales', 'design', 'procurement', 'production', 'shipping'
];

// 독립 업무
export const INDEPENDENT_SECTIONS: WorkSection[] = [
  'marketing', 'design_general'
];

export const TASK_STATUSES: Record<TaskStatus, { title: string; color: string }> = {
  pending: { title: '진행전', color: '#6b7280' },
  planning: { title: '계획중', color: '#0052cc' },
  in_progress: { title: '진행중', color: '#f59e0b' },
  completed: { title: '진행완료', color: '#10b981' },
  on_hold: { title: '보류', color: '#8b5cf6' },
  cancelled: { title: '취소', color: '#ef4444' }
};
