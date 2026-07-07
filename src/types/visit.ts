export type Platform =
  | '포포몬'
  | '강남맛집'
  | '캐시노트'
  | '서울오빠'
  | '디너의여왕'
  | '리뷰노트'
  | '레뷰'

export const platforms: Platform[] = [
  '포포몬',
  '강남맛집',
  '캐시노트',
  '서울오빠',
  '디너의여왕',
  '리뷰노트',
  '레뷰',
]

export type Category = '카페' | '음식점' | '술집' | '기타'

export const categories: Category[] = ['카페', '음식점', '술집', '기타']

export type VisitStatus = '예정' | '리뷰완료'

export type Visit = {
  id: string
  visitDate: string | null
  platform: Platform
  storeName: string
  category: Category
  sponsoredItems: string
  campaignUrl: string | null
  storeInfoUrl: string
  retailValue: number
  extraPayment: number
  status: VisitStatus
  postUrl: string | null
  reviewDeadline: string | null
  createdAt: string
}

export type NewVisit = Omit<Visit, 'id' | 'createdAt'>
