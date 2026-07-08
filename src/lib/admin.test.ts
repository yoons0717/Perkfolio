import { describe, expect, it } from 'vitest'
import { isAdmin } from './admin'

describe('isAdmin', () => {
  it('returns true when app_metadata has the admin role', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
  })

  it('returns false for a non-admin role', () => {
    expect(isAdmin({ role: 'user' })).toBe(false)
  })

  it('returns false when app_metadata has no role', () => {
    expect(isAdmin({})).toBe(false)
  })

  it('returns false when app_metadata is undefined', () => {
    expect(isAdmin(undefined)).toBe(false)
  })

  it('returns false when app_metadata is null', () => {
    expect(isAdmin(null)).toBe(false)
  })
})
