Lite Admin Guide (필수 기능 · 디자인 · UX 가이드)
본 문서는 현재 운영 중인 문의/리뷰 관리 Admin을 안정적으로 유지하면서, 꼭 필요한 최소 기능과 일관된 UI/UX 원칙을 정의합니다. 대규모 대시보드(매출/지출/P&L 등)는 별도 로드맵에서 진행합니다.
1) 역할/권한(필수)
역할: admin(전체관리자), agent(에이전트)
권한 범위
admin: 전체 문의/리뷰 열람, 상태 변경, 담당자 지정, 수정/삭제, 다중 선택 삭제
agent: 담당자 미지정 또는 본인 지정 문의만 열람, 상태 변경/담당자 지정/수정 가능(삭제 불가)
RLS/정책 핵심
profiles 조회: 본인 + admin 전역
inquiries: select는 역할 조건에 따름, update/insert는 auth 허용, delete는 admin만
reviews: delete는 admin만(운영 안전성)
2) 데이터 모델(필수)
inquiries (중요 컬럼)
session_id (uuid, not null)
status (new|in_progress|answered|closed)
assignee (uuid|null)
inquiry_kind: 단체복, 커스텀 소량 굿즈(고정)
source: 네이버 스마트스토어|카카오톡채널|카카오샵|외부영업|지인
admin_notes (text|null)
reviews (중요 컬럼)
rating(0~5), title, content, images[], display_at, view_count(수정 가능)
profiles
id(uuid), display_name, role(admin|agent)
3) Admin 최소 기능(완료/유지)
로그인 정보 패널: 이름/이메일/역할 표시(RPC get_me 기반)
대시보드 위젯(브랜드 블록)
총 문의, 미답변, 담당자 미지정, 내 대기중
담당자별 건수/대기 배지
지금 답변해야 할 문의(new 최근 8건)
문의 테이블(와이드)
열: 날짜(체크박스/전체선택), 상태(드롭다운), 이름, 연락처, 종류, 수량, 담당자(드롭다운), 구분(드롭다운), 작업(수정/삭제)
행 펼치기/접기: 세부정보(메모/담당자/구분 등)
다중 선택 삭제(전체관리자)
수동 생성 카드(펼치기/접기)
필드: 이름/연락처/종류(고정 드롭다운), 수량, 구분(드롭다운), 담당자(드롭다운)
저장 시 session_id 자동 생성
리뷰 관리
작성, 목록(표시/수정/삭제), 목록 내부 아코디언 상세
4) UI/UX 원칙(브랜드 0052cc)
기본 톤: 라이트 모드 고정(흰 배경, 검은 글자)
강조 색: #0052cc(CTA/헤더 위젯/아이콘)
컴포넌트
버튼: rounded-full, hover bg-gray-50, 주요 CTA는 #0052cc 배경/흰 글자
카드: rounded-xl + border + shadow-sm + bg-white
테이블: 헤더 bg-gray-50/80, 행 hover 강조, 상단 바 sticky 가능
토글: “펼치기/접기”는 우측 작은 pill 버튼
접근성: 포커스 링, 명도 대비 4.5:1, 모바일도 기능 동일(레이아웃은 PC 최적)
5) 안정성 체크리스트(운영)
RLS 확인: reviews delete는 admin 전용, profiles select_self/select_admin 정상
SQL 실행 가이드: 에디터에는 순수 SQL만, 타입 변경은 정책 drop→변경→재생성 순서
컬럼 충돌 방지: inquiry_source(enum) 컬럼 source 사용, source_channel은 점진 폐기
세션 필수: 수동 생성 시 session_id 자동 생성
6) 파일/함수 분리(권장)
공용 RPC: get_me, list_users_admin → auth/profiles 전용 SQL 파일로 이동
리뷰/프로필/문의 스키마 파일 분리(유지보수성)
7) 향후 확장(선택)
대시보드(P&L 등)는 app/(dashboard)/* 네임스페이스에 더미 데이터로 별도 진행
전역 필터 바(기간/그룹/비교)는 Admin과 독립
8) 운영 절차
배포 전: 정책/SQL/라이트모드 점검
배포 후: 관리자/매니저 계정으로 E2E 확인(로그인→위젯→문의 CRUD/배정→리뷰 CRUD/조회)
본 가이드는 “지금 필요한 최소”에 집중합니다. 신규 대시보드는 기존 Admin을 건드리지 않고 별도 라우팅/폴더에서 진행합니다.