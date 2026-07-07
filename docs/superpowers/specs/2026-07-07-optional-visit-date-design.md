# 방문(예정)일 선택값 전환 설계

**목적:** 체험단 신청은 했지만 실제 방문일이 아직 확정되지 않은 단계(신청 단계)를 표현할 수 있도록, `visitDate`를 필수값에서 선택값으로 바꾼다.

## 검토한 대안

- **DB `visit_date`를 not null로 유지 + 별도 `visitDateConfirmed` 플래그 추가**: "날짜를 아예 모른다"는 상태를 별도 플래그+더미 날짜로 표현해야 해서 오히려 복잡하고, 화면마다 이 플래그를 추가로 분기해야 함.
- **채택: `visit_date` 컬럼을 nullable로 전환**: "모른다"를 null로 직접 표현. 이 프로젝트에 이미 `campaign_url`을 nullable로 바꾼 선례(`20260704140243_make_campaign_url_nullable.sql`)가 있어 패턴이 일관됨.

## 1. 데이터 모델

- 마이그레이션 추가: `alter table public.visits alter column visit_date drop not null;`
- `src/types/visit.ts`: `Visit.visitDate: string` → `string | null` (`NewVisit`은 `Omit`이라 자동 반영)
- `src/lib/visits.ts`: snake_case ↔ camelCase 매핑 로직은 변경 불필요 (null이 그대로 통과)

## 2. 입력 폼 (`src/components/VisitForm.tsx`)

- 체험(예정)일 `DatePicker`에서 `required` 제거
- `isClearable` 속성 추가 — 한 번 고른 날짜도 다시 비울 수 있어야 함 (신청 단계로 되돌리는 경우)
- 상태(status) 필드는 변경 없음 — visitDate 유무에 따른 자동 잠금/제한을 걸지 않는다 (사용자 명시적 결정)
- `initialFormFields`: 신규 작성(AddPage) 시 기본값을 `new Date()` → `null`로 변경 (처음부터 빈 상태로 시작)
- `handleSubmit`: `visitDate: toDateString(visitDate as Date)` → `visitDate: visitDate ? toDateString(visitDate) : null`
- 관련 주석("visitDate/... are guaranteed non-empty") 갱신

## 3. 표 (`src/pages/TablePage.tsx`)

- 체험(예정)일 컬럼: `visitDate`가 null이면 "날짜 미정" 텍스트를 마감일 미정과 같은 muted 스타일로 표시
- 정렬: `visitDate` 기준 정렬 시, null 항목은 정렬 방향(asc/desc)과 무관하게 항상 맨 뒤로 고정 — 기존 `netSaved` 정렬에서 `예정` 상태를 항상 맨 뒤로 미는 것과 동일한 패턴을 재사용
- 모바일 카드뷰(`VisitCard`)도 동일하게 "날짜 미정" 표시

## 4. 캘린더 (`src/pages/CalendarPage.tsx`)

- `visitsByDate` 집계(날짜별 그리드 배치)에서 `visitDate === null`인 항목은 완전히 제외 — 배치할 날짜가 없으므로 그리드에 노출하지 않음 (표에서만 확인 가능)
- **마감일 카드는 변경 없음** — `deadlinesByDate`는 `reviewDeadline` 기준으로만 동작하므로, 방문일이 없어도 마감일 카드에는 그대로 노출됨 (필수 필드인 reviewDeadline은 항상 존재)

## 5. 대시보드 (`src/pages/DashboardPage.tsx`)

- "이번 달 요약" 섹션(기간 필터 적용 대상): `filtered` 계산을 `visits.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, period, customRange))`로 변경 — "전체" 기간을 선택해도 날짜 미정 항목은 이 섹션 전체(총 체험단/체험가/추가결제액/순절감액/평균절감율/상태별 카운트/카테고리별 분포)에서 항상 제외
- "마감 임박" 섹션은 변경 없음 — `computeUpcomingDeadlines`는 필터링 안 된 전체 `visits`를 받아 `reviewDeadline` 기준으로만 판단하므로, 날짜 미정 항목도 마감이 임박했으면 그대로 노출
- "월별 절감액 트렌드"(`computeMonthlyTrend`): `v.visitDate.slice(0, 7)`로 월을 추출하므로 null이면 크래시 — 방어적으로 `visitDate === null`인 항목은 집계에서 건너뛰도록 수정 (상태가 예정이 아닌데 날짜만 없는 예외적 케이스 대비)
- "플랫폼별 평균 절감액"(`computePlatformRanking`)은 `visitDate`를 사용하지 않으므로 변경 불필요

## 6. 테스트 갱신 대상

- `src/lib/visits.test.ts` — null visit_date 매핑
- `src/lib/visitStats.test.ts` — `isInPeriod` null 처리(대시보드에서 필터링 전에 걸러지므로 함수 자체 시그니처는 유지하되 호출부 테스트 보강), `computeMonthlyTrend`가 null visitDate를 건너뛰는지
- `src/components/VisitForm.test.tsx` — 방문일 없이 제출 가능한지, 신규 폼 기본값이 비어있는지
- `src/pages/TablePage.test.tsx` — null 정렬 위치, "날짜 미정" 표시
- `src/pages/CalendarPage.test.tsx` — null visitDate 항목이 그리드에서 빠지는지, 마감일 카드에는 그대로 뜨는지
- `src/pages/DashboardPage.test.tsx` — 이번 달 요약에서 제외, 마감 임박에는 포함, 월별 트렌드 크래시 없음

## 범위 밖

- 상태(status) 필드에 대한 자동 제약(예: 방문일 없으면 리뷰완료 선택 불가) — 추가하지 않음
- 캘린더에 "날짜 미정" 별도 섹션/리스트 추가 — 추가하지 않음, 표에서만 확인
