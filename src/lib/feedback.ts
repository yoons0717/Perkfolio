import { supabase } from './supabaseClient'
import type { Feedback, NewFeedback } from '../types/feedback'

type FeedbackRow = {
  id: string
  type: Feedback['type']
  content: string
  created_at: string
  user_email: string | null
  admin_reply: string | null
  replied_at: string | null
}

function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
    userEmail: row.user_email,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
  }
}

export async function addFeedback(feedback: NewFeedback): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    type: feedback.type,
    content: feedback.content,
    user_email: feedback.userEmail,
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

export async function getMyFeedbackList(userId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as FeedbackRow[]).map(toFeedback)
}

export async function replyToFeedback(id: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .update({ admin_reply: reply, replied_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase.from('feedback').delete().eq('id', id)

  if (error) throw error
}
