import { describe, expect, it } from 'vitest'
import { ADMIN_EMAIL, isAdmin } from './admin'

describe('isAdmin', () => {
  it('returns true for the admin email', () => {
    expect(isAdmin(ADMIN_EMAIL)).toBe(true)
  })

  it('returns false for a non-admin email', () => {
    expect(isAdmin('other@example.com')).toBe(false)
  })

  it('returns false when email is undefined', () => {
    expect(isAdmin(undefined)).toBe(false)
  })

  it('returns false when email is null', () => {
    expect(isAdmin(null)).toBe(false)
  })
})
