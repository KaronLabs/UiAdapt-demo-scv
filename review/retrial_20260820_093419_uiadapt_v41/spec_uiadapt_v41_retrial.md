# UIAdapt v4.1 Evidence Remediation Retrial

```yaml
meta:
  case_id: retrial_20260820_093419_uiadapt_v41
  generated_at: 2026-08-20T09:37:00+09:00
  repository: git@github-karonlabs:KaronLabs/UiAdapt-demo-scv.git
  branch: fix/uiadapt-v4.1-product-contract
  worktree_path: E:\03_AllWork\grafana\park-web-demo-v4.1
  implementation_target_sha: 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff
  comparison_base: main@68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0
  changed_files_or_diff: evidence/retrial_20260820_093419_uiadapt_v41/raw/01-git-before.txt
  reviewer_access_assumption: local package access or remote branch access at the exact published commit
  reviewer_required: different_session_or_model
  evidence_package: evidence/retrial_20260820_093419_uiadapt_v41
  constitutional_documents:
    - E:\03_AllWork\grafana\AGENTS.md | present | SHA256 CDF4CDB6E784B68B9B8EBF988A2936DD1D5D8563C68D2C006463D97EE3034A25
    - E:\03_AllWork\grafana\park-web-demo-v4.1\README.md | present | SHA256 B54DCF81940E6DF57EFBB6E98C774592F7A14ADBB69D02EC906A36457D3C2C32
    - CLAUDE.md | missing
    - GEMINI.md | missing
    - SECURITY.md | missing
review_target: 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff
comparison_base: 68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0
status: success
reviewer_required: different_session_or_model
code_modified: false
manifest_sha256: E189282E032087AA60D1640BC3A53EDD3B315BEFE0214E2A53B6C76F62FDFE3E
```

## Scope

This is an evidence-only retrial of the frozen v4.1 source. It does not alter
product, test, build, workflow, historical documentation, or historical
evidence files. The collector does not issue a verdict. The maximum claim is
`EVIDENCE_PACKAGE_READY_FOR_INDEPENDENT_REVIEW`.

## Implementation diff

The complete machine-derived `git diff --stat main...HEAD` and
`git diff --name-status main...HEAD` are preserved in `raw/01-git-before.txt`.
The result contains 36 implementation files with 825 insertions and 71
deletions. The retrial itself adds only:

```text
evidence/retrial_20260820_093419_uiadapt_v41/**
review/retrial_20260820_093419_uiadapt_v41/**
```

## Tests

| Command | Raw evidence | Exit | Result |
|---|---|---:|---|
| `npm ci` | `raw/02-npm-ci.txt` | 0 | 240 packages installed; 0 vulnerabilities |
| `npm run lint` | `raw/03-lint.txt` | 0 | ESLint emitted no findings |
| `npm test` | `raw/04-vitest.txt` | 0 | 2 files, 17 tests passed |
| `npm run build` | `raw/05-build.txt` | 0 | TypeScript and Vite build completed |
| `npm run test:e2e` | `raw/06-playwright.txt` | 0 | 36 tests passed across three viewport projects |
| `npm audit --omit=dev --audit-level=high` | `raw/07-audit-production.txt` | 0 | 0 vulnerabilities |
| `npm audit` | `raw/08-audit-full.txt` | 0 | 0 vulnerabilities |
| `git diff --check` | `raw/09-git-diff-check.txt` | 0 | no output, RC 0 |

## Evidence quotes

```yaml
- claim: npm ci completed
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/02-npm-ci.txt
  sha256: 3907A1D877ED4BD68D669779DCA6C48E89A64416B32A46D33EC0A2CFE3D84114
  command: npm ci
  start_timestamp: 2026-08-20T09:34:45.6386896+09:00
  exit_code: 0
  quote: |
    added 240 packages, and audited 241 packages in 19s
    63 packages are looking for funding
      run `npm fund` for details
    found 0 vulnerabilities

- claim: lint completed
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/03-lint.txt
  sha256: C4A0B06189EC26D53BCBA70C296CEB3F79FFCB2D4B275FB090B8C74365DA1D1E
  command: npm run lint
  start_timestamp: 2026-08-20T09:35:17.2743138+09:00
  exit_code: 0
  quote: |
    > uiadapt-adaptive-storefront-theater@4.1.0 lint
    > eslint .
    --- RAW OUTPUT END ---
    EXIT_CODE: 0

- claim: Vitest suite passes
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/04-vitest.txt
  sha256: B271A3D7E018019C2329D1AEA4DE9BCD26737E2CD7D463D808DDF435AC40AE68
  command: npm test
  start_timestamp: 2026-08-20T09:35:23.6750573+09:00
  exit_code: 0
  quote: |
    Test Files  2 passed (2)
         Tests  17 passed (17)
      Start at  09:35:25
      Duration  3.69s (transform 249ms, setup 618ms, import 1.25s, tests 735ms, environment 3.00s)

- claim: production build completes
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/05-build.txt
  sha256: ED883DD39D4F5792EC75B083094DC7905DDEFD6C29B0B7090531EB3C66556F53
  command: npm run build
  start_timestamp: 2026-08-20T09:35:28.9179429+09:00
  exit_code: 0
  quote: |
    vite v8.2.1 building client environment for production...
    transforming...
    ✓ 27 modules transformed.
    rendering chunks...
    computing gzip size...

- claim: Playwright suite passes
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/06-playwright.txt
  sha256: 4E93ED01CCE947C85ED046BBD344E0C309546E084270208B39FBA35C912F4F31
  command: npm run test:e2e
  start_timestamp: 2026-08-20T09:35:31.8979396+09:00
  exit_code: 0
  quote: |
    Running 36 tests using 3 workers
    ok 34 [desktop-1440] › e2e\storefront.spec.ts:226:1 › Stop preserves state and cancels the remaining Replay timers (2.1s)
    ok 35 [mobile-390] › e2e\storefront.spec.ts:226:1 › Stop preserves state and cancels the remaining Replay timers (2.0s)
    ok 36 [laptop-1024] › e2e\storefront.spec.ts:226:1 › Stop preserves state and cancels the remaining Replay timers (1.9s)
    36 passed (21.7s)

- claim: production dependency audit reports no vulnerability
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/07-audit-production.txt
  sha256: 6B7718931782E11E35A5E32C488BC473FCD1F42D8D458DC78A1693C450516CEF
  command: npm audit --omit=dev --audit-level=high
  start_timestamp: 2026-08-20T09:36:18.1755321+09:00
  exit_code: 0
  quote: |
    --- RAW OUTPUT BEGIN ---
    found 0 vulnerabilities
    --- RAW OUTPUT END ---
    EXIT_CODE: 0

- claim: full dependency audit reports no vulnerability
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/08-audit-full.txt
  sha256: ABCD0C358F8AE5DD2390FBF3293D47A4FF238814E42668EB5B090A18BB6D82BC
  command: npm audit
  start_timestamp: 2026-08-20T09:36:19.1023597+09:00
  exit_code: 0
  quote: |
    --- RAW OUTPUT BEGIN ---
    found 0 vulnerabilities
    --- RAW OUTPUT END ---
    EXIT_CODE: 0

- claim: git diff check returns success
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/09-git-diff-check.txt
  sha256: 2A51F5F345E2E48C40D5C46E3EE085160849DE84E9CBC721BC11B31BC6EF2D03
  command: git diff --check
  start_timestamp: 2026-08-20T09:36:20.0161508+09:00
  exit_code: 0
  quote: |
    --- RAW OUTPUT BEGIN ---
    --- RAW OUTPUT END ---
    EXIT_CODE: 0
    END_TIMESTAMP: 2026-08-20T09:36:20.0463533+09:00

- claim: frozen source paths match target SHA
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/12-source-integrity.txt
  sha256: C4DE63DE4E9A32F60ADF7F96C2126AEAD4BAE2D399C2B984F4355A81B92260E9
  command: git diff --exit-code target SHA across every frozen path
  start_timestamp: 2026-08-20T09:36:20.7972384+09:00
  exit_code: 0
  quote: |
    COMMAND_CHECK: git diff --exit-code 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff -- src
    CHECK_EXIT_CODE: 0
    COMMAND_CHECK: git diff --exit-code 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff -- e2e
    CHECK_EXIT_CODE: 0

- claim: nested deployment uses /uiadapt_demo/
  source: evidence/retrial_20260820_093419_uiadapt_v41/raw/11-runtime-evidence.txt
  sha256: ACED37854B26F2DD17C046C35DB8B1A58AB2422085E0CFB2DD044CF42532279B
  command: dist inventory and nested-base inspection
  start_timestamp: 2026-08-20T09:36:20.0864357+09:00
  exit_code: 0
  quote: |
    --- NESTED BASE MATCHES ---
        <script type="module" crossorigin src="/uiadapt_demo/assets/index-C2KZUVP0.js"></script>
        <link rel="stylesheet" crossorigin href="/uiadapt_demo/assets/index-BTJBcn0m.css">
    --- SOURCE NETWORK/HTML-INJECTION SURFACE SCAN ---
    NO_MATCHES
```

## Threat model

```yaml
threat_model:
  assets: static React/Vite HTML, JavaScript, CSS, local SVG, bundled fonts
  trust_boundaries: browser, local 127.0.0.1 preview server, npm registry during install/audit
  runtime_network_boundary: no fetch, XMLHttpRequest, axios, external URL, or dangerouslySetInnerHTML match in src
  secret_boundary: no application secret or authentication boundary found or expected
  user_input_boundary: local in-memory storefront controls; no backend submission
  out_of_scope: [live deployment, server headers, real auth, payment, analytics, recommendation service]
```

## Risks

```yaml
risks:
  - risk: PRODUCT_CLARITY
    status: NOT_VERIFIED
    severity: medium
    handling: accepted_unresolved
    reason: The three-person non-developer test was not performed.
  - risk: REMOTE_CI
    status: NOT_VERIFIED
    severity: medium
    handling: plan
    reason: gh run list returned HTTP 404; no workflow success is inferred.
  - risk: LIVE_DEPLOYMENT
    status: NOT_VERIFIED
    severity: low
    handling: accepted_unresolved
    reason: The live server was not modified or tested.
  - risk: BROWSER_COVERAGE
    status: VERIFIED_CHROMIUM_ONLY
    severity: low
    handling: accepted_unresolved
    reason: The configured desktop, laptop, and mobile projects use Chromium; Firefox and WebKit were not claimed.
  - risk: HISTORICAL_ATTRIBUTION
    status: UNAVAILABLE
    severity: low
    handling: safeguard
    reason: Pre-existing untracked review artifacts were recorded but not rewritten or used as fresh proof.
```

## Source integrity

```yaml
source_integrity:
  implementation_target_sha: 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff
  result: every frozen path check returned 0
  code_modified: false
  evidence: evidence/retrial_20260820_093419_uiadapt_v41/raw/12-source-integrity.txt
```

## Publication state

```yaml
publication_state:
  remote_branch: present
  remote_branch_sha_before_evidence_commit: 0f69cc5ec9b4c5d822dc1f08634d225bc617ffff
  comparison_base: 68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0
  remote_ci: NOT_VERIFIED
  live_deployment: NOT_VERIFIED
  evidence: evidence/retrial_20260820_093419_uiadapt_v41/raw/14-publication-state.txt
```

## Limitations and attempt history

- The collector is not the final reviewer and issues no verdict, approval, or score.
- Product clarity, remote CI, live deployment, and non-Chromium browsers remain unverified.
- `retrial_20260820_084917_uiadapt_v41` remains locally preserved but was not selected for publication because Git EOL normalization would have changed its sealed raw bytes.
- `retrial_20260820_093322_uiadapt_v41` remains locally preserved as a failed capture-harness invocation; it is not submitted as successful evidence.
- The current package records all text evidence directly as UTF-8/LF so staged Git blobs can be checked byte-for-byte against the manifest.

## Independent-review instructions

1. Resolve the implementation target and comparison base independently.
2. Read the raw logs instead of trusting this summary.
3. Verify every manifest entry and its exact ordered membership.
4. Confirm committed Git blob bytes match the sealed evidence bytes.
5. Keep unresolved risk states unresolved.
6. Issue any verdict only from a different session or model.
