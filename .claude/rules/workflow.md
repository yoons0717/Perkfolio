# 작업 워크플로우 규칙

## Supabase migration
- Supabase MCP `apply_migration`으로 스키마/RLS를 바꾸면 즉시 라이브에는 반영되지만 `supabase/migrations/`에 파일이 자동으로 생기지 않는다.
- `apply_migration` 실행 직후 `list_migrations`로 실제 배정된 `version`/`name`을 확인하고, 동일한 SQL로 `supabase/migrations/<version>_<name>.sql` 파일을 반드시 만들 것. 파일명 타임스탬프가 다르면 CLI가 "아직 적용 안 된 새 migration"으로 오인한다. 이 파일 생성은 후속 작업이 아니라 migration 적용 자체의 일부다.

## 검증 명령어
- 이 프로젝트 루트의 `tsconfig.json`은 `references`만 있는 파일이라, 단독 `tsc --noEmit`(또는 `npx tsc --noEmit`)은 아무 파일도 검사하지 않고 조용히 통과한다.
- 타입 체크는 `npx tsc -p tsconfig.app.json --noEmit` 또는 `npm run build`로 할 것.
