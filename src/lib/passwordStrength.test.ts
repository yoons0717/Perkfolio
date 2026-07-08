import { describe, expect, it } from 'vitest'
import { getPasswordRequirements, isPasswordStrong } from './passwordStrength'

describe('getPasswordRequirements', () => {
  it('marks all requirements unmet for an empty password', () => {
    const requirements = getPasswordRequirements('')
    expect(requirements.every((r) => !r.met)).toBe(true)
  })

  it('marks length as met at 8 characters and unmet below it', () => {
    expect(getPasswordRequirements('Ab1!567').find((r) => r.key === 'length')?.met).toBe(false)
    expect(getPasswordRequirements('Ab1!5678').find((r) => r.key === 'length')?.met).toBe(true)
  })

  it('marks uppercase, lowercase, and special requirements independently', () => {
    const requirements = getPasswordRequirements('abcdefgh')
    expect(requirements.find((r) => r.key === 'uppercase')?.met).toBe(false)
    expect(requirements.find((r) => r.key === 'lowercase')?.met).toBe(true)
    expect(requirements.find((r) => r.key === 'special')?.met).toBe(false)
  })
})

describe('isPasswordStrong', () => {
  it('returns true when all requirements are met', () => {
    expect(isPasswordStrong('Password123!')).toBe(true)
  })

  it('returns false when any requirement is missing', () => {
    expect(isPasswordStrong('password123!')).toBe(false) // no uppercase
    expect(isPasswordStrong('PASSWORD123!')).toBe(false) // no lowercase
    expect(isPasswordStrong('Passw1rd')).toBe(false) // no special char
    expect(isPasswordStrong('Pw1!')).toBe(false) // too short
  })
})
