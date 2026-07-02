# Perkfolio 개발 계획

## 프로젝트 개요
개인 블로거가 여러 체험단 매칭 플랫폼을 통해 받는 체험 방문 기록을 한곳에서 관리하고, 절감액/수익을 분석하는 웹앱.

## 기술 스택
- Frontend: React + TypeScript + Vite
- 스타일: Tailwind CSS
- 라우팅: React Router
- 백엔드/데이터: Supabase (Postgres DB + Auth)
- 상태 관리: React state/Context만 사용 (전역상태 라이브러리 불필요)

## 디자인 톤
다크 대시보드 컨셉으로 고정 (`src/index.css`의 `@theme` 토큰 참고). 배경 `#14161A`, 카드 `#1D2027`, 텍스트 `#E7E9EC`. 상태 색상: 예정=blue(`#5B8DEF`) / 방문완료=amber(`#F0B429`) / 리뷰완료=green(`#34D399`), 마감일 임박은 red-400. 폰트: 헤딩 Inter, 본문 Pretendard, 숫자 JetBrains Mono. 새 화면 작업 시 이 토큰을 그대로 재사용.

---

## Phase 0: 프로젝트 셋업 ✅
- Vite + React + TS 스캐폴딩
- Tailwind CSS 설정
- React Router 설정
- Supabase 프로젝트 신규 생성, `.env.local`에 URL/키 연결
- Supabase 클라이언트 초기화 (`src/lib/supabaseClient.ts`)

## Phase 1: 인증 ✅
- Supabase Auth 이메일/비밀번호 로그인 화면 (`/login`), 회원가입 화면 없음
- 계정은 Supabase 대시보드에서 수동으로 1개 생성
- 세션 상태 관리 (AuthContext)
- 보호된 라우트: 세션 없으면 `/login`으로 리다이렉트
- 로그인 성공 시 `/table`로 이동
- 상단 네비게이션에 로그아웃 버튼

## Phase 2: 데이터 스키마 + 입력 폼 (`/add`) ✅
- Supabase `visits` 테이블, RLS로 `auth.uid()` 기준 행 단위 격리 (마이그레이션은 `supabase/migrations/`에 누적 관리)
- 필드: 방문일, 마감일(선택, 방문일과 별개 날짜), 플랫폼(select), 업체명, 가게 정보 URL(필수), 카테고리(카페/음식점/술집/기타), 체험 내역, 체험가, 추가결제액(기본값 0), 체험단 URL(필수), 포스팅 링크(선택), 상태(기본값 '예정')
- 상태는 3단계: 예정 → 방문완료 → 리뷰완료
- `src/lib/visits.ts`: getVisits / getVisit / addVisit / updateVisit / deleteVisit / toggleStatus(3단계 순환)
- 폼은 "기본 정보"(2열 그리드) + "링크" 두 섹션으로 구성 (`src/components/VisitForm.tsx`), `src/components/formStyles.ts`로 입력창 스타일 공유
- 저장 성공 시 `/table`로 이동 (성공 토스트 없음), 저장 실패 시에만 폼에 에러 메시지 표시

## Phase 3: 기록 화면 — 표 뷰 (`/table`) ✅
- 표/캘린더는 "방문내역"이라는 하나의 화면으로 묶고, 상단 세그먼트 토글로 전환 (`RecordsLayout`이 두 라우트를 감싸며 토글+플로팅 추가 버튼을 공유)
- 우하단 플로팅 "+" 버튼 → `/add` 페이지로 이동 (모달 아님)
- 컬럼: 날짜, 마감일(D-day 표시, 리뷰완료 시 초록 "리뷰완료"로 전환), 플랫폼, 업체명, 카테고리, 체험가, 추가결제액, 순절감액(자동계산), 상태
- 정렬: 컬럼 헤더 클릭 (날짜/마감일/체험가 등)
- 필터: 상태(예정/방문완료/리뷰완료/전체), 플랫폼별
- 상태 배지 클릭 시 예정 → 방문완료 → 리뷰완료 순환
- 좁은 화면에서는 컬럼이 줄바꿈되지 않고 가로 스크롤 (`overflow-x-auto` + `whitespace-nowrap`)
- 행 클릭 시 상세(조회) 화면 이동, 행 끝 "삭제" 버튼으로 바로 삭제

## Phase 4: 캘린더 뷰 (`/calendar`) ✅
- `RecordsLayout` 토글바 공유 (표 ↔ 캘린더)
- 월간 캘린더 그리드, 좌측 컬러 스트라이프 카드형으로 방문/마감일 표시 (`src/lib/statusStyle.ts`의 상태별 색상 재사용)
- 하루 2건 초과 시 "+N개" 축약, 모바일(`sm` 미만)에서는 카드 대신 점(dot) 요약으로 전환해 레이아웃이 눌리지 않게 함
- 마감일은 빨간 스트라이프/점으로 별도 표시 (방문일과 다른 날짜에 찍힘), 리뷰완료 시 초록으로 전환
- 날짜 클릭 시 하단에 해당일 방문 + 마감일 리스트 패널, 방문 항목은 상태 토글 버튼 포함
- 패널의 각 항목 클릭 시 상세 페이지(`/edit/:id`)로 이동
- 날짜 셀 호버 시 테두리/배경 강조 효과

## 상세 페이지 — 조회/수정 (`/edit/:id`) ✅
- 기본은 읽기 전용 "조회" 모드: 폼과 동일한 2열 그리드/섹션 레이아웃을 재사용하되, 입력창 대신 테두리 없는 밑줄 박스(문서형)로 표시해 "수정 가능"과 명확히 구분
- 조회 모드 하단에 "수정"/"삭제" 버튼
- "수정" 클릭 시 같은 자리에서 `VisitForm`(실제 입력창)으로 전환, "취소"로 되돌아가기, 저장 시 다시 조회 모드로
- 체험단 URL / 가게 정보 URL / 포스팅 링크는 링크 아이콘 + "바로가기"로 새 탭에서 열림
- 조회 박스는 폼의 `inputClass`/`selectClass`와 동일한 `px-3 py-3` 패딩을 써서, 모드 전환 시 필드 높이가 거의 변하지 않도록 함

---

## Phase 5: 테스트 코드 작성 ✅
도구: Vitest + React Testing Library. 커밋 전 `npm run test:run`을 Husky pre-commit 훅으로 자동 실행 — 테스트 실패 시 커밋 불가.

- [x] 테스트 환경 셋업 (+ pre-commit 훅)
- [x] 입력 폼 테스트 (`VisitForm`, `AddPage`)
- [x] 표 / 캘린더 테스트 (`TablePage`, `CalendarPage`) + 공용 로직 단위 테스트 (`statusStyle`, `useVisitActions`)
- [x] 상세 화면 테스트 (`EditPage`) — 조회/수정 모드 전환, 저장, 삭제

## 이후 단계 (미착수)

### Phase 6: 대시보드 (`/dashboard`) - 추후 보완
- 라우팅 + NavBar 링크는 이미 연결됨, 화면은 `<h1>대시보드</h1>` 스텁만 존재
- 요약 카드 4개(총 방문/총 체험가/총 추가결제/순절감액)
- 디데이
- 플랫폼별 절감액 랭킹 막대그래프 (recharts)
- 월별 트렌드 라인 차트

### 테마 토글 (라이트/다크 모드)
- 현재는 다크 대시보드 테마로 고정되어 있음
- 라이트 모드 토큰 설계 + 사용자가 전환할 수 있는 토글 UI 추가 검토
