# CSV 내보내기 설계

## 배경

방문 기록을 표 화면에서 CSV 파일로 내보내는 기능. 처음엔 "연말정산용"으로 구상했지만, 최종 용도(회계사 전달 / 홈택스 업로드 / 개인 백업)는 아직 정해지지 않았고, 플랫폼 자체 기능으로 우선 발전시켜두고 필요해지면 그때 확장하기로 함. 이 때문에 서식이 필요한 xlsx가 아니라 라이브러리 의존성 없이 만들 수 있는 CSV를 MVP로 선택.

## 범위

- 표(Table) 화면에서 현재 필터링된(상태/플랫폼 필터 적용된) 목록을 CSV로 내보내기
- 대시보드 화면의 기간별 내보내기는 이번 스코프에 포함하지 않음 (필요해지면 별도로)

## 데이터 형식

열 구성은 표 화면과 동일한 9개 컬럼, 이 순서대로:

| 열 | 소스 | 형식 |
|---|---|---|
| 방문(예정)일 | `visit.visitDate` | `YYYY-MM-DD` 그대로 |
| 마감일 | `visit.reviewDeadline` | 원본 날짜만 (`YYYY-MM-DD`), 없으면 빈 문자열. "D-3"/"완료" 같은 상대적 표기는 넣지 않음 — 파일은 저장 시점에 고정되는데 D-day는 상대적이라 나중에 열면 틀린 정보가 됨. 완료 여부는 "상태" 열로 이미 알 수 있음 |
| 플랫폼 | `visit.platform` | 그대로 |
| 업체명 | `visit.storeName` | 그대로 |
| 카테고리 | `visit.category` | 그대로 |
| 체험가 | `visit.retailValue` | 순수 숫자 (예: `48000`, 통화기호/쉼표 없음) |
| 추가결제액 | `visit.extraPayment` | 순수 숫자 |
| 순절감액 | `netSaved(visit)` (기존 `lib/visitStats.ts`) | 순수 숫자 (음수 가능) |
| 상태 | `visit.status` | 그대로 |

인코딩/이스케이핑:
- 파일 맨 앞에 UTF-8 BOM(`﻿`)을 붙임 — 없으면 엑셀에서 한글이 깨져 보이는 문제가 있어 방지 차원
- 값에 쉼표/큰따옴표/줄바꿈이 있으면 CSV 표준대로 큰따옴표로 감싸고 내부 `"`는 `""`로 이스케이프
- 줄바꿈은 `\r\n` (CSV 관례 + 엑셀 호환)

## 아키텍처

- `src/lib/csvExport.ts` (신규)
  - `visitsToCsv(visits: Visit[]): string` — 위 표 그대로 헤더 행 + 데이터 행을 만드는 순수 함수. Supabase 호출 없음, `netSaved`만 `lib/visitStats.ts`에서 가져다 씀
  - `downloadCsv(filename: string, csv: string): void` — BOM을 붙인 Blob을 만들어 `URL.createObjectURL` + 임시 `<a>` 클릭으로 다운로드 트리거. 브라우저 API 직접 호출이라 컴포넌트가 아니라 여기(lib)에 둠
- `src/pages/TablePage.tsx`
  - 필터 select들 옆에 "CSV 내보내기" `Button`(secondary variant) 추가
  - 클릭 핸들러: 이미 계산되어 있는 `visible`(필터링+정렬된 배열)을 `visitsToCsv`에 넘기고, 파일명 `perkfolio_visits_YYYY-MM-DD.csv`(오늘 날짜, `toDateString(new Date())` 재사용)로 `downloadCsv` 호출
  - `visible.length === 0`이면 버튼 `disabled`

## 엣지 케이스

- 필터링된 목록이 0건: 버튼 비활성화 (다운로드 자체를 시도하지 않음)
- 업체명/체험 내역 등 자유 텍스트에 쉼표·따옴표·줄바꿈이 포함된 경우: CSV 표준 이스케이핑으로 처리

## 테스트

- `src/lib/csvExport.test.ts`: `visitsToCsv`에 대한 단위 테스트
  - 헤더 행이 정확한지
  - 쉼표/따옴표가 포함된 값이 올바르게 이스케이프되는지
  - `reviewDeadline`이 없을 때 빈 문자열인지
  - `netSaved`가 음수일 때도 그대로 숫자로 나오는지
- `src/pages/TablePage.test.tsx`: 버튼 클릭 시 (모킹한) 다운로드 함수가 현재 필터링된 목록으로 호출되는지 확인하는 얇은 배선(wiring) 테스트, 목록이 비어있을 때 버튼이 비활성화되는지

## 스코프 밖

- xlsx(엑셀 네이티브 포맷), 서식(합계 행, 색상 등), 대시보드 화면에서의 기간별 내보내기 — 전부 필요해지면 나중에 별도로 다룸
