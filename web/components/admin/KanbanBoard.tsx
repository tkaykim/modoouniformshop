"use client";
import { useState } from 'react';
import { Task, TaskStatus, KanbanColumn, TASK_STATUSES } from '../../types/tasks';
import { Clock, User, Calendar, AlertCircle, Flag } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (newStatus: TaskStatus) => void;
  onClick: () => void;
}

const TaskCard = ({ task, onStatusChange, onClick }: TaskCardProps) => {
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

  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
      }}
    >
      {/* 제목과 우선순위 */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority === 'urgent' ? '긴급' : task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
        </span>
      </div>

      {/* 업무번호 */}
      <div className="text-xs text-gray-500 mb-3 font-mono">
        {task.taskNumber}
        {task.orderNumber && (
          <span className="ml-2 text-[#0052cc]">• {task.orderNumber}</span>
        )}
      </div>

      {/* 담당자 */}
      <div className="flex items-center gap-2 mb-2">
        <User size={14} className="text-gray-400" />
        <span className="text-sm text-gray-700">{task.assignee}</span>
      </div>

      {/* 마감일 */}
      {task.dueDate && dueDateStatus && (
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-gray-400" />
          <span className={`text-sm ${dueDateStatus.color}`}>
            {dueDateStatus.text}
          </span>
        </div>
      )}

      {/* 메모 개수 */}
      {task.memos.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <AlertCircle size={12} />
          <span>메모 {task.memos.length}개</span>
        </div>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  column: KanbanColumn;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

const KanbanColumn = ({ column, onTaskStatusChange, onTaskClick }: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
      onTaskStatusChange(taskId, column.id);
    }
  };

  return (
    <div 
      className={`rounded-2xl bg-white shadow-sm flex flex-col min-h-[600px] transition-colors ${
        isDragOver ? 'bg-blue-50 border-2 border-blue-200' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 컬럼 헤더 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-medium text-gray-900">{column.title}</h3>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
      </div>

      {/* 태스크 리스트 */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {column.tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            할일이 없습니다.
          </div>
        ) : (
          column.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const KanbanBoard = ({ tasks, onTaskStatusChange, onTaskClick }: KanbanBoardProps) => {
  // 상태별로 태스크 그룹화
  const columns: KanbanColumn[] = Object.entries(TASK_STATUSES).map(([status, config]) => ({
    id: status as TaskStatus,
    title: config.title,
    color: config.color,
    tasks: tasks.filter(task => task.status === status)
  }));

  return (
    <div className="w-full">
      {/* 칸반보드 그리드 - 6개 컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6 overflow-x-auto">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTaskStatusChange={onTaskStatusChange}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};
