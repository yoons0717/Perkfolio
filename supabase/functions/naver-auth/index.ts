import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { code, state } = await req.json()

  const tokenRes = await fetch(
    `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${state}`,
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return new Response(JSON.stringify({ error: '네이버 인증에 실패했습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  if (!profileRes.ok || profileData.resultcode !== '00') {
    return new Response(JSON.stringify({ error: '로그인에 실패했습니다. 다시 시도해주세요.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const email = profileData.response?.email?.toLowerCase()
  if (!email) {
    return new Response(
      JSON.stringify({ error: '이메일 제공에 동의해야 로그인할 수 있습니다.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return new Response(JSON.stringify({ error: '로그인에 실패했습니다. 다시 시도해주세요.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const existingUser = existing.users.find((u) => u.email === email)
  if (existingUser && !existingUser.email_confirmed_at) {
    return new Response(
      JSON.stringify({ error: '먼저 이메일 인증을 완료해주세요.' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError) {
    return new Response(JSON.stringify({ error: '로그인에 실패했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      email,
      token: linkData.properties.hashed_token,
      type: linkData.properties.verification_type,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
