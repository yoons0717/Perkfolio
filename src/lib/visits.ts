import { supabase } from './supabaseClient'
import type { NewVisit, Visit } from '../types/visit'

type VisitRow = {
  id: string
  visit_date: string | null
  platform: Visit['platform']
  store_name: string
  category: Visit['category']
  sponsored_items: string
  campaign_url: string | null
  store_info_url: string
  retail_value: number
  extra_payment: number
  status: Visit['status']
  post_url: string | null
  review_deadline: string | null
  created_at: string
}

function toVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    visitDate: row.visit_date,
    platform: row.platform,
    storeName: row.store_name,
    category: row.category,
    sponsoredItems: row.sponsored_items,
    campaignUrl: row.campaign_url,
    storeInfoUrl: row.store_info_url,
    retailValue: row.retail_value,
    extraPayment: row.extra_payment,
    status: row.status,
    postUrl: row.post_url,
    reviewDeadline: row.review_deadline,
    createdAt: row.created_at,
  }
}

export async function getVisits(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .order('visit_date', { ascending: false })

  if (error) throw error
  return (data as VisitRow[]).map(toVisit)
}

export async function getVisit(id: string): Promise<Visit> {
  const { data, error } = await supabase.from('visits').select('*').eq('id', id).single()
  if (error) throw error
  return toVisit(data as VisitRow)
}

export async function addVisit(visit: NewVisit): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .insert({
      visit_date: visit.visitDate,
      platform: visit.platform,
      store_name: visit.storeName,
      category: visit.category,
      sponsored_items: visit.sponsoredItems,
      campaign_url: visit.campaignUrl,
      store_info_url: visit.storeInfoUrl,
      retail_value: visit.retailValue,
      extra_payment: visit.extraPayment,
      status: visit.status,
      post_url: visit.postUrl,
      review_deadline: visit.reviewDeadline,
    })
    .select()
    .single()

  if (error) throw error
  return toVisit(data as VisitRow)
}

export async function updateVisit(id: string, visit: NewVisit): Promise<Visit> {
  const { data, error } = await supabase
    .from('visits')
    .update({
      visit_date: visit.visitDate,
      platform: visit.platform,
      store_name: visit.storeName,
      category: visit.category,
      sponsored_items: visit.sponsoredItems,
      campaign_url: visit.campaignUrl,
      store_info_url: visit.storeInfoUrl,
      retail_value: visit.retailValue,
      extra_payment: visit.extraPayment,
      status: visit.status,
      post_url: visit.postUrl,
      review_deadline: visit.reviewDeadline,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toVisit(data as VisitRow)
}

export async function deleteVisit(id: string): Promise<void> {
  const { error } = await supabase.from('visits').delete().eq('id', id)
  if (error) throw error
}
