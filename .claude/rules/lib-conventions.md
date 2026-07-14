---
paths:
  - "src/lib/**/*.ts"
---

# src/lib 컨벤션

## 데이터 접근
- "내 데이터만" 조회하는 함수는 RLS 정책만 믿지 말고, `.eq('user_id', userId)` 같은 명시적 필터를 쿼리에 직접 넣을 것. RLS 정책은 OR로 겹칠 수 있어서 admin 등 다른 정책이 함께 매칭되면 의도치 않게 스코프가 넓어질 수 있다.
- 개인 스코프 조회와 전체(admin) 조회가 같은 테이블을 읽더라도, 하나의 함수가 caller identity에 따라 암묵적으로 결과가 달라지게 하지 말 것. `getMyFeedbackList(userId)` / `getFeedbackList()`처럼 이름과 쿼리를 분리해서 어떤 스코프인지 코드만 보고 알 수 있게 한다.

## 에러 처리
- `src/lib` 함수는 raw Supabase 에러를 그대로 던지지 않는다. `null`을 반환하거나, 정규화된 `Error`(또는 `{ error }` 형태)로 감싸서 반환/throw한다. 실제 화면에 보여줄 메시지 조립은 호출하는 쪽(훅/페이지)의 책임으로 남긴다.
