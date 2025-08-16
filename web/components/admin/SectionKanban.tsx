"use client";
import { useState } from 'react';
import { Task, TaskStatus, TASK_STATUSES, WORK_SECTIONS, WorkSection, OrderInfo } from '../../types/tasks';
import { ChevronDown, ChevronRight, User, Calendar, Clock, AlertCircle, Eye, Link } from 'lucide-react';
import { OrderSelector } from './OrderSelector';

interface SectionKanbanProps {
  section: WorkSection;
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDetailClick: (task: Task) => void;
  availableOrders?: OrderInfo[];
  onTaskOrderChange?: (taskId: string, orderNumber: string | undefined) => void;
}

interface TaskItemProps {
  task: Task;
  viewMode: 'simple' | 'summary' | 'detailed';
  onStatusChange: (newStatus: TaskStatus) => void;
  onDetailClick: () => void;
  onToggleView: () => void;
  availableOrders?: OrderInfo[];
  onOrderChange?: (orderNumber: string | undefined) => void;
}

const TaskItem = ({ task, viewMode, onStatusChange, onDetailClick, onToggleView, availableOrders, onOrderChange }: TaskItemProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'low': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: '지연됨', color: 'text-red-600' };
    if (diffDays === 0) return { text: '오늘', color: 'text-orange-600' };
    if (diffDays === 1) return { text: '내일', color: 'text-orange-500' };
    return { text: `${diffDays}일 후`, color: 'text-gray-600' };
  };

  const dueDateStatus = getDueDateStatus(task.dueDate);

  if (viewMode === 'simple') {
    return (
      <div className={`flex items-center gap-3 py-2 px-3 bg-white rounded-lg shadow-sm hover:shadow transition-shadow min-w-0 ${
        task.isOrderLinked ? 'border-2 border-[#0052cc]' : 'border border-gray-200'
      }`}>
        <button 
          onClick={onToggleView}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 text-sm font-medium text-gray-900 truncate min-w-0">
          {task.title}
        </div>
        {task.isOrderLinked && task.orderNumber && (
          <div className="flex items-center gap-1 text-xs text-blue-600 flex-shrink-0">
            <Link size={10} />
            <span className="whitespace-nowrap">{task.orderNumber}</span>
          </div>
        )}
        <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">{task.assignee}</div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: TASK_STATUSES[task.status].color }} />
      </div>
    );
  }

  if (viewMode === 'summary') {
    return (
      <div className={`bg-white rounded-xl p-4 shadow-sm min-w-0 ${
        task.isOrderLinked ? 'border-2 border-[#0052cc]' : 'border border-gray-200'
      }`}>
        <div className="flex items-start gap-3 mb-3">
          <button 
            onClick={onToggleView}
            className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0"
          >
            <ChevronDown size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 mb-2 truncate">{task.title}</h4>
            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center gap-1 flex-shrink-0">
                <User size={12} />
                <span className="whitespace-nowrap">{task.assignee}</span>
              </div>
              {task.dueDate && dueDateStatus && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Calendar size={12} />
                  <span className={`${dueDateStatus.color} whitespace-nowrap`}>{dueDateStatus.text}</span>
                </div>
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_STATUSES[task.status].color }} />
                <span className="whitespace-nowrap">{TASK_STATUSES[task.status].title}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onDetailClick}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#0052cc] hover:bg-blue-50 rounded flex-shrink-0 whitespace-nowrap"
          >
            <Eye size={12} />
            상세보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm min-w-0 ${
      task.isOrderLinked ? 'border-2 border-[#0052cc]' : 'border border-gray-100'
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <button 
          onClick={onToggleView}
          className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0"
        >
          <ChevronDown size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex-1 truncate">{task.title}</h4>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 whitespace-nowrap ${getPriorityColor(task.priority)}`}>
              {task.priority === 'urgent' ? '긴급' : task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-3 font-mono truncate">
            {task.taskNumber}
            {task.orderNumber && (
              <span className="ml-2 text-[#0052cc]">• {task.orderNumber}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2 flex-shrink-0">
              <User size={12} className="text-gray-400" />
              <span className="text-gray-700 whitespace-nowrap">{task.assignee}</span>
            </div>
            {task.dueDate && dueDateStatus && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Calendar size={12} className="text-gray-400" />
                <span className={`${dueDateStatus.color} whitespace-nowrap`}>{dueDateStatus.text}</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_STATUSES[task.status].color }} />
              <span className="text-gray-700 whitespace-nowrap">{TASK_STATUSES[task.status].title}</span>
            </div>
            {task.memos.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <AlertCircle size={12} className="text-gray-400" />
                <span className="text-gray-500 whitespace-nowrap">메모 {task.memos.length}개</span>
              </div>
            )}
          </div>

          {task.description && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="truncate">{task.description.substring(0, 100)}...</div>
            </div>
          )}

          {/* 주문 선택 (메인 플로우 업무만) */}
          {availableOrders && onOrderChange && ['inbound', 'sales'].includes(task.section) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-700 mb-2 block">주문 연동</label>
              <OrderSelector
                currentOrderNumber={task.orderNumber}
                availableOrders={availableOrders}
                onOrderSelect={onOrderChange}
                isOrderLinked={task.isOrderLinked}
              />
            </div>
          )}
        </div>
        <button
          onClick={onDetailClick}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0052cc] text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0 whitespace-nowrap"
        >
          <Eye size={12} />
          상세보기
        </button>
      </div>
    </div>
  );
};

interface StatusColumnProps {
  status: TaskStatus;
  tasks: Task[];
  expandedTasks: Set<string>;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDetailClick: (task: Task) => void;
  onToggleTaskView: (taskId: string) => void;
  availableOrders?: OrderInfo[];
  onTaskOrderChange?: (taskId: string, orderNumber: string | undefined) => void;
}

const StatusColumn = ({ 
  status, 
  tasks, 
  expandedTasks, 
  onTaskStatusChange, 
  onTaskDetailClick, 
  onToggleTaskView,
  availableOrders,
  onTaskOrderChange
}: StatusColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const statusInfo = TASK_STATUSES[status];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onTaskStatusChange(taskId, status);
    }
  };

  return (
    <div 
      className={`flex-shrink-0 w-72 transition-colors ${
        isDragOver ? 'bg-blue-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: statusInfo.color }} />
        <h4 className="text-sm font-medium text-gray-900 whitespace-nowrap">{statusInfo.title}</h4>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {tasks.map(task => {
          const isExpanded = expandedTasks.has(task.id);
          const viewMode = isExpanded ? 'detailed' : expandedTasks.has(`${task.id}-summary`) ? 'summary' : 'simple';
          
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', task.id);
              }}
              className="cursor-move"
            >
              <TaskItem
                task={task}
                viewMode={viewMode}
                onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
                onDetailClick={() => onTaskDetailClick(task)}
                onToggleView={() => onToggleTaskView(task.id)}
                availableOrders={availableOrders}
                onOrderChange={(orderNumber) => onTaskOrderChange?.(task.id, orderNumber)}
              />
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-xs whitespace-nowrap">
            할일이 없습니다
          </div>
        )}
      </div>
    </div>
  );
};

export const SectionKanban = ({ section, tasks, onTaskStatusChange, onTaskDetailClick, availableOrders, onTaskOrderChange }: SectionKanbanProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const handleToggleTaskView = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      const summaryKey = `${taskId}-summary`;
      
      if (newSet.has(taskId)) {
        // detailed → simple
        newSet.delete(taskId);
        newSet.delete(summaryKey);
      } else if (newSet.has(summaryKey)) {
        // summary → detailed
        newSet.delete(summaryKey);
        newSet.add(taskId);
      } else {
        // simple → summary
        newSet.add(summaryKey);
      }
      
      return newSet;
    });
  };

  // 상태별로 태스크 그룹화
  const tasksByStatus = Object.keys(TASK_STATUSES).reduce((acc, status) => {
    acc[status as TaskStatus] = tasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{WORK_SECTIONS[section]}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            총 {tasks.length}개
          </span>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {Object.entries(TASK_STATUSES).map(([status, _]) => (
          <StatusColumn
            key={status}
            status={status as TaskStatus}
            tasks={tasksByStatus[status as TaskStatus] || []}
            expandedTasks={expandedTasks}
            onTaskStatusChange={onTaskStatusChange}
            onTaskDetailClick={onTaskDetailClick}
            onToggleTaskView={handleToggleTaskView}
            availableOrders={availableOrders}
            onTaskOrderChange={onTaskOrderChange}
          />
        ))}
      </div>
    </div>
  );
};
