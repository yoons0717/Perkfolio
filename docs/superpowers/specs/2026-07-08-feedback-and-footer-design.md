# 피드백(문의/버그 제보) + 푸터 설계

**목적:** 실사용 블로거들에게 링크를 배포하기 전에, 버그/건의사항을 받을 창구와 그 창구로 이어지는 푸터를 추가한다.

## 검토한 대안

- **피드백 접수 방식**: 서로의 글이 보이는 공개 게시판은 커뮤니티 운영 부담이 커서 지금 규모에 안 맞음. 외부 링크(구글폼/이메일)로 때우는 방법도 있으나 앱에 자연스럽게 녹아들지 않음. **채택: 로그인 계정에 연결된 피드백 폼** — 제출자는 세션에서 자동 식별, 이메일 입력란 불필요.
- **피드백 확인 방법**: Supabase 대시보드에서 직접 보는 게 제일 가볍지만, 사용자가 앱 내 관리자 화면을 원함. **채택: `/admin/feedback` 전용 화면**, 조회만 지원(처리 상태 토글 없음).
- **관리자 판별**: `profiles` 테이블 + role 컬럼은 관리자 1명뿐인 지금 규모엔 과함. **채택: 본인 이메일(`yoons0717@gmail.com`) 하드코딩** — 프론트 가드와 Supabase RLS 양쪽에 동일 조건 적용.
- **푸터 노출 범위**: 문의하기가 로그인을 전제로 하므로, 랜딩/로그인 화면까지 푸터를 노출하면 문의하기가 눌러도 안 되는 죽은 링크가 됨. **채택: `NavBar`와 동일하게 세션 있을 때만 렌더링.**

## 1. 데이터 계층 (Supabase)

- 신규 마이그레이션(`supabase/migrations/`)으로 `feedback` 테이블 생성, `visits` 테이블(`20260701135038_create_visits_table.sql`)과 동일한 RLS 컨벤션 사용:
  ```sql
  create table public.feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id),
    type text not null check (type in ('버그', '건의')),
    content text not null,
    created_at timestamptz not null default now()
  );

  alter table public.feedback enable row level security;

  create policy "feedback_insert_own"
    on public.feedback for insert
    to authenticated
    with check ( (select auth.uid()) = user_id );

  create policy "feedback_select_admin"
    on public.feedback for select
    to authenticated
    using ( (select auth.jwt() ->> 'email') = 'yoons0717@gmail.com' );
  ```
  - select 정책을 관리자 이메일로 제한하는 이유: 프론트 가드만 있으면 다른 로그인 사용자가 Supabase API를 직접 호출해 남의 제보를 읽을 수 있음.
  - update/delete 정책 없음 — 조회만 지원하는 범위와 일치.
- `src/types/feedback.ts`: `FeedbackType = '버그' | '건의'`, `Feedback = { id, type, content, createdAt }`, `NewFeedback = { type, content }` — `visit.ts` 타입 구조 그대로 따름.
- `src/lib/feedback.ts`: `addFeedback(feedback: NewFeedback): Promise<void>`, `getFeedbackList(): Promise<Feedback[]>` (최신순 정렬) — `visits.ts`와 동일하게 snake_case row ↔ camelCase 타입 매핑.

## 2. 피드백 제출 다이얼로그 (`src/components/FeedbackModal.tsx`)

- `WelcomeModal.tsx`와 동일한 오버레이(`fixed inset-0 bg-black/50`) + 중앙 카드 스타일 재사용.
- 필드: 유형 `<select>`(옵션: 버그 제보/건의사항, 기본값 버그 제보) + 내용 `<textarea>`(필수).
- 제출 흐름: `VisitForm.tsx`와 동일한 패턴 — `submitting`/`error` 로컬 state, 실패 시 `<p className="text-sm text-danger">` 인라인 에러.
- 성공 시: 폼을 "제출되었습니다. 감사합니다!" 안내로 전환, "닫기" 버튼으로 모달 종료(자동 닫힘 타이머 없음 — 사용자가 직접 닫음).
- Props: `{ onClose: () => void }`.

## 3. 푸터 (`src/components/Footer.tsx`)

- `NavBar.tsx`처럼 `useAuth()`의 `session`을 확인해 없으면 `null` 반환.
- `App.tsx`에서 `<NavBar />` 옆에 `<Footer />` 렌더(라우트 밖, 최상위).
- 레이아웃: `border-t border-line bg-surface px-6 py-4`, 좌측 `© 2026 PerkTrack`(NavBar 로고 표기와 통일), 우측 "문의하기" 버튼.
- "문의하기" 클릭 시 로컬 `isFeedbackOpen` state로 `FeedbackModal` 오픈.

## 4. 관리자 피드백 조회 화면

- `src/lib/admin.ts`: `ADMIN_EMAIL = 'yoons0717@gmail.com'`, `isAdmin(email: string | undefined): boolean`.
- `src/App.tsx`에 라우트 추가:
  ```tsx
  <Route path="/admin/feedback" element={
    <ProtectedRoute>
      <AdminFeedbackPage />
    </ProtectedRoute>
  } />
  ```
- `src/pages/AdminFeedbackPage.tsx`: 마운트 시 `useAuth()`의 `session.user.email`이 `isAdmin()`을 통과하지 못하면 `<Navigate to="/table" replace />`. 통과하면 `getFeedbackList()` 호출 후 유형 배지 + 내용 + 제출일시(`format.ts`의 기존 날짜 포맷 함수 재사용)를 최신순 목록으로 렌더. 로딩/에러 상태는 기존 화면들과 동일하게 공유 스피너(`Spinner`)/에러 문구 패턴 사용.
- `NavBar.tsx`: `isAdmin(session.user.email)`이 true일 때만 데스크톱 메뉴와 모바일 메뉴 양쪽에 "관리자" 링크(`/admin/feedback`) 추가.

## 5. 테스트

- `feedback.test.ts`: `addFeedback`/`getFeedbackList`가 Supabase 클라이언트를 올바른 인자로 호출하고 응답을 camelCase로 매핑하는지.
- `FeedbackModal.test.tsx`: 렌더, 내용 미입력 시 제출 버튼 비활성 또는 에러, 제출 성공 시 `addFeedback` 호출과 성공 안내 전환, 실패 시 에러 문구.
- `Footer.test.tsx`: 세션 없으면 `null`, 있으면 문의하기 클릭 시 모달 오픈.
- `AdminFeedbackPage.test.tsx`: 관리자 이메일이면 목록 렌더, 아니면 `/table`로 리다이렉트.
- `admin.test.ts`: `isAdmin()` 이메일 일치/불일치/undefined 케이스.

## 범위 밖

- 피드백 처리 상태(확인함/처리중) 토글, 삭제 기능 — 요청받지 않아 추가하지 않음.
- 이용약관/개인정보처리방침 링크 — 별도 법률 검토 필요, 이번 범위 밖.
- 공개 게시판, 익명 제출, 스크린샷 첨부 — 요청받지 않아 추가하지 않음.
