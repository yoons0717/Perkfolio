# 대시보드 커스텀 그래프 설계

**목적:** 오늘 제거한 "전체 통계"(마감임박/플랫폼랭킹/월별트렌드) 대신, 사용자가 원하는 그래프만 골라서 추가하는 기능.

**검토한 대안:** 고정 위젯 켜고끄기(A) → 축/지표를 자유롭게 조합하는 완전 빌더(B, 표현력은 넓지만 "상태별 평균절감액" 같은 무의미한 조합 발생) → **채택: 축만 고르고 지표는 항상 "평균 절감액"으로 고정(C)** — 무의미한 조합이 애초에 안 생기고 구현도 단순.

## 1. 데이터 모델

- 신규 테이블 `dashboard_graphs`: `id`, `user_id` (FK), `axis` (`category` | `platform` | `month`), `chart_type` (`bar` | `line`, month 축에서만 의미 있음), `scope` (`all` | `period`, category/platform 축에서만 의미 있음), `created_at`
- 개수 제한 없음, 사용자가 자유롭게 추가/삭제
- 신규/기존 계정 모두 기본값은 빈 목록 (아무 그래프도 없음)

## 2. 축별 규칙

- **축 = 월**: `chart_type` 선택 가능(막대/라인), `scope`는 항상 `all` 고정 (이번 달로 필터링하면 막대 하나만 남아 무의미)
- **축 = 카테고리 / 플랫폼**: `chart_type`은 항상 `bar` 고정 (순서 없는 범주형 축엔 라인이 안 맞음), `scope` 선택 가능(전체/이번 달)
- `status`(상태)는 축 후보에서 제외 — 예정 상태는 애초에 절감액 집계 대상이 아님

## 3. 계산 로직 (`src/lib/visitStats.ts`)

- 신규 함수 `computeGraphData(visits, axis)`: 주어진 축 기준으로 group-by 후 `{ label, avgNet, count }[]` 반환 — `computeCategoryBreakdown`/`computePlatformRanking`의 avgNet 계산 로직을 축 무관하게 일반화
- `scope: 'period'`인 그래프는 호출 전에 기간 필터링된 visits를 넘기고, `scope: 'all'`/월 축은 전체 visits를 넘김 (필터링은 호출부 책임, 함수 자체는 축 그룹핑만 담당)
- 기존 `computeMonthlyTrend`/`computePlatformRanking`/`computeUpcomingDeadlines`는 그대로 유지 (미사용 상태지만 삭제하지 않음 — 마감임박은 이 기능 범위 밖)

## 4. UI (`src/pages/DashboardPage.tsx`)

- "이번 달 요약" Section 아래 새 카드: "+ 그래프 추가" — 축/차트종류(또는 고정 안내)/기간연동(또는 고정 안내) 선택 후 저장
- 저장된 그래프는 카드 목록으로 렌더링, 각 카드에 삭제 버튼
- 막대 위/옆에 건수(`count`)를 항상 참고 정보로 같이 표시 (기존 카테고리분포/플랫폼랭킹과 동일 패턴)
- 라인 차트는 recharts `LineChart` 재사용 (오늘 제거하면서 패키지는 남겨둠)

## 5. 테스트 갱신 대상

- `src/lib/visitStats.test.ts` — `computeGraphData` 축별(category/platform/month) 그룹핑 및 평균 계산
- `src/lib/dashboardGraphs.ts`(신규) + 테스트 — Supabase CRUD (조회/생성/삭제)
- `src/pages/DashboardPage.test.tsx` — 그래프 추가/삭제, 축=월일 때 필드 고정 동작

## 범위 밖

- 저장된 그래프 순서 변경(드래그 정렬)
- 지표(Y축) 선택 — 평균 절감액 고정
- 마감임박 위젯 부활 — 이번 기능 범위 아님, 필요해지면 별도로 다룸
