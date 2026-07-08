export type FeedbackType = '버그' | '건의'

export type Feedback = {
  id: string
  type: FeedbackType
  content: string
  createdAt: string
}

export type NewFeedback = Omit<Feedback, 'id' | 'createdAt'>
