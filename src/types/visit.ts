export type Platform =
  | '포포몬'
  | '강남맛집'
  | '캐시노트'
  | '서울오빠'
  | '디너의여왕'
  | '리뷰노트'
  | '레뷰'
  | '슈퍼멤버스'

export const platforms: Platform[] = [
  '포포몬',
  '강남맛집',
  '캐시노트',
  '서울오빠',
  '디너의여왕',
  '리뷰노트',
  '레뷰',
  '슈퍼멤버스',
]

export type Category = '카페' | '음식점' | '술집' | '기타'

export const categories: Category[] = ['카페', '음식점', '술집', '기타']

export type ReviewType = '블로그' | '클립' | '유튜브' | '인스타 게시물' | '릴스'

export const reviewTypes: ReviewType[] = ['블로그', '클립', '유튜브', '인스타 게시물', '릴스']

export type VisitStatus = '예정' | '리뷰완료'

export type Visit = {
  id: string
  visitDate: string | null
  platform: Platform
  storeName: string
  category: Category
  reviewTypes: ReviewType[]
  sponsoredItems: string | null
  reservationNote: string | null
  campaignUrl: string | null
  storeInfoUrl: string | null
  retailValue: number
  extraPayment: number
  status: VisitStatus
  postUrls: string[]
  reviewDeadline: string | null
  createdAt: string
}

export type NewVisit = Omit<Visit, 'id' | 'createdAt'>
