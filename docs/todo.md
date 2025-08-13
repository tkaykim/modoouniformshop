PROJECT_TODO.md — 모두의 유니폼 대시보드(프론트 설계 & 더미데이터 운영)
0. 실행 목표(OKR 스타일)
O1. 단일 대시보드에서 영업·운영 상태를 즉시 파악

KR1. 주/월/사용자지정 기간별 매출·지출·순이익 카드/차트 제공

KR2. 담당자/채널 단위 분해(Group by)로 비교가 3클릭 이내

O2. 업무 몰입과 동기부여 강화를 위한 매니저 센터 제공

KR3. 개인 목표·진척도·Streak·리더보드 UI 제공

KR4. Next Best Action(우선순위 추천) 카드 노출

O3. “지금은 UI 먼저, 나중에 데이터 바인딩”을 원칙으로 구현

KR5. 모든 화면은 더미데이터로 동작(“(dummy)” 접미·isDummy 플래그)

KR6. Admin에서 더미 일괄 삭제 → 실제 스키마 연결이 1시간 내 가능하도록 구조화

1. 브랜드 & 테마 가이드
Primary: #0052cc (모든 주요 CTA/강조, 헤더 라인, 링크 포커스)

Accent: #00c2ff / Success: #12b76a / Warning: #f79009 / Danger: #ef4444

로고/타이포: 좌측 상단 모두의 유니폼 로고타이프, KPI 숫자는 세미-모노 계열 폰트

접근성: 명도 대비 4.5:1 이상, 포커스 링, 키보드 탐색 전면 지원

다크/라이트 테마: shadcn/ui 토큰 기반 자동 전환(차트 대비 체크)

2. 전역 UX 원칙
전역 필터 바(모든 탭 공통):

기간: 최근 7일 / 최근 30일 / 사용자 지정(시작~종료)

보기 기준: 전체 / 담당자별 / 채널별(카카오채널, 쓰레드, 인스타그램, 유튜브, 네이버블로그, 외부영업, 인바운드 등)

비교 보기: 전주 대비 / 전월 대비 / 전년 동기 대비

Demo 모드 토글: 켜면 모든 더미 레코드에 (dummy) 배지 표시

카드-테이블-드로어 흐름:
KPI 카드 클릭 → 해당 조건 프리셋 적용된 리스트/칸반으로 드릴다운 → 행 클릭 시 오른쪽 드로어로 상세 확인

속도 체감: 스켈레톤/빈 상태(Empty) 명확화, 주요 액션은 2~3 클릭 이내

3. 정보 구조(페이지 & 목적)
Overview(개요)

KPI: 주간 매출, 월간 매출, 월간 순이익, 채널별 인입 비중, 카테고리별 할 일 진행률, 지출 변화

차트: 매출·지출·순이익 3중 라인, P&L 워터폴, 그룹별 스몰멀티(담당자/채널)

Sales(매출)

건별 입력 모달(UI만), 리스트/집계(기간·담당자·채널 필터), Top 채널/담당자 카드

Expenses(지출)

건별 입력 모달(UI만), 항목(광고비/영업비/원가-발주/원가-인쇄/배송/기타) 분해 도넛/막대, Budget vs Actual(목업)

P&L Explorer(손익 익스플로러)

기간·그룹·비교 컨트롤 → 순이익 게이지/마진율/워터폴/그룹별 순이익

Inquiries(문의)

테이블(채널/상태/담당자/기간), Inquiry Drawer(요약/UTM/희망통화시간), Event Timeline

Activity(활동/일정)

타임라인(최근 이벤트), 캘린더(희망 통화 시간대·미팅 블럭)

Channel Insights(채널 인사이트)

계정 스위처(카카오/인스타/쓰레드/유튜브/네이버블로그), KPI/콘텐츠 Top10, CSV 업로드(목업)

Reviews(후기)

카드 그리드(평점/제목/작성자/노출일/조회수), 정렬, 드로어 상세

Manager Center(매니저 센터)

개인 대시보드: 목표·진척도 링, Streak, 개인 매출/순이익 추이(7/30/커스텀), Next Best Action

리더보드: 매출/순이익/전환율 종합 점수 랭킹, 배지(Top Closer 등)

Admin(관리/Demo)

더미 생성/삭제, 상태/배지 컬러 맵, 권한별 UI 가시성 토글

4. 컴포넌트 명세(Props 키만 정의, 코드 없음)
GlobalFilterBar { period, groupBy, compare, demoMode, onChange }

KPICard { title, value, deltaLabel? }

LineCard { title, seriesMeta[], period }

DonutCard { title, segments[] }

WaterfallCard { title, steps[] }

LeagueTable { rows[], metric }

SalesTable { rows[], filters } / ExpenseTable { rows[], filters }

FormModal { fields[], mode: 'sales'|'expenses', isDemo }

InquiryTable { rows[], filters }

InquiryDrawer { inquiry, open, onOpenChange }

EventTimeline { events[] }

CalendarView { events[], view, onRangeChange }

CSVUploadDialog { open, onOpenChange }

EmptyState { title, description, cta? }

Skeleton(카드/테이블/드로어/차트 공용)

DemoToolbar { onGenerate, onDeleteAll, info }

5. 더미데이터 운영 정책
표기 원칙: 제목/메모 등 문자열 끝에 “ (dummy)” 접미 + 내부 플래그 isDummy: true

Demo 모드: 헤더 토글 스위치 / 모든 더미에 (dummy) 배지 / 워터마크

샘플 기간 생성: 지난 90일 기준 매출·지출·문의·할 일·이벤트 난수 생성(분포는 실제와 유사하게)

일괄 삭제: Admin > Demo에서 isDummy=true 또는 문자열에 (dummy) 포함 조건으로 삭제

CSV 템플릿(키만):

sales.csv: date, group_name, channel, owner, amount, memo, isDummy

expenses.csv: date, category, channel, order_ref, amount, memo, isDummy

targets.csv: period, owner, target_revenue, target_profit, isDummy

6. 지표 산식(목업 기준)
순이익 = 매출합계 − (원가-발주 + 원가-인쇄 + 영업비 + 광고비 + 배송 + 기타)

마진율 = 순이익 ÷ 매출합계

그룹 보기: group by owner / channel

비교 보기: 기준 기간 대비 증감(%, ▲/▼ 배지)

퍼널(문의): new → contacted → quoted → won/lost(현 단계는 시각화용 목업 값)

7. 기술 스택(디자인 중심)
Next.js 14(App Router), Tailwind, shadcn/ui(Radix), lucide-react

테이블: TanStack Table

차트: Recharts(초기) → ECharts(확장 대비)

캘린더: FullCalendar

상태(디자인 단계): Zustand(필터/토글/UI 상태 전용)

날짜: date-fns(ko 로케일)

8. 폴더 구조(문서·컴포넌트 단위)
bash
복사
편집
app/(dashboard)/layout
app/(dashboard)/overview/page
app/(dashboard)/sales/page
app/(dashboard)/expenses/page
app/(dashboard)/pnl/page
app/(dashboard)/inquiries/page
app/(dashboard)/activity/page
app/(dashboard)/insights/page
app/(dashboard)/reviews/page
app/(dashboard)/manager/page
app/(dashboard)/admin/page

components/dashboard/*
lib/ui/* (color tokens, chart config)
lib/adapters/* (후일 API 응답 → UI 변환 인터페이스만)
9. 단계별 TODO 체크리스트(실행 순서)
PHASE 1 — 레이아웃 & 전역 필터 (브랜드 적용)
 헤더/사이드바/콘텐츠 영역 3분할, #0052cc 적용

 GlobalFilterBar 배치(기간/그룹/비교/Demo)

 전역 필터 상태를 URL 쿼리와 동기화(공유 가능)

 스켈레톤/빈 상태 패턴 공통 정의

 접근성(포커스 링, 키보드 탐색) 점검

PHASE 2 — Overview(개요) 화면
 KPI 6카드 배치(주간·월간 매출, 월간 순이익, 채널 비중, 할 일 진행률, 지출 변화)

 매출·지출·순이익 3중 라인 시안(필터 반응형, 목업)

 P&L 워터폴 시안(목업 steps)

 그룹 보기(담당자/채널) 시 스몰멀티/스택 변환 규칙 적용

 카드 클릭 → 관련 탭 이동(필터 프리셋 유지) 네비게이션

PHASE 3 — Sales & Expenses(입력/리스트) + CSV 목업
 FormModal(매출/지출 공용) UI — 필드/검증 표시만, 동작 없음

 SalesTable/ExpenseTable: 집계행, 정렬/필터, 컬럼 토글

 Donut/Bar(지출 항목), Top 채널/담당자 카드

 CSVUploadDialog(템플릿 안내 + 업로드 버튼만)

PHASE 4 — P&L Explorer
 컨트롤 패널(기간/그룹/비교)

 순이익 게이지/마진율 카드

 워터폴 + 그룹별 스몰멀티

 목표 대비(Targets) 자리만 마련(목업)

PHASE 5 — Inquiries & Activity
 InquiryTable: 컬럼(생성일/채널/종류/필요일/상태/담당/최근 이벤트)

 InquiryDrawer: 요약/UTM/희망통화시간 탭

 EventTimeline: 타입 아이콘+타임스탬프+메모

 Activity: 타임라인 & FullCalendar(희망 통화 시간 블럭)

PHASE 6 — Channel Insights & Reviews
 계정 스위처(카카오/인스타/쓰레드/유튜브/네이버블로그)

 KPI/콘텐츠 Top10(목업), CSV 업로드 버튼

 Reviews 카드 그리드/정렬/드로어

PHASE 7 — Manager Center(동기부여)
 개인 대시보드: 목표/진척도 링, Streak, 개인 추이 그래프

 Next Best Action 카드(규칙 기반 목업: 마감 임박·고액·최근 접촉 없음)

 리더보드(매출/순이익/전환율 종합 점수 랭킹, 배지)

PHASE 8 — Admin(Demo & Handoff)
 DemoToolbar(90일 더미 생성/일괄 삭제 UI)

 상태/배지 컬러 맵, 권한별 UI 가시성 토글

 Handoff 문서: 실제 스키마 연결 가이드(키 맵핑 테이블)

10. 키 맵핑(향후 실제 스키마 연동 대비 — 키 이름만 고정)
sales: id, date, group_name, channel, owner_id, amount, memo, isDummy

expenses: id, date, category, channel, order_ref, amount, memo, isDummy

targets: id, period, owner_id, target_revenue, target_profit, isDummy

scores: id, owner_id, period, revenue_score, speed_score, conversion_score, total

tasks: id, title, category, rel_type, rel_id, assignee_id, due_date, status, progress, priority, isDummy

11. Tasks(할 일) & 진척도 설계
카테고리: 디자인/발주/인쇄/배송/기타/영업/관리

상태: todo / doing / blocked / done

우선순위: P0 / P1 / P2

진척도(progress): 0–100% (서브체크 수/완료 수로 자동 계산 자리)

뷰:

개인 할 일(오늘/연체/이번 주), 칸반(상태별), 간트 느낌의 타임라인(기간 필터 반영)

카테고리/채널/담당자 필터, 진행률 링, 완료율 스파크라인

동기부여 요소:

Streak(연속 완료 일수), 배지(이번 주 10건 완료 등), 팀 랭킹

12. QA & 수용 기준(Definition of Done)
 1440/1280/1024/768 반응형에서 깨짐 없음

 라이트/다크 테마 대비 적합, 포커스/키보드 탐색 정상

 전역 필터가 모든 탭/카드/차트/리스트에 일관 반영

 Demo 모드에서 (dummy) 배지·워터마크·일괄 삭제 동작(목업 수준)

 카드 클릭 → 리스트 → 드로어 네비게이션 끊김 없음

 Empty/Skeleton 상태 정의 완료(로드/무데이터/필터 무매치 구분)

13. 핸드오프(실데이터 연결 가이드 — 개요)
단계 1: 더미 삭제 → sales/expenses/tasks/targets 실제 테이블 생성

단계 2: lib/adapters/*에 응답→UI 변환 함수 작성(키 맵핑 표 준수)

단계 3: TanStack Query 도입해 각 페이지 데이터 바인딩

단계 4: 전역 필터 상태 → 쿼리 파라미터로 변환(서버/클라이언트 어디서든 동일 인터페이스)

단계 5: CSV 업로드(임시) → ETL 파이프라인 전환

14. 네이밍 & 용어 표준(요약)
채널: kakao_channel | threads | instagram | youtube | naver_blog | outbound | inbound

지출 카테고리: ad | sales_ops | cogs_po | cogs_print | shipping | misc

상태 배지 컬러: 신규=회색, 진행=파랑(#0052cc 계열), 보류=주황, 확정=초록, 취소/실패=빨강