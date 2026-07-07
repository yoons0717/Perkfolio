import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Button from './Button'
import Select from './Select'
import { inputClass, selectClass, sectionLabelClass } from './formStyles'
import { toDateString } from '../lib/format'
import { statusOrder } from '../lib/statusStyle'
import { categories, platforms } from '../types/visit'
import type { Category, NewVisit, Platform, VisitStatus } from '../types/visit'

// Slightly shorter than the shared inputClass/selectClass so the whole form
// fits on one screen without scrolling; other pages keep the taller default
// since they match it against buttons/selects elsewhere.
const compactInputClass = inputClass.replace('py-3', 'py-2')
const compactSelectClass = selectClass.replace('py-3', 'py-2')

function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
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
  sponsoredItems: string
  campaignUrl: string
  storeInfoUrl: string
  retailValue: string
  extraPayment: string
  postUrl: string
  reviewDeadline: Date | null
  status: VisitStatus | ''
}

function initialFormFields(initialValues: NewVisit | undefined): FormFields {
  return {
    visitDate: initialValues?.visitDate ? parseDateString(initialValues.visitDate) : null,
    platform: initialValues?.platform ?? '',
    storeName: initialValues?.storeName ?? '',
    category: initialValues?.category ?? '',
    sponsoredItems: initialValues?.sponsoredItems ?? '',
    campaignUrl: initialValues?.campaignUrl ?? '',
    storeInfoUrl: initialValues?.storeInfoUrl ?? '',
    retailValue: String(initialValues?.retailValue ?? ''),
    extraPayment: String(initialValues?.extraPayment ?? 0),
    postUrl: initialValues?.postUrl ?? '',
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

  const {
    visitDate,
    platform,
    storeName,
    category,
    sponsoredItems,
    campaignUrl,
    storeInfoUrl,
    retailValue,
    extraPayment,
    postUrl,
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
    setSubmitting(true)

    try {
      await onSubmit({
        visitDate: visitDate ? toDateString(visitDate) : null,
        platform: platform as Platform,
        storeName,
        category: category as Category,
        sponsoredItems,
        campaignUrl: campaignUrl.trim() === '' ? null : campaignUrl.trim(),
        storeInfoUrl,
        retailValue: Number(retailValue),
        extraPayment: Number(extraPayment),
        status: status as VisitStatus,
        postUrl: postUrl.trim() === '' ? null : postUrl.trim(),
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

        <FormField label="가게 정보 URL">
          <input
            type="url"
            value={storeInfoUrl}
            onChange={(e) => updateField('storeInfoUrl', e.target.value)}
            required
            className={compactInputClass}
          />
        </FormField>

        <FormField label="체험 내역">
          <input
            type="text"
            placeholder="예: 파스타 2, 음료 2"
            value={sponsoredItems}
            onChange={(e) => updateField('sponsoredItems', e.target.value)}
            required
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

        <FormField label="포스팅 링크 (선택)">
          <input
            type="url"
            value={postUrl}
            onChange={(e) => updateField('postUrl', e.target.value)}
            className={compactInputClass}
          />
        </FormField>
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
