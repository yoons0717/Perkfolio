import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Select from './Select'
import { inputClass, selectClass, sectionLabelClass } from './formStyles'
import { toDateString } from '../lib/format'
import { statusOrder } from '../lib/statusStyle'
import { platforms } from '../types/visit'
import type { Category, NewVisit, Platform, VisitStatus } from '../types/visit'

const categories: Category[] = ['카페', '음식점', '술집', '기타']

function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

type VisitFormProps = {
  initialValues?: NewVisit
  onSubmit: (visit: NewVisit) => Promise<void>
  submitLabel: string
  pendingLabel: string
  footerExtra?: ReactNode
}

export default function VisitForm({
  initialValues,
  onSubmit,
  submitLabel,
  pendingLabel,
  footerExtra,
}: VisitFormProps) {
  const [visitDate, setVisitDate] = useState<Date | null>(
    initialValues ? parseDateString(initialValues.visitDate) : new Date(),
  )
  const [platform, setPlatform] = useState<Platform | ''>(initialValues?.platform ?? '')
  const [storeName, setStoreName] = useState(initialValues?.storeName ?? '')
  const [category, setCategory] = useState<Category | ''>(initialValues?.category ?? '')
  const [sponsoredItems, setSponsoredItems] = useState(initialValues?.sponsoredItems ?? '')
  const [campaignUrl, setCampaignUrl] = useState(initialValues?.campaignUrl ?? '')
  const [storeInfoUrl, setStoreInfoUrl] = useState(initialValues?.storeInfoUrl ?? '')
  const [retailValue, setRetailValue] = useState(String(initialValues?.retailValue ?? ''))
  const [extraPayment, setExtraPayment] = useState(String(initialValues?.extraPayment ?? 0))
  const [postUrl, setPostUrl] = useState(initialValues?.postUrl ?? '')
  const [reviewDeadline, setReviewDeadline] = useState<Date | null>(
    initialValues?.reviewDeadline ? parseDateString(initialValues.reviewDeadline) : null,
  )
  const [status, setStatus] = useState<VisitStatus | ''>(initialValues?.status ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // visitDate/platform/category/status are guaranteed non-empty here: each
    // field is `required` (DatePicker/Select), so the browser blocks submit
    // before this handler runs if any of them is empty.
    setError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        visitDate: toDateString(visitDate as Date),
        platform: platform as Platform,
        storeName,
        category: category as Category,
        sponsoredItems,
        campaignUrl,
        storeInfoUrl,
        retailValue: Number(retailValue),
        extraPayment: Number(extraPayment),
        status: status as VisitStatus,
        postUrl: postUrl.trim() === '' ? null : postUrl.trim(),
        reviewDeadline: reviewDeadline ? toDateString(reviewDeadline) : null,
      })
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            방문일
            <DatePicker
              selected={visitDate}
              onChange={(date: Date | null) => setVisitDate(date)}
              dateFormat="yyyy-MM-dd"
              className={`w-full ${inputClass}`}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            플랫폼
            <Select
              aria-label="플랫폼"
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className={selectClass}
            >
              <option value="" disabled hidden>
                선택하세요
              </option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          리뷰 마감일 (선택)
          <DatePicker
            selected={reviewDeadline}
            onChange={(date: Date | null) => setReviewDeadline(date)}
            dateFormat="yyyy-MM-dd"
            isClearable
            placeholderText="마감일 없음"
            className={`w-full ${inputClass}`}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            업체명
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            카테고리
            <Select
              aria-label="카테고리"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={selectClass}
            >
              <option value="" disabled hidden>
                선택하세요
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          가게 정보 URL
          <input
            type="url"
            value={storeInfoUrl}
            onChange={(e) => setStoreInfoUrl(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          체험 내역
          <input
            type="text"
            placeholder="예: 파스타 2, 음료 2"
            value={sponsoredItems}
            onChange={(e) => setSponsoredItems(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            정가
            <input
              type="number"
              min="0"
              value={retailValue}
              onChange={(e) => setRetailValue(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            추가 결제액
            <input
              type="number"
              min="0"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          상태
          <Select
            aria-label="상태"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus)}
            className={selectClass}
          >
            <option value="" disabled hidden>
              선택하세요
            </option>
            {statusOrder.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <p className={sectionLabelClass}>링크</p>

        <label className="flex flex-col gap-1 text-sm">
          체험단 URL
          <input
            type="url"
            value={campaignUrl}
            onChange={(e) => setCampaignUrl(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          포스팅 링크 (선택)
          <input
            type="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-blue px-3 py-2 font-display text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? pendingLabel : submitLabel}
        </button>
        {footerExtra}
      </div>
    </form>
  )
}
