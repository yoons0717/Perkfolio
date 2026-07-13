export type Profile = {
  userId: string
  blogUrl: string
  blogName: string | null
  blogDescription: string | null
  updatedAt: string
}

export type NewProfile = Omit<Profile, 'userId' | 'updatedAt'>
