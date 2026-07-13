import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import Spinner from './Spinner'
import UnlinkBlogModal from './UnlinkBlogModal'
import { inputClass } from './formStyles'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../lib/profiles'
import type { Profile } from '../types/profile'

function trimToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

type FormFields = {
  blogUrl: string
  blogName: string
  blogDescription: string
}

function initialFormFields(profile: Profile | null): FormFields {
  return {
    blogUrl: profile?.blogUrl ?? '',
    blogName: profile?.blogName ?? '',
    blogDescription: profile?.blogDescription ?? '',
  }
}

export default function BlogLinkCard() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false)
  const [fields, setFields] = useState<FormFields>(() => initialFormFields(null))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoadError(false)
    getProfile(userId)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setFields(initialFormFields(p))
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!session || !userId) return null

  function startEdit() {
    setFields(initialFormFields(profile ?? null))
    setError(null)
    setMode('edit')
  }

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const blogUrl = fields.blogUrl.trim()
    if (!isHttpUrl(blogUrl)) {
      setError('http:// 또는 https://로 시작하는 주소를 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const saved = await upsertProfile(userId as string, {
        blogUrl,
        blogName: trimToNull(fields.blogName),
        blogDescription: trimToNull(fields.blogDescription),
      })
      setProfile(saved)
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 font-display text-sm font-bold text-ink">블로그 연동</h2>
        <p className="text-sm text-danger">
          블로그 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
        </p>
      </div>
    )
  }

  if (profile === undefined) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 font-display text-sm font-bold text-ink">블로그 연동</h2>
        <Spinner />
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">블로그 연동</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            블로그 URL
            <input
              type="url"
              required
              className={inputClass}
              value={fields.blogUrl}
              onChange={(e) => updateField('blogUrl', e.target.value)}
              placeholder="https://blog.naver.com/yourid"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            블로그명 (선택)
            <input
              type="text"
              className={inputClass}
              value={fields.blogName}
              onChange={(e) => updateField('blogName', e.target.value)}
              placeholder="블로그 이름"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            소개 (선택)
            <textarea
              className={inputClass}
              value={fields.blogDescription}
              onChange={(e) => updateField('blogDescription', e.target.value)}
              placeholder="블로그를 한 줄로 소개해보세요"
              rows={2}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                setError(null)
                setMode('view')
              }}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 font-display text-sm font-bold text-ink">블로그 연동</h2>
        <p className="mb-4 text-sm text-muted">
          아직 연동된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.
        </p>
        <Button onClick={startEdit}>블로그 연동하기</Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-2 font-display text-sm font-bold text-ink">블로그 연동</h2>
      {profile.blogName && (
        <p className="font-display text-base font-extrabold text-ink">{profile.blogName}</p>
      )}
      {profile.blogDescription && (
        <p className="mb-3 text-sm text-muted">{profile.blogDescription}</p>
      )}
      <a
        href={profile.blogUrl}
        target="_blank"
        rel="noreferrer"
        className="mb-4 inline-block text-sm font-semibold text-blue hover:underline"
      >
        바로가기
      </a>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={startEdit} className="flex-1">
          수정
        </Button>
        <Button variant="danger" onClick={() => setIsUnlinkModalOpen(true)} className="flex-1">
          연동 해제
        </Button>
      </div>
      {isUnlinkModalOpen && (
        <UnlinkBlogModal
          userId={userId}
          onClose={() => setIsUnlinkModalOpen(false)}
          onUnlinked={() => {
            setProfile(null)
            setIsUnlinkModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
