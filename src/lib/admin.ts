export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL
}
