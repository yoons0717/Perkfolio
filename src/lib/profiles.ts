import { supabase } from './supabaseClient'
import type { NewProfile, Profile } from '../types/profile'

type ProfileRow = {
  user_id: string
  blog_url: string
  updated_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    blogUrl: row.blog_url,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? toProfile(data as ProfileRow) : null
}

export async function upsertProfile(userId: string, profile: NewProfile): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        blog_url: profile.blogUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) throw error
  return toProfile(data as ProfileRow)
}

export async function deleteProfile(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('user_id', userId)
  if (error) throw error
}
