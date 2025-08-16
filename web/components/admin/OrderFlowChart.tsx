"use client";
import { Task, OrderInfo, MAIN_FLOW_SECTIONS, WORK_SECTIONS, TASK_STATUSES } from '../../types/tasks';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface OrderFlowChartProps {
  orderNumber: string;
  orderInfo?: OrderInfo;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const OrderFlowChart = ({ orderNumber, orderInfo, tasks, onTaskClick }: OrderFlowChartProps) => {
  // 섹션별 태스크 그룹화
  const tasksBySection = MAIN_FLOW_SECTIONS.reduce((acc, section) => {
    acc[section] = tasks.filter(task => task.section === section && task.orderNumber === orderNumber);
    return acc;
  }, {} as Record<string, Task[]>);

  // 섹션별 전체 상태 계산
  const getSectionStatus = (sectionTasks: Task[]) => {
    if (sectionTasks.length === 0) return 'empty';
    
    const completedCount = sectionTasks.filter(task => task.status === 'completed').length;
    const inProgressCount = sectionTasks.filter(task => task.status === 'in_progress').length;
    
    if (completedCount === sectionTasks.length) return 'completed';
    if (inProgressCount > 0 || completedCount > 0) return 'in_progress';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-300 text-gray-700';
      case 'empty': return 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      case 'empty': return <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded" />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* 주문 정보 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">주문 업무 흐름도</h3>
          <div className="text-sm font-mono text-[#0052cc] bg-blue-50 px-3 py-1 rounded-full">
            {orderNumber}
          </div>
        </div>
        
        {orderInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">고객명:</span>
              <span className="ml-2 font-medium">{orderInfo.customerName}</span>
            </div>
            <div>
              <span className="text-gray-500">주문일:</span>
              <span className="ml-2 font-medium">{orderInfo.orderDate}</span>
            </div>
            {orderInfo.totalAmount && (
              <div>
                <span className="text-gray-500">주문금액:</span>
                <span className="ml-2 font-medium">{orderInfo.totalAmount.toLocaleString()}원</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">상태:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                orderInfo.status === 'active' ? 'bg-blue-100 text-blue-800' :
                orderInfo.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {orderInfo.status === 'active' ? '진행중' : orderInfo.status === 'completed' ? '완료' : '취소'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 플로우 차트 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {MAIN_FLOW_SECTIONS.map((section, index) => {
          const sectionTasks = tasksBySection[section] || [];
          const sectionStatus = getSectionStatus(sectionTasks);
          
          return (
            <div key={section} className="flex items-center gap-3 flex-shrink-0">
              {/* 섹션 카드 */}
              <div className={`min-w-[200px] p-4 rounded-xl transition-all hover:shadow-md cursor-pointer ${getStatusColor(sectionStatus)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(sectionStatus)}
                    <h4 className="font-medium text-sm">{WORK_SECTIONS[section]}</h4>
                  </div>
                  <span className="text-xs opacity-75">
                    {sectionTasks.length}개
                  </span>
                </div>
                
                {sectionTasks.length > 0 && (
                  <div className="space-y-1">
                    {sectionTasks.slice(0, 2).map(task => (
                      <div 
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="text-xs p-2 bg-black bg-opacity-10 rounded cursor-pointer hover:bg-opacity-20 transition-colors"
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span>{task.assignee}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            task.status === 'completed' ? 'bg-green-200 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {TASK_STATUSES[task.status].title}
                          </span>
                        </div>
                      </div>
                    ))}
                    {sectionTasks.length > 2 && (
                      <div className="text-xs opacity-75 text-center">
                        +{sectionTasks.length - 2}개 더
                      </div>
                    )}
                  </div>
                )}
                
                {sectionTasks.length === 0 && (
                  <div className="text-xs opacity-50">
                    업무 없음
                  </div>
                )}
              </div>

              {/* 화살표 */}
              {index < MAIN_FLOW_SECTIONS.length - 1 && (
                <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* 진행률 표시 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">전체 진행률</span>
          <span className="font-medium">
            {(() => {
              const totalTasks = Object.values(tasksBySection).flat().length;
              const completedTasks = Object.values(tasksBySection).flat().filter(task => task.status === 'completed').length;
              return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            })()}%
          </span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#0052cc] rounded-full h-2 transition-all duration-300"
            style={{ 
              width: `${(() => {
                const totalTasks = Object.values(tasksBySection).flat().length;
                const completedTasks = Object.values(tasksBySection).flat().filter(task => task.status === 'completed').length;
                return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              })()}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};
