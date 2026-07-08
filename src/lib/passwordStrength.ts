export interface PasswordRequirement {
  key: 'length' | 'uppercase' | 'lowercase' | 'special'
  label: string
  met: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { key: 'length', label: '8자 이상', met: password.length >= 8 },
    { key: 'uppercase', label: '대문자 포함', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: '소문자 포함', met: /[a-z]/.test(password) },
    { key: 'special', label: '특수문자 포함', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordRequirements(password).every((r) => r.met)
}
