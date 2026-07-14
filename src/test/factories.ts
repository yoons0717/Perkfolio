import type { Visit } from '../types/visit'
import type { Feedback } from '../types/feedback'
import type { DashboardGraph } from '../types/dashboardGraph'

export function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: '1',
    visitDate: '2026-01-10',
    platform: '포포몬',
    storeName: '카페 온도',
    category: '카페',
    sponsoredItems: '음료 2',
    reservationNote: null,
    campaignUrl: 'https://campaign.example.com',
    storeInfoUrl: 'https://store.example.com',
    retailValue: 10000,
    extraPayment: 0,
    status: '예정',
    postUrl: null,
    reviewDeadline: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: '1',
    type: '버그',
    content: '버튼이 안 눌려요',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeDashboardGraph(overrides: Partial<DashboardGraph> = {}): DashboardGraph {
  return {
    id: '1',
    axis: 'category',
    chartType: 'bar',
    scope: 'all',
    metric: 'avgNet',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
