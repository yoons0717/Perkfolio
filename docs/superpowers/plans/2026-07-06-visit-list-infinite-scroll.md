# 방문 목록 무한스크롤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `TablePage`의 표/카드 목록을 한 번에 20개씩만 렌더링하고, 스크롤이 목록 끝에 닿으면 자동으로 20개씩 더 보여준다(무한스크롤).

**Architecture:** 데이터 페칭(`getVisits`)과 필터/정렬(`visible` 배열 계산)은 그대로 두고, 그 결과를 몇 개까지 화면에 그릴지만 관리하는 재사용 가능한 훅 `useInfiniteScroll`을 새로 만든다. `TablePage`는 이 훅이 반환하는 `displayCount`로 `visible`을 슬라이스해서 렌더링하고, 목록 끝에 `sentinelRef`를 붙인 빈 `div`를 둬서 `IntersectionObserver`가 스크롤을 감지하게 한다.

**Tech Stack:** React 19 훅(`useState`/`useEffect`/`useRef`), 브라우저 `IntersectionObserver` API, Vitest + React Testing Library.

## Global Constraints

- 서버 사이드 페이지네이션 없음 — `lib/visits.ts`, `getVisits()`, Supabase 쿼리는 변경하지 않는다 (스펙: `docs/superpowers/specs/2026-07-06-visit-list-infinite-scroll-design.md`)
- 적용 범위는 `TablePage`(표+카드)뿐 — `CalendarPage`, `DashboardPage`는 변경하지 않는다
- 배치 크기 20, 스크롤 트리거는 `IntersectionObserver` 기반 무한스크롤(버튼 아님)
- 필터/정렬이 바뀌면 표시 개수는 20으로 리셋된다
- CSV 내보내기는 화면에 보이는 개수(`displayCount`)가 아니라 필터링된 전체(`visible`)를 대상으로 한다 — 기존 동작 그대로 유지
- 훅은 named export로 작성 (프로젝트의 기존 훅 컨벤션 — `useVisits`, `useIsMobile`)
- 테스트는 Vitest + React Testing Library, `afterEach(() => vi.clearAllMocks())` 패턴 사용, `vi.restoreAllMocks()`는 사용 금지 (vi.mock 팩토리 호출 기록이 지워지지 않는 걸 이 프로젝트에서 확인함)
- Visit 픽스처는 `src/test/factories.ts`의 `makeVisit()`만 사용

---

### Task 1: `useInfiniteScroll` 훅 + `IntersectionObserver` 테스트 스텁

**Files:**
- Create: `src/hooks/useInfiniteScroll.ts`
- Create: `src/hooks/useInfiniteScroll.test.tsx`
- Create: `src/test/fakeIntersectionObserver.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize?: number): { displayCount: number; sentinelRef: RefObject<HTMLDivElement> }` — Task 2가 이 시그니처로 가져다 쓴다
- Produces: `FakeIntersectionObserver` (class, `src/test/fakeIntersectionObserver.ts`) — `static instances`, `static latest()`, `static intersect()`를 가진 jsdom용 `IntersectionObserver` 스텁. Task 2의 테스트에서도 재사용

- [ ] **Step 1: `IntersectionObserver`가 없는 jsdom 환경에서 동작할 스텁 클래스 작성**

`src/test/fakeIntersectionObserver.ts`:

```ts
import { vi } from 'vitest'

export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []

  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds: number[] = []

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  static latest(): FakeIntersectionObserver {
    return FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1]
  }

  static intersect(): void {
    const observer = FakeIntersectionObserver.latest()
    observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer as unknown as IntersectionObserver)
  }
}
```

- [ ] **Step 2: 전체 테스트 스위트에서 `IntersectionObserver`가 항상 존재하도록 전역 등록**

`src/test/setup.ts` 전체를 다음으로 교체:

```ts
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FakeIntersectionObserver } from './fakeIntersectionObserver'

global.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver

afterEach(() => {
  cleanup()
})
```

(기존 `useInfiniteScroll`을 쓰지 않는 다른 모든 테스트는 `IntersectionObserver`가 생성되기만 하고 호출되지는 않으므로 영향 없음.)

- [ ] **Step 3: 훅의 실패하는 테스트 작성**

`src/hooks/useInfiniteScroll.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useInfiniteScroll } from './useInfiniteScroll'
import { FakeIntersectionObserver } from '../test/fakeIntersectionObserver'

function TestHarness({
  totalCount,
  resetKey,
  batchSize,
}: {
  totalCount: number
  resetKey: string
  batchSize?: number
}) {
  const { displayCount, sentinelRef } = useInfiniteScroll(totalCount, resetKey, batchSize)
  return (
    <div>
      <span data-testid="count">{displayCount}</span>
      <div ref={sentinelRef} data-testid="sentinel" />
    </div>
  )
}

beforeEach(() => {
  FakeIntersectionObserver.instances = []
})

describe('useInfiniteScroll', () => {
  it('shows the full list when totalCount is smaller than the batch size', () => {
    render(<TestHarness totalCount={5} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('5')
  })

  it('recalculates the batch once totalCount grows (e.g. data finishes loading)', () => {
    const { rerender } = render(<TestHarness totalCount={0} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    rerender(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')
  })

  it('loads one more batch when the sentinel intersects, capped at totalCount', () => {
    render(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')

    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('40')

    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('45')
  })

  it('resets back to the first batch when resetKey changes', () => {
    const { rerender } = render(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('40')

    rerender(<TestHarness totalCount={45} resetKey="b" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')
  })
})
```

- [ ] **Step 4: 테스트가 실패하는지 확인 (모듈이 없어서 실패해야 함)**

Run: `npx vitest run src/hooks/useInfiniteScroll.test.tsx`
Expected: FAIL — `Cannot find module './useInfiniteScroll'` (또는 동일 취지의 import 에러)

- [ ] **Step 5: 훅 구현**

`src/hooks/useInfiniteScroll.ts`:

```ts
import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize = 20) {
  const [displayCount, setDisplayCount] = useState(() => Math.min(batchSize, totalCount))
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Resets to the first batch whenever the underlying list changes shape:
  // either the initial fetch just resolved (totalCount moves from 0 to N,
  // since the caller mounts this hook before its data has loaded) or the
  // caller's filter/sort changed (resetKey).
  useEffect(() => {
    setDisplayCount(Math.min(batchSize, totalCount))
  }, [resetKey, totalCount, batchSize])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount((count) => Math.min(count + batchSize, totalCount))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [totalCount, batchSize])

  return { displayCount, sentinelRef }
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/hooks/useInfiniteScroll.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 7: 전체 스위트가 여전히 통과하는지 확인 (전역 setup 변경 영향 없는지)**

Run: `npm run test:run`
Expected: PASS (기존 188개 + 새 4개 = 192개)

- [ ] **Step 8: 커밋**

```bash
git add src/hooks/useInfiniteScroll.ts src/hooks/useInfiniteScroll.test.tsx src/test/fakeIntersectionObserver.ts src/test/setup.ts
git commit -m "Add useInfiniteScroll hook for client-side render windowing"
```

---

### Task 2: `TablePage`에 무한스크롤 적용

**Files:**
- Modify: `src/pages/TablePage.tsx:1-13` (import 추가), `:133-178` (훅 사용), `:183-291` (렌더링에 슬라이스 적용 + sentinel 추가)
- Modify: `src/pages/TablePage.test.tsx`

**Interfaces:**
- Consumes: `useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize?: number): { displayCount: number; sentinelRef: RefObject<HTMLDivElement> }` (Task 1)
- Consumes: `FakeIntersectionObserver` (Task 1, `src/test/fakeIntersectionObserver.ts`)

- [ ] **Step 1: 실패하는 테스트부터 작성 — 21개 이상일 때 20개만 보이고, 스크롤 시 더 보이는지**

`src/pages/TablePage.test.tsx` 상단 import에 추가:

```tsx
import { FakeIntersectionObserver } from '../test/fakeIntersectionObserver'
```

파일 맨 아래(`describe('TablePage mobile card view', ...)` 블록 뒤)에 새 블록 추가:

```tsx
function dateFor(i: number): string {
  const d = new Date(2026, 0, i + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('TablePage infinite scroll', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
  })

  it('renders only the first 20 visits initially, and more after the sentinel intersects', async () => {
    const visits = Array.from({ length: 25 }, (_, i) =>
      makeVisit({ id: String(i), storeName: `가게${String(i).padStart(2, '0')}`, visitDate: dateFor(i) }),
    )
    vi.mocked(getVisits).mockResolvedValue(visits)
    renderTablePage()

    // default sort is visitDate desc, so the highest i (latest date) renders first
    await screen.findByText('가게24')
    expect(screen.getAllByRole('row')).toHaveLength(21) // header + first 20
    expect(screen.queryByText('가게04')).not.toBeInTheDocument()

    FakeIntersectionObserver.intersect()

    expect(await screen.findByText('가게04')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(26) // header + all 25
  })
})
```

`beforeEach` import가 이미 있는지 확인 — 없다면 파일 상단 `import { afterEach, describe, expect, it, vi } from 'vitest'`를 `import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'`로 수정.

- [ ] **Step 2: 테스트가 실패하는지 확인 (아직 슬라이스 안 함 — 25개가 다 보임)**

Run: `npx vitest run src/pages/TablePage.test.tsx -t "renders only the first 20"`
Expected: FAIL — `getAllByRole('row')`가 21이 아니라 26을 반환

- [ ] **Step 3: `TablePage.tsx`에 훅 적용**

`src/pages/TablePage.tsx` 상단 import 블록(1-13번째 줄)에 추가:

```tsx
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
```

`const visible = useMemo(...)` 블록(기존 142-165번째 줄) 바로 뒤, `function handleSort` 이전에 추가:

```tsx
  const resetKey = `${statusFilter}|${platformFilter}|${sortKey}|${sortDir}`
  const { displayCount, sentinelRef } = useInfiniteScroll(visible.length, resetKey)
  const pageVisits = visible.slice(0, displayCount)
```

- [ ] **Step 4: 렌더링을 `pageVisits`로 바꾸고 sentinel 추가**

기존(183-291번째 줄) 반환 JSX 전체를 다음으로 교체 (변경점: 최상위를 `<>...</>`로 감싸고, 두 `visible.map`을 `pageVisits.map`으로 바꾸고, 끝에 `<div ref={sentinelRef} />` 추가):

```tsx
  return (
    <div>
      <div className="mb-4 flex gap-3">
        <div className="w-36">
          <Select
            aria-label="상태 필터"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '전체' | VisitStatus)}
            className="rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink"
          >
            <option value="전체">상태 전체</option>
            {statusOrder.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Select
            aria-label="플랫폼 필터"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as '전체' | Platform)}
            className="rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink"
          >
            <option value="전체">플랫폼 전체</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" onClick={handleExportCsv} disabled={visible.length === 0} className="ml-auto">
          CSV 내보내기
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          아직 등록된 방문 기록이 없습니다.
        </p>
      ) : (
        <>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {pageVisits.map((v) => (
                <VisitCard key={v.id} visit={v} onNavigate={() => navigate(`/edit/${v.id}`)} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[860px] border-collapse whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface text-left text-muted">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`cursor-pointer select-none px-4 py-3 font-semibold transition-colors hover:text-ink ${
                          sortKey === col.key ? 'text-ink' : ''
                        }`}
                      >
                        {col.label}{' '}
                        <Chevron
                          className={`inline-block transition-transform ${
                            sortKey === col.key ? `text-blue ${sortDir === 'asc' ? 'rotate-180' : ''}` : 'text-muted/40'
                          }`}
                        />
                      </th>
                    ))}
                    <th className="py-3 pr-6 pl-4 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVisits.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/edit/${v.id}`)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface"
                    >
                      <td className="px-4 py-3 font-mono text-ink">{v.visitDate}</td>
                      <td className="px-4 py-3 font-mono">
                        <DeadlineCell visit={v} />
                      </td>
                      <td className="px-4 py-3">{v.platform}</td>
                      <td className="px-4 py-3">{v.storeName}</td>
                      <td className="px-4 py-3">{v.category}</td>
                      <td className="px-4 py-3 font-mono">{formatWon(v.retailValue)}</td>
                      <td className="px-4 py-3 font-mono">{formatWon(v.extraPayment)}</td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          v.status === '예정'
                            ? 'text-muted'
                            : `font-semibold ${netSaved(v) < 0 ? 'text-red-400' : 'text-green'}`
                        }`}
                      >
                        {v.status === '예정' ? '-' : formatWon(netSaved(v))}
                      </td>
                      <td className="py-3 pr-6 pl-4">
                        <StatusBadge status={v.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div ref={sentinelRef} />
        </>
      )}
    </div>
  )
}
```

`handleExportCsv`는 그대로 `visible`(슬라이스 전 전체 필터링 결과)을 사용하므로 수정하지 않는다.

- [ ] **Step 5: 새 테스트 통과 확인**

Run: `npx vitest run src/pages/TablePage.test.tsx -t "renders only the first 20"`
Expected: PASS

- [ ] **Step 6: 기존 `TablePage` 테스트 전부 통과 확인 (21개 미만인 기존 픽스처들은 영향 없어야 함)**

Run: `npx vitest run src/pages/TablePage.test.tsx`
Expected: PASS (기존 테스트 전부 + 새 테스트 1개)

- [ ] **Step 7: 전체 스위트 통과 확인**

Run: `npm run test:run`
Expected: PASS (193개)

- [ ] **Step 8: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공

- [ ] **Step 9: 커밋**

```bash
git add src/pages/TablePage.tsx src/pages/TablePage.test.tsx
git commit -m "Show visit list 20 at a time with infinite scroll"
```
