import { describe, expect, it } from 'vitest'
import { isAdmin } from './admin'

describe('isAdmin', () => {
  it('returns true for the admin email', () => {
    expect(isAdmin('yoons0717@gmail.com')).toBe(true)
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
