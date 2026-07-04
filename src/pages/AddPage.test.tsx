import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AddPage from './AddPage'
import { addVisit } from '../lib/visits'
import type { NewVisit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  addVisit: vi.fn(),
}))

function renderAddPage() {
  render(
    <MemoryRouter initialEntries={['/add']}>
      <Routes>
        <Route path="/add" element={<AddPage />} />
        <Route path="/table" element={<div>표 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillRequiredFields() {
  await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '포포몬')
  await userEvent.selectOptions(screen.getByLabelText('카테고리'), '카페')
  await userEvent.selectOptions(screen.getByLabelText('상태'), '예정')
  await userEvent.type(screen.getByLabelText('업체명'), '카페 온도')
  await userEvent.type(screen.getByLabelText('가게 정보 URL'), 'https://store.example.com')
  await userEvent.type(screen.getByLabelText('체험 내역'), '파스타 2, 음료 2')
  await userEvent.clear(screen.getByLabelText('체험가'))
  await userEvent.type(screen.getByLabelText('체험가'), '48000')
  await userEvent.type(screen.getByLabelText('체험단 URL (선택)'), 'https://campaign.example.com')
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('AddPage', () => {
  it('calls addVisit with the form data and navigates to /table on success', async () => {
    vi.mocked(addVisit).mockResolvedValue({} as never)
    renderAddPage()

    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(addVisit).toHaveBeenCalledTimes(1)
    const submitted = vi.mocked(addVisit).mock.calls[0][0] as NewVisit
    expect(submitted).toMatchObject({
      storeName: '카페 온도',
      storeInfoUrl: 'https://store.example.com',
      sponsoredItems: '파스타 2, 음료 2',
      retailValue: 48000,
      campaignUrl: 'https://campaign.example.com',
    })

    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })

  it('stays on the page and shows an error when addVisit fails', async () => {
    vi.mocked(addVisit).mockRejectedValue(new Error('network error'))
    renderAddPage()

    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument()
    expect(screen.queryByText('표 화면')).not.toBeInTheDocument()
  })
})
