import type { UserAppMetadata } from '@supabase/supabase-js'

export function isAdmin(appMetadata: UserAppMetadata | null | undefined): boolean {
  return appMetadata?.role === 'admin'
}
