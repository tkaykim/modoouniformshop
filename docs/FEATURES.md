모두의 유니폼 — 구현 기능 총정리

### 우리가 제공하는 서비스(한눈에)
- 단체복/소량 굿즈 제작을 원하는 고객이 빠르게 상담을 접수하고, 담당자가 효율적으로 후속 대응할 수 있도록 하는 “상담 접수 → 리뷰 신뢰 확보 → Admin 운영” 일련의 흐름을 제공합니다.
- 핵심 가치
  - 고객: 간단한 대화형 설문으로 원하는 제작 스펙과 연락처를 남기면, 전문 담당자가 곧바로 연락하는 빠른 컨시어지 경험
  - 운영: 문의를 실시간으로 수집/정리하고, 역할별 권한(admin/agent)로 배정·상태·메모를 관리, 리뷰는 작성/수정/노출 관리
  - 신뢰: 실제 고객 리뷰 리스트/미리보기 컴포넌트로 사회적 증거를 전면에 배치하여 전환율을 높임

### 공개 웹(고객용)
- 홈 페이지(`web/app/page.tsx`)
  - 히어로 섹션 이미지 최적화(`next/image`) 및 반응형 사이즈 처리
  - 최근 리뷰 미리보기(`ReviewsPreview`) 섹션과 FAQ 아코디언(`FAQSection`)
  - 상담 플로우 진입 버튼(뷰포트 교차 감지로 플로팅 노출 제어)
  - 하단 고정 외부 링크 버튼(공식 홈페이지 이동)

- 리뷰 목록(`web/app/review/page.tsx`)
  - Supabase `reviews` 테이블에서 최신순 목록 로드
  - 썸네일/본문 이미지는 `next/image`로 LCP/대역폭 최적화, Blur placeholder 적용
  - 카드 클릭 시 모달 뷰로 상세 열람, 좌/우 키 및 버튼으로 이전/다음 탐색
  - 중복 조회 방지 메모리셋을 사용해 1세션 1뷰 카운팅, RPC 실패 시 API 라우트로 폴백

- 리뷰 상세(`web/app/review/[id]/page.tsx`)
  - 각 리뷰의 개별 페이지(모달 외 직접 접근용, SEO 보조)

### 상담 챗 플로우(고객 설문)
- 컨테이너(`web/components/chat/ChatContainer.tsx`)
  - 단계형 설문 UI: 현재 스텝은 화면 중앙에 고정, 이전 스텝은 위 영역에 축약 표시
  - `ResizeObserver`/`MutationObserver`를 활용해 콘텐츠 변화 시 자동 중앙 정렬 스크롤
  - 진행 스텝 활성 목록: [1, 2, 3, 8] (기타 스텝은 보존/향후 확장)

- 전역 상태(`web/store/chatStore.ts`)
  - `zustand`로 세션/스텝/응답/더티 플래그/포커스 관리
  - 세션 ID 로컬 저장 및 `answers` 로컬스토리지 복원
  - `setAnswer(step, payload, { optimistic })`로 낙관적 저장, Supabase Function/로컬 API에 업서트
  - `finalizeInquiry(sessionId)`로 접수 완료 처리 및 UI 초기화

- 검증(`web/lib/validators.ts`)
  - 각 스텝 입력을 `zod` 스키마로 런타임 검증

- 스텝 구성(`web/components/chat/steps/*`)
  - Step1: 문의 종류 선택(단체복/커스텀 소량 굿즈)
  - Step2: 우선순위 3개 선택(선택 순서에 따라 1~3 순위 배지 자동 부여)
  - Step3: 제작 품목 다중 선택 + 직접입력 옵션
  - Step4~7: 스펙/수량/일정/출처(컴포넌트 존재, 현재 플로우 비활성)
  - Step8: 성함/연락처 + 개인정보 수집 동의, 제출 시 접수 완료 모달 표시 및 자동 초기화
  - Step9: 상담 희망 시간대(선택적), 제출 시 finalize 처리

### Admin — 문의/리뷰 운영
- 로그인/세션
  - Supabase Auth 사용, `get_me` RPC로 `display_name`/역할(admin/agent) 획득

- 문의 대시보드(`web/app/admin/page.tsx`)
  - 역할별 접근: admin은 전체, agent는 미배정/본인 배정 문의만
  - KPI 위젯: 총 문의/미답변/담당자 미지정/내 대기중
  - 담당자별 집계표 및 ‘지금 답변해야 할 문의’(new 최근 8건)
  - 문의 테이블: 상태 드롭다운, 이름/연락처/종류/수량/담당자/구분, 행 펼치기/접기, 수정/삭제
  - 다중 선택 삭제(관리자), 수동 생성 패널(세션 ID 자동 생성)

- 리뷰 관리(`web/app/admin/reviews/page.tsx`)
  - 리뷰 작성: 별점/작성자명/제목/내용/이미지(최대 3장)/표시 시각
  - Supabase Storage 업로드 후 퍼블릭 URL 저장
  - 목록 조회·수정(제목/별점/조회수/작성자)·삭제, 상세 보기(이미지/본문)
  - 본문은 목록 뷰에서 읽기 전용 표시로 안전성 유지

- 데모 대시보드(`web/app/admin/demo/page.tsx`)
  - 판매/지출/업무/필드영업/콘텐츠/칸반 등 경영 보드 데모 데이터 시각화
  - `recharts` 기반 라인/막대/도넛/레이더 등 다양한 카드 구성(운영 데이터와 분리)

### API/백엔드 연동
- 클라이언트 API 래퍼(`web/lib/api.ts`)
  - `upsertInquiryStep`: Supabase Edge Function 또는 로컬 API 라우트로 단계별 응답 저장
  - `finalizeInquiry`: 접수 상태로 전환

- 로컬 API 라우트(`web/app/api/*`)
  - `upsert-inquiry-step`: `session_id` 기준 신규/갱신 업서트, `last_step_completed` 갱신
  - `finalize-inquiry`: 접수 상태 업데이트(`awaiting_reply`)
  - `reviews/increment-view`: 조회수 1 증가(Edge Function/RPC 실패 시 폴백)

### 공통 라이브러리/유틸
- `web/lib/logger.ts`: 콘솔 기반 경량 로거(`logger.event` 포함)
- `web/lib/time.ts`: KST 변환/포맷 유틸
- `web/lib/img.ts`: `next/image`용 shimmer placeholder
- `web/lib/toast.ts`: 간단 토스트 메시지 헬퍼

### 접근성/성능
- 라이트 모드 고정, 명확한 대비, 키보드 내비게이션(리뷰 모달 좌/우/Esc)
- `next/image`와 지연 로딩으로 이미지 성능 최적화, 리스트 LCP 개선
- 낙관적 업데이트와 점진적 폴백으로 느린 네트워크에서도 일관된 UX

### 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버 전용: `SUPABASE_SERVICE_ROLE_KEY` (로컬 API 경로 사용 시 필요)

### 향후 확장 포인트
- 상담 스텝 4~7 활성화 및 유효성·저장 로직 연결
- 데모 대시보드의 일부 카드 운영 데이터와 연계(별도 네임스페이스 유지)
- 리뷰 검색/필터링 및 정렬 고도화, 이미지 최적화 규칙 추가

