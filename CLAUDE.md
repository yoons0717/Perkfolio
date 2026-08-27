# CLAUDE.md — Perkfolio

개인 블로거용 체험단 방문 관리 웹앱. 전체 계획은 `PLAN.md` 참고.

## 기술 스택
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Supabase (Postgres + Auth) — 방문 기록 등 앱 데이터/인증은 전부 Supabase 사용
- 테마(라이트/다크) 선택만 예외적으로 localStorage에 저장 — 기기별 UI 취향이라 앱 데이터로 안 보고, React 마운트 전에 동기적으로 읽어야 깜빡임 없이 적용 가능
- 상태 관리: React state/Context만 사용. Redux, Zustand 등 전역상태 라이브러리 도입 금지

## 폴더 구조
- `src/lib/` — 데이터 접근 및 외부 연동 로직만 (`supabaseClient.ts`, `visits.ts`, `auth.ts`, `format.ts`, `statusStyle.ts`, `visitStats.ts`)
- `src/pages/` — 라우트 단위 화면 컴포넌트 (Login, Add, Edit, Table, Calendar, Dashboard)
- `src/components/` — 재사용 UI 컴포넌트. 버튼은 `Button.tsx` 사용, `<button>` 직접 스타일링 금지
- `src/hooks/` — 여러 화면에서 공유하는 React 커스텀 훅 (예: `useVisitActions`, `useVisits`)
- `src/context/` — AuthContext 등 전역 컨텍스트
- `src/types/` — 공용 타입 정의 (Visit 등)

## 코드 컨벤션
- 컴포넌트는 함수형 컴포넌트만 사용 (class component 금지)
- 컴포넌트 파일/함수명: PascalCase (예: `VisitForm.tsx`)
- 일반 함수/변수명: camelCase
- Supabase 테이블/컬럼명은 snake_case(Postgres 관례), TS 타입에서는 camelCase로 매핑해서 사용
- import는 상대 경로 사용 (alias 설정 안 함)
- 데이터 접근(Supabase 호출)은 반드시 `src/lib` 모듈을 통해서만 수행 — 컴포넌트에서 Supabase client 직접 호출 금지

## 환경 변수
- `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 저장
- `.env.local`은 git에 커밋하지 않음 (`.gitignore` 처리)

## 관리자 판별
- `src/lib/admin.ts`의 `isAdmin()`은 `auth.users.raw_app_meta_data.role`(JWT의 `app_metadata`)이 `'admin'`인지 확인
- `app_metadata`는 서비스 롤로만 수정 가능(사용자는 `updateUser()`로 못 건드림) — 절대 `user_metadata`에 role을 넣지 말 것, 사용자가 스스로 관리자를 자칭할 수 있게 됨
- RLS의 `feedback_select_admin` 정책도 동일하게 `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` 확인

## 명령어
- `npm install` — 의존성 설치
- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run lint` — oxlint 검사
- `npm test` — Vitest watch 모드 실행
- `npm run test:run` — Vitest 1회 실행 (CI/pre-commit용)

## 테스트
- 도구: Vitest + React Testing Library
- 테스트 파일은 대상 파일과 같은 위치에 `*.test.tsx`(또는 `.test.ts`)로 둠
- Visit 픽스처는 `src/test/factories.ts`의 `makeVisit()` 사용, 파일마다 재정의 금지
- 여러 테스트가 같은 `vi.mock`을 공유하면 `afterEach(() => vi.clearAllMocks())`로 정리 — `vi.restoreAllMocks()`는 이 프로젝트에서 vi.mock 팩토리로 만든 함수의 호출 기록을 지우지 못하는 걸 확인했으니 쓰지 말 것
- Husky pre-commit 훅(`.husky/pre-commit`)이 커밋 전 `npm run test:run`을 실행 — 테스트 실패 시 커밋이 막히고 숑숑이 메시지로 알려줌

## 규칙
- 색상/스타일링/에러처리/반응형/데이터 접근 등 세부 컨벤션은 `.claude/rules/`에 파일별로 분리되어 있음 (해당 경로의 파일 작업 시 자동 로드됨)
- 요청받지 않은 기능/화면 추가 금지
- 기존 코드 스타일 유지, 관련 없는 리팩토링 금지
- 커밋은 사용자가 명시적으로 요청할 때만 수행
- 리팩토링을 요청받으면 바로 손대지 말고, 초점 후보(데드코드 제거 / 주석 정리 / 중복 코드 정리 등)를 짧게 제시하고 확인받은 뒤 진행
- 작업 중 버그를 발견하면 지금 작업과 무관해도 짚어서 언급하고 계속 진행 (침묵하고 넘어가지 않음)
- 작업이 끝나면 무엇을 바꿨는지 몇 줄로 요약 — 파일별 diff를 다시 설명하는 장황한 마무리 금지, 여러 항목은 문단 대신 목록으로
- 요약 후 커밋이 필요해 보여도 바로 커밋하지 말고, 커밋해도 될지 먼저 물어보고 사용자가 확인해야 커밋
