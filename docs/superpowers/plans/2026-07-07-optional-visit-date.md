# 방문(예정)일 선택값 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `visitDate` (체험/예정일) an optional field end-to-end, so a visit whose actual date hasn't been confirmed yet ("신청 단계") can be saved without one.

**Architecture:** `visit_date` becomes a nullable Postgres column; `Visit.visitDate` becomes `string | null` in TypeScript; every consumer (form, table, calendar, dashboard) gets a null-safe branch that was previously assumed non-null. No new components, no new routes.

**Tech Stack:** React + TypeScript, Supabase (Postgres), Vitest + React Testing Library, react-datepicker.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-07-optional-visit-date-design.md` — read it before starting; every task below implements a section of it.
- **Do NOT run `git commit` at the end of any task.** The user asked to batch all commits for this feature at the very end, after every task is done and reviewed — this overrides subagent-driven-development's normal "commit per task" step. Stage changes with `git add` and stop there; report which files are staged.
- Supabase access only through `src/lib` modules — never call the Supabase client directly from a component (existing project rule, `CLAUDE.md`).
- `npm run test:run` must pass (all suites, not just the one touched) before a task is considered done.
- Reuse `src/test/factories.ts`'s `makeVisit()` for all new Visit fixtures — do not hand-roll visit objects in tests.
- Status(status) field gets no automatic lock/constraint tied to `visitDate` — this was an explicit user decision, not an oversight. Do not add one.
- Calendar gets no new "날짜 미정" section — a visit with no `visitDate` is simply absent from the day grid, and only ever visible via its deadline card (if it has one) or the Table page.

---

### Task 1: Make `visitDate` nullable in the data model

**Files:**
- Create: `supabase/migrations/20260707140000_make_visit_date_nullable.sql`
- Modify: `src/types/visit.ts:28`
- Modify: `src/lib/visits.ts:6` (`VisitRow.visit_date`)

**Interfaces:**
- Produces: `Visit.visitDate: string | null` — every later task consumes this type.

- [ ] **Step 1: Write the migration file**

```sql
alter table public.visits
  alter column visit_date drop not null;
```

Save as `supabase/migrations/20260707140000_make_visit_date_nullable.sql` (matches the naming pattern of the existing `20260704140243_make_campaign_url_nullable.sql`).

- [ ] **Step 2: Update the `Visit` type**

In `src/types/visit.ts`, change line 28:

```ts
// before
  visitDate: string
// after
  visitDate: string | null
```

`NewVisit` (`Omit<Visit, 'id' | 'createdAt'>`) picks this up automatically — no separate edit needed.

- [ ] **Step 3: Update the data-access row type**

In `src/lib/visits.ts`, change line 6:

```ts
// before
  visit_date: string
// after
  visit_date: string | null
```

The rest of `src/lib/visits.ts` (the `toVisit` mapper, `addVisit`, `updateVisit`) needs no change — `row.visit_date` and `visit.visitDate` already pass through untyped-checked assignments that now correctly allow `null`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from `src/types/visit.ts` or `src/lib/visits.ts`. (Later tasks fix the errors this step introduces elsewhere — that's expected and addressed in Tasks 2, 4, 5, 6.)

- [ ] **Step 5: Apply the migration to the live Supabase project**

This is a real schema change on the project's actual database — **ask the user for explicit confirmation before running it**, even though it's a low-risk, purely-relaxing constraint change. Use the Supabase MCP tool `apply_migration` (or `supabase db push` from the CLI if the user prefers), passing the SQL from Step 1. Do not proceed to later tasks' manual/browser verification until this is applied, since the app's actual database still rejects null `visit_date` until it lands.

- [ ] **Step 6: Stage the changes**

```bash
git add supabase/migrations/20260707140000_make_visit_date_nullable.sql src/types/visit.ts src/lib/visits.ts
```

Do not commit (see Global Constraints).

---

### Task 2: Make the visit-date field optional in `VisitForm`

**Files:**
- Modify: `src/components/VisitForm.tsx`
- Test: `src/components/VisitForm.test.tsx`

**Interfaces:**
- Consumes: `Visit.visitDate: string | null` (Task 1)
- Produces: `VisitForm` submits `visitDate: string | null` in its `NewVisit` payload; AddPage's initial state has `visitDate` empty instead of today.

- [ ] **Step 1: Write the failing tests**

In `src/components/VisitForm.test.tsx`:

1. Remove the existing test `'blocks submission when visit date is cleared (native required validation)'` (lines 47-56) — it asserts behavior we're intentionally removing (the field is no longer required).

2. Add a new test in `describe('VisitForm validation', ...)`, right after the removed one:

```tsx
  it('submits successfully with the visit date left empty, sending null', async () => {
    const { onSubmit } = renderForm()
    await fillRequiredFields({ skip: ['체험(예정)일'] })
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0] as NewVisit
    expect(submitted.visitDate).toBeNull()
  })
```

3. Extend the existing test `'starts with 플랫폼/카테고리/상태 unselected (placeholder), and extra payment defaulting to 0'` (around line 89) to also assert the date field starts empty:

```tsx
  it('starts with 플랫폼/카테고리/상태 unselected (placeholder), extra payment defaulting to 0, and no visit date prefilled', () => {
    renderForm()
    expect(screen.getByLabelText('플랫폼')).toHaveValue('')
    expect(screen.getByLabelText('카테고리')).toHaveValue('')
    expect(screen.getByLabelText('상태')).toHaveValue('')
    expect(screen.getByLabelText('추가결제액')).toHaveValue(0)
    expect(screen.getByLabelText('체험(예정)일')).toHaveValue('')
  })
```

4. Update `fillRequiredFields` (around line 12) to add an explicit visit-date fill step, so every other existing test that expects a real `visitDate` in the payload (e.g. the regex match at line 125) keeps passing once the default is no longer "today":

```tsx
async function fillRequiredFields(opts: { skip?: string[] } = {}) {
  const skip = opts.skip ?? []
  if (!skip.includes('플랫폼')) await userEvent.selectOptions(screen.getByLabelText('플랫폼'), '포포몬')
  if (!skip.includes('카테고리')) await userEvent.selectOptions(screen.getByLabelText('카테고리'), '카페')
  if (!skip.includes('상태')) await userEvent.selectOptions(screen.getByLabelText('상태'), '예정')
  await userEvent.type(screen.getByLabelText('업체명'), '카페 온도')
  await userEvent.type(screen.getByLabelText('가게 정보 URL'), 'https://store.example.com')
  await userEvent.type(screen.getByLabelText('체험 내역'), '파스타 2, 음료 2')
  await userEvent.clear(screen.getByLabelText('체험가'))
  await userEvent.type(screen.getByLabelText('체험가'), '48000')
  if (!skip.includes('체험(예정)일')) {
    await userEvent.type(screen.getByLabelText('체험(예정)일'), '2026-07-06{enter}')
  }
  if (!skip.includes('마감일')) {
    await userEvent.type(screen.getByLabelText('마감일'), '2026-09-01{enter}')
  }
  if (!skip.includes('체험단 URL')) {
    await userEvent.type(screen.getByLabelText('체험단 URL (선택)'), 'https://campaign.example.com')
  }
}
```

- [ ] **Step 2: Run the tests to verify the new/changed ones fail**

Run: `npx vitest run src/components/VisitForm.test.tsx`
Expected: FAIL — `'submits successfully with the visit date left empty'` fails because the DatePicker still has `required`, blocking submission; the "starts empty" test fails because the field still prefills today's date.

- [ ] **Step 3: Update `VisitForm.tsx`**

In `src/components/VisitForm.tsx`:

Change the comment and `initialFormFields` (around lines 39-54):

```tsx
function initialFormFields(initialValues: NewVisit | undefined): FormFields {
  return {
    visitDate: initialValues?.visitDate ? parseDateString(initialValues.visitDate) : null,
    platform: initialValues?.platform ?? '',
    storeName: initialValues?.storeName ?? '',
    category: initialValues?.category ?? '',
    sponsoredItems: initialValues?.sponsoredItems ?? '',
    campaignUrl: initialValues?.campaignUrl ?? '',
    storeInfoUrl: initialValues?.storeInfoUrl ?? '',
    retailValue: String(initialValues?.retailValue ?? ''),
    extraPayment: String(initialValues?.extraPayment ?? 0),
    postUrl: initialValues?.postUrl ?? '',
    reviewDeadline: initialValues?.reviewDeadline ? parseDateString(initialValues.reviewDeadline) : null,
    status: initialValues?.status ?? '',
  }
}
```

(This changes both "new visit" — `initialValues` undefined — and "editing a visit that already has no date" to start from `null` instead of `new Date()`.)

Update the comment above `handleSubmit` (around line 96-98):

```tsx
    // platform/category/status/reviewDeadline are guaranteed non-empty here
    // (each is `required`, so the browser blocks submit before this handler
    // runs). visitDate is NOT required — it may be null when the actual
    // visit date isn't confirmed yet.
```

Update the submit payload (around line 104):

```tsx
        visitDate: visitDate ? toDateString(visitDate) : null,
```

Update the 체험(예정)일 `DatePicker` (around lines 128-137) — remove `required`, add `isClearable`:

```tsx
          <label className="flex flex-col gap-1 text-sm">
            체험(예정)일
            <DatePicker
              selected={visitDate}
              onChange={(date: Date | null) => updateField('visitDate', date)}
              dateFormat="yyyy-MM-dd"
              className={`w-full ${compactInputClass}`}
              isClearable
            />
          </label>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/VisitForm.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Typecheck and run the full suite**

Run: `npx tsc --noEmit && npm run test:run`
Expected: no errors from files touched so far; failures may remain in `TablePage`, `CalendarPage`, `DashboardPage` tests until Tasks 4-6 land — that's expected at this point, note them but don't fix them here.

- [ ] **Step 6: Stage the changes**

```bash
git add src/components/VisitForm.tsx src/components/VisitForm.test.tsx
```

Do not commit.

---

### Task 3: Guard `computeMonthlyTrend` against a null `visitDate`

**Files:**
- Modify: `src/lib/visitStats.ts:94-101` (`computeMonthlyTrend`)
- Test: `src/lib/visitStats.test.ts`

**Interfaces:**
- Consumes: `Visit.visitDate: string | null` (Task 1)
- Produces: `computeMonthlyTrend` never throws on a null `visitDate`; later consumed by `DashboardPage` (Task 6) without further guarding needed at the call site.

- [ ] **Step 1: Write the failing test**

In `src/lib/visitStats.test.ts`, inside `describe('computeMonthlyTrend', ...)` (around line 232-244), add:

```ts
  it('skips visits with no visit date instead of crashing', () => {
    const visits = [
      makeVisit({ visitDate: null, retailValue: 10000, extraPayment: 0 }),
      makeVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 }),
    ]
    expect(computeMonthlyTrend(visits)).toEqual([{ month: '2026-01', net: 20000 }])
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/visitStats.test.ts -t "skips visits with no visit date"`
Expected: FAIL — `TypeError: Cannot read properties of null (reading 'slice')`.

- [ ] **Step 3: Update `computeMonthlyTrend`**

In `src/lib/visitStats.ts`, change:

```ts
export function computeMonthlyTrend(visits: Visit[]) {
  const totals = new Map<string, number>()
  for (const v of visits) {
    if (v.visitDate === null) continue
    const month = v.visitDate.slice(0, 7)
    totals.set(month, (totals.get(month) ?? 0) + netSaved(v))
  }
  return [...totals.entries()].map(([month, net]) => ({ month, net })).sort((a, b) => (a.month < b.month ? -1 : 1))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/visitStats.test.ts`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Stage the changes**

```bash
git add src/lib/visitStats.ts src/lib/visitStats.test.ts
```

Do not commit.

---

### Task 4: Show and sort null visit dates in `TablePage`

**Files:**
- Modify: `src/pages/TablePage.tsx`
- Test: `src/pages/TablePage.test.tsx`

**Interfaces:**
- Consumes: `Visit.visitDate: string | null` (Task 1)
- Produces: no new exports; row cell order unchanged (`[마감일, 체험(예정)일, 업체명, 체험가, 추가결제액, 순절감액, 상태]`).

- [ ] **Step 1: Write the failing tests**

In `src/pages/TablePage.test.tsx`, add to `describe('TablePage columns', ...)` (after the test ending around line 124):

```tsx
  it('shows "날짜 미정" instead of a date when a visit has no visit date', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ storeName: '카페 온도', visitDate: null }),
    ])
    renderTablePage()

    await screen.findByText('카페 온도')
    const dateCell = getRowCells('카페 온도')[1]
    expect(dateCell).toHaveTextContent('날짜 미정')
  })
```

Add to `describe('TablePage sorting', ...)` (after the 마감일 sort test ending around line 189):

```tsx
  it('always sorts visits with no visit date to the end, regardless of direction', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', visitDate: null }),
      makeVisit({ id: '2', storeName: '가게B', visitDate: '2026-01-05' }),
      makeVisit({ id: '3', storeName: '가게C', visitDate: '2026-01-15' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    // default sort is visitDate desc — already selected, no click needed
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게C', '가게B', '가게A'])

    await userEvent.click(screen.getByText(/체험\(예정\)일/))
    await userEvent.click(screen.getByText(/체험\(예정\)일/)) // toggle to asc
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게B', '가게C', '가게A'])
  })
```

Also update the mobile-card test in `describe('TablePage mobile card view', ...)`: add a new test after the existing ones (around line 294):

```tsx
  it('shows "날짜 미정" instead of a date on the card when a visit has no visit date', async () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ storeName: '카페 온도', visitDate: null })])
    renderTablePage()

    await screen.findByText('카페 온도')
    expect(screen.getByText(/날짜 미정/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/TablePage.test.tsx`
Expected: FAIL on the three new tests — the desktop/mobile display tests fail because the cell currently renders `null`/nothing, and the sort test fails because `null` sorts using `String(null)` (`"null"`) instead of being pinned last.

- [ ] **Step 3: Update `TablePage.tsx`**

Update `sortValue` (line 43-47):

```ts
function sortValue(v: Visit, key: SortKey): string | number {
  if (key === 'netSaved') return netSaved(v)
  if (key === 'reviewDeadline') return v.reviewDeadline ?? ''
  if (key === 'visitDate') return v.visitDate ?? ''
  return v[key]
}
```

Update the sort comparator (around lines 247-257) — add a `visitDate` pinning branch alongside the existing `netSaved` one:

```ts
    result = [...result].sort((a, b) => {
      // 예정 visits don't show a real 순절감액 (displayed as "-", since the
      // amount isn't confirmed yet), so sorting by that column pins them to
      // the end regardless of asc/desc — otherwise the unconfirmed
      // placeholder rows would interleave with the real sorted values.
      if (sortKey === 'netSaved') {
        const aPending = a.status === '예정'
        const bPending = b.status === '예정'
        if (aPending || bPending) return aPending && bPending ? 0 : aPending ? 1 : -1
      }

      // same pinning idea for a visit with no confirmed date yet.
      if (sortKey === 'visitDate') {
        const aNoDate = a.visitDate === null
        const bNoDate = b.visitDate === null
        if (aNoDate || bNoDate) return aNoDate && bNoDate ? 0 : aNoDate ? 1 : -1
      }

      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
```

Update the desktop table cell (line 393):

```tsx
                      <td className="px-4 py-3 font-mono">
                        {v.visitDate ? (
                          <span className="text-ink">{v.visitDate}</span>
                        ) : (
                          <span className="text-muted">날짜 미정</span>
                        )}
                      </td>
```

Update the mobile `VisitCard` (line 188):

```tsx
              {visit.platform} · {visit.visitDate ?? '날짜 미정'}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/TablePage.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Stage the changes**

```bash
git add src/pages/TablePage.tsx src/pages/TablePage.test.tsx
```

Do not commit.

---

### Task 5: Exclude null-visitDate visits from the calendar day grid

**Files:**
- Modify: `src/pages/CalendarPage.tsx:33-44` (`visitsByDate`)
- Test: `src/pages/CalendarPage.test.tsx`

**Interfaces:**
- Consumes: `Visit.visitDate: string | null` (Task 1)
- Produces: no new exports. `deadlinesByDate` (keyed by `reviewDeadline`, untouched) still includes these visits — that's the point.

- [ ] **Step 1: Write the failing test**

In `src/pages/CalendarPage.test.tsx`, add after the existing dedup test (`'moves a reviewed visit from its visit-date cell...'`, around line 113):

```tsx
  it('excludes a visit with no visit date from the day grid, but still shows its deadline card', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeBaseVisit({ visitDate: null, reviewDeadline: DAY_16, storeName: '카페 온도', status: '예정' }),
    ])
    renderCalendar()

    // only the deadline card renders — no visit-date cell exists to duplicate onto
    expect(await screen.findAllByText('카페 온도')).toHaveLength(1)
    expect(screen.getByText(/마감/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsc --noEmit`
Expected: FAIL — `map.get(v.visitDate)` and `map.set(v.visitDate, list)` no longer typecheck, since `v.visitDate` is now `string | null` but `map` is declared as `Map<string, Visit[]>`. This compile error is the real failure signal for this task (the Vitest run itself may still pass at runtime, since a `null`-keyed Map entry is simply never looked up by any real day string and so never renders — but that's incidental, not a guarantee, which is exactly why Step 3 adds an explicit guard).

- [ ] **Step 3: Update `CalendarPage.tsx`**

In `src/pages/CalendarPage.tsx`, update `visitsByDate` (lines 33-44):

```tsx
  const visitsByDate = useMemo(() => {
    const map = new Map<string, Visit[]>()
    for (const v of visits) {
      if (v.visitDate === null) continue
      // once reviewed, a visit with a deadline is represented by its
      // deadline-date card instead — showing it here too would duplicate it
      if (v.status === '리뷰완료' && v.reviewDeadline) continue
      const list = map.get(v.visitDate) ?? []
      list.push(v)
      map.set(v.visitDate, list)
    }
    return map
  }, [visits])
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/CalendarPage.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Stage the changes**

```bash
git add src/pages/CalendarPage.tsx src/pages/CalendarPage.test.tsx
```

Do not commit.

---

### Task 6: Exclude null-visitDate visits from the Dashboard's period-filtered section

**Files:**
- Modify: `src/pages/DashboardPage.tsx:50-53` (`filtered`)
- Test: `src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `Visit.visitDate: string | null` (Task 1), `computeMonthlyTrend` guard (Task 3 — `allTimeConfirmed` may still contain a null-visitDate visit if its status isn't `예정`, and this task relies on Task 3 already having made that safe).
- Produces: no new exports. "마감 임박" section (uses raw `visits`, driven by `reviewDeadline`) is intentionally untouched.

- [ ] **Step 1: Write the failing tests**

In `src/pages/DashboardPage.test.tsx`, add after `'excludes out-of-period visits by default, then includes them once switched to 전체'` (around line 91):

```tsx
  it('excludes visits with no visit date from the 이번 달 요약 section, even under 전체', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', visitDate: null, status: '리뷰완료', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ id: '2', status: '리뷰완료', retailValue: 5000, extraPayment: 0 }),
    ])
    renderDashboard()
    await screen.findByText('총 체험단')
    expect(totalVisitCountText()).toBe('1건')

    await userEvent.selectOptions(screen.getByLabelText('기간 필터'), '전체')
    expect(totalVisitCountText()).toBe('1건')
  })
```

Add after `'shows an upcoming deadline regardless of the selected stats period'` (around line 122):

```tsx
  it('shows an upcoming deadline for a visit with no visit date, since deadlines do not depend on visitDate', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({
        id: '42',
        storeName: '카페 온도',
        visitDate: null,
        reviewDeadline: toDateString(tomorrow),
        status: '예정',
      }),
    ])
    renderDashboard()

    await userEvent.click(await screen.findByText('카페 온도'))
    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL on the first new test — `isInPeriod(null, ...)` throws (`Cannot read properties of null (reading 'split')`) since `filtered` currently calls `isInPeriod` unconditionally. The second new test should already pass (마감 임박 doesn't touch `visitDate`) — that's fine, it's here to lock in the behavior.

- [ ] **Step 3: Update `DashboardPage.tsx`**

In `src/pages/DashboardPage.tsx`, update `filtered` (lines 50-53):

```tsx
  const filtered = useMemo(
    () => visits.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, period, customRange)),
    [visits, period, customRange],
  )
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Run the full suite and build**

Run: `npx tsc --noEmit && npm run test:run && npm run build`
Expected: everything green — this is the last task, so the whole feature should now typecheck, test, and build cleanly.

- [ ] **Step 6: Stage the changes**

```bash
git add src/pages/DashboardPage.tsx src/pages/DashboardPage.test.tsx
```

Do not commit.

---

## After Task 6

All changes across all 6 tasks are staged but **not committed** (per Global Constraints). Report the full `git status --short` to the user and wait for them to decide how to batch the commit(s) — do not commit unprompted.
