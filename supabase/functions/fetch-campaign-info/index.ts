import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveTarget } from './resolveTarget.ts'
import type { CampaignInfo } from './parsers/common.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FETCH_TIMEOUT_MS = 10000
const MAX_FETCH_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const GENERIC_FETCH_ERROR = '정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.'

type Deps = {
  verifyUser: (authHeader: string | null) => Promise<boolean>
  fetchImpl: typeof fetch
  retryDelayMs?: number
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const isAuthed = await deps.verifyUser(authHeader)
    if (!isAuthed) {
      return jsonResponse({ error: '인증 정보가 없습니다.' }, 401)
    }

    let url: unknown
    try {
      const body = await req.json()
      url = body?.url
    } catch {
      return jsonResponse({ error: '올바른 URL이 아니에요.' }, 400)
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(typeof url === 'string' ? url.trim() : '')
    } catch {
      return jsonResponse({ error: '올바른 URL이 아니에요.' }, 400)
    }

    const target = resolveTarget(parsedUrl.hostname)
    if (!target) {
      return jsonResponse({ error: '지원하지 않는 사이트예요. 직접 입력해주세요.' }, 400)
    }

    const retryDelayMs = deps.retryDelayMs ?? RETRY_DELAY_MS
    let res: Response | null = null
    for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
      try {
        const candidate = await fetchWithTimeout(deps.fetchImpl, parsedUrl.toString())
        if (candidate.ok) {
          res = candidate
          break
        }
        console.error(
          `target fetch returned non-ok for ${parsedUrl.hostname} (attempt ${attempt}/${MAX_FETCH_ATTEMPTS}): ${candidate.status} ${candidate.statusText}`,
        )
      } catch (fetchErr) {
        console.error(
          `target fetch threw for ${parsedUrl.hostname} (attempt ${attempt}/${MAX_FETCH_ATTEMPTS}):`,
          fetchErr,
        )
      }
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(retryDelayMs)
      }
    }

    if (!res) {
      return jsonResponse({ error: GENERIC_FETCH_ERROR }, 502)
    }

    const html = await res.text()
    const info: CampaignInfo = target.parse(html)
    return jsonResponse(info)
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: GENERIC_FETCH_ERROR }, 500)
  }
}

async function verifyUser(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data, error } = await client.auth.getUser()
  return !error && !!data.user
}

if (import.meta.main) {
  Deno.serve((req) => handleRequest(req, { verifyUser, fetchImpl: fetch }))
}
