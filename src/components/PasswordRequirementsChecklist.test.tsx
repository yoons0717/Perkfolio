import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PasswordRequirementsChecklist from './PasswordRequirementsChecklist'

describe('PasswordRequirementsChecklist', () => {
  it('renders nothing when the password is empty', () => {
    const { container } = render(<PasswordRequirementsChecklist password="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows unmet requirements once typing starts', () => {
    render(<PasswordRequirementsChecklist password="abc" />)
    expect(screen.getByText('8자 이상')).toBeInTheDocument()
    expect(screen.getByText('대문자 포함')).toBeInTheDocument()
    expect(screen.getByText('소문자 포함')).toBeInTheDocument()
    expect(screen.getByText('특수문자 포함')).toBeInTheDocument()
  })

  it('marks a requirement as met once satisfied', () => {
    render(<PasswordRequirementsChecklist password="Password123!" />)
    expect(screen.getByText('8자 이상')).toHaveClass('text-positive')
    expect(screen.getByText('대문자 포함')).toHaveClass('text-positive')
  })

  it('keeps an unmet requirement styled as muted', () => {
    render(<PasswordRequirementsChecklist password="password" />)
    expect(screen.getByText('대문자 포함')).toHaveClass('text-muted')
  })
})
