# 네이버 소셜 로그인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 네이버 계정으로 로그인/회원가입할 수 있게 한다.

**Architecture:** 프론트는 전체 페이지 리다이렉트로 네이버 인가 → 콜백 페이지가 Supabase Edge Function을 호출해 코드를 교환 → Edge Function이 `generateLink(magiclink)`로 토큰을 발급 → 프론트가 `verifyOtp`로 세션을 완성한다. 상세 설계는 `docs/superpowers/specs/2026-07-08-naver-social-login-design.md` 참고.

**Tech Stack:** React/TS, react-router, Supabase JS, Supabase Edge Function(Deno), Vitest + RTL.

## Global Constraints
- Supabase 호출은 `src/lib`에서만 (컴포넌트 직접 호출 금지)
- import는 상대 경로
- 버튼은 `Button.tsx` 재사용 가능한 형태로, `<button>` 직접 스타일링 금지
- 커밋은 태스크 단위로, 각 태스크는 `npm run test:run` 통과 후 커밋

---

### Task 0: 사전 준비 (수동, 코드 아님)
- Naver Developers에서 앱 등록, redirect URI로 `http://localhost:5173/auth/naver/callback` + 배포 도메인 등록, Client ID/Secret 발급
- `.env.local`에 `VITE_NAVER_CLIENT_ID` 추가
- Supabase 시크릿에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 등록: `supabase secrets set NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=...`

### Task 1: `src/lib/naverAuth.ts` — 프론트 데이터 접근 모듈

**Files:** Create `src/lib/naverAuth.ts`, `src/lib/naverAuth.test.ts`

```ts
import { supabase } from './supabaseClient'

const NAVER_AUTHORIZE_URL = 'https://nid.naver.com/oauth2.0/authorize'

export function buildNaverAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_NAVER_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/naver/callback`,
    state,
  })
  return `${NAVER_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeNaverCode(
  code: string,
  state: string,
): Promise<{ email: string; token: string }> {
  const { data, error } = await supabase.functions.invoke('naver-auth', {
    body: { code, state },
  })
  if (error) throw error
  return data
}

export function completeNaverSignIn(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
}
```

테스트 (`auth.test.ts`와 동일하게 `supabaseClient`를 mock):

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildNaverAuthorizeUrl, exchangeNaverCode, completeNaverSignIn } from './naverAuth'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    auth: { verifyOtp: vi.fn() },
  },
}))

afterEach(() => vi.clearAllMocks())

describe('buildNaverAuthorizeUrl', () => {
  it('includes client_id, redirect_uri, state', () => {
    const url = buildNaverAuthorizeUrl('abc123')
    expect(url).toContain('state=abc123')
    expect(url).toContain('response_type=code')
    expect(url).toContain(encodeURIComponent('/auth/naver/callback'))
  })
})

describe('exchangeNaverCode', () => {
  it('invokes the naver-auth function and returns data', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { email: 'a@b.com', token: 'tok' },
      error: null,
    } as never)
    const result = await exchangeNaverCode('code1', 'state1')
    expect(supabase.functions.invoke).toHaveBeenCalledWith('naver-auth', {
      body: { code: 'code1', state: 'state1' },
    })
    expect(result).toEqual({ email: 'a@b.com', token: 'tok' })
  })

  it('throws when the function returns an error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('boom'),
    } as never)
    await expect(exchangeNaverCode('c', 's')).rejects.toThrow('boom')
  })
})

describe('completeNaverSignIn', () => {
  it('calls verifyOtp with magiclink type', () => {
    completeNaverSignIn('a@b.com', 'tok')
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'a@b.com',
      token: 'tok',
      type: 'magiclink',
    })
  })
})
```

- [ ] 위 파일 작성 후 `npm run test:run` 통과 확인, 커밋: `git commit -m "Add naverAuth lib for Naver OAuth bridge"`

### Task 2: `NaverLoginButton` 컴포넌트

**Files:** Create `src/components/NaverLoginButton.tsx`, `src/components/NaverLoginButton.test.tsx`
**Consumes:** `buildNaverAuthorizeUrl` from Task 1

```tsx
import Button from './Button'
import { buildNaverAuthorizeUrl } from '../lib/naverAuth'

export default function NaverLoginButton() {
  function handleClick() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_oauth_state', state)
    window.location.href = buildNaverAuthorizeUrl(state)
  }

  return (
    <Button type="button" onClick={handleClick} className="bg-[#03C75A] text-white">
      네이버로 시작하기
    </Button>
  )
}
```

테스트:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NaverLoginButton from './NaverLoginButton'

afterEach(() => vi.clearAllMocks())

describe('NaverLoginButton', () => {
  it('stores a state and redirects on click', () => {
    delete (window as unknown as { location: unknown }).location
    window.location = { href: '' } as Location
    render(<NaverLoginButton />)
    fireEvent.click(screen.getByRole('button', { name: '네이버로 시작하기' }))
    expect(sessionStorage.getItem('naver_oauth_state')).toBeTruthy()
    expect(window.location.href).toContain('nid.naver.com')
  })
})
```

- [ ] `npm run test:run` 통과 확인, 커밋: `git commit -m "Add NaverLoginButton component"`

### Task 3: `NaverCallbackPage` + 라우트

**Files:** Create `src/pages/NaverCallbackPage.tsx`, `src/pages/NaverCallbackPage.test.tsx`; Modify `src/App.tsx`
**Consumes:** `exchangeNaverCode`, `completeNaverSignIn` from Task 1

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeNaverCode, completeNaverSignIn } from '../lib/naverAuth'

export default function NaverCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const naverError = params.get('error')
      const savedState = sessionStorage.getItem('naver_oauth_state')
      sessionStorage.removeItem('naver_oauth_state')

      if (naverError) {
        setError('네이버 로그인이 취소되었습니다.')
        return
      }
      if (!code || !state || state !== savedState) {
        setError('로그인 요청이 올바르지 않습니다. 다시 시도해주세요.')
        return
      }

      try {
        const { email, token } = await exchangeNaverCode(code, state)
        const { error: otpError } = await completeNaverSignIn(email, token)
        if (otpError) {
          setError('로그인에 실패했습니다. 다시 시도해주세요.')
          return
        }
        navigate('/table')
      } catch (err) {
        console.error(err)
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
      }
    }
    run()
  }, [navigate])

  if (error) {
    return (
      <div className="mx-auto mt-24 w-full max-w-sm px-4 text-center">
        <p className="mb-3 text-sm text-danger">{error}</p>
        <a href="/login" className="text-blue text-sm">로그인 페이지로 돌아가기</a>
      </div>
    )
  }

  return <div className="mx-auto mt-24 w-full max-w-sm px-4 text-center text-sm text-muted">로그인 처리 중...</div>
}
```

테스트 (핵심 케이스만):

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NaverCallbackPage from './NaverCallbackPage'
import { exchangeNaverCode, completeNaverSignIn } from '../lib/naverAuth'

vi.mock('../lib/naverAuth', () => ({
  exchangeNaverCode: vi.fn(),
  completeNaverSignIn: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

function renderAt(search: string) {
  window.history.pushState({}, '', `/auth/naver/callback${search}`)
  return render(
    <MemoryRouter initialEntries={[`/auth/naver/callback${search}`]}>
      <NaverCallbackPage />
    </MemoryRouter>,
  )
}

describe('NaverCallbackPage', () => {
  it('shows error when state does not match', async () => {
    sessionStorage.setItem('naver_oauth_state', 'expected')
    renderAt('?code=abc&state=wrong')
    expect(await screen.findByText(/올바르지 않습니다/)).toBeInTheDocument()
  })

  it('shows error on naver error callback', async () => {
    renderAt('?error=access_denied')
    expect(await screen.findByText(/취소되었습니다/)).toBeInTheDocument()
  })

  it('completes sign-in and shows success path on match', async () => {
    sessionStorage.setItem('naver_oauth_state', 'st1')
    vi.mocked(exchangeNaverCode).mockResolvedValue({ email: 'a@b.com', token: 'tok' })
    vi.mocked(completeNaverSignIn).mockResolvedValue({ error: null } as never)
    renderAt('?code=abc&state=st1')
    await waitFor(() => expect(completeNaverSignIn).toHaveBeenCalledWith('a@b.com', 'tok'))
  })
})
```

App.tsx에 라우트 추가 (import 및 `<Routes>` 내부):

```tsx
import NaverCallbackPage from './pages/NaverCallbackPage'
// ...
<Route path="/auth/naver/callback" element={<NaverCallbackPage />} />
```

- [ ] `npm run test:run` 통과 확인, 커밋: `git commit -m "Add NaverCallbackPage and route"`

### Task 4: `NaverLoginButton`을 로그인/회원가입 페이지에 배치

**Files:** Modify `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`

각 폼 하단(제출 버튼 아래, 링크 위)에 구분선과 함께 배치:

```tsx
<NaverLoginButton />
```

- [ ] 두 페이지 렌더 확인 (`npm run dev`로 육안 확인), `npm run test:run` 통과, 커밋: `git commit -m "Add Naver login option to Login/Signup pages"`

### Task 5: Edge Function `supabase/functions/naver-auth`

**Files:** Create `supabase/functions/naver-auth/index.ts`

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const { code, state } = await req.json()

  const tokenRes = await fetch(
    `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${state}`,
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return new Response(JSON.stringify({ error: '네이버 인증에 실패했습니다.' }), { status: 400 })
  }

  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  const email = profileData.response?.email
  if (!email) {
    return new Response(
      JSON.stringify({ error: '이메일 제공에 동의해야 로그인할 수 있습니다.' }),
      { status: 400 },
    )
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: existing } = await admin.auth.admin.listUsers()
  const existingUser = existing.users.find((u) => u.email === email)
  if (existingUser && !existingUser.email_confirmed_at) {
    return new Response(
      JSON.stringify({ error: '먼저 이메일 인증을 완료해주세요.' }),
      { status: 409 },
    )
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError) {
    return new Response(JSON.stringify({ error: '로그인에 실패했습니다.' }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ email, token: linkData.properties.hashed_token }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
```

- [ ] 배포: `supabase functions deploy naver-auth`
- [ ] Naver Developers 테스트 계정으로 실제 로그인 플로우 수동 검증 (Task 0의 redirect URI로 전체 플로우 실행 → `/table` 도착 확인)
- [ ] 커밋: `git commit -m "Add naver-auth Edge Function"`

---

## Self-Review 메모
- 설계 문서의 모든 결정 사항(자동 연결 + email_confirmed_at 안전장치, 전체 페이지 리다이렉트, generateLink/verifyOtp 브릿지)이 각 태스크에 반영됨
- `listUsers()`가 프로젝트 유저 수가 많아지면 페이지네이션이 필요할 수 있음 — 지금은 개인/소수 유저 앱이라 생략, 유저가 늘면 이메일 필터링 방식 재검토 필요
