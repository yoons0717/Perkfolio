import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VisitForm from './VisitForm'
import type { NewVisit } from '../types/visit'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<VisitForm onSubmit={onSubmit} submitLabel="저장" pendingLabel="저장 중..." />)
  return { onSubmit }
}

async function fillRequiredFields(opts: { skip?: string[] } = {}) {
  const skip = opts.skip ?? []
  if (!skip.includes('플랫폼')) await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '포포몬')
  if (!skip.includes('카테고리')) await userEvent.selectOptions(screen.getByLabelText('카테고리'), '카페')
  if (!skip.includes('상태')) await userEvent.selectOptions(screen.getByLabelText('상태'), '예정')
  await userEvent.type(screen.getByLabelText('업체명'), '카페 온도')
  await userEvent.type(screen.getByLabelText('가게 정보 URL'), 'https://store.example.com')
  await userEvent.type(screen.getByLabelText('체험 내역'), '파스타 2, 음료 2')
  await userEvent.clear(screen.getByLabelText('체험가'))
  await userEvent.type(screen.getByLabelText('체험가'), '48000')
  await userEvent.type(screen.getByLabelText('체험단 URL'), 'https://campaign.example.com')
}

const requiredFieldLabels = ['업체명', '가게 정보 URL', '체험 내역', '체험가', '체험단 URL']

describe('VisitForm validation', () => {
  it('does not submit when required fields are empty', async () => {
    const { onSubmit } = renderForm()
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each(requiredFieldLabels)('does not submit when %s is cleared', async (label) => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.clear(screen.getByLabelText(label))
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submission when visit date is cleared (native required validation)', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    const dateInput = screen.getByLabelText('방문일') as HTMLInputElement
    await userEvent.clear(dateInput)
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(dateInput.validity.valueMissing).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each(['플랫폼', '카테고리', '상태'])(
    'blocks submission when %s is left unselected (native required validation)',
    async (label) => {
      const { onSubmit } = renderForm()
      await fillRequiredFields({ skip: [label] })
      const select = screen.getByLabelText(label) as HTMLSelectElement
      await userEvent.click(screen.getByRole('button', { name: '저장' }))

      expect(select.validity.valueMissing).toBe(true)
      expect(onSubmit).not.toHaveBeenCalled()
    },
  )

  it('submits when optional fields (포스팅 링크, 마감일) are left empty', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('starts with 플랫폼/카테고리/상태 unselected (placeholder), and extra payment defaulting to 0', () => {
    renderForm()
    expect(screen.getByLabelText('플랫폼')).toHaveValue('')
    expect(screen.getByLabelText('카테고리')).toHaveValue('')
    expect(screen.getByLabelText('상태')).toHaveValue('')
    expect(screen.getByLabelText('추가결제액')).toHaveValue(0)
  })
})

describe('VisitForm submission payload', () => {
  it('submits the exact values entered, with non-default select values', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '캐시노트')
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '음식점')
    await userEvent.selectOptions(screen.getByLabelText('상태'), '방문완료')
    await userEvent.clear(screen.getByLabelText('추가결제액'))
    await userEvent.type(screen.getByLabelText('추가결제액'), '5000')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted).toMatchObject({
      platform: '캐시노트',
      storeName: '카페 온도',
      category: '음식점',
      storeInfoUrl: 'https://store.example.com',
      sponsoredItems: '파스타 2, 음료 2',
      retailValue: 48000,
      extraPayment: 5000,
      campaignUrl: 'https://campaign.example.com',
      postUrl: null,
      reviewDeadline: null,
      status: '방문완료',
    })
    expect(submitted.visitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('submits a filled review deadline as a date string', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.type(screen.getByLabelText('마감일 (선택)'), '2026-09-01{enter}')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.reviewDeadline).toBe('2026-09-01')
  })

  it('submits a filled post URL as-is', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.type(screen.getByLabelText('포스팅 링크 (선택)'), 'https://blog.example.com/post')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.postUrl).toBe('https://blog.example.com/post')
  })

  it('submits a whitespace-only post URL as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.type(screen.getByLabelText('포스팅 링크 (선택)'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.postUrl).toBeNull()
  })

  it('shows an error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network error'))
    renderForm(onSubmit)
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('disables the submit button and shows the pending label while submitting', async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    renderForm(onSubmit)
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const pendingButton = await screen.findByRole('button', { name: '저장 중...' })
    expect(pendingButton).toBeDisabled()

    resolveSubmit()
    await screen.findByRole('button', { name: '저장' })
  })
})

describe('VisitForm with initialValues', () => {
  it('pre-fills fields from initialValues', () => {
    const initialValues: NewVisit = {
      visitDate: '2026-08-15',
      platform: '레뷰',
      storeName: '기존 업체',
      category: '음식점',
      sponsoredItems: '세트메뉴',
      campaignUrl: 'https://campaign.example.com/existing',
      storeInfoUrl: 'https://store.example.com/existing',
      retailValue: 30000,
      extraPayment: 2000,
      status: '방문완료',
      postUrl: 'https://blog.example.com/post',
      reviewDeadline: '2026-08-20',
    }
    render(
      <VisitForm
        initialValues={initialValues}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        submitLabel="수정"
        pendingLabel="수정 중..."
      />,
    )

    expect(screen.getByLabelText('업체명')).toHaveValue('기존 업체')
    expect(screen.getByLabelText('가게 정보 URL')).toHaveValue('https://store.example.com/existing')
    expect(screen.getByLabelText('체험 내역')).toHaveValue('세트메뉴')
    expect(screen.getByLabelText('체험가')).toHaveValue(30000)
    expect(screen.getByLabelText('추가결제액')).toHaveValue(2000)
    expect(screen.getByLabelText('체험단 URL')).toHaveValue('https://campaign.example.com/existing')
    expect(screen.getByLabelText('포스팅 링크 (선택)')).toHaveValue('https://blog.example.com/post')
    expect(screen.getByLabelText('플랫폼')).toHaveValue('레뷰')
    expect(screen.getByLabelText('카테고리')).toHaveValue('음식점')
    expect(screen.getByLabelText('상태')).toHaveValue('방문완료')
    expect(screen.getByLabelText('방문일')).toHaveValue('2026-08-15')
    expect(screen.getByLabelText('마감일 (선택)')).toHaveValue('2026-08-20')
  })
})
