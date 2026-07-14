export type Profile = {
  userId: string
  blogUrl: string
  updatedAt: string
}

export type NewProfile = Omit<Profile, 'userId' | 'updatedAt'>
