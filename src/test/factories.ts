import type { Visit } from '../types/visit'
import type { Feedback } from '../types/feedback'
import type { MoneyVisit } from '../lib/visitStats'

export function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: '1',
    visitDate: '2026-01-10',
    platform: '포포몬',
    storeName: '카페 온도',
    category: '카페',
    reviewTypes: [],
    sponsoredItems: '음료 2',
    reservationNote: null,
    campaignUrl: 'https://campaign.example.com',
    storeInfoUrl: 'https://store.example.com',
    retailValue: 10000,
    extraPayment: 0,
    status: '예정',
    postUrls: [],
    reviewDeadline: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// retailValue가 non-null임이 보장된 Visit이 필요한 테스트용 (netSaved 등 MoneyVisit을 받는 함수용).
// overrides에 retailValue: null을 넘기지 않는 한 makeVisit의 기본값(10000)이 유지된다.
export function makeMoneyVisit(overrides: Partial<Visit> = {}): MoneyVisit {
  return makeVisit(overrides) as MoneyVisit
}

export function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: '1',
    type: '버그',
    content: '버튼이 안 눌려요',
    createdAt: '2026-01-01T00:00:00.000Z',
    userEmail: 'user@example.com',
    adminReply: null,
    repliedAt: null,
    ...overrides,
  }
}
