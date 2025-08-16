"use client";
import { useState } from 'react';
import { Task, TaskMemo, TASK_STATUSES, WORK_SECTIONS } from '../../types/tasks';
import { X, Calendar, User, Flag, Clock, MessageSquare, Plus, Edit3, Package } from 'lucide-react';
import { OrderDetailPanel } from './OrderDetailPanel';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate?: (task: Task) => void;
}

export const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdate }: TaskDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memos' | 'details'>('overview');
  const [newMemo, setNewMemo] = useState('');
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  if (!isOpen || !task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
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

  const handleAddMemo = () => {
    if (!newMemo.trim()) return;

    const memo: TaskMemo = {
      id: `memo-${Date.now()}`,
      author: '현재 사용자', // 실제로는 로그인한 사용자 정보 사용
      content: newMemo.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedTask = {
      ...task,
      memos: [...task.memos, memo],
      updatedAt: new Date().toISOString()
    };

    onTaskUpdate?.(updatedTask);
    setNewMemo('');
  };

  const renderSectionDetails = () => {
    if (!task.sectionDetails) return null;

    const details = task.sectionDetails;
    const section = task.section;

    switch (section) {
      case 'inbound':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">문의 유형</label>
                <p className="text-sm text-gray-900">{details.inquiryType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">고객명</label>
                <p className="text-sm text-gray-900">{details.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">연락처</label>
                <p className="text-sm text-gray-900">{details.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">희망 연락시간</label>
                <p className="text-sm text-gray-900">{details.preferredContactTime}</p>
              </div>
            </div>
          </div>
        );
      
      case 'sales':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">리드 스코어</label>
                <p className="text-sm text-gray-900">{details.leadScore}점</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예상 수주액</label>
                <p className="text-sm text-gray-900">{details.estimatedValue?.toLocaleString()}원</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">최종 연락일</label>
                <p className="text-sm text-gray-900">{details.lastContactDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">다음 팔로업</label>
                <p className="text-sm text-gray-900">{details.nextFollowUp}</p>
              </div>
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">캠페인</label>
                <p className="text-sm text-gray-900">{details.campaign}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">타겟 고객</label>
                <p className="text-sm text-gray-900">{details.targetAudience}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예산</label>
                <p className="text-sm text-gray-900">{details.budget?.toLocaleString()}원</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예상 ROI</label>
                <p className="text-sm text-gray-900">{details.expectedROI}%</p>
              </div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">디자인 타입</label>
                <p className="text-sm text-gray-900">{details.designType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">컬러 스킴</label>
                <p className="text-sm text-gray-900">{details.colorScheme}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정 횟수</label>
                <p className="text-sm text-gray-900">{details.revisionCount}회</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">고객 승인</label>
                <p className="text-sm text-gray-900">{details.clientApproval ? '승인됨' : '대기중'}</p>
              </div>
            </div>
          </div>
        );

      case 'procurement':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">공급업체</label>
                <p className="text-sm text-gray-900">{details.supplier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수량</label>
                <p className="text-sm text-gray-900">{details.quantity}개</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">단가</label>
                <p className="text-sm text-gray-900">{details.unitPrice?.toLocaleString()}원</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">납기일</label>
                <p className="text-sm text-gray-900">{details.deliveryDate}</p>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">결제 방법</label>
                <p className="text-sm text-gray-900">{details.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">금액</label>
                <p className="text-sm text-gray-900">{details.amount?.toLocaleString()}원</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">결제 상태</label>
                <p className="text-sm text-gray-900">{details.paymentStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">인보이스 번호</label>
                <p className="text-sm text-gray-900">{details.invoiceNumber}</p>
              </div>
            </div>
          </div>
        );

      case 'production':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">생산라인</label>
                <p className="text-sm text-gray-900">{details.productionLine}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">품질검사</label>
                <p className="text-sm text-gray-900">{details.qualityCheck ? '통과' : '검사중'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">완성률</label>
                <p className="text-sm text-gray-900">{details.completionRate}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">완료 예정일</label>
                <p className="text-sm text-gray-900">{details.expectedCompletion}</p>
              </div>
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">택배사</label>
                <p className="text-sm text-gray-900">{details.shippingCompany}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">송장번호</label>
                <p className="text-sm text-gray-900">{details.trackingNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">배송지</label>
                <p className="text-sm text-gray-900">{details.shippingAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">배송 유형</label>
                <p className="text-sm text-gray-900">{details.deliveryType}</p>
              </div>
            </div>
          </div>
        );

      case 'design_general':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">디자인 타입</label>
                <p className="text-sm text-gray-900">{details.designType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">클라이언트</label>
                <p className="text-sm text-gray-900">{details.clientType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">진행 단계</label>
                <p className="text-sm text-gray-900">{details.designStage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">마감일</label>
                <p className="text-sm text-gray-900">{details.deadline}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-mono">{task.taskNumber}</span>
                {task.orderNumber && (
                  <button
                    onClick={() => setIsOrderDetailOpen(true)}
                    className="flex items-center gap-1 text-[#0052cc] hover:text-blue-700 transition-colors"
                  >
                    <Package size={14} />
                    주문번호: {task.orderNumber}
                  </button>
                )}
                <span className="px-2 py-1 rounded-full text-xs" style={{ 
                  backgroundColor: TASK_STATUSES[task.status].color, 
                  color: 'white' 
                }}>
                  {TASK_STATUSES[task.status].title}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: '개요', icon: Flag },
              { id: 'memos', label: '업무메모', icon: MessageSquare },
              { id: 'details', label: '세부정보', icon: Edit3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#0052cc] text-[#0052cc]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">업무 섹션</label>
                    <p className="text-gray-900">{WORK_SECTIONS[task.section]}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">담당자</label>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <p className="text-gray-900">{task.assignee}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">우선순위</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  </div>
                  {task.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">마감일</label>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="text-gray-900">{task.dueDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 설명 */}
                {task.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">상세 설명</label>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-xl">{task.description}</p>
                  </div>
                )}

                {/* 날짜 정보 */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">생성일</label>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <p className="text-gray-600">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">수정일</label>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <p className="text-gray-600">{formatDate(task.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'memos' && (
              <div className="space-y-4">
                {/* 새 메모 추가 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">새 메모 추가</label>
                  <div className="flex gap-2">
                    <textarea
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      placeholder="업무 메모를 입력하세요..."
                      className="flex-1 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
                      rows={3}
                    />
                    <button
                      onClick={handleAddMemo}
                      className="px-4 py-2 bg-[#0052cc] text-white rounded-xl hover:bg-blue-700 transition-colors self-start"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* 기존 메모 목록 */}
                <div className="space-y-3">
                  {task.memos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">아직 메모가 없습니다.</p>
                  ) : (
                    task.memos.map((memo) => (
                      <div key={memo.id} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{memo.author}</span>
                          <span className="text-sm text-gray-500">{formatDate(memo.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{memo.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {WORK_SECTIONS[task.section]} 세부정보
                </h3>
                {renderSectionDetails()}
              </div>
            )}
          </div>

          {/* 주문 상세보기 패널 */}
          {task.orderNumber && (
            <OrderDetailPanel
              orderNumber={task.orderNumber}
              isOpen={isOrderDetailOpen}
              onClose={() => setIsOrderDetailOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
