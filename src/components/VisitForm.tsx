import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Button from './Button'
import Select from './Select'
import { inputClass, selectClass, sectionLabelClass } from './formStyles'
import { toDateString } from '../lib/format'
import { statusOrder } from '../lib/statusStyle'
import { categories, platforms, reviewTypes as reviewTypeOptions } from '../types/visit'
import type { Category, NewVisit, Platform, ReviewType, VisitStatus } from '../types/visit'

// Slightly shorter than the shared inputClass/selectClass so the whole form
// fits on one screen without scrolling; other pages keep the taller default
// since they match it against buttons/selects elsewhere.
const compactInputClass = inputClass.replace('py-3', 'py-2')
const compactSelectClass = selectClass.replace('py-3', 'py-2')

function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  )
}

type FormFields = {
  visitDate: Date | null
  platform: Platform | ''
  storeName: string
  category: Category | ''
  reviewTypes: ReviewType[]
  sponsoredItems: string
  reservationNote: string
  campaignUrl: string
  storeInfoUrl: string
  retailValue: string
  extraPayment: string
  postUrls: string[]
  reviewDeadline: Date | null
  status: VisitStatus | ''
}

function initialFormFields(initialValues: NewVisit | undefined): FormFields {
  return {
    visitDate: initialValues?.visitDate ? parseDateString(initialValues.visitDate) : null,
    platform: initialValues?.platform ?? '',
    storeName: initialValues?.storeName ?? '',
    category: initialValues?.category ?? '',
    reviewTypes: initialValues?.reviewTypes ?? [],
    sponsoredItems: initialValues?.sponsoredItems ?? '',
    reservationNote: initialValues?.reservationNote ?? '',
    campaignUrl: initialValues?.campaignUrl ?? '',
    storeInfoUrl: initialValues?.storeInfoUrl ?? '',
    retailValue: String(initialValues?.retailValue ?? ''),
    extraPayment: String(initialValues?.extraPayment ?? 0),
    postUrls: initialValues?.postUrls ?? [],
    reviewDeadline: initialValues?.reviewDeadline ? parseDateString(initialValues.reviewDeadline) : null,
    status: initialValues?.status ?? '',
  }
}

type VisitFormProps = {
  initialValues?: NewVisit
  onSubmit: (visit: NewVisit) => Promise<void>
  submitLabel: string
  pendingLabel: string
  footerExtra?: (submitting: boolean) => ReactNode
}

export default function VisitForm({
  initialValues,
  onSubmit,
  submitLabel,
  pendingLabel,
  footerExtra,
}: VisitFormProps) {
  const [fields, setFields] = useState<FormFields>(() => initialFormFields(initialValues))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function toggleReviewType(rt: ReviewType) {
    updateField(
      'reviewTypes',
      reviewTypes.includes(rt) ? reviewTypes.filter((t) => t !== rt) : [...reviewTypes, rt],
    )
  }

  function updatePostUrl(index: number, value: string) {
    updateField(
      'postUrls',
      postUrls.map((u, i) => (i === index ? value : u)),
    )
  }

  function addPostUrl() {
    updateField('postUrls', [...postUrls, ''])
  }

  function removePostUrl(index: number) {
    updateField(
      'postUrls',
      postUrls.filter((_, i) => i !== index),
    )
  }

  const {
    visitDate,
    platform,
    storeName,
    category,
    reviewTypes,
    sponsoredItems,
    reservationNote,
    campaignUrl,
    storeInfoUrl,
    retailValue,
    extraPayment,
    postUrls,
    reviewDeadline,
    status,
  } = fields

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // platform/category/status/reviewDeadline are guaranteed non-empty here
    // (each is `required`, so the browser blocks submit before this handler
    // runs). visitDate is NOT required — it may be null when the actual
    // visit date isn't confirmed yet.
    setError(null)

    if (reviewTypes.length === 0) {
      setError('리뷰 타입을 1개 이상 선택해주세요.')
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        visitDate: visitDate ? toDateString(visitDate) : null,
        platform: platform as Platform,
        storeName,
        category: category as Category,
        reviewTypes,
        sponsoredItems: trimToNull(sponsoredItems),
        reservationNote: trimToNull(reservationNote),
        campaignUrl: trimToNull(campaignUrl),
        storeInfoUrl: trimToNull(storeInfoUrl),
        retailValue: Number(retailValue),
        extraPayment: Number(extraPayment),
        status: status as VisitStatus,
        postUrls: postUrls.map((u) => u.trim()).filter((u) => u !== ''),
        reviewDeadline: toDateString(reviewDeadline as Date),
      })
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="체험(예정)일">
            <DatePicker
              selected={visitDate}
              onChange={(date: Date | null) => updateField('visitDate', date)}
              dateFormat="yyyy-MM-dd"
              className={`w-full ${compactInputClass}`}
              isClearable
            />
          </FormField>

          <FormField label="플랫폼">
            <Select
              aria-label="플랫폼"
              required
              value={platform}
              onChange={(e) => updateField('platform', e.target.value as Platform)}
              className={compactSelectClass}
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
          </FormField>
        </div>

        <FormField label="마감일">
          <DatePicker
            selected={reviewDeadline}
            onChange={(date: Date | null) => updateField('reviewDeadline', date)}
            dateFormat="yyyy-MM-dd"
            className={`w-full ${compactInputClass}`}
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="업체명">
            <input
              type="text"
              value={storeName}
              onChange={(e) => updateField('storeName', e.target.value)}
              required
              className={compactInputClass}
            />
          </FormField>

          <FormField label="카테고리">
            <Select
              aria-label="카테고리"
              required
              value={category}
              onChange={(e) => updateField('category', e.target.value as Category)}
              className={compactSelectClass}
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
          </FormField>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span>리뷰 타입</span>
          <div role="group" aria-label="리뷰 타입" className="flex flex-wrap gap-x-4 gap-y-2">
            {reviewTypeOptions.map((rt) => (
              <label key={rt} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={reviewTypes.includes(rt)}
                  onChange={() => toggleReviewType(rt)}
                  className="h-4 w-4 accent-blue"
                />
                {rt}
              </label>
            ))}
          </div>
        </div>

        <FormField label="가게 정보 URL (선택)">
          <input
            type="url"
            value={storeInfoUrl}
            onChange={(e) => updateField('storeInfoUrl', e.target.value)}
            className={compactInputClass}
          />
        </FormField>

        <FormField label="체험 내역 (선택)">
          <input
            type="text"
            placeholder="예: 파스타 2, 음료 2"
            value={sponsoredItems}
            onChange={(e) => updateField('sponsoredItems', e.target.value)}
            className={compactInputClass}
          />
        </FormField>

        <FormField label="예약 정보 (선택)">
          <input
            type="text"
            placeholder="예: 예약 필수, 저녁 7시"
            value={reservationNote}
            onChange={(e) => updateField('reservationNote', e.target.value)}
            className={compactInputClass}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="체험가">
            <input
              type="number"
              min="0"
              value={retailValue}
              onChange={(e) => updateField('retailValue', e.target.value)}
              required
              className={compactInputClass}
            />
          </FormField>

          <FormField label="추가결제액">
            <input
              type="number"
              min="0"
              value={extraPayment}
              onChange={(e) => updateField('extraPayment', e.target.value)}
              className={compactInputClass}
            />
          </FormField>
        </div>

        <FormField label="상태">
          <Select
            aria-label="상태"
            required
            value={status}
            onChange={(e) => updateField('status', e.target.value as VisitStatus)}
            className={compactSelectClass}
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
        </FormField>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <p className={sectionLabelClass}>링크</p>

        <FormField label="체험단 URL (선택)">
          <input
            type="url"
            value={campaignUrl}
            onChange={(e) => updateField('campaignUrl', e.target.value)}
            className={compactInputClass}
          />
        </FormField>

        <div className="flex flex-col gap-1 text-sm">
          <span>포스팅 링크 (선택)</span>
          <div className="flex flex-col gap-2">
            {postUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  aria-label={`포스팅 링크 ${i + 1}`}
                  value={url}
                  onChange={(e) => updatePostUrl(i, e.target.value)}
                  className={`flex-1 ${compactInputClass}`}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removePostUrl(i)}
                  aria-label={`포스팅 링크 ${i + 1} 삭제`}
                  className="shrink-0 px-3"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addPostUrl}
              className="self-start border-dashed text-sm text-blue hover:bg-blue-bg"
            >
              + 링크 추가
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? pendingLabel : submitLabel}
        </Button>
        {footerExtra?.(submitting)}
      </div>
    </form>
  )
}
