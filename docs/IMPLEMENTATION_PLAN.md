## 구현 계획(Implementation Plan)

### 스택/배포
- Next.js(App Router) + TypeScript + Tailwind + Zustand
- Supabase(PostgreSQL, RLS, Edge Functions)
- Supabase Auth(어드민/에이전트)
- SendGrid + Slack Webhook, Vercel 배포

### 데이터 모델 핵심
- `inquiries`: 세션 기반 단일 Row에 답변 누적, 단계(`last_step_completed`) 추적, 상태/담당자 관리
- `inquiry_events`: 상태/담당자/메모 변경 이력
- `profiles`: 어드민/에이전트 권한

### 주요 테이블 필드
- 세션/추적: `session_id`, `utm`, `source_channel`
- 답변: `inquiry_kind`, `priorities(jsonb)`, `items(text[])`, `item_custom`, `quantity`, `design`, `needed_date`, `heard_about`, `name`, `contact`, `preferred_time_start/end`
- 운영: `last_step_completed`, `status`, `assignee`, `admin_notes`

### RLS/보안
- `inquiries`는 퍼블릭 직접 접근 금지. Edge Functions로만 생성/갱신
- 인증 사용자(어드민/에이전트)만 전체 조회/수정 가능

### Edge Functions
1) `upsert_inquiry_step`: 세션별 Row 생성/업데이트, 단계 반영, 완료 시 알림 트리거
2) `finalize_inquiry`: 상담 완료 전환(`awaiting_reply`)
3) `admin_update_status`: 상태 변경 + 이력 기록(인증 필요)
4) `admin_assign_agent`: 담당자 지정 + 이력 기록(인증 필요)

### API 계약(요약)
- POST `/functions/v1/upsert_inquiry_step` → `{ session_id, step, payload, utm? }`
- POST `/functions/v1/finalize_inquiry` → `{ session_id }`
- POST `/functions/v1/admin_update_status` → `{ inquiry_id, status }`
- POST `/functions/v1/admin_assign_agent` → `{ inquiry_id, assignee }`

### 프론트 구조
```
app/
  page.tsx                # 챗봇 진입
  admin/
    login/page.tsx
    inquiries/page.tsx
    inquiries/[id]/page.tsx
components/chat/steps/    # Q1~Q9
lib/ (supabaseClient, api, validators, time, analytics)
store/chatStore.ts        # 세션/답변/단계 관리
```

### 환경 변수(.env.example)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`(Functions), `SENDGRID_API_KEY`, `SLACK_WEBHOOK_URL`
- `NOTIFY_EMAIL_TO`, `NEXT_PUBLIC_GA4_ID`, `TZ=Asia/Seoul`

### 마일스톤/수락 기준
- Week 1: 베이스 세팅, 스키마/함수 스텁, Q1~Q3
- Week 2: Q4~Q9, 세션 저장/복원, 제출 완료
- Week 3: 어드민 리스트/상세/상태/담당자, 알림
- Week 4: E2E/접근성/배포
- AC: Q1 이후 새로고침 복원, 관리자가 실시간 진행 확인, 신규 접수 알림 수신

### 초기 세팅 명령
```
npx create-next-app@latest modoouniformshop --ts --eslint --tailwind --app --src-dir=false --import-alias "@/*"
cd modoouniformshop
npm i zustand zod react-hook-form react-datepicker date-fns date-fns-tz @supabase/supabase-js
npm i -D supabase
npx supabase init
```

