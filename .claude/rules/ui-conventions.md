---
paths:
  - "src/pages/**/*.tsx"
  - "src/components/**/*.tsx"
  - "src/index.css"
---

# 페이지/컴포넌트 UI 컨벤션

## 색상
- 색은 `src/index.css`의 `@theme` 시맨틱 토큰(`--color-bg`, `--color-surface`, `--color-ink`, `--color-line`, `--color-muted`, `--color-blue`, `--color-positive`, `--color-amber`, `--color-violet`, `--color-danger` 등, light/dark 각각 정의됨)만 사용할 것. 하드코딩 hex나 Tailwind 기본 팔레트(`bg-gray-800`, `text-red-400` 등)를 직접 쓰지 않는다 (차트처럼 className이 아니라 실제 색상값이 필요한 곳은 `var(--color-*)`로 참조).
- `bg-surface` 컨테이너 안에 중첩된(recessed) 요소에 `bg-bg`를 재사용하지 말 것 — 페이지 배경색과 같은 값이라 뚫린 구멍처럼 보인다. 대신 `bg-white/5` 같은 반투명 오버레이를 쓴다.
- status/deadline 색상 로직은 `src/lib/statusStyle.ts`에만 존재해야 한다. 색을 바꿔야 하면 이 파일만 수정하고, 개별 페이지/컴포넌트에 색 로직을 중복 정의하지 않는다.

## 스타일링
- 공유 컴포넌트 템플릿에 이미 박혀있는 padding/margin 유틸리티(예: `Card.tsx`의 `p-4`)를 `className="p-0"`처럼 상충되는 클래스로 덮어쓰지 말 것. Tailwind는 같은 속성의 두 클래스 중 어느 게 이길지 소스 순서로 보장하지 않는다. padding만 다르게 하고 싶으면 필요한 스타일만 복사한 별도 `div`를 만들거나, 컴포넌트에 padding variant/prop을 추가한다.

## 에러 표시
- `catch`에서 `console.error(err)`로 로깅하고, 사용자에게는 한국어 안내 메시지를 state로 세팅해 보여준다(`setError`, `onError` 등). `alert()`는 쓰지 않는다.

## 로딩/빈 상태
- 페이지 컴포넌트 최상단에서 `if (loading) return <Spinner />`, 이어서 `if (error) return <p className="text-sm text-danger">{error}</p>` 순서로 얼리 리턴한다.
- 목록/데이터가 비어 있을 때는 별도 컴포넌트를 새로 만들지 말고, `<p className="text-sm text-muted">아직 등록된 체험단 기록이 없습니다.</p>` 같은 톤(체언+"이/가 없습니다.")의 안내 문구를 그 자리에 인라인으로 둔다.
- 목록 조회처럼 loading/error/data를 함께 다뤄야 하면 새로 만들지 말고 `useAsyncList` 훅을 재사용한다.

## 반응형/모바일
- 모바일/데스크톱 분기 기준은 `sm:` 브레이크포인트 하나로 통일한다. 모바일 전용 요소는 `sm:hidden`, 데스크톱 전용 요소는 `hidden ... sm:block` 형태로 쓴다 (`BottomTabBar`/`Footer` 참고).
- `BottomTabBar`는 모바일 화면 하단에 고정되므로(`--bottom-tab-bar-h` CSS 변수), 하단에 고정되거나 화면 전체 높이를 쓰는 요소는 이 높이만큼 겹치지 않는지 확인한다. Footer가 모바일에서 BottomTabBar 밑에 깔렸던 사례가 있다.
- 컨텐츠 폭은 `max-w-*` 컨테이너로 제한하고 큰 화면에서 `lg:max-w-*` 등으로 넓히는 식으로 처리한다. 페이지가 공용 좁은 폼 컨테이너와 다른 폭이 필요하면 억지로 그 컨테이너에 맞추지 말고 그 페이지 전용 반응형 폭을 준다 (MyPage 사례).
