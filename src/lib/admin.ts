export const ADMIN_EMAIL = 'yoons0717@gmail.com'

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL
}
