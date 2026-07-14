import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import Card from './Card'
import Spinner from './Spinner'
import UnlinkBlogModal from './UnlinkBlogModal'
import { inputClass } from './formStyles'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../lib/profiles'
import type { Profile } from '../types/profile'

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
}

function initialFormFields(profile: Profile | null): FormFields {
  return {
    blogUrl: profile?.blogUrl ?? '',
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
      const saved = await upsertProfile(userId as string, { blogUrl })
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
      <Card>
        <h2 className="mb-2 font-display text-sm font-bold text-ink">내 블로그</h2>
        <p className="text-sm text-danger">
          블로그 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
        </p>
      </Card>
    )
  }

  if (profile === undefined) {
    return (
      <Card>
        <h2 className="mb-2 font-display text-sm font-bold text-ink">내 블로그</h2>
        <Spinner />
      </Card>
    )
  }

  if (mode === 'edit') {
    return (
      <Card>
        <h2 className="mb-4 font-display text-sm font-bold text-ink">내 블로그</h2>
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
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <h2 className="mb-2 font-display text-sm font-bold text-ink">내 블로그</h2>
        <p className="mb-4 text-sm text-muted">
          아직 등록된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.
        </p>
        <Button onClick={startEdit}>블로그 등록하기</Button>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="mb-2 font-display text-sm font-bold text-ink">내 블로그</h2>
      <a
        href={profile.blogUrl}
        target="_blank"
        rel="noreferrer"
        className="mb-4 block truncate text-sm font-semibold text-blue hover:underline"
      >
        {profile.blogUrl}
      </a>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={startEdit} className="flex-1">
          수정
        </Button>
        <Button variant="danger" onClick={() => setIsUnlinkModalOpen(true)} className="flex-1">
          삭제
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
    </Card>
  )
}
