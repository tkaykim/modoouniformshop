모두의 유니폼 — 통합 대시보드 디자인 명세서
0) 글로벌 프레임
상단 헤더(고정): 로고타이프(모두의 유니폼), 전역 필터(기간 7/30/커스텀 · 보기: 전체/담당자/채널 · 비교: 전주/전월/전년 동기), 빠른 검색, 알림, 사용자 아바타, Demo 모드 토글.

좌측 내비(고정): 개요 · 판매 · 재무/회계 · 목표/성과 · 업무 · 할 일 · 채널 인사이트 · 매니저 센터 · Admin

그리드/리듬: 12컬럼 · 24/16px 여백 스케일 · 카드형(모서리 16–20px) · 그림자 레벨 2단계.

반응형: 1440/1280/1024/768 기준; 1024↓에서는 좌측 내비 축소/슬라이드.

아이콘/컴포넌트 톤: 라인아이콘, 얇은 경계(#E5E7EB), 라이트/다크 테마.

색상 토큰(예시)

Token	Value
Primary	#0052cc
Accent	#00c2ff
Success	#12b76a
Warning	#f79009
Danger	#ef4444
Surface	#f8f9fb

대시보드는 한눈에 비교 가능한 시지각 특성(길이·2D 위치)을 우선으로 쓰며 과다 색상/요소는 지양합니다. 필요 차트만 엄선, 군더더기 제거 원칙. 
Nielsen Norman Group
+1
Qalyptus
Smashing Magazine

1) 탭 구성 요약
탭	목적 키워드
개요	핵심 KPI·트렌드·P&L 한눈 비교
판매	매출 입력/리스트/분석(담당자·채널·기간)
재무/회계	지출/원가/광고·영업비, P&L 상세, 정산 보조
목표/성과	목표 대비 실적, 마진·전환, 부서/담당 리그
업무	문의/영업/제작 플로우 타임라인·칸반
할 일	개인/팀 할 일·진척도·간트형 타임라인
채널 인사이트	채널/콘텐츠 지표, 업로드/캘린더, 기여도 자리
매니저 센터	개인 목표·Streak·리더보드·Next Best Action

2) 공통 컴포넌트(이름/역할/필드)
GlobalFilterBar: period, groupBy(전체/담당자/채널), compare, demoMode

KPICard: title, value, delta(전/전월/전년)

LineCard(시계열): seriesMeta[], period

DonutCard/BarCard(분해): segments[]

WaterfallCard(P&L): steps[]

LeagueTable(랭킹/리그): rows[], metric

DataTable: 필터/정렬/고정/집계행

SideDrawer: 상세 + 탭(개요/타임라인/메모/파일)

Kanban: 상태 컬럼(드래그는 초기 비활성)

Calendar: 주/월 보기, 가용시간·마감 표시

FormModal: 매출/지출 입력(데모는 저장 비활성)

CSVUploadDialog: 템플릿 안내, (dummy) 샘플 미리보기

Empty/Skeleton: 로딩/무데이터/필터 불일치 상태

3) 페이지별 디자인 사양
A. 개요(Overview)
상단 KPI 6:
① 주간 매출 ② 월간 매출 ③ 월간 순이익 ④ 채널 인입 비중 ⑤ 카테고리별 할 일 진행률 ⑥ 지출 변화

중앙 좌: 매출·지출·순이익 3중 라인(30/90일)

중앙 우: P&L 워터폴(매출 → 원가-발주/인쇄 → 영업비 → 광고비 → 배송/기타 → 순이익)

하단: 리그 테이블(담당자/채널 기준 전환/매출/순익 Top), 퍼널 미니뷰(new→contacted→quoted→won/lost, 값은 목업)

인터랙션: KPI/차트/행 클릭 → 해당 조건 프리셋으로 상세 탭 이동.

디자인 포인트: 수치 가독성(세미모노), 최소 색상, 2D 위치/길이 우선. 
Nielsen Norman Group
Qalyptus

B. 판매(Sales)
상단: 기간·담당자·채널 필터, 매출 입력 모달 버튼(필드: 날짜/단체명/채널/담당/금액/메모)

좌: 매출 시계열(7/30/커스텀), 전월 대비 배지

우: 채널별/담당자별 매출 막대 + Top5 카드

하단: 매출 테이블(집계행: 합계/평균 단가), 행 클릭 드로어(기본 정보/메모/연결 리드)

권장 KPI: 쿼터 달성률·전환률·평균 거래규모·매출·퍼널 누수 지표를 보조 카드로 제공. 
blog.hubspot.com

C. 재무/회계(Finance)
상단: 지출 입력 모달(분류: 광고비/영업비/원가-발주/원가-인쇄/배송/기타)

좌: 지출 도넛 + 월별 지출 막대(카테고리 스택)

우: P&L 상세 워터폴 + 마진율 카드

하단: 지출 테이블(필터: 카테고리/채널/관련 주문) + 정산 보조(월별/담당자별 합계)

참고/영감: 역할별/산업별 재무/HR/영업 대시보드 샘플의 구성을 참고해 카드/차트 균형을 유지. 
Qlik
+1

D. 목표/성과(Goals & Performance)
상단: 목표 설정 패널(기간, 매출/순익 목표, 담당자·팀 선택)

중앙: 목표 대비 달성률 링 + 추세 라인(예측선 포함)

하단 좌: 전환 퍼널(리드→상담→견적→수주)

하단 우: 부서/담당자 리그(점수 = 순익0.6 + 매출0.4 기본)

UI 톤: 성공은 초록, 경고는 주황, 위험은 빨강. 너무 많은 색상 지양. 
Qalyptus

E. 업무(Operations)
탭: 타임라인 / 캘린더 / 칸반

타임라인: 최근 30일 활동(문의 이벤트/연락/노트/파일)

캘린더: 희망 통화 시간대(문의 preferred_time)·미팅·마감

칸반: 상태 컬럼(new/assigned/contacted/quoted/won/lost) — 드래그는 목업, 상태 칩 컬러 가이드

상세 드로어: 요약·UTM·연락이력·다음 행동(자리만)

원칙: 불필요한 비주얼 제거, 정보 탐색 부담↓. 
Nielsen Norman Group

F. 할 일(Tasks)
상단: “오늘/이번주/연체” 탭 + 카테고리/우선순위 필터(P0/P1/P2)

중앙: 개인/팀 칸반 + 간트형 타임라인(주/월)

우: 진행률 링(0–100%), 완료율 스파크라인, Streak 배지

행동: 체크리스트(서브태스크), 담당자/기한 배지, (dummy) 표기

G. 채널 인사이트 & 콘텐츠 진행(Channels & Content)
상단: 계정 스위처(카카오 채널·인스타·쓰레드·유튜브·네이버 블로그) + 기간

좌: 계정 KPI(도달/클릭/팔로워·구독자 증감)

중앙: 콘텐츠 Top10(조회/저장/공유/클릭 · URL 링크)

우: 업로드 캘린더(빈도/퍼포먼스 히트맵)

하단: CSV 업로드(목업) → 샘플 미리보기, 매핑 가이드

참고: 역할별 대시보드 예시(세일즈·마케팅·HR 등)를 폭넓게 참고해 모듈/카드 재사용성 높임. 
Qlik

H. 매니저 센터(Manager Center)
상단: 개인 목표/진척도 링, Streak, “이번 주 우선 작업” 카드

중앙 좌: 개인 순이익/매출 추세(7/30/커스텀)

중앙 우: 응답속도/후속접촉 간격/전환률 미니 KPI

하단: 팀 리더보드(순익·매출·전환 혼합 점수)

권장 지표: 쿼터 달성/전환/평균 거래규모 등 세일즈 코어 KPI를 서브로 배치. 
blog.hubspot.com
hublead.io

4) 상태/색상 규칙
상태 칩: new=Gray, assigned=Primary, contacted=Teal, quoted=Violet, won=Success, lost=Danger

경고 단계: D-3 이내(Warning), 경과(Danger)

Demo 표기: 행/카드 타이틀 끝 “(dummy)” + 상단 배너 “Demo Mode” + 워터마크

5) 인터랙션(공통)
카드/차트 드릴다운: 클릭 시 관련 탭 이동 + 필터 프리셋 유지

드로어: 리스트 행 클릭 → 우측 드로어(요약/타임라인/메모 탭)

테이블: 열 고정/정렬/필터/집계행, CSV 다운로드(목업)

캘린더: 셀 클릭 → 일정 생성 모달(목업)

칸반: 카드 드래그는 시연만, 실제 상태 변경은 후속 구현

6) 더미데이터 운영
생성: 지난 90일 매출/지출/리드/할 일 난수 분포 · 채널 비중(인스타/네이버/카카오/외부 등)

표기: (dummy) 접미 + isDummy: true 플래그

삭제: Admin > Demo 툴에서 일괄 필터 삭제

CSV 템플릿 키(요약)

파일	필드 키
sales.csv	date, group_name, channel, owner, amount, memo, isDummy
expenses.csv	date, category(ad/sales_ops/cogs_po/cogs_print/shipping/misc), channel, order_ref, amount, memo, isDummy
tasks.csv	title, category, assignee, due, priority, status, progress, isDummy

7) 시각 요소 가이드
차트 우선순위: 시계열=라인, 분해=막대·도넛, 기여/손익흐름=워터폴, 퍼널=단순 단계 바.

라벨링: 축/범례 최소화, 툴팁 정보 밀도↑, K·M·억 단위 축약.

텍스트: KPI 숫자 크게(32–40px), 보조 라벨 12–14px.

정돈: 불필요한 그래픽 제거·색상 제한. 필요 이상 차트 수 최소화. 
Nielsen Norman Group
Qalyptus

8) 레퍼런스(디자인/지표 참고)
부서/역할별 대시보드 예시 모음(Qlik): 다양한 산업/직무 샘플 확인. 
Qlik

세일즈 대시보드 핵심 KPI(HubSpot 예시·최근 업데이트 포함). 
blog.hubspot.com
hublead.io
huble.com

대시보드 설계 원칙: 프리어텐티브 시지각·군더더기 제거·일관성·색상 제한. 
Nielsen Norman Group
+2
Nielsen Norman Group
+2
vision.cpa

차트 선택 가이드/유형(FineReport 가이드들). 
finereport.com
+1

9) 전달 산출물(디자이너 착수용)
화면별 와이어(모바일/태블릿/데스크톱): 개요/판매/재무/목표/업무/할 일/채널/매니저

컴포넌트 보드: KPICard/Line/Donut/Waterfall/League/DataTable/Drawer/Kanban/Calendar/Form/CSVDialog/Empty/Skeleton

상태/색상 맵: 상태칩·경고 색·성공/경고/위험 톤

타이포/아이콘 스펙: 본문·수치·캡션 크기, 아이콘 세트

Demo 모드 시안: 워터마크·배지·(dummy) 표기 샘플

프로토타입 네비게이션: 카드→리스트→드로어, KPI→상세, 캘린더→모달

10) 구현 단계 체크리스트(디자인 기준)
글로벌 프레임/토큰/반응형 그리드 확정

전역 필터 바 + 상태칩/배지 시스템

개요 화면(6 KPI · 라인 · 워터폴 · 리그 · 퍼널 미니뷰)

판매/재무 화면(입력 모달·리스트·분석 카드/차트)

목표/성과(목표 패널·달성 링·리그/퍼널)

업무/할 일(타임라인·캘린더·칸반·간트형)

채널 인사이트(계정/KPI/콘텐츠Top/업로드)

매니저 센터(개인 목표·Streak·리더보드·NBA)

Demo 모드 전체 적용·(dummy) 데이터 시안

접근성·다크모드·빈/로딩 상태 점검

부록) 상태·배지 컬러(권장)
상태	컬러
new	Gray
assigned	Primary
contacted	Teal
quoted	Violet
won	Success
lost	Danger