import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GraphBuilderForm from './GraphBuilderForm'

afterEach(() => {
  vi.clearAllMocks()
})

describe('GraphBuilderForm', () => {
  it('defaults to axis=category with chart type fixed to bar and scope selectable', () => {
    render(<GraphBuilderForm onSave={vi.fn()} />)

    expect(screen.getByLabelText('축')).toHaveValue('category')
    expect(screen.queryByLabelText('차트 종류')).not.toBeInTheDocument()
    expect(screen.getByText('막대 고정')).toBeInTheDocument()
    expect(screen.getByLabelText('기간')).toBeInTheDocument()
  })

  it('switching axis to month reveals chart type select and fixes scope to 전체 고정', async () => {
    render(<GraphBuilderForm onSave={vi.fn()} />)

    await userEvent.selectOptions(screen.getByLabelText('축'), '월')

    expect(screen.getByLabelText('차트 종류')).toBeInTheDocument()
    expect(screen.queryByLabelText('기간')).not.toBeInTheDocument()
    expect(screen.getByText('전체 고정')).toBeInTheDocument()
  })

  it('switching axis back to category/platform restores scope select and fixes chart type to bar', async () => {
    render(<GraphBuilderForm onSave={vi.fn()} />)

    await userEvent.selectOptions(screen.getByLabelText('축'), '월')
    await userEvent.selectOptions(screen.getByLabelText('차트 종류'), '라인')
    await userEvent.selectOptions(screen.getByLabelText('축'), '플랫폼')

    expect(screen.queryByLabelText('차트 종류')).not.toBeInTheDocument()
    expect(screen.getByText('막대 고정')).toBeInTheDocument()
    expect(screen.getByLabelText('기간')).toHaveValue('all')
  })

  it('saves category axis with chartType forced to bar and the selected scope', async () => {
    const onSave = vi.fn()
    render(<GraphBuilderForm onSave={onSave} />)

    await userEvent.selectOptions(screen.getByLabelText('기간'), '이번 달')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSave).toHaveBeenCalledWith({ axis: 'category', chartType: 'bar', scope: 'period' })
  })

  it('saves month axis with the selected chartType and scope forced to all', async () => {
    const onSave = vi.fn()
    render(<GraphBuilderForm onSave={onSave} />)

    await userEvent.selectOptions(screen.getByLabelText('축'), '월')
    await userEvent.selectOptions(screen.getByLabelText('차트 종류'), '라인')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSave).toHaveBeenCalledWith({ axis: 'month', chartType: 'line', scope: 'all' })
  })
})
