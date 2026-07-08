import { supabase } from './supabaseClient'
import type { Feedback, NewFeedback } from '../types/feedback'

type FeedbackRow = {
  id: string
  type: Feedback['type']
  content: string
  created_at: string
}

function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function addFeedback(feedback: NewFeedback): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    type: feedback.type,
    content: feedback.content,
  })

  if (error) throw error
}

export async function getFeedbackList(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as FeedbackRow[]).map(toFeedback)
}
