모두의 유니폼 — Admin 전역 디자인 가이드(Overview 기준)

1) 핵심 원칙
- 라이트 테마 고정, 배경은 Surface(#f8f9fb) 계열 유지
- 카드 중심 UI: 테두리(border) 미사용, bg-white + shadow-sm + rounded 조합 사용
- 포커스/강조는 배경 대비와 그림자, 컬러(#0052cc)로 표현
- 아이콘/텍스트 대비 강화: 활성 상태는 배경 #0052cc, 아이콘/텍스트는 모두 white

2) 토큰/타이포(권장)
- Primary: #0052cc, Surface: #f8f9fb
- Card: bg-white rounded-xl/2xl shadow-sm, 내부 패딩 p-4~p-6
- Text 기본: text-gray-900, 보조: text-gray-600, 캡션: text-gray-500
- 아이콘: 20px, 항목 높이 h-11(사이드바/리스트 버튼 등)

3) 금지 규칙
- border, border-b, border-t 등 테두리 사용 금지(내부 구분선 필요시 여백과 배경 톤으로 구분)
- 과한 애니메이션 금지, PC 사이드바는 고정 폭
- **레이아웃 세로 찌그러짐 금지**: 디스플레이 WIDTH가 줄어들어도 레이아웃이 세로로 찌그러지거나 줄바뀜 발생 금지
- 대신 가로 스크롤, 크기 축소, 텍스트 생략(...) 등으로 처리

4) 컴포넌트 패턴
- 버튼: rounded-full 또는 rounded, bg-white shadow-sm hover:bg-gray-50
- 강조 버튼: bg-[#0052cc] text-white rounded shadow-sm
- 카드: bg-white rounded-2xl shadow-sm, 내부에 불필요한 선 제거
- 입력/셀렉트: bg-white rounded shadow-sm px-3 py-2(테두리 없음)
- 목록/표: wrapper는 overflow-auto + card, 행 구분은 spacing으로 처리

5) 네비게이션
- 사이드바: 고정 폭, 섹션 제목(캡션) + 항목(아이콘 20px + text-base)
- 활성: bg-[#0052cc] text-white(아이콘/텍스트 모두)

6) 적용 범위
- /admin 이하 모든 페이지에 동일 규칙 적용(overview 기준과 동일 톤)



