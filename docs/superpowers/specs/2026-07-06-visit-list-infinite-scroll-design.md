# 방문 목록 무한스크롤 설계

## 배경

`TablePage`는 `useVisits()`로 전체 방문 기록을 한 번에 가져온 뒤, 상태/플랫폼 필터와 컬럼 정렬을 전부 클라이언트에서 처리한다(`visible` = 필터링+정렬된 배열). 방문 기록이 많아지면 이 배열 전체를 표/카드로 한 번에 렌더링하는 비용이 커진다.

네트워크/DB 호출 자체를 페이지 단위로 나누는 방식(서버 사이드 페이지네이션)도 검토했지만, 그러려면 정렬·필터를 Supabase 쿼리로 다시 구현해야 하고 특히 `순절감액`(체험가 - 추가결제액, 클라이언트에서 계산되는 값) 정렬은 SQL로 옮기기 까다롭다. 개인용 도구 규모에서 이 비용을 들일 이유가 없다고 판단, **데이터는 지금처럼 한 번에 가져오되 화면에는 일부만 그리다가 스크롤에 따라 더 그리는** 방식으로 범위를 좁혔다.

## 범위

- `TablePage`의 표(데스크탑)/카드(모바일) 목록 렌더링에만 적용
- `CalendarPage`, `DashboardPage`는 건드리지 않음 — 캘린더는 월 단위로 이미 범위가 좁고, 대시보드는 기간 전체 합계/차트가 필요해서 자르면 안 됨
- `lib/visits.ts`(`getVisits`)나 Supabase 쿼리는 변경하지 않음

## 아키텍처

### `src/hooks/useInfiniteScroll.ts` (신규)

```ts
function useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize = 20): {
  displayCount: number
  sentinelRef: RefObject<HTMLDivElement>
}
```

- `displayCount` state, 초기값 `Math.min(batchSize, totalCount)`
- `resetKey`가 바뀌면(filter/sort 변경 시) `displayCount`를 다시 `batchSize`로 리셋
- `sentinelRef`가 가리키는 엘리먼트가 뷰포트에 들어오면(`IntersectionObserver`) `displayCount`를 `batchSize`만큼 증가(단, `totalCount`를 넘지 않게)
- `totalCount`가 `displayCount`보다 작아지는 경우(필터링으로 목록이 줄어든 경우)도 방어적으로 클램프

훅으로 분리하는 이유: `TablePage` 자체 로직과 섞지 않고 이 동작만 독립적으로 테스트하기 위함.

### `src/pages/TablePage.tsx`

- `useInfiniteScroll(visible.length, \`${statusFilter}-${platformFilter}-${sortKey}-${sortDir}\`)` 호출
- 실제 렌더링 대상은 `visible.slice(0, displayCount)` — 표 `tbody`와 모바일 카드 목록 둘 다 이 슬라이스를 사용
- 목록(표 `tbody` 또는 카드 리스트) 맨 끝에 `<div ref={sentinelRef} />` 추가. 높이 없는 빈 div로, 스크롤 트리거 역할만 함
- CSV 내보내기는 기존대로 `visible`(슬라이스 전 전체 필터링 결과)을 사용 — 화면에 몇 개가 보이든 내보내기는 전체 필터링 결과여야 하므로 변경 없음

## 엣지 케이스

- 필터/정렬 변경 시 `displayCount`가 20으로 리셋되어, 스크롤해서 늘어났던 목록이 필터를 바꾸는 순간 다시 처음 20개부터 보이게 됨
- 전체 목록이 20개 이하이면 sentinel이 사실상 항상 뷰포트 안에 있어도 `displayCount`가 이미 `totalCount`와 같으므로 추가 로드가 일어나지 않음(클램프 처리)
- `IntersectionObserver`가 없는 테스트 환경(jsdom)에서는 훅 테스트에서 모킹해서 검증

## 테스트

- `src/hooks/useInfiniteScroll.test.ts`: `IntersectionObserver`를 모킹해서
  - 초기 `displayCount`가 `batchSize`(또는 `totalCount`가 더 작으면 그 값)인지
  - sentinel이 교차하면 `displayCount`가 `batchSize`만큼 늘어나는지, `totalCount`를 넘지 않는지
  - `resetKey`가 바뀌면 `displayCount`가 다시 `batchSize`로 돌아가는지
- `src/pages/TablePage.test.tsx`: 21개 이상의 방문 기록을 넣었을 때 처음엔 20개 행/카드만 렌더되는지 확인하는 테스트 추가 (기존 테스트는 그대로 유지, 21개 미만인 기존 테스트에는 영향 없음)

## 스코프 밖

- 서버 사이드 페이지네이션, 정렬/필터의 DB 쿼리 이관
- 캘린더/대시보드 데이터 페칭 최적화
- 가상 스크롤(windowing) — 지금 규모에서는 20개 단위 렌더링 정도로 충분하다고 판단
