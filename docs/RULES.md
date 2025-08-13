## RULES – 엔지니어링/운영 규칙

본 문서는 모듈형 챗봇 상담 서비스의 일관된 개발·운영을 위한 규칙을 정의합니다. 모든 신규 작업(PR)은 본 규칙을 준수해야 합니다.

### 제품/아키텍처 원칙
- 프론트엔드: Next.js(App Router) + TypeScript + TailwindCSS + Zustand
- 백엔드/DB: Supabase(PostgreSQL, RLS 활성), 비로그인 사용자의 쓰기는 Edge Functions 통해서만 허용
- 인증: Supabase Auth(어드민/에이전트만 로그인)
- 알림: SendGrid 이메일 + Slack Webhook
- 배포: Vercel. 프리뷰→프로덕션 승인 흐름 유지

### 데이터 보안/프라이버시
- `inquiries` 테이블은 클라이언트에서 직접 쓰기 금지. 모든 생성/업데이트는 Edge Function(서비스 롤)으로 수행
- 서비스 롤 키는 클라이언트에 노출 금지. Edge Functions 시크릿에만 저장
- 최소한의 개인정보만 수집(이름, 연락처). 불필요한 IP/UA 저장 금지
- RLS 정책을 항상 활성화하고, 어드민 권한 체크는 `profiles.role`로 수행

### 브랜치/커밋/PR 규칙
- 브랜치: `feat/<ticket-id>-<slug>`, `fix/...`, `chore/...`
- 커밋 메시지: `type(scope): summary`
  - type: feat | fix | chore | docs | refactor | test | ci
- PR 조건: 1인 이상 리뷰 승인, CI(lint/test) 통과, 템플릿 체크리스트 충족
- 머지 전략: Squash & merge 권장. 릴리즈 노트는 기능 단위로 요약

### 이슈/티켓 규칙
- 담당자: 기본 `TKAY`
- 우선순위 라벨: High | Medium | Low
- 상태: TODO → In Progress → Review/QA → Done
- 수락 기준(AC) 명시: 사용자/어드민 관점의 동작 기준 포함

### 환경 변수/시크릿
- `.env.example`에 키 목록과 간단 설명 추가
- 실제 키: 로컬 `.env.local`, Vercel Project Env, Supabase Function Secrets에만 보관
- PR에 시크릿/토큰/키 절대 포함 금지

### UI/UX 규칙(핵심)
- 모든 인터랙션은 좌측 질문/우측 사용자 응답 말풍선 형식
- A2 다중 선택은 선택 순서대로 1,2,3 랭킹 표기, 해제 시 순번 당김
- A6 날짜는 기본(KST) 기준 1주일 뒤 preselect
- A9 시간대는 "[00:00]부터 [00:00]사이" 플레이스홀더 및 직접 입력 허용
- 반응형 우선. 명확한 포커스 스타일과 키보드 접근성 유지

### 코드 스타일/품질
- TypeScript로 작성, 명시적 함수 시그니처, 의미 있는 이름 사용
- 주석은 필요 최소한으로 "왜"를 설명
- ESLint/Prettier 일관 적용. 테스트는 유닛/통합/E2E로 분리
- 에러 핸들링은 사용자 메시지/로깅 분리. 빈 `catch` 금지

### 배포/운영
- 메인 브랜치 머지 시 Vercel Preview → 수동 Promote로 Production 반영
- Supabase 스키마 변경은 마이그레이션 파일로 기록(`supabase/schema.sql`)
- 장애/알림 채널: Slack `#inbound-inquiries`

### 변경 승인 기준(샘플)
- 사용자 플로우(Q1→Q9) 정상 동작, 새로고침 복원, 최종 완료 후 세션 종료
- 어드민 리스트/상세 조회, 상태 변경, 담당자 지정 가능
- 신규 접수 시 이메일/Slack 알림 수신

