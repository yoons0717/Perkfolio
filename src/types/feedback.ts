export type FeedbackType = '버그' | '건의'

export const feedbackTypeLabel: Record<FeedbackType, string> = {
  버그: '버그 제보',
  건의: '건의사항',
}

export type Feedback = {
  id: string
  type: FeedbackType
  content: string
  createdAt: string
  userEmail: string | null
  adminReply: string | null
  repliedAt: string | null
}

export type NewFeedback = Omit<Feedback, 'id' | 'createdAt' | 'adminReply' | 'repliedAt'>
