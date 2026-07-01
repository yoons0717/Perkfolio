import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { addVisit } from '../lib/visits'
import type { Category, Platform, VisitStatus } from '../types/visit'

const platforms: Platform[] = [
  '포포몬',
  '강남맛집',
  '캐시노트',
  '서울오빠',
  '디너의여왕',
  '리뷰노트',
  '레뷰',
]

const categories: Category[] = ['카페', '음식점', '기타']

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AddPage() {
  const navigate = useNavigate()
  const [visitDate, setVisitDate] = useState<Date | null>(new Date())
  const [platform, setPlatform] = useState<Platform>(platforms[0])
  const [storeName, setStoreName] = useState('')
  const [category, setCategory] = useState<Category>(categories[0])
  const [sponsoredItems, setSponsoredItems] = useState('')
  const [retailValue, setRetailValue] = useState('')
  const [extraPayment, setExtraPayment] = useState('0')
  const [postUrl, setPostUrl] = useState('')
  const [status, setStatus] = useState<VisitStatus>('예정')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!visitDate) return
    setError(null)
    setSubmitting(true)

    try {
      await addVisit({
        visitDate: toDateString(visitDate),
        platform,
        storeName,
        category,
        sponsoredItems,
        retailValue: Number(retailValue),
        extraPayment: Number(extraPayment),
        status,
        postUrl: postUrl.trim() === '' ? null : postUrl.trim(),
      })
      navigate('/table')
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md px-4">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">협찬 방문 입력</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          방문일
          <DatePicker
            selected={visitDate}
            onChange={(date: Date | null) => setVisitDate(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          플랫폼
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          업체명
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          카테고리
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          협찬 내역
          <input
            type="text"
            placeholder="예: 파스타 2, 음료 2"
            value={sponsoredItems}
            onChange={(e) => setSponsoredItems(e.target.value)}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          정가
          <input
            type="number"
            min="0"
            value={retailValue}
            onChange={(e) => setRetailValue(e.target.value)}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          추가 결제액
          <input
            type="number"
            min="0"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          포스팅 링크 (선택)
          <input
            type="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          상태
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-blue focus:outline-none"
          >
            <option value="예정">예정</option>
            <option value="완료">완료</option>
          </select>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-blue px-3 py-2 font-display text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
