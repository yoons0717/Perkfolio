import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VisitForm from './VisitForm'
import type { NewVisit } from '../types/visit'
import { detectSupportedPlatform, fetchCampaignInfo } from '../lib/campaignInfo'

vi.mock('../lib/campaignInfo', () => ({
  detectSupportedPlatform: vi.fn(),
  fetchCampaignInfo: vi.fn(),
}))

afterEach(() => vi.clearAllMocks())

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<VisitForm onSubmit={onSubmit} submitLabel="저장" pendingLabel="저장 중..." />)
  return { onSubmit }
}

async function fillRequiredFields(opts: { skip?: string[] } = {}) {
  const skip = opts.skip ?? []
  if (!skip.includes('플랫폼')) await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '포포몬')
  if (!skip.includes('카테고리')) await userEvent.selectOptions(screen.getByLabelText('카테고리'), '카페')
  if (!skip.includes('상태')) await userEvent.selectOptions(screen.getByLabelText('상태'), '예정')
  if (!skip.includes('리뷰 타입')) await userEvent.click(screen.getByRole('checkbox', { name: '블로그' }))
  await userEvent.type(screen.getByLabelText('업체명'), '카페 온도')
  if (!skip.includes('가게 정보 URL')) {
    await userEvent.type(screen.getByLabelText('가게 정보 URL (선택)'), 'https://store.example.com')
  }
  if (!skip.includes('체험 내역')) {
    await userEvent.type(screen.getByLabelText('체험 내역 (선택)'), '파스타 2, 음료 2')
  }
  await userEvent.clear(screen.getByLabelText('체험가'))
  await userEvent.type(screen.getByLabelText('체험가'), '48000')
  if (!skip.includes('체험(예정)일')) {
    await userEvent.type(screen.getByLabelText('체험(예정)일'), '2026-07-06{enter}')
  }
  if (!skip.includes('마감일')) {
    await userEvent.type(screen.getByLabelText('마감일'), '2026-09-01{enter}')
  }
  if (!skip.includes('체험단 URL')) {
    await userEvent.type(screen.getByLabelText('체험단 URL (선택)'), 'https://campaign.example.com')
  }
}

const requiredFieldLabels = ['업체명', '체험가']

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

  it('submits successfully with the visit date left empty, sending null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험(예정)일'] })
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.visitDate).toBeNull()
  })

  it('blocks submission when review deadline is cleared (native required validation)', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    const deadlineInput = screen.getByLabelText('마감일') as HTMLInputElement
    await userEvent.clear(deadlineInput)
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(deadlineInput.validity.valueMissing).toBe(true)
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

  it('submits when optional fields (포스팅 링크, 체험단 URL) are left empty', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험단 URL'] })
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('blocks submission and shows an error when no review type is checked', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['리뷰 타입'] })
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('리뷰 타입을 1개 이상 선택해주세요.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('starts with 플랫폼/카테고리/상태 unselected (placeholder), extra payment defaulting to 0, and no visit date prefilled', () => {
    renderForm()
    expect(screen.getByLabelText('플랫폼')).toHaveValue('')
    expect(screen.getByLabelText('카테고리')).toHaveValue('')
    expect(screen.getByLabelText('상태')).toHaveValue('')
    expect(screen.getByLabelText('추가결제액')).toHaveValue(0)
    expect(screen.getByLabelText('체험(예정)일')).toHaveValue('')
  })
})

describe('VisitForm submission payload', () => {
  it('submits the exact values entered, with non-default select values', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '캐시노트')
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '음식점')
    await userEvent.selectOptions(screen.getByLabelText('상태'), '리뷰완료')
    await userEvent.clear(screen.getByLabelText('추가결제액'))
    await userEvent.type(screen.getByLabelText('추가결제액'), '5000')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted).toMatchObject({
      platform: '캐시노트',
      storeName: '카페 온도',
      category: '음식점',
      reviewTypes: ['블로그'],
      storeInfoUrl: 'https://store.example.com',
      sponsoredItems: '파스타 2, 음료 2',
      retailValue: 48000,
      extraPayment: 5000,
      campaignUrl: 'https://campaign.example.com',
      reviewDeadline: '2026-09-01',
      status: '리뷰완료',
    })
    expect(submitted.visitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('submits a filled review deadline as a date string', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['마감일'] })
    await userEvent.type(screen.getByLabelText('마감일'), '2026-10-15{enter}')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.reviewDeadline).toBe('2026-10-15')
  })

  it('submits a filled post URL as-is', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }))
    await userEvent.type(screen.getByLabelText('포스팅 링크 1'), 'https://blog.example.com/post')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.postUrls).toEqual(['https://blog.example.com/post'])
  })

  it('drops a whitespace-only post URL entry from the submitted array', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }))
    await userEvent.type(screen.getByLabelText('포스팅 링크 1'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.postUrls).toEqual([])
  })

  it('removes a post URL row when its delete button is clicked', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }))
    await userEvent.type(screen.getByLabelText('포스팅 링크 1'), 'https://blog.example.com/a')
    await userEvent.click(screen.getByRole('button', { name: '+ 링크 추가' }))
    await userEvent.type(screen.getByLabelText('포스팅 링크 2'), 'https://blog.example.com/b')
    await userEvent.click(screen.getByRole('button', { name: '포스팅 링크 1 삭제' }))

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.postUrls).toEqual(['https://blog.example.com/b'])
  })

  it('submits an empty 체험단 URL as null, since a campaign post can disappear before it is captured', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험단 URL'] })

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.campaignUrl).toBeNull()
  })

  it('submits a whitespace-only 체험단 URL as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험단 URL'] })
    await userEvent.type(screen.getByLabelText('체험단 URL (선택)'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.campaignUrl).toBeNull()
  })

  it('submits an empty 가게 정보 URL as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['가게 정보 URL'] })

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.storeInfoUrl).toBeNull()
  })

  it('submits a whitespace-only 가게 정보 URL as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['가게 정보 URL'] })
    await userEvent.type(screen.getByLabelText('가게 정보 URL (선택)'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.storeInfoUrl).toBeNull()
  })

  it('submits an empty 체험 내역 as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험 내역'] })

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.sponsoredItems).toBeNull()
  })

  it('submits a whitespace-only 체험 내역 as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험 내역'] })
    await userEvent.type(screen.getByLabelText('체험 내역 (선택)'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.sponsoredItems).toBeNull()
  })

  it('submits a filled 예약 정보 as-is', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.type(screen.getByLabelText('예약 정보 (선택)'), '예약 필수, 저녁 7시')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.reservationNote).toBe('예약 필수, 저녁 7시')
  })

  it('submits an empty 예약 정보 as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.reservationNote).toBeNull()
  })

  it('submits a whitespace-only 예약 정보 as null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields()
    await userEvent.type(screen.getByLabelText('예약 정보 (선택)'), '   ')

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.reservationNote).toBeNull()
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
      reviewTypes: ['블로그', '릴스'],
      sponsoredItems: '세트메뉴',
      reservationNote: '예약 필수, 저녁 7시',
      campaignUrl: 'https://campaign.example.com/existing',
      storeInfoUrl: 'https://store.example.com/existing',
      retailValue: 30000,
      extraPayment: 2000,
      status: '리뷰완료',
      postUrls: ['https://blog.example.com/post'],
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
    expect(screen.getByRole('checkbox', { name: '블로그' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '릴스' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '클립' })).not.toBeChecked()
    expect(screen.getByLabelText('가게 정보 URL (선택)')).toHaveValue('https://store.example.com/existing')
    expect(screen.getByLabelText('체험 내역 (선택)')).toHaveValue('세트메뉴')
    expect(screen.getByLabelText('예약 정보 (선택)')).toHaveValue('예약 필수, 저녁 7시')
    expect(screen.getByLabelText('체험가')).toHaveValue(30000)
    expect(screen.getByLabelText('추가결제액')).toHaveValue(2000)
    expect(screen.getByLabelText('체험단 URL (선택)')).toHaveValue('https://campaign.example.com/existing')
    expect(screen.getByLabelText('포스팅 링크 1')).toHaveValue('https://blog.example.com/post')
    expect(screen.getByLabelText('플랫폼')).toHaveValue('레뷰')
    expect(screen.getByLabelText('카테고리')).toHaveValue('음식점')
    expect(screen.getByLabelText('상태')).toHaveValue('리뷰완료')
    expect(screen.getByLabelText('체험(예정)일')).toHaveValue('2026-08-15')
    expect(screen.getByLabelText('마감일')).toHaveValue('2026-08-20')
  })
})

describe('VisitForm 체험단 URL 가져오기', () => {
  it('disables the 가져오기 button when the campaign URL is empty', () => {
    renderForm()
    expect(screen.getByRole('button', { name: '가져오기' })).toBeDisabled()
  })

  it('shows a guide message about the supported sites by default', () => {
    renderForm()
    expect(
      screen.getByText(
        '디너의여왕·강남맛집 URL을 붙여넣으면 업체명·체험내역·마감일·예약정보를 자동으로 채워드려요.',
      ),
    ).toBeInTheDocument()
  })

  it('shows an error and does not call fetchCampaignInfo for an unsupported URL', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue(null)
    renderForm()
    await userEvent.type(screen.getByLabelText('체험단 URL (선택)'), 'https://revu.net/campaigns/1')
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    expect(await screen.findByText('지원하지 않는 사이트예요. 직접 입력해주세요.')).toBeInTheDocument()
    expect(fetchCampaignInfo).not.toHaveBeenCalled()
  })

  it('fills matching fields when fetchCampaignInfo succeeds', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue('디너의여왕')
    vi.mocked(fetchCampaignInfo).mockResolvedValue({
      platform: '디너의여왕',
      storeName: '최가네샤브버섯칼국수',
      sponsoredItems: '스페셜샤브샤브 2인',
      reviewDeadline: '2026-08-19',
      reservationNote: '예약 필수',
    })
    renderForm()
    await userEvent.type(
      screen.getByLabelText('체험단 URL (선택)'),
      'https://dinnerqueen.net/taste/1477357',
    )
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    expect(await screen.findByLabelText('업체명')).toHaveValue('최가네샤브버섯칼국수')
    expect(screen.getByLabelText('플랫폼')).toHaveValue('디너의여왕')
    expect(screen.getByLabelText('체험 내역 (선택)')).toHaveValue('스페셜샤브샤브 2인')
    expect(screen.getByLabelText('예약 정보 (선택)')).toHaveValue('예약 필수')
    expect(screen.getByLabelText('마감일')).toHaveValue('2026-08-19')
  })

  it('keeps existing field values when the response has null for that field', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue('디너의여왕')
    vi.mocked(fetchCampaignInfo).mockResolvedValue({
      platform: '디너의여왕',
      storeName: null,
      sponsoredItems: '스페셜샤브샤브 2인',
      reviewDeadline: null,
      reservationNote: null,
    })
    renderForm()
    await userEvent.type(screen.getByLabelText('업체명'), '기존 업체명')
    await userEvent.type(
      screen.getByLabelText('체험단 URL (선택)'),
      'https://dinnerqueen.net/taste/1477357',
    )
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    expect(await screen.findByLabelText('체험 내역 (선택)')).toHaveValue('스페셜샤브샤브 2인')
    expect(screen.getByLabelText('업체명')).toHaveValue('기존 업체명')
  })

  it('shows an error and changes no field when every response field is null', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue('디너의여왕')
    vi.mocked(fetchCampaignInfo).mockResolvedValue({
      platform: '디너의여왕',
      storeName: null,
      sponsoredItems: null,
      reviewDeadline: null,
      reservationNote: null,
    })
    renderForm()
    await userEvent.type(screen.getByLabelText('업체명'), '기존 업체명')
    await userEvent.type(
      screen.getByLabelText('체험단 URL (선택)'),
      'https://dinnerqueen.net/taste/1477357',
    )
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    expect(await screen.findByText('정보를 가져오지 못했어요. 직접 입력해주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('업체명')).toHaveValue('기존 업체명')
  })

  it('shows the thrown error message when fetchCampaignInfo rejects', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue('디너의여왕')
    vi.mocked(fetchCampaignInfo).mockRejectedValue(
      new Error('정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.'),
    )
    renderForm()
    await userEvent.type(
      screen.getByLabelText('체험단 URL (선택)'),
      'https://dinnerqueen.net/taste/1477357',
    )
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    expect(
      await screen.findByText('정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument()
  })

  it('shows a full-form overlay and marks the form inert while fetching', async () => {
    vi.mocked(detectSupportedPlatform).mockReturnValue('디너의여왕')
    let resolveFetch!: (info: Awaited<ReturnType<typeof fetchCampaignInfo>>) => void
    vi.mocked(fetchCampaignInfo).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    renderForm()
    await userEvent.type(
      screen.getByLabelText('체험단 URL (선택)'),
      'https://dinnerqueen.net/taste/1477357',
    )
    await userEvent.click(screen.getByRole('button', { name: '가져오기' }))

    const pendingButton = await screen.findByRole('button', { name: /가져오는 중/ })
    expect(pendingButton).toBeDisabled()
    // The overlay renders its own "가져오는 중..." text alongside the button's,
    // so more than one match is expected here.
    expect(screen.getAllByText('가져오는 중...').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('업체명').closest('[inert]')).not.toBeNull()

    resolveFetch({
      platform: '디너의여왕',
      storeName: '최가네샤브버섯칼국수',
      sponsoredItems: null,
      reviewDeadline: null,
      reservationNote: null,
    })

    await screen.findByRole('button', { name: '가져오기' })
    expect(screen.getByLabelText('업체명').closest('[inert]')).toBeNull()
  })
})
