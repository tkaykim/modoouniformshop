import { Task, WorkSection, TaskStatus, TaskMemo, OrderInfo, MAIN_FLOW_SECTIONS, INDEPENDENT_SECTIONS } from '../types/tasks';

// 더미 업무메모 생성 함수
const createDummyMemos = (count: number = 2): TaskMemo[] => {
  const authors = ['김현수', '박지은', '이민호', '정수연', '최영훈'];
  const contents = [
    '고객과 통화 완료, 추가 요구사항 확인됨',
    '디자인 시안 검토 중, 수정사항 있음',
    '발주 업체 컨택 완료, 견적서 대기 중',
    '결제 승인 처리 완료',
    '제작 진행 상황 양호, 예정일 준수 가능',
    '배송 준비 완료, 택배사 연락 예정',
    '고객 피드백 반영하여 수정 작업 진행',
    '품질 검수 완료, 출고 준비 중'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `memo-${Date.now()}-${i}`,
    author: authors[Math.floor(Math.random() * authors.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

// 섹션별 세부정보 생성 함수
const createSectionDetails = (section: WorkSection): Record<string, any> => {
  switch (section) {
    case 'inbound':
      return {
        inquiryType: ['전화문의', '카카오톡', '홈페이지'][Math.floor(Math.random() * 3)],
        customerName: '김○○',
        phoneNumber: '010-****-1234',
        preferredContactTime: '오후 2-5시'
      };
    case 'sales':
      return {
        leadScore: Math.floor(Math.random() * 100),
        estimatedValue: Math.floor(Math.random() * 1000000) + 100000,
        lastContactDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextFollowUp: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    case 'marketing':
      return {
        campaign: ['SNS 광고', '블로그 포스팅', '인플루언서 협업'][Math.floor(Math.random() * 3)],
        targetAudience: '20-30대 직장인',
        budget: Math.floor(Math.random() * 500000) + 50000,
        expectedROI: Math.floor(Math.random() * 300) + 100
      };
    case 'design':
      return {
        designType: ['로고', '티셔츠', '후드티', '에코백'][Math.floor(Math.random() * 4)],
        colorScheme: '#0052cc, #ffffff',
        revisionCount: Math.floor(Math.random() * 3),
        clientApproval: Math.random() > 0.5
      };
    case 'procurement':
      return {
        supplier: ['A텍스타일', 'B원단공급사', 'C제조업체'][Math.floor(Math.random() * 3)],
        quantity: Math.floor(Math.random() * 500) + 50,
        unitPrice: Math.floor(Math.random() * 10000) + 5000,
        deliveryDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
          case 'design_general':
        return {
          designType: ['브랜드 아이덴티티', '웹사이트 디자인', '포스터', '배너'][Math.floor(Math.random() * 4)],
          clientType: ['내부', '외부 업체', '파트너'][Math.floor(Math.random() * 3)],
          designStage: ['컨셉', '초안', '수정', '최종'][Math.floor(Math.random() * 4)],
          deadline: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
    case 'production':
      return {
        productionLine: ['라인1', '라인2', '라인3'][Math.floor(Math.random() * 3)],
        qualityCheck: Math.random() > 0.2,
        completionRate: Math.floor(Math.random() * 100),
        expectedCompletion: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    case 'shipping':
      return {
        shippingCompany: ['CJ대한통운', '로젠택배', '한진택배'][Math.floor(Math.random() * 3)],
        trackingNumber: `T${Date.now().toString().slice(-8)}`,
        shippingAddress: '서울시 강남구 ○○○',
        deliveryType: ['일반배송', '당일배송', '픽업'][Math.floor(Math.random() * 3)]
      };
    default:
      return {};
  }
};

// 주문 정보 생성
const generateOrderInfo = (): OrderInfo[] => {
  const customers = ['㈜테크혁신', '서울대학교', '삼성전자', 'LG유플러스', '카카오', '네이버', '현대자동차', '포스코', 'SK텔레콤', '롯데그룹', '신한은행', 'KB국민은행'];
  const orders: OrderInfo[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const orderDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // 60일 이내
    orders.push({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}-${i.toString().padStart(2, '0')}`,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      orderDate: orderDate.toISOString().split('T')[0],
      totalAmount: Math.floor(Math.random() * 5000000) + 500000, // 50만원~550만원
      status: ['active', 'active', 'active', 'completed', 'cancelled'][Math.floor(Math.random() * 5)] as 'active' | 'completed' | 'cancelled',
      description: `${customers[Math.floor(Math.random() * customers.length)]} 단체복 제작 주문`
    });
  }
  
  return orders;
};

// 더미 할일 생성
export const generateDummyTasks = (): { tasks: Task[], orders: OrderInfo[] } => {
  const allSections: WorkSection[] = [...MAIN_FLOW_SECTIONS, ...INDEPENDENT_SECTIONS];
  const statuses: TaskStatus[] = ['pending', 'planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];
  const assignees = ['김현수', '박지은', '이민호', '정수연', '최영훈', '한서진', '오태경', '윤지혜'];
  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
  
  const orders = generateOrderInfo();

  const taskTitles: Record<WorkSection, string[]> = {
    inbound: [
      '신규 문의 고객 상담 진행',
      '재문의 고객 후속 연락',
      'VIP 고객 전담 상담',
      '단체복 문의 접수 처리',
      '긴급 문의 즉시 대응'
    ],
    sales: [
      '○○회사 단체복 견적 제안',
      '대학교 MT복 영업 진행',
      '기업 연말파티 굿즈 제안',
      'VIP 고객 관계 관리',
      '신규 거래처 발굴 활동'
    ],
    design: [
      '주문 단체복 디자인 시안 작업',
      '고객 로고 단체복 적용',
      '주문 굿즈 패키지 디자인',
      '고객 요청 디자인 수정',
      '최종 디자인 승인 대기'
    ],
    procurement: [
      '원단 발주 및 입고 관리',
      '부자재 공급업체 관리',
      '품질 검수 및 검품 작업',
      '재고 관리 및 발주 계획',
      '신규 공급업체 발굴'
    ],
    production: [
      '단체복 제작 진행 관리',
      '품질 관리 및 검수',
      '생산 일정 조율',
      '제작 완료 확인',
      '긴급 주문 제작 대응'
    ],
    shipping: [
      '완성품 포장 및 출고',
      '배송 일정 관리',
      '고객 배송 완료 알림',
      '배송 지연 대응',
      '반품 및 교환 처리'
    ],
    marketing: [
      'SNS 콘텐츠 기획 및 제작',
      '인플루언서 협업 진행',
      '브랜드 인지도 개선 캠페인',
      '고객 리뷰 수집 및 활용',
      '시즌 프로모션 기획'
    ],
    design_general: [
      '회사 브랜드 아이덴티티 개선',
      '웹사이트 리뉴얼 디자인',
      '마케팅 포스터 제작',
      '소셜미디어 배너 디자인',
      '카탈로그 레이아웃 작업'
    ]
  };

  const tasks: Task[] = [];
  let orderIndex = 0;

  // 메인 플로우 태스크 생성 (주문번호 기반 연계)
  MAIN_FLOW_SECTIONS.forEach(section => {
    const taskCount = Math.floor(Math.random() * 4) + 6; // 6-10개
    
    for (let i = 0; i < taskCount; i++) {
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      
      // 메인 플로우 태스크는 70% 확률로 주문번호 보유
      const hasOrderNumber = Math.random() > 0.3;
      let orderNumber: string | undefined;
      let isOrderLinked = false;
      
      if (hasOrderNumber && orderIndex < orders.length) {
        orderNumber = orders[orderIndex].orderNumber;
        isOrderLinked = true;
        // 같은 주문번호를 여러 섹션에서 공유할 수 있도록 인덱스 조정
        if (Math.random() > 0.4) orderIndex++;
      }
      
      const task: Task = {
        id: `${section}-${Date.now()}-${i}`,
        title: taskTitles[section][Math.floor(Math.random() * taskTitles[section].length)],
        orderNumber,
        taskNumber: `TSK-${section.toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        section,
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        dueDate: Math.random() > 0.2 ? dueDate.toISOString().split('T')[0] : undefined,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        description: isOrderLinked ? '주문 기반 연계 업무입니다.' : '주문과 연계되지 않은 업무입니다.',
        memos: createDummyMemos(Math.floor(Math.random() * 4) + 1),
        sectionDetails: createSectionDetails(section),
        createdAt: createdDate.toISOString(),
        updatedAt: new Date().toISOString(),
        isOrderLinked
      };
      
      tasks.push(task);
    }
  });

  // 독립 업무 태스크 생성 (주문번호 없음)
  INDEPENDENT_SECTIONS.forEach(section => {
    const taskCount = Math.floor(Math.random() * 3) + 4; // 4-7개
    
    for (let i = 0; i < taskCount; i++) {
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      
      const task: Task = {
        id: `${section}-${Date.now()}-${i}`,
        title: taskTitles[section][Math.floor(Math.random() * taskTitles[section].length)],
        orderNumber: undefined, // 독립 업무는 주문번호 없음
        taskNumber: `TSK-${section.toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        section,
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        dueDate: Math.random() > 0.2 ? dueDate.toISOString().split('T')[0] : undefined,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        description: '독립적인 업무입니다.',
        memos: createDummyMemos(Math.floor(Math.random() * 4) + 1),
        sectionDetails: createSectionDetails(section),
        createdAt: createdDate.toISOString(),
        updatedAt: new Date().toISOString(),
        isOrderLinked: false
      };
      
      tasks.push(task);
    }
  });

  return { tasks, orders };
};
