# 재심청구서 및 무결성 영수증

## 사건 및 청구 범위

- 사건 번호: `2026-UIA-DIST-V1-PRECOURT-0822`
- 비교 기준: `269ca4559fc4aa7dab18e8124812688bc012c967`
- 원심 코드 target: `56d0938fe20885af32cb060f83428609eaa859ce`
- 재심 source target: `2bce807a0d3c4ac577e1ee9a58ff79e106cfa1ed`
- 원격 branch: `codex/uiadapt-distribution-engine-v1`
- 작성일: `2026-08-22` (Asia/Seoul)
- 청구 상태: `SOURCE_REMEDIATED`
- 외부 검증 상태: `CI_AND_DISPOSABLE_MYSQL_PENDING_EXTERNAL_CONFIRMATION`

본 청구서는 원심 공소 네 건을 반박하지 않습니다. 코드 대조 결과 공소 1~4는 정당했습니다. 아래 조치와 독립 검증을 근거로 source remediation 범위의 재심을 청구합니다.

## 공소별 조치

### 1. Legacy R8 rollback

- rollback target의 `server/uiadapt-api.mjs` 존재 여부로 capability를 판별합니다.
- API-capable target은 static/API/gateway restart와 API/DB health를 계속 필수로 요구합니다.
- legacy target은 API service를 명시적으로 stop하고 static/gateway만 restart한 뒤 authenticated legacy smoke를 수행합니다.
- automatic rollback, manual rollback, `manual_recover`를 모두 같은 정책으로 교정했습니다.
- API capability가 서로 다른 current/rollback target의 2×2 조합과 실패 복구를 실행 fixture로 검증합니다.

### 2. Manual Takeover 및 Adaptive toggle persistence

- 한 session에서 `REPLAY* -> USER*`를 허용하고 event별 source를 보존합니다.
- `USER -> REPLAY` 되감기와 USER session의 REPLAY event는 거부합니다.
- `snapshot.adaptiveEnabled`를 필수 boolean으로 추가하고 snapshot마다 저장·조회합니다.
- applied-state 정책은 session 초기값이 아니라 각 frame의 adaptive 값으로 검증합니다.
- 기존 DB에는 `db/002-uiadapt-snapshot-adaptive.sql`을 적용해 nullable column 추가, session 초기값 backfill, `NOT NULL` 강화 순으로 업그레이드합니다.

### 3. Candidate persistence continuity

- eligibility, candidate identity, 직전 persistence를 이용한 O(1) recurrence를 강제합니다.
- `0 -> 2` 위조, eligible 상태의 임의 reset, ineligible transition을 거부합니다.
- 정상 `0 -> 1 -> 2 -> 3 + transition`, candidate 변경, eligibility 상실은 보존합니다.

### 4. Required verification

- local Chapter 6 명령은 구현과 분리된 verifier가 exact source target에서 실행했습니다.
- source target은 원격 branch에 push되어 원격 ref와 일치합니다.
- 로컬 환경에는 Docker와 MySQL CLI가 없어 disposable MySQL 실행은 불가능했습니다.
- 현재 `gh` 인증 계정은 private repository Actions API에 `404 Not Found`를 받아 exact-target GitHub job 결과를 열람하지 못했습니다.

## TDD 영수증

| 결함 | RED | GREEN |
|---|---|---|
| mixed source / adaptive / persistence | `node --test server/db.test.mjs`: 9 pass, 4 fail | `node --test server/db.test.mjs`: 14/14 pass |
| legacy rollback | focused deployment: 0 pass, 2 fail | `npm run test:deployment`: 23/23 pass |
| ineligible transition | focused DB test: 1 pass, 1 fail | DB suite: 14/14 pass |
| schema migration contract | schema suite: 1 pass, 1 fail | schema suite: 2/2 pass |

## 독립 리뷰 영수증

- Spec-compliance reviewer: 최초 FAIL 후 ineligible transition 교정, 재검토 `PASS`.
- Code-quality reviewer: migration과 manual recovery fixture 지적 후 교정, 최종 `APPROVED`.
- 두 reviewer 모두 구현에 참여하지 않았고 read-only로 검토했습니다.

## 제6장 독립 검증 결과

검증 target은 시작과 종료 모두 `2bce807a0d3c4ac577e1ee9a58ff79e106cfa1ed`였습니다.

| 명령 | 결과 |
|---|---|
| `npm test` | RC 0, 58/58 |
| `npm run test:api` | RC 0, 25 pass, integration 1 skip |
| `npm run test:gateway` | RC 0, 17/17 |
| `npm run test:deployment` | RC 0, 23/23 |
| `npm run verify:build-bases` | RC 0 |
| `npm run build` | RC 0 |
| `npm run build:nwg` | RC 0 |
| `npm run test:e2e` | RC 0, 54/54 |
| `npm audit --omit=dev --audit-level=high` | RC 0, vulnerabilities 0 |
| `git diff --check` | RC 0 |
| `UIADAPT_INTEGRATION=1 npm run test:api-integration` | BLOCKED: Docker/MySQL unavailable |

검증 UTC 구간은 `2026-08-22T01:50:53.055Z`부터 `2026-08-22T01:52:44.202Z`까지입니다.

## 원격 및 무결성 영수증

- Push 결과: `24f9f8b..2bce807` -> `codex/uiadapt-distribution-engine-v1`
- 독립 원격 ref 확인: `2bce807a0d3c4ac577e1ee9a58ff79e106cfa1ed`
- source tree: 아래 manifest 생성 시 기록
- petition bytes: self-excluding manifest `review/retrial_20260822_manifest.sha256`에 기록

## 잔존 제한과 재심 요청

Source code, migration contract, rollback fixture, local full regression은 교정 및 독립 확인되었습니다. 그러나 disposable MySQL 실제 실행과 GitHub exact-target job 성공은 현재 접근 환경에서 확인되지 않았습니다.

따라서 다음과 같이 청구합니다.

- 원심 High 2건과 Medium 1건의 source defect: `REMEDIATED`
- local source review 및 regression 범위: `READY_FOR_DEPLOYMENT_REVIEW`
- disposable MySQL 및 exact-target CI 포함 최종 merge 승인: `PENDING_EXTERNAL_CONFIRMATION`

이 문서는 production 배포 완료나 live acceptance를 주장하지 않습니다.
