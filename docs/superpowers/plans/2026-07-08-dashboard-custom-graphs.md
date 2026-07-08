# 대시보드 커스텀 그래프 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**목표:** `docs/superpowers/specs/2026-07-08-dashboard-custom-graphs-design.md`대로, 축만 고르고 지표는 평균 절감액으로 고정된 그래프를 사용자가 대시보드에서 추가/삭제할 수 있게 함. 코드는 각 태스크의 구현자가 작성 — 이 계획엔 파일과 역할만 적혀 있음.

**Architecture:** Supabase 신규 테이블(`dashboard_graphs`) ↔ `src/lib/dashboardGraphs.ts` CRUD ↔ `useDashboardGraphs` 훅 ↔ `DashboardPage`에서 `GraphBuilderForm`/`GraphCard`로 렌더링. 그래프 계산 자체는 `visitStats.ts`의 신규 `computeGraphData` 함수.

## Global Constraints (스펙 원문)

- `dashboard_graphs` 컬럼: `id`, `user_id`, `axis`(`category`|`platform`|`month`), `chart_type`(`bar`|`line`), `scope`(`all`|`period`), `created_at`
- 축 = `month`: `chart_type` 선택 가능(막대/라인), `scope`는 항상 `all` 고정
- 축 = `category` | `platform`: `chart_type`은 항상 `bar` 고정, `scope` 선택 가능(`all`/`period`)
- `status`(상태)는 축 후보 아님
- 저장 개수 제한 없음, 기본 목록은 빈 배열
- `computeGraphData`는 축 그룹핑/평균만 담당 — 기간 필터링은 호출부(DashboardPage) 책임
- 막대에는 항상 건수(`count`)를 참고 정보로 같이 표시
- 기존 `computeMonthlyTrend`/`computePlatformRanking`/`computeUpcomingDeadlines`는 삭제하지 않음 (미사용 상태 유지)

---

### Task 1: Supabase 테이블 + 타입 + CRUD

**Files:**
- Create: `supabase/migrations/<timestamp>_create_dashboard_graphs_table.sql`
- Create: `src/types/dashboardGraph.ts`
- Create: `src/lib/dashboardGraphs.ts`
- Create: `src/lib/dashboardGraphs.test.ts`

**Interfaces (Produces):**
- `DashboardGraph { id: string; axis: 'category' | 'platform' | 'month'; chartType: 'bar' | 'line'; scope: 'all' | 'period'; createdAt: string }`
- `NewDashboardGraph = Pick<DashboardGraph, 'axis' | 'chartType' | 'scope'>`
- `getDashboardGraphs(): Promise<DashboardGraph[]>`
- `addDashboardGraph(graph: NewDashboardGraph): Promise<void>`
- `deleteDashboardGraph(id: string): Promise<void>`

**요구사항:**
- 마이그레이션: Global Constraints의 컬럼 그대로, `user_id`는 `auth.users` FK, RLS로 본인 행만 select/insert/delete 가능하게 (`feedback` 테이블 마이그레이션 패턴 참고)
- `src/lib/dashboardGraphs.ts`: snake_case(DB) ↔ camelCase(TS) 매핑은 `src/lib/feedback.ts` 패턴 그대로 따르기
- 테스트는 Supabase 클라이언트를 목(mock)해서 매핑/호출 검증 (`feedback.test.ts` 참고)

---

### Task 2: `useDashboardGraphs` 훅

**Files:**
- Create: `src/hooks/useDashboardGraphs.ts`

**Interfaces (Consumes):** Task 1의 `getDashboardGraphs`/`addDashboardGraph`/`deleteDashboardGraph`

**Interfaces (Produces):**
- `useDashboardGraphs(): { graphs: DashboardGraph[]; loading: boolean; error: string | null; addGraph: (g: NewDashboardGraph) => Promise<void>; removeGraph: (id: string) => Promise<void> }`

**요구사항:**
- `src/hooks/useVisits.ts` 패턴 참고 (마운트 시 조회 + loading/error 상태)
- `addGraph`/`removeGraph`는 성공 시 로컬 `graphs` 상태도 갱신 (다시 fetch할 필요 없게)

---

### Task 3: `computeGraphData` 계산 로직

**Files:**
- Modify: `src/lib/visitStats.ts`
- Modify: `src/lib/visitStats.test.ts`

**Interfaces (Produces):**
- `computeGraphData(visits: Visit[], axis: 'category' | 'platform' | 'month'): { label: string; avgNet: number; count: number }[]`

**요구사항:**
- `computeCategoryBreakdown`/`computePlatformRanking`의 평균 절감액 계산 로직을 축 무관하게 일반화한 버전 (기존 두 함수는 삭제하지 말고 그대로 둘 것)
- `axis === 'month'`일 땐 `visitDate` 기준 `YYYY-MM`으로 그룹핑, 방문일 없는 항목은 건너뜀
- 빈 배열 입력 시 division-by-zero 없이 빈 배열 반환
- 테스트는 축 3종류(category/platform/month) 각각 최소 1개 케이스

---

### Task 4: 그래프 빌더/카드 UI 컴포넌트

**Files:**
- Create: `src/components/GraphBuilderForm.tsx`
- Create: `src/components/GraphCard.tsx`

**Interfaces (Consumes):** Task 1의 `DashboardGraph`/`NewDashboardGraph` 타입, Task 3의 `computeGraphData` 반환 형태

**Interfaces (Produces):**
- `GraphBuilderForm({ onSave: (g: NewDashboardGraph) => void })`
- `GraphCard({ graph: DashboardGraph, data: { label: string; avgNet: number; count: number }[], onDelete: () => void })`

**요구사항:**
- `GraphBuilderForm`: 축 select(카테고리/플랫폼/월) + Global Constraints의 축별 규칙대로 `chart_type`/`scope` 필드를 선택 가능하게 보여주거나 고정 텍스트로 대체 + 저장 버튼
- `GraphCard`: `chartType === 'bar'`면 막대(기존 카테고리분포/플랫폼랭킹과 같은 스타일), `'line'`이면 recharts `LineChart` 재사용. 막대 옆엔 항상 건수 표시. 삭제 버튼 포함
- 버튼은 `src/components/Button.tsx` 사용, `<button>` 직접 스타일링 금지 (프로젝트 컨벤션)

---

### Task 5: 대시보드 통합

**Files:**
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/DashboardPage.test.tsx`

**Interfaces (Consumes):** Task 2의 `useDashboardGraphs`, Task 3의 `computeGraphData`, Task 4의 `GraphBuilderForm`/`GraphCard`

**요구사항:**
- "이번 달 요약" Section 아래에 `GraphBuilderForm` + 저장된 `graphs`를 `GraphCard` 목록으로 렌더링
- 각 `GraphCard`에 넘길 데이터는 `graph.scope === 'period'`면 기간 필터링된 visits로, 아니면 전체 visits로 `computeGraphData` 호출해서 계산
- 테스트: 그래프 추가/삭제 플로우 1개, 축=month 선택 시 필드가 고정되는지 1개

---

## 순서

Task 1 → 2 → 3 → 4 → 5 (Task 3은 1·2와 독립적으로 병행 가능하지만 순서대로 진행). 각 태스크 완료 후 `npm run test:run` 통과 확인 후 커밋.
