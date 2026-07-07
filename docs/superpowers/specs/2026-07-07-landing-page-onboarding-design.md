# 공개 랜딩 페이지 + 첫 로그인 온보딩 설계

**목적:** 친구 등 처음 써보는 사용자가 로그인 화면부터 마주치지 않도록, 로그아웃 상태에서 `/`에 접속하면 앱을 소개하는 공개 랜딩 페이지를 보여주고, 첫 로그인 시 핵심 사용법을 안내하는 환영 모달을 띄운다.

## 검토한 대안

- **온보딩 상태 저장 위치**: localStorage 플래그는 CLAUDE.md 원칙(테마 외 앱 데이터는 Supabase)에 어긋나고 기기가 바뀌면 다시 뜨는 문제가 있음. 별도 `profiles` 테이블 신설은 마이그레이션+RLS까지 필요해 이 기능 규모에 비해 과함. **채택: Supabase Auth의 `user_metadata`** — 새 테이블 없이 `supabase.auth.updateUser({ data: { has_seen_onboarding: true } })`로 계정별 저장, 기기 간에도 유지됨.
- **온보딩 형태**: 화면 요소를 하나씩 짚어주는 단계별 툴팁 투어는 더 친절하지만 구현/유지보수 부담이 큼. **채택: 환영 모달 1장** — 첫 로그인 시 한 화면에 핵심 기능 요약.
- **랜딩 페이지 분량**: README에 있는 스크린샷을 포함한 다중 섹션 마케팅 페이지는 스크린샷 관리 부담이 생김. **채택: 간결한 1화면** — 헤더 + 한 줄 소개 + 기능 불릿 + CTA 버튼만.

## 1. 라우팅 (`src/App.tsx`)

- `/` 라우트를 `<Navigate to="/table" replace />`에서 `<LandingPage />`로 교체
- `LandingPage` 내부에서 `useAuth()`의 `session`을 확인:
  - `loading`이면 `null` 반환 (기존 `ProtectedRoute`와 동일한 패턴)
  - `session`이 있으면 `<Navigate to="/table" replace />` (로그인 상태로 `/`에 오면 기존처럼 표로 이동)
  - 없으면 랜딩 콘텐츠 렌더
- `/login`, `/signup`, `/forgot-password`, `/reset-password`는 변경 없음

## 2. 공개 랜딩 페이지 (`src/pages/LandingPage.tsx`)

- `LoginPage`와 같은 톤의 가벼운 단일 화면 (`mx-auto`, `max-w` 컨테이너)
- 구성: `Logo` + 한 줄 소개 문구 + 기능 불릿 3~4개(표·캘린더 뷰, 대시보드 통계, 마감 임박 알림 등 — README 기능 설명 재활용) + CTA 버튼 2개("로그인" → `/login`, "회원가입" → `/signup`)
- 스크린샷/이미지 없음, 기존 `Button` 컴포넌트 사용

### `Logo` 홈 링크화

- `src/components/Logo.tsx`: 현재 `<p>` 텍스트를 `Link to="/"`로 감싸 클릭 시 랜딩 페이지로 이동
- `LoginPage`/`SignupPage`에 이미 배치된 `Logo` 사용부는 변경 없이 그대로 동작 (로그인/회원가입 화면에서 랜딩으로 돌아가는 경로 확보)

## 3. 첫 로그인 온보딩 (`src/components/WelcomeModal.tsx`)

- 표시 위치: `RecordsLayout`(`/table`, `/calendar`를 감싸는 레이아웃, 로그인·회원가입 직후 도착 지점)
- 조건: `session.user.user_metadata.has_seen_onboarding`가 falsy면 모달 표시
- 내용: 환영 문구 + 핵심 사용법 3줄(+ 버튼으로 체험단 추가 / 표·캘린더로 확인 / 대시보드에서 통계 확인) + "시작하기" 버튼
- 동작: "시작하기" 클릭 → `src/lib/auth.ts`에 새로 추가하는 `markOnboardingSeen()`(`supabase.auth.updateUser({ data: { has_seen_onboarding: true } })`를 래핑) 호출 → 모달 닫힘
- `onAuthStateChange`가 이벤트 필터 없이 모든 auth 이벤트를 받으므로, `updateUser`가 발생시키는 `USER_UPDATED` 이벤트로 `AuthContext`의 `session`이 자동 갱신되어 재조회 불필요
- 스타일: 기존 컴포넌트가 없어 신규 작성 — 오버레이 + 카드, `bg-surface`/`border-line`/`text-ink` 등 기존 토큰 사용

## 4. 테스트

- `LandingPage.test.tsx`: 비로그인 시 콘텐츠·CTA 링크 렌더, 로그인 상태면 `/table`로 리다이렉트
- `WelcomeModal.test.tsx`: `has_seen_onboarding` 없을 때 모달 노출, "시작하기" 클릭 시 `markOnboardingSeen` 호출과 모달 닫힘 확인
- `RecordsLayout.test.tsx`: `has_seen_onboarding`가 이미 true면 모달이 뜨지 않는지 확인

## 범위 밖

- 단계별 툴팁 투어, `/guide` 같은 별도 안내 페이지 — 추가하지 않음
- 랜딩 페이지에 스크린샷/이미지 삽입 — 추가하지 않음
- 온보딩을 다시 보기 위한 "튜토리얼 다시 보기" 메뉴 — 요청받지 않아 추가하지 않음
