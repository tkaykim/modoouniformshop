## SQL RULES – Supabase(PostgreSQL) 작성 규칙

이 문서는 Supabase SQL 작성 시 빈번하게 발생한 오류를 예방하기 위한 필수 규칙을 정리합니다. 모든 SQL 변경은 본 문서를 따른 후 적용하세요.

### 1) POLICY에는 IF NOT EXISTS가 없습니다
- 올바른 패턴: `drop policy if exists ...; create policy ...;`
- 잘못된 패턴: `create policy if not exists ...` (PostgreSQL 문법상 존재하지 않음)

예시
```
drop policy if exists "reviews_select_anon" on public.reviews;
create policy "reviews_select_anon" on public.reviews for select to anon using (true);
```

### 2) 스키마 변경은 멱등하게 작성
- 테이블/열 생성 시 `if not exists` 활용
- 트리거/함수/인덱스는 기존 존재 시 drop 후 create

### 3) RLS는 테이블마다 명시적으로 enable
```
alter table public.<table> enable row level security;
```

### 4) 스토리지 정책은 버킷 범위를 명시
- `storage.objects` 정책에서 `bucket_id = '<bucket>'` 조건을 반드시 포함
```
create policy "bucket_read" on storage.objects
  for select to anon using (bucket_id = 'reviews');
```

### 5) 권한 범위 분리
- 공개 읽기(anon)와 인증 사용자 읽기(auth)를 분리해 정의
- 쓰기/수정은 authenticated만 허용

### 6) 배포 순서
1. 스키마(테이블/열/함수/트리거)
2. RLS enable
3. 정책(drop → create)
4. 스토리지 버킷 및 정책

### 7) 타임존
- DB 전체 타임존 변경 대신 역할별로 지정
```
alter role anon set time zone 'Asia/Seoul';
alter role authenticated set time zone 'Asia/Seoul';
alter role service_role set time zone 'Asia/Seoul';
```

