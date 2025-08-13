## TODO – 구현 체크리스트(담당: TKAY)

### Week 1 – 베이스 세팅
- [ ] 1-1 디자인 시안·컴포넌트 가이드 확정 (High, 1d)
- [ ] 1-2 Supabase 프로젝트 생성 & DB 스키마 적용 (High, 2d)
  - [ ] `supabase/schema.sql` 실행 및 RLS/정책 확인
  - [ ] Edge Functions 스텁 배포: `upsert_inquiry_step`, `finalize_inquiry`
- [ ] 1-3 Next.js + TS + Tailwind 초기 세팅 / ESLint·Prettier (High, 1d)
- [ ] 1-4 환경 변수 템플릿 작성(.env.example) & Vercel/Supabase 시크릿 세팅 (High, 0.5d)
- [ ] 1-5 프로젝트 보드/라벨/자동화 규칙 반영 (High, 0.5d)

### Week 2 – 사용자 챗봇 플로우
- [ ] 2-1 챗 UI 레이아웃 & 말풍선 컴포넌트 (High, 2d)
- [ ] 2-2 질문 스텝 상태관리(Zustand) + 진행률바 (High, 1d)
- [ ] 2-3 날짜 선택(KST 기본 1주 뒤) (Medium, 0.5d)
- [ ] 2-4 세션 자동 저장(LocalStorage) & 복원 (High, 0.5d)
- [ ] 2-5 제출 API(Edge Functions) 연결 & 에러 처리 (High, 1d)
  - [ ] 프론트에서 Functions 엔드포인트 연결(`/functions/v1/...`)
  - [ ] 네트워크 오류 큐잉/재시도 로직

### Week 3 – 어드민 & 알림
- [ ] 3-1 어드민 로그인(Supabase Auth) & 권한가드 (High, 1d)
- [ ] 3-2 문의 리스트(필터/검색) (High, 1d)
- [ ] 3-3 상세·상태 업데이트·담당자 지정 (High, 1d)
- [ ] 3-4 이메일 알림(SendGrid) 트리거 (Medium, 0.5d)
- [ ] 3-5 Slack Webhook 통합 (Medium, 0.5d)

### Week 4 – 통합·QA·배포
- [ ] 4-1 E2E 테스트(Playwright) 작성 (Medium, 1d)
- [ ] 4-2 반응형·접근성(Lighthouse 90+) (Medium, 0.5d)
- [ ] 4-3 Vercel Preview → Production Promote (High, 0.5d)
- [ ] 4-4 Supabase DB 백업·롤백 전략 문서화 (Low, 0.5d)
- [ ] 4-5 광고 UTM 기록 & GA4 대시보드 셋업 (Low, 0.5d)

### Acceptance Criteria(요약)
- [ ] Q1 답변 후 새로고침해도 진행 상태/답변 복원
- [ ] 최종 제출 시 완료 메시지 및 새 세션으로 초기화
- [ ] 어드민에서 진행 상황/상태/담당자 확인·변경 가능
- [ ] 신규 접수 시 이메일/Slack 알림 수신

