"use client";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Task, WorkSection, TaskStatus, OrderInfo, WORK_SECTIONS, MAIN_FLOW_SECTIONS, INDEPENDENT_SECTIONS } from '../../../types/tasks';
import { generateDummyTasks } from '../../../lib/dummyTasks';
import { SectionKanban } from '../../../components/admin/SectionKanban';
import { TaskDetailModal } from '../../../components/admin/TaskDetailModal';
import { OrderFlowChart } from '../../../components/admin/OrderFlowChart';
import { fetchOrders } from '../../../lib/ordersApi';

export default function TasksPage() {
  const [data] = useState(() => generateDummyTasks());
  const [tasks, setTasks] = useState<Task[]>(data.tasks);
  const [orders, setOrders] = useState<OrderInfo[]>(data.orders);
  const [realOrders, setRealOrders] = useState<OrderInfo[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForFlow, setSelectedOrderForFlow] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 실제 주문 데이터 로드
  const loadRealOrders = async () => {
    setLoadingOrders(true);
    const { orders: fetchedOrders, error } = await fetchOrders();
    
    if (!error && fetchedOrders.length > 0) {
      setRealOrders(fetchedOrders);
      // 실제 주문이 있으면 더미 주문과 합친다
      setOrders([...fetchedOrders, ...data.orders]);
    } else {
      console.warn('실제 주문 데이터 로드 실패:', error);
      // 실패시 더미 데이터만 사용
      setRealOrders([]);
    }
    
    setLoadingOrders(false);
  };

  // 컴포넌트 마운트시 실제 주문 데이터 로드
  useEffect(() => {
    loadRealOrders();
  }, []);

  // 검색 필터링된 할일들
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // 각 섹션별 할일 개수 계산
  const sectionCounts = useMemo(() => {
    const counts: Record<WorkSection, number> = {} as Record<WorkSection, number>;
    Object.keys(WORK_SECTIONS).forEach(section => {
      counts[section as WorkSection] = filteredTasks.filter(task => task.section === section).length;
    });
    return counts;
  }, [filteredTasks]);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const handleTaskDetailClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    setSelectedTask(updatedTask);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskOrderChange = (taskId: string, orderNumber: string | undefined) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, orderNumber, isOrderLinked: !!orderNumber, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  // 주문별 할일 그룹화
  const tasksByOrder = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.filter(task => task.orderNumber).forEach(task => {
      if (task.orderNumber) {
        if (!grouped[task.orderNumber]) {
          grouped[task.orderNumber] = [];
        }
        grouped[task.orderNumber].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fb' }}>
      <main className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">할일 관리</h1>
            <div className="flex items-center gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="할일 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white rounded-full shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#0052cc] text-sm w-64"
                />
              </div>
              
              {/* 새 할일 추가 버튼 */}
              <div className="flex items-center gap-3">
                {loadingOrders && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0052cc]"></div>
                    <span>주문 데이터 로딩중...</span>
                  </div>
                )}
                
                {realOrders.length > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    실제 주문 {realOrders.length}건 연동됨
                  </div>
                )}
                
                <button className="flex items-center gap-2 px-4 py-2 bg-[#0052cc] text-white rounded-full shadow-sm hover:bg-blue-700 transition-colors">
                  <Plus size={16} />
                  <span className="text-sm font-medium">새 할일</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            <span className="font-medium text-[#0052cc]">주문 연계 업무</span>는 인바운드→영업→디자인→발주→제작→배송 순서로 진행되며, 
            <span className="font-medium text-green-600"> 독립 업무</span>는 별도로 관리됩니다.
          </div>

          {/* 업무 플로우별 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 메인 플로우 통계 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">주문 연계 업무 플로우</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {MAIN_FLOW_SECTIONS.map((section, index) => (
                  <div key={section} className="flex items-center gap-2 flex-shrink-0">
                    <div className="bg-[#0052cc] text-white rounded-xl p-3 text-center min-w-[100px]">
                      <div className="text-lg font-semibold">
                        {sectionCounts[section] || 0}
                      </div>
                      <div className="text-xs whitespace-nowrap">{WORK_SECTIONS[section]}</div>
                    </div>
                    {index < MAIN_FLOW_SECTIONS.length - 1 && (
                      <div className="text-gray-400 flex-shrink-0">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 독립 업무 통계 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">독립 업무</h3>
              <div className="flex gap-3">
                {INDEPENDENT_SECTIONS.map((section) => (
                  <div key={section} className="bg-green-600 text-white rounded-xl p-3 text-center flex-1">
                    <div className="text-lg font-semibold">
                      {sectionCounts[section] || 0}
                    </div>
                    <div className="text-xs whitespace-nowrap">{WORK_SECTIONS[section]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 주문별 업무 흐름도 */}
        {Object.keys(tasksByOrder).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">주문별 업무 흐름</h2>
              <select 
                value={selectedOrderForFlow || ''}
                onChange={(e) => setSelectedOrderForFlow(e.target.value || null)}
                className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]"
              >
                <option value="">주문 선택...</option>
                {Object.keys(tasksByOrder).map(orderNumber => {
                  const order = orders.find(o => o.orderNumber === orderNumber);
                  return (
                    <option key={orderNumber} value={orderNumber}>
                      {orderNumber} - {order?.customerName || '고객명 없음'}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {selectedOrderForFlow && (
              <OrderFlowChart
                orderNumber={selectedOrderForFlow}
                orderInfo={orders.find(o => o.orderNumber === selectedOrderForFlow)}
                tasks={tasksByOrder[selectedOrderForFlow] || []}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsDetailModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {/* 주문 연계 업무 플로우 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">주문 연계 업무 플로우</h2>
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
              인바운드 → 영업 → 디자인 → 발주 → 제작 → 배송
            </div>
          </div>
          <div className="space-y-6">
            {MAIN_FLOW_SECTIONS.map((section) => {
              const sectionTasks = filteredTasks.filter(task => task.section === section);
              
              return (
                <SectionKanban
                  key={section}
                  section={section}
                  tasks={sectionTasks}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskDetailClick={handleTaskDetailClick}
                  availableOrders={orders}
                  onTaskOrderChange={handleTaskOrderChange}
                />
              );
            })}
          </div>
        </div>

        {/* 독립 업무 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">독립 업무</h2>
            <div className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
              주문과 무관한 별도 업무
            </div>
          </div>
          <div className="space-y-6">
            {INDEPENDENT_SECTIONS.map((section) => {
              const sectionTasks = filteredTasks.filter(task => task.section === section);
              
              return (
                <SectionKanban
                  key={section}
                  section={section}
                  tasks={sectionTasks}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskDetailClick={handleTaskDetailClick}
                  availableOrders={orders}
                  onTaskOrderChange={handleTaskOrderChange}
                />
              );
            })}
          </div>
        </div>

        {/* 할일 상세보기 모달 */}
        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onTaskUpdate={handleTaskUpdate}
        />
      </main>
    </div>
  );
}


