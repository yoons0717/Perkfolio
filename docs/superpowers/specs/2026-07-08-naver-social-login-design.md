# 네이버 소셜 로그인/회원가입 설계

## 배경

Perkfolio는 현재 Supabase Auth의 이메일/비밀번호 로그인만 지원한다. 네이버 계정으로 로그인/회원가입할 수 있게 해달라는 요청.

Supabase Auth는 Google/Kakao/Apple 등은 네이티브 OAuth 프로바이더로 지원하지만 **네이버는 지원하지 않는다.** 네이버는 OIDC가 아닌 순수 OAuth2라서 Supabase의 `signInWithOAuth`/`signInWithIdToken`을 바로 쓸 수 없고, 콜백 처리와 세션 발급을 직접 구현해야 한다.

## 결정된 사항

- **연동 방식**: 네이버 OAuth를 직접 구현 (Supabase가 지원하는 다른 프로바이더로 대체하지 않음)
- **계정 연결 정책**: 기존 이메일/비밀번호 계정과 이메일이 같으면 자동으로 같은 계정으로 로그인(병용 계정) — 단, **기존 계정의 이메일이 Supabase에서 이미 confirm된 경우에만** 허용. `email_confirmed_at`이 비어있으면(이메일 미확인 상태) 자동 연결하지 않고 에러 처리한다. 이 프로젝트는 이미 이메일 가입 시 confirm 이메일을 요구하므로 추가 비용 없이 넣을 수 있는 안전장치.
  - 잔여 리스크: 네이버는 Google과 달리 `email_verified` 같은 필드를 제공하지 않아, 네이버가 반환한 이메일의 검증 수준을 그대로 신뢰한다. 위 안전장치로 "확인된 기존 계정에만 연결 가능"하도록 제한했지만, 네이버 쪽 이메일 신뢰 자체는 여전히 네이버에 의존한다.
- **프론트 플로우**: 팝업이 아닌 전체 페이지 리다이렉트 방식

## 아키텍처 / 플로우

```
LoginPage / SignupPage
  [네이버로 시작하기] 버튼 (NaverLoginButton)
        │  state 값 생성 → sessionStorage 저장
        │  location.href = 네이버 인가 URL로 이동
        ▼
네이버 로그인/동의 화면 (네이버 도메인)
        │  code, state 쿼리파라미터로 콜백
        ▼
/auth/naver/callback (NaverCallbackPage, 새 라우트)
        │  state 검증(sessionStorage와 비교, CSRF 방지)
        │  Supabase Edge Function 호출 (code 전달)
        ▼
Edge Function (supabase/functions/naver-auth)
        │  1) code → 네이버 액세스 토큰 교환 (Naver Client Secret 사용)
        │  2) 네이버 프로필 API 호출 → email 획득
        │  3) 기존 유저 조회 → email_confirmed_at 체크(안전장치)
        │  4) Admin API generateLink(type: magiclink)로 유저 조회/생성 + OTP 토큰 발급
        │     (이메일 발송 없이 토큰만 프론트로 반환)
        ▼
NaverCallbackPage
        │  supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
        │  → 정상 세션 발급, AuthContext가 자동으로 인식
        ▼
/table 로 이동 (로그인 완료)
```

핵심 포인트: Naver Client Secret과 Supabase service_role 키는 Edge Function(서버) 안에서만 사용하고 프론트에는 절대 노출하지 않는다. `generateLink` + `verifyOtp` 조합은 비-OIDC 프로바이더를 Supabase에 붙일 때 쓰는 표준적인 브릿지 패턴이다.

Supabase 자체의 "이메일 링크 클릭 확인" 절차는 필요 없다 — 네이버 로그인 성공 자체가 계정 소유권 증명으로 취급되기 때문(Google/Kakao/Apple 소셜 로그인과 동일한 논리).

## 새로 추가되는 파일

### 프론트엔드
- `src/components/NaverLoginButton.tsx` — "네이버로 시작하기" 버튼. `LoginPage`/`SignupPage` 양쪽에서 재사용. 클릭 시 state 생성(sessionStorage 저장) 후 네이버 인가 URL로 `location.href` 이동
- `src/pages/NaverCallbackPage.tsx` — `/auth/naver/callback` 라우트. code/state 쿼리 파싱 → state 검증 → Edge Function 호출 → verifyOtp → `/table` 이동. 로딩 스피너 + 실패 시 에러 메시지와 로그인 페이지로 돌아가는 링크
- `src/lib/naverAuth.ts` — Supabase/외부 호출은 `src/lib`에서만 수행하는 프로젝트 규칙에 따른 전용 모듈: `buildNaverAuthorizeUrl()`, `exchangeNaverCode(code, state)` (Edge Function 호출), `completeNaverSignIn(email, token)` (`verifyOtp` 래핑)
- `src/App.tsx`에 라우트 한 줄 추가: `<Route path="/auth/naver/callback" element={<NaverCallbackPage />} />`

### 백엔드 (Supabase Edge Function, 새 디렉터리)
- `supabase/functions/naver-auth/index.ts` — Deno 런타임:
  1. `code` → 네이버 액세스 토큰 교환 (`NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, Supabase 시크릿으로 등록)
  2. 네이버 프로필 API(`GET /v1/nid/me`) 호출 → email 획득 (email 스코프 미동의 시 에러 반환)
  3. service_role 클라이언트로 기존 유저 조회(`admin.listUsers` 이메일 필터) → 있으면 `email_confirmed_at` 체크(안전장치) → 없으면 신규
  4. `admin.generateLink({ type: 'magiclink', email })` 로 토큰 발급, `{ email, hashed_token }` 형태로 프론트에 응답

## 환경 변수 / 외부 설정

- Naver Developers에서 앱 등록 필요 (Client ID/Secret 발급, redirect URI 등록: `https://<domain>/auth/naver/callback`)
- 프론트: `VITE_NAVER_CLIENT_ID`
- Edge Function (Supabase 시크릿): `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` (SUPABASE_URL/SERVICE_ROLE_KEY는 Edge Function 런타임에 자동 주입됨)

## 에러 처리

- 네이버 인가 거부/취소: 네이버가 `error` 쿼리파라미터로 콜백 → "네이버 로그인이 취소되었습니다" 후 `/login`으로
- state 불일치(CSRF 의심/뒤로가기 재사용): 에러 메시지 후 `/login`으로, Edge Function 호출 안 함
- 네이버 email 스코프 미동의: Edge Function이 에러 반환 → "이메일 제공에 동의해야 로그인할 수 있습니다"
- 기존 계정 있지만 이메일 미확인 상태(안전장치 발동): Edge Function이 에러 반환 → "먼저 이메일 인증을 완료해주세요" + 로그인 페이지 링크
- 네이버 토큰 교환/프로필 API 실패, Edge Function 자체 오류: 공통 "로그인에 실패했습니다. 다시 시도해주세요" (기존 LoginPage 패턴과 동일한 톤)

## 테스트

- `naverAuth.test.ts`: `buildNaverAuthorizeUrl`이 올바른 쿼리파라미터(client_id, redirect_uri, state)를 만드는지, `exchangeNaverCode`/`completeNaverSignIn`이 Supabase 함수 호출을 올바르게 감싸는지 (기존 `auth.test.ts` 패턴과 동일하게 mock)
- `NaverCallbackPage.test.tsx`: state 불일치, 네이버 에러 콜백, 성공 시 `/table` 이동, 각 실패 케이스 메시지 표시
- `NaverLoginButton.test.tsx`: 클릭 시 state 저장 + location 이동 호출
- Edge Function은 Deno 런타임이라 이 프로젝트의 Vitest 셋업 대상이 아님 — 자동 테스트는 프론트 쪽만 작성하고, Edge Function 자체는 네이버 개발자센터 테스트 계정으로 실제 플로우를 수동 검증한다
