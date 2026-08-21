{
  "document_title": "Code Supreme Court Submission — UIAdapt Investor Stage and nwg Release",
  "meta": {
    "created_at": "2026-08-21T02:14:01Z",
    "review_target": "Git commit fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 on codex/uiadapt-investor-stage, deployed as nwg current release and exposed at https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/",
    "comparison_base": "91d73b45adeb97b86be97dba69f638ab910a06e9 (previous known-good nwg release)",
    "feedback_source": [
      "User-approved UIAdapt investor-stage redesign plan",
      "Independent specification review",
      "Independent visual REMAND: viewport-only evidence, 1024 orphan-card centering, mobile disclosure wrapping",
      "Independent quality REMAND: inactive/muted contrast and Wanted Sans false-positive detection",
      "User instruction to finish nwg deployment and use official web documentation instead of inference",
      "User request in pasted Code Supreme Court SPEC WRITER protocol"
    ],
    "scope": {
      "included": [
        "Seven committed source/test/dependency files between comparison_base and review_target",
        "GitHub branch publication of the exact target SHA",
        "nwg SHA-addressed release packaging, atomic current symlink switch, systemd runtime, Basic Auth gateway, Tailscale Funnel mapping",
        "Fresh local automated verification, 18 screenshots, independent public browser smoke, and independent source-to-runtime provenance"
      ],
      "excluded": [
        "Merge to main",
        "Cloudflare or Replit deployment",
        "Changes to existing 8443 and 8787 mappings",
        "Full host reboot",
        "Human three-person product-clarity experiment"
      ]
    },
    "changed_files_or_diff": {
      "artifact": "review/evidence/run_20260821_020352_uiadapt_investor_stage/source.diff",
      "sha256": "0cf119de60753e3ab70bac9541c64a60eb28512dd83684b05c1542664db33087",
      "bytes": 75773,
      "committed_paths": [
        "e2e/storefront.spec.ts",
        "package-lock.json",
        "package.json",
        "src/App.test.tsx",
        "src/App.tsx",
        "src/main.tsx",
        "src/styles.css"
      ],
      "deleted_paths": []
    },
    "reviewer_access_assumption": "The different-session reviewer receives this spec content, the entire review/evidence/run_20260821_020352_uiadapt_investor_stage directory, source.diff, repository access sufficient to resolve both commits, and the public URL. SSH and the live credential are not assumed; captured redacted runtime outputs are included for those boundaries.",
    "constitution_paths": [
      "E:/03_AllWork/grafana/AGENTS.md (provided in active session)",
      "No additional repository-local AGENTS.md was discovered or claimed for E:/03_AllWork/uiadapt-investor-stage."
    ],
    "evidence_package": {
      "spec_file_path": "review/spec_20260821_113808_uiadapt_investor_stage_nwg_release_r3.md",
      "spec_file_content_available": true,
      "changed_files_or_diff": "review/evidence/run_20260821_020352_uiadapt_investor_stage/source.diff",
      "test_commands": [
        "npm ci && npm run lint && npm test && npm run test:gateway && npm run test:deployment && npm run verify:build-bases && npm run build:nwg && npm run test:e2e && npm audit --omit=dev --audit-level=high",
        "pwsh -NoProfile -File review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\runtime-check.ps1",
        "pwsh -NoProfile -File \"review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\run-independent-public-smoke.ps1\""
      ],
      "test_outputs": [
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-target.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-target-attempt1-failed.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-diff.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/source-diff-receipt.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/automated-verification.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/runtime-verification.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/deployment-history.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-public-smoke.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/screenshot-inventory.json"
      ],
      "evidence_timestamps": [
        "git-target.json: 2026-08-21T02:07:18Z",
        "git-target-attempt1-failed.json: 2026-08-21T02:04:47Z",
        "git-diff.json: 2026-08-21T02:04:47Z",
        "source-diff-receipt.json: 2026-08-21T02:08:09Z",
        "automated-verification.json: 2026-08-21T02:06:27Z",
        "runtime-verification.json: 2026-08-21T02:06:29Z",
        "deployment-history.json: 2026-08-21T02:08:09Z",
        "independent-public-smoke.json: 2026-08-21T02:06:40Z",
        "screenshot-inventory.json: 2026-08-21T02:09:18Z"
      ],
      "relevant_runtime_outputs": [
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/runtime-verification.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/deployment-history.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-public-smoke.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-provenance.json"
      ],
      "known_missing_items": [
        "PRODUCT_CLARITY=NOT_VERIFIED: no real three-person non-developer test was performed.",
        "Full host reboot was not executed because it could affect unrelated nwg services.",
        "The first silent SCP attempt and one auxiliary PowerShell blob-check syntax failure were observed in the orchestrator session but no raw capture file was retained; both are disclosed in risks.",
        "Historical implementation RED logs and reviewer chat streams are not reproduced in this package; the final target is covered by fresh regression evidence."
      ],
      "evidence_directory": "review/evidence/run_20260821_020352_uiadapt_investor_stage",
      "independent_public_smoke_sha256": "a06cb9e8cf3d4f6d4dc3ebbad08d165d44a38e4a6bc496ae5ff6b90cd9484ab9",
      "independent_provenance_sha256": "aea8a62071e83efafb9666d587d41fe2c4a5f3b4f4ffde3bd6b5682c160319dd",
      "independent_provenance_result": "PASS_WITH_DISCLOSED_AUDITOR_CORRECTION",
      "manifest": {
        "path": "review/evidence/run_20260821_020352_uiadapt_investor_stage/SHA256SUMS",
        "sha256": "6d428f6edad6df85dde9c7da50d9f4768ebc931d8c702da1003dd5a2078fbe33",
        "entry_count": 40,
        "self_excluding": true,
        "verification_result": "GREEN",
        "verified_at_utc": "2026-08-21T02:34:00Z"
      }
    },
    "spec_revision": 3,
    "supersedes": "review/spec_20260821_113136_uiadapt_investor_stage_nwg_release_r2.md",
    "revision_reason": "Append-only correction of R2-M1: bind this revision to its own path and the already sealed evidence manifest.",
    "revised_at_utc": "2026-08-21T02:38:08Z"
  },
  "summary": [
    "Reframed the storefront as a UIAdapt investor-stage technology demonstration while retaining the same product catalog and deterministic adaptive runtime.",
    "Replaced Bricolage Grotesque and Manrope with locally bundled wanted-sans@1.0.3 for user-facing text while retaining IBM Plex Mono for state and diagnostic text.",
    "Added the exact investor message, invariant strip, causal trace, 27-second CTA, and explicit EXPLORE/COMPARE/FOCUS missions; moved the cart into the sample merchant stage.",
    "Strengthened responsive, contrast, focus, reduced-motion, real-font-load, and state-visibility tests.",
    "Pushed exact SHA fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 and atomically deployed it to nwg behind the existing password gateway and Tailscale Funnel.",
    "Preserved the previous release 91d73b45adeb97b86be97dba69f638ab910a06e9 as rollback material."
  ],
  "rationale": [
    "The previous visual hierarchy resembled a small commerce prototype and used typography too small for a second-round startup review.",
    "The revised screen makes the product thesis observable in the first viewport: Same catalog + Same behavior + Different presentation, then Behavior → State → Policy → Interface.",
    "Wanted Sans was selected and pinned from its official package so Korean display and body text use one locally bundled family with no runtime CDN dependency.",
    "The nwg release model uses releases/<SHA> plus an atomic current symlink, so a failed deployment can restore the previous release without overwriting it.",
    "Tailscale Funnel behavior was checked against https://tailscale.com/docs/reference/tailscale-cli/funnel and static serving against https://github.com/vercel/serve."
  ],
  "threat_model": {
    "trust_boundary": "Public internet → Tailscale Funnel :443 → loopback password gateway :4180 → loopback static server :5173 → immutable SHA release.",
    "trusted": [
      "Git object identity for the declared target and base",
      "The SHA-256-bound release archive and independent path-ordered release manifest",
      "systemd units installed from the reviewed release",
      "root-owned 0600 credential file metadata and LoadCredential boundary",
      "Local bundled product data, SVGs, Wanted Sans, and IBM Plex Mono assets"
    ],
    "untrusted": [
      "Unauthenticated and incorrectly authenticated internet clients",
      "Client-provided Authorization headers and malformed request targets",
      "External runtime origins and CDNs",
      "Author summaries without capture artifacts",
      "A service reporting active before its listener is ready"
    ],
    "boundary_change": [
      "The public topology and shared Basic Auth boundary were not newly created by the investor-stage source diff; the running current release was changed from the comparison base to the target SHA.",
      "The UI font dependency changed from two @fontsource variable families to wanted-sans@1.0.3, bundled into the static artifact.",
      "No database, payment, analytics, personal-data, token, or external API boundary was added."
    ],
    "blocked_scenarios": [
      "Missing or incorrect Basic Auth receives HTTP 401.",
      "Successful proxying does not require exposing the credential in repository files, commands, evidence logs, or browser artifacts.",
      "External runtime requests, asset 404s, console errors, and request failures are test failures.",
      "A different product's purchase evidence cannot be claimed as a presentation-only change because catalog/runtime regression tests remain active.",
      "Readiness is now judged by actual listeners and HTTP response rather than systemd active alone during deployment orchestration."
    ],
    "new_scenarios": [
      "The public demo remains exposed to password guessing because it uses one shared Basic Auth credential.",
      "Availability depends on Tailscale Funnel and the nwg host.",
      "The large complete Wanted Sans WOFF2 increases static payload size.",
      "A future package upgrade could change the font license or asset layout and requires a fresh dependency review."
    ]
  },
  "before_after": [
    {
      "before": "Header presented Atelier Audio as the primary brand and kept the cart in the global header.",
      "after": "Header presents UIAdapt · Adaptive UI Infrastructure; Atelier Audio is explicitly a sample store and owns the cart."
    },
    {
      "before": "Hero copy was '같은 상품, 달라지는 무대.' and did not expose the causal chain in the first viewport.",
      "after": "Hero states '특허 출원 기반 적응형 UI 인프라', '같은 상품을, 더 나은 판단으로.', the WHAT/HOW thesis, invariants, and causal trace."
    },
    {
      "before": "Bricolage Grotesque and Manrope were active UI families.",
      "after": "Wanted Sans Variable is the only user-facing family; IBM Plex Mono remains for state/evidence diagnostics."
    },
    {
      "before": "Existing deployment current pointed to 91d73b45adeb97b86be97dba69f638ab910a06e9.",
      "after": "nwg current points to fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91; the previous release remains available for rollback."
    }
  ],
  "diffs": {
    "artifact": "review/evidence/run_20260821_020352_uiadapt_investor_stage/source.diff",
    "summary": "Seven modified committed paths; 513 insertions and 211 deletions; no deleted path.",
    "paths": {
      "src/App.tsx": "Investor-stage brand, hero, invariants, causal trace, state missions, CTA, and sample-store cart placement.",
      "src/styles.css": "Wanted Sans type scale, investor-stage layout, causal signature, responsive behavior, contrast corrections, focus and reduced-motion treatments.",
      "src/main.tsx": "Remove Bricolage/Manrope imports and import complete local Wanted Sans variable CSS.",
      "src/App.test.tsx": "DOM and behavior contracts for new hero, causal trace, invariant strip, CTA, and cart placement.",
      "e2e/storefront.spec.ts": "Real Wanted Sans load, computed sizes, contrast, 18 screenshots, responsive layout, state visibility, and regression checks.",
      "package.json": "Replace two font packages with exact wanted-sans@1.0.3.",
      "package-lock.json": "Lockfile resolution and integrity update for the dependency change."
    }
  },
  "files": [
    {
      "path": "src/App.tsx",
      "status": "modified",
      "role": "Investor-stage presentation markup",
      "reason": "Expose the product thesis and separate UIAdapt from the sample merchant.",
      "impact": "high"
    },
    {
      "path": "src/styles.css",
      "status": "modified",
      "role": "Typography, layout, visual state and accessibility rules",
      "reason": "Make the demo readable and investor-facing across three viewports.",
      "impact": "high"
    },
    {
      "path": "src/main.tsx",
      "status": "modified",
      "role": "Font entrypoint",
      "reason": "Load local Wanted Sans and retire two prior families.",
      "impact": "medium"
    },
    {
      "path": "src/App.test.tsx",
      "status": "modified",
      "role": "Component regression tests",
      "reason": "Bind exact copy, DOM contracts and CTA behavior.",
      "impact": "medium"
    },
    {
      "path": "e2e/storefront.spec.ts",
      "status": "modified",
      "role": "Browser and visual regression suite",
      "reason": "Prove typography, viewports, contrast, assets and state transitions.",
      "impact": "high"
    },
    {
      "path": "package.json",
      "status": "modified",
      "role": "Dependency declaration",
      "reason": "Pin wanted-sans@1.0.3.",
      "impact": "medium"
    },
    {
      "path": "package-lock.json",
      "status": "modified",
      "role": "Dependency integrity lock",
      "reason": "Reproduce the font dependency graph.",
      "impact": "medium"
    },
    {
      "path": "review/spec_20260821_113808_uiadapt_investor_stage_nwg_release_r3.md",
      "status": "added",
      "role": "Court specification",
      "reason": "Append-only Court revision binding the self path and sealed evidence manifest after R2 independent review.",
      "impact": "low"
    },
    {
      "path": "review/evidence/run_20260821_020352_uiadapt_investor_stage/",
      "status": "added",
      "role": "Raw captures, full diff, screenshots, companion receipts, independent receipts and a self-excluding SHA-256 manifest generated after all final package artifacts.",
      "reason": "Allow another session to verify claims without relying on chat history; outside the reviewed product commit.",
      "impact": "low"
    }
  ],
  "implementation": {
    "core_logic": [
      "Product, RuntimeSnapshot, deriveFeatures, detectState, derivePolicy, replay fixture, and catalog objects were not modified.",
      "stateMission maps EXPLORE→발견, COMPARE→비교, FOCUS→결정지원 only at the presentation layer.",
      "The header and hero were reorganized without changing runtime event collection.",
      "SignalRibbon moved into the causal system and remains state-derived."
    ],
    "edge_conditions": [
      "Adaptive OFF still displays detected state while applying EXPLORE presentation.",
      "FOCUS hides comparison support; COMPARE shows it.",
      "Keyboard focus survives adaptation and reduced-motion removes movement.",
      "390px has zero horizontal overflow and non-wrapping evidence controls; 1024px centers the orphan product card.",
      "Wanted Sans verification requires an exact @font-face, loaded FontFace, and HTTP 200 for WantedSansVariable*.woff2."
    ],
    "deployment_flow": [
      "Build and package exact target SHA.",
      "Verify local and uploaded tar SHA-256.",
      "Extract to a SHA staging directory, run production npm install and systemd unit verification.",
      "Rename staging to releases/<SHA>, atomically replace current, restart services, wait for listeners and HTTP readiness.",
      "Verify auth, nested assets, service state, parent repository cleanliness, Funnel mappings and public browser behavior.",
      "On failure after current switch, atomically restore the previous release and restart services."
    ],
    "exception_history": [
      "The first deployment reached systemd active before the static listener was ready. The post-switch check failed and the rollback handler restored the prior release. Journal evidence is preserved.",
      "The retry changed only orchestration readiness: condition-based listener and HTTP checks replaced immediate readiness inference.",
      "The first git target evidence command used ^{commit}; Windows cmd stripped the caret and returned RC 128. That capture is preserved, and a caret-free target command returned RC 0.",
      "An initial quiet SCP attempt reported RC 0 but produced no remote file; the absence was detected before mutation. A second visible SCP was size/hash verified. Raw output for the first attempt is unavailable.",
      "Independent provenance initially sorted one manifest by whole hash-leading rows rather than paths, disclosed the mismatch, corrected the auditor, and returned PASS_WITH_DISCLOSED_AUDITOR_CORRECTION."
    ]
  },
  "impact": {
    "API": "none",
    "UI": "Major presentation-layer redesign; product and runtime semantics preserved.",
    "DB / 스키마": "none",
    "설정 / 환경변수": "No new application environment variable. Existing UIADAPT_GATEWAY_PASSWORD_FILE and service configuration preserved.",
    "배포 / 인프라": "nwg current moved to the target SHA. Static and gateway services remain loopback-only and enabled/active. Funnel 443 mapping retained; 8443 and 8787 unchanged.",
    "성능": "Complete Wanted Sans WOFF2 is approximately 1.29 MB uncompressed. No comparative latency benchmark was performed.",
    "보안": "No secret added to Git or evidence. Shared Basic Auth remains a limited-strength public gate; no sensitive data exists behind it.",
    "의존성": "Removed @fontsource-variable/bricolage-grotesque and @fontsource-variable/manrope; added exact wanted-sans@1.0.3; serve remains exact 14.2.6.",
    "라이선스 / third-party": "Wanted Sans package is bundled locally. No legal opinion was performed; package license metadata remains the review source.",
    "접근성 (a11y)": "Keyboard path, focus preservation, reduced motion, semantic controls, minimum text size, and reviewed contrast are covered by automated browser tests.",
    "국제화 (i18n)": "Korean remains the primary language; English canonical state and thesis terms remain. word-break: keep-all is used for Korean copy.",
    "데이터 보존 / 삭제 (GDPR 등)": "No personal data collection, analytics, payment, or external behavior transmission. Existing old release and failed deployment evidence retained.",
    "컴플라이언스 (도메인별)": "Patent wording is limited to '특허 출원 기반'; no registration, accuracy, conversion or performance claim is made.",
    "로깅 / 모니터링": "systemd journal and service status provide operational evidence. No new application telemetry was added.",
    "회귀 위험": "Presentation CSS is the largest changed surface; 45 E2E tests and 18 screenshots cover the declared viewports and states.",
    "하위호환성": "Nested /uiadapt_demo/ path, product data, runtime policy, replay timing, Adaptive OFF, gateway and deployment contracts remain compatible."
  },
  "tests": {
    "automated": [
      {
        "command": "npm ci && npm run lint && npm test && npm run test:gateway && npm run test:deployment && npm run verify:build-bases && npm run build:nwg && npm run test:e2e && npm audit --omit=dev --audit-level=high",
        "result": "RC 0: lint; Vitest 19/19; gateway 16/16; deployment 5/5; two build-base contracts; build:nwg; Playwright 45/45; production audit 0 vulnerabilities.",
        "capture": "review/evidence/run_20260821_020352_uiadapt_investor_stage/automated-verification.json"
      },
      {
        "command": "git diff --name-status 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 && git diff --stat 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 && git diff --check 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
        "result": "RC 0: exact seven-path diff and clean diff check.",
        "capture": "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-diff.json"
      }
    ],
    "manual": [
      {
        "procedure": "Inspect 18 fresh screenshots: full-page and viewport-only EXPLORE/COMPARE/FOCUS at 1440×900, 1024×768 and 390×844.",
        "result": "Different-session visual reviewer inspected all 18 exact screenshot paths and hashes: Critical 0, Important 0, Minor 0; verdict PASS.",
        "capture": "review/evidence/run_20260821_020352_uiadapt_investor_stage/visual-review-final.json"
      },
      {
        "procedure": "Different-session Playwright smoke against the authenticated public URL.",
        "result": "PUBLIC_SMOKE_PASS: exact copy, CTA, causal trace, invariants, Wanted Sans, COMPARE 7000ms, FOCUS 21000ms, overflow 0 and runtime-hygiene counts 0.",
        "capture": "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-public-smoke.json"
      }
    ],
    "repro": [
      {
        "procedure": "Inspect systemd journal from 01:45:35–01:47:05 UTC.",
        "result": "First post-switch startup was rolled back before listener readiness; final release started at 01:46:49 UTC and served HTML/CSS/JS with HTTP 200.",
        "capture": "review/evidence/run_20260821_020352_uiadapt_investor_stage/deployment-history.json"
      },
      {
        "procedure": "Execute the original Windows git receipt command containing ^{commit}, then execute the caret-free replacement.",
        "result": "Original capture RC 128 is preserved; corrected capture RC 0 binds local HEAD, base and remote branch.",
        "captures": [
          "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-target-attempt1-failed.json",
          "review/evidence/run_20260821_020352_uiadapt_investor_stage/git-target.json"
        ]
      }
    ]
  },
  "evidence_quotes": [
    {
      "command": "git rev-parse --show-toplevel && git branch --show-current && git rev-parse HEAD && git rev-parse 91d73b45adeb97b86be97dba69f638ab910a06e9 && git status --short --branch && git ls-remote origin refs/heads/codex/uiadapt-investor-stage",
      "stdout": "E:/03_AllWork/uiadapt-investor-stage\ncodex/uiadapt-investor-stage\nfba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\n91d73b45adeb97b86be97dba69f638ab910a06e9\n## codex/uiadapt-investor-stage...origin/codex/uiadapt-investor-stage\n?? review/evidence/\nfba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\trefs/heads/codex/uiadapt-investor-stage\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "Local branch HEAD, comparison base, and GitHub remote branch resolve to the declared target. The only untracked material is the newly created review evidence directory.",
      "timestamp": "2026-08-21T02:07:18Z",
      "evidence_type": "automated",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/git-target.json"
    },
    {
      "command": "git rev-parse --show-toplevel && git branch --show-current && git rev-parse HEAD && git rev-parse 91d73b45adeb97b86be97dba69f638ab910a06e9^{commit} && git rev-parse fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91^{tree} && git status --short --branch && git ls-remote origin refs/heads/codex/uiadapt-investor-stage",
      "stdout": "E:/03_AllWork/uiadapt-investor-stage\ncodex/uiadapt-investor-stage\nfba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\n91d73b45adeb97b86be97dba69f638ab910a06e9{commit}\n",
      "stderr": "fatal: ambiguous argument '91d73b45adeb97b86be97dba69f638ab910a06e9{commit}': unknown revision or path not in the working tree.\nUse '--' to separate paths from revisions, like this:\n'git <command> [<revision>...] -- [<file>...]'\n",
      "exit_code": 128,
      "observation": "Disclosed evidence-collection failure: Windows cmd consumed the caret in ^{commit}, producing RC 128. The failed receipt is preserved and a caret-free command succeeded in git-target.json.",
      "timestamp": "2026-08-21T02:04:47Z",
      "evidence_type": "repro",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/git-target-attempt1-failed.json"
    },
    {
      "command": "git diff --name-status 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 && git diff --stat 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 && git diff --check 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
      "stdout": "M\te2e/storefront.spec.ts\nM\tpackage-lock.json\nM\tpackage.json\nM\tsrc/App.test.tsx\nM\tsrc/App.tsx\nM\tsrc/main.tsx\nM\tsrc/styles.css\n e2e/storefront.spec.ts | 210 ++++++++++++++++++++++++---\n package-lock.json      |  29 ++--\n package.json           |   5 +-\n src/App.test.tsx       |  36 ++++-\n src/App.tsx            |  58 +++++---\n src/main.tsx           |   3 +-\n src/styles.css         | 383 +++++++++++++++++++++++++++++++------------------\n 7 files changed, 513 insertions(+), 211 deletions(-)\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The committed product delta is exactly seven modified paths with 513 insertions and 211 deletions; git diff --check emitted no error.",
      "timestamp": "2026-08-21T02:04:47Z",
      "evidence_type": "automated",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/git-diff.json"
    },
    {
      "command": "git hash-object review/evidence/run_20260821_020352_uiadapt_investor_stage/source.diff && git diff --numstat 91d73b45adeb97b86be97dba69f638ab910a06e9..fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
      "stdout": "89075eb97e54ed41ae0e4bcc800008b0c42991a5\n191\t19\te2e/storefront.spec.ts\n8\t21\tpackage-lock.json\n2\t3\tpackage.json\n29\t7\tsrc/App.test.tsx\n36\t22\tsrc/App.tsx\n1\t2\tsrc/main.tsx\n246\t137\tsrc/styles.css\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The full source.diff artifact is bound by git hash-object output and per-file numstat.",
      "timestamp": "2026-08-21T02:08:09Z",
      "evidence_type": "automated",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/source-diff-receipt.json"
    },
    {
      "command": "npm ci && npm run lint && npm test && npm run test:gateway && npm run test:deployment && npm run verify:build-bases && npm run build:nwg && npm run test:e2e && npm audit --omit=dev --audit-level=high",
      "stdout": "\nadded 315 packages, and audited 316 packages in 16s\n\n87 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities\n\n> uiadapt-adaptive-storefront-theater@4.1.0 lint\n> eslint .\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test\n> vitest run\n\n\n RUN  v4.1.11 E:/03_AllWork/uiadapt-investor-stage\n\n\n Test Files  2 passed (2)\n      Tests  19 passed (19)\n   Start at  11:05:24\n   Duration  18.30s (transform 242ms, setup 5.58s, import 336ms, tests 729ms, environment 27.96s)\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:gateway\n> node --test scripts/password-gateway.test.mjs\n\nTAP version 13\n# Subtest: fails closed when the required password is missing\nok 1 - fails closed when the required password is missing\n  ---\n  duration_ms: 3.5131\n  type: 'test'\n  ...\n# Subtest: reads the password file with exactly one trailing LF or CRLF removed\nok 2 - reads the password file with exactly one trailing LF or CRLF removed\n  ---\n  duration_ms: 8.2446\n  type: 'test'\n  ...\n# Subtest: fails closed on a missing password file even when an environment password exists\nok 3 - fails closed on a missing password file even when an environment password exists\n  ---\n  duration_ms: 2.0463\n  type: 'test'\n  ...\n# Subtest: fails closed on an empty password file\nok 4 - fails closed on an empty password file\n  ---\n  duration_ms: 3.4897\n  type: 'test'\n  ...\n# Subtest: fails closed on an unreadable password-file target\nok 5 - fails closed on an unreadable password-file target\n  ---\n  duration_ms: 1.3804\n  type: 'test'\n  ...\n# Subtest: does not expose either password source when password-file startup fails\nok 6 - does not expose either password source when password-file startup fails\n  ---\n  duration_ms: 74.5789\n  type: 'test'\n  ...\n# Subtest: keeps the direct environment password compatible when no file is configured\nok 7 - keeps the direct environment password compatible when no file is configured\n  ---\n  duration_ms: 0.2485\n  type: 'test'\n  ...\n# Subtest: starts and authenticates when executed through a symlinked current release\nok 8 - starts and authenticates when executed through a symlinked current release\n  ---\n  duration_ms: 164.8459\n  type: 'test'\n  ...\n# Subtest: rejects missing and incorrect credentials without contacting upstream\nok 9 - rejects missing and incorrect credentials without contacting upstream\n  ---\n  duration_ms: 12.8962\n  type: 'test'\n  ...\n# Subtest: redirects an authenticated root request to the nested demo path\nok 10 - redirects an authenticated root request to the nested demo path\n  ---\n  duration_ms: 5.5016\n  type: 'test'\n  ...\n# Subtest: proxies authenticated requests without forwarding the authorization secret\nok 11 - proxies authenticated requests without forwarding the authorization secret\n  ---\n  duration_ms: 15.949\n  type: 'test'\n  ...\n# Subtest: keeps absolute-form and scheme-relative request targets on the configured upstream\nok 12 - keeps absolute-form and scheme-relative request targets on the configured upstream\n  ---\n  duration_ms: 9.9751\n  type: 'test'\n  ...\n# Subtest: rejects an authenticated malformed HTTP target and remains available\nok 13 - rejects an authenticated malformed HTTP target and remains available\n  ---\n  duration_ms: 8.5376\n  type: 'test'\n  ...\n# Subtest: rejects unauthenticated websocket upgrades before contacting upstream\nok 14 - rejects unauthenticated websocket upgrades before contacting upstream\n  ---\n  duration_ms: 7.4546\n  type: 'test'\n  ...\n# Subtest: proxies authenticated websocket upgrades to the fixed upstream without authorization\nok 15 - proxies authenticated websocket upgrades to the fixed upstream without authorization\n  ---\n  duration_ms: 4.4214\n  type: 'test'\n  ...\n# Subtest: rejects an authenticated malformed websocket target and remains available\nok 16 - rejects an authenticated malformed websocket target and remains available\n  ---\n  duration_ms: 6.6464\n  type: 'test'\n  ...\n1..16\n# tests 16\n# suites 0\n# pass 16\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 421.2405\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:deployment\n> node --test scripts/nwg-deployment-contract.test.mjs\n\nTAP version 13\n# Subtest: pins a non-SPA static server to the production loopback endpoint\nok 1 - pins a non-SPA static server to the production loopback endpoint\n  ---\n  duration_ms: 7.3045\n  type: 'test'\n  ...\n# Subtest: defines hardened static and gateway systemd units for the exact current release\nok 2 - defines hardened static and gateway systemd units for the exact current release\n  ---\n  duration_ms: 2.7867\n  type: 'test'\n  ...\n# Subtest: runs deployment contracts in the Node 22 and Node 24 verification jobs\nok 3 - runs deployment contracts in the Node 22 and Node 24 verification jobs\n  ---\n  duration_ms: 1.0618\n  type: 'test'\n  ...\n# Subtest: preserves the existing target when source validation or copying fails\nok 4 - preserves the existing target when source validation or copying fails\n  ---\n  duration_ms: 12.5525\n  type: 'test'\n  ...\n# Subtest: canonical build:nwg release is served through the static and gateway contracts\nok 5 - canonical build:nwg release is served through the static and gateway contracts\n  ---\n  duration_ms: 8161.771\n  type: 'test'\n  ...\n1..5\n# tests 5\n# suites 0\n# pass 5\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 8262.5597\n\n> uiadapt-adaptive-storefront-theater@4.1.0 verify:build-bases\n> node scripts/verify-build-bases.mjs\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build\n> tsc -b && vite build\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.66 kB │ gzip:  0.45 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\ndist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 148ms\nPASS build: 2 asset URL(s) use /uiadapt_demo/assets/\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build:pages\n> tsc -b && vite build --base=/\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.64 kB │ gzip:  0.44 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-57iRw5Vo.css                                       23.15 kB │ gzip:  5.78 kB\ndist/assets/index-CwtPn8V7.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 152ms\nPASS build:pages: 2 asset URL(s) use /assets/\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build:nwg\n> npm run build && npm run stage:nwg\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build\n> tsc -b && vite build\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.66 kB │ gzip:  0.45 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\ndist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 149ms\n\n> uiadapt-adaptive-storefront-theater@4.1.0 stage:nwg\n> node scripts/stage-nwg.mjs\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:e2e\n> playwright test\n\n[WebServer] \n[WebServer] > uiadapt-adaptive-storefront-theater@4.1.0 build\n[WebServer] > tsc -b && vite build\n[WebServer] \n[WebServer] vite v8.2.1 building client environment for production...\n[WebServer] transforming...\n[WebServer] ✓ 26 modules transformed.\n[WebServer] rendering chunks...\n[WebServer] computing gzip size...\n[WebServer] dist/index.html                                                       0.66 kB │ gzip:  0.45 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\n[WebServer] dist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\n[WebServer] dist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\n[WebServer] dist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n[WebServer] \n[WebServer] ✓ built in 148ms\n[WebServer] \n[WebServer] > uiadapt-adaptive-storefront-theater@4.1.0 preview\n[WebServer] > vite preview --host 127.0.0.1 --port 8766\n[WebServer] \n[WebServer]   ➜  Local:   http://127.0.0.1:8766/uiadapt_demo/\n\nRunning 45 tests using 3 workers\n\n  ok  3 [mobile-390] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (831ms)\n  ok  2 [laptop-1024] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (975ms)\n  ok  1 [desktop-1440] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (1.0s)\n  ok  4 [mobile-390] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (514ms)\n  ok  5 [laptop-1024] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (560ms)\n  ok  6 [desktop-1440] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (568ms)\n  ok  7 [mobile-390] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (456ms)\n  ok  9 [desktop-1440] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (475ms)\n  ok  8 [laptop-1024] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (520ms)\n  ok 10 [mobile-390] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (569ms)\n  ok 11 [desktop-1440] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (619ms)\n  ok 12 [laptop-1024] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (604ms)\n  ok 13 [mobile-390] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (793ms)\n  ok 15 [laptop-1024] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (890ms)\n  ok 14 [desktop-1440] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (922ms)\n  ok 16 [mobile-390] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.2s)\n  ok 19 [mobile-390] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (541ms)\n  ok 17 [laptop-1024] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.5s)\n  ok 20 [mobile-390] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (401ms)\n  ok 18 [desktop-1440] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.8s)\n  ok 21 [laptop-1024] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (581ms)\n  ok 22 [mobile-390] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (662ms)\n  ok 23 [desktop-1440] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (723ms)\n  ok 24 [laptop-1024] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (485ms)\n  ok 25 [mobile-390] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (521ms)\n  ok 26 [desktop-1440] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (488ms)\n  ok 27 [laptop-1024] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (710ms)\n  ok 29 [desktop-1440] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (799ms)\n  ok 28 [mobile-390] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (889ms)\n  ok 30 [laptop-1024] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (664ms)\n  ok 31 [desktop-1440] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (585ms)\n  ok 33 [laptop-1024] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (955ms)\n  ok 34 [desktop-1440] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (906ms)\n  ok 32 [mobile-390] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (3.5s)\n  ok 36 [desktop-1440] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (2.4s)\n  ok 35 [laptop-1024] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (3.5s)\n  ok 38 [desktop-1440] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (2.8s)\n  ok 37 [mobile-390] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (4.5s)\n  ok 40 [desktop-1440] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (1.8s)\n  ok 39 [laptop-1024] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (4.3s)\n  ok 42 [desktop-1440] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (2.0s)\n  ok 41 [mobile-390] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (2.8s)\n  ok 43 [laptop-1024] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (2.8s)\n  ok 44 [mobile-390] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (2.4s)\n  ok 45 [laptop-1024] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (1.9s)\n\n  45 passed (25.4s)\nfound 0 vulnerabilities\n",
      "stderr": "[WebServer] (node:9140) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)\n[WebServer] (node:7444) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)\n(node:25444) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n(node:21564) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n(node:12824) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n",
      "exit_code": 0,
      "observation": "Fresh sequential install, lint, Vitest, gateway, deployment, two-base build verification, nwg build, Playwright, and production audit all returned RC 0. Stderr contains only FORCE_COLOR/NO_COLOR warnings.",
      "timestamp": "2026-08-21T02:06:27Z",
      "evidence_type": "automated",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/automated-verification.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\runtime-check.ps1",
      "stdout": "RUNTIME_UTC=2026-08-21T02:06:31Z\nCURRENT=/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\nSTATIC=enabled/active\nGATEWAY=enabled/active\nLOCAL_UNAUTH=401\nLOCAL_AUTH=200\nPUBLIC_UNAUTH=401\nPUBLIC_AUTH=200\nPUBLIC_ROOT=302\nPUBLIC_LOCATION=/uiadapt_demo/\nPARENT_DIRTY_COUNT=0\nCREDENTIAL_META=600:root:root:9\n\n# Funnel on:\n#     - https://00-new-world-gpu.tail645adc.ts.net\n\nhttps://00-new-world-gpu.tail645adc.ts.net (Funnel on)\n|-- / proxy http://127.0.0.1:4180\n\nhttps://00-new-world-gpu.tail645adc.ts.net:8443 (tailnet only)\n|-- / proxy http://127.0.0.1:8101\n\nhttp://00-new-world-gpu:8787 (tailnet only)\nhttp://00-new-world-gpu.tail645adc.ts.net:8787 (tailnet only)\n|-- / proxy http://127.0.0.1:8787\nRUNTIME_GATE=PASS\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The nwg current symlink points to the target release; both services are enabled/active; local and public authentication contracts pass; Funnel mappings 443, 8443, and 8787 remain intact.",
      "timestamp": "2026-08-21T02:06:29Z",
      "evidence_type": "runtime",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/runtime-verification.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\deployment-history.ps1",
      "stdout": "HISTORY_CAPTURE_UTC=2026-08-21T02:08:11Z\nCURRENT=/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\nRELEASES_BEGIN\n06a1df4ffbac80c3bdcf99f00f2ba7577c054409\n91d73b45adeb97b86be97dba69f638ab910a06e9\nfba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\nRELEASES_END\nJOURNAL_BEGIN\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopping uiadapt-gateway.service - UIAdapt password gateway...\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: uiadapt-gateway.service: Deactivated successfully.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopped uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopping uiadapt-static.service - UIAdapt static site...\n2026-08-21T01:45:42+00:00 new-world-gpu serve[329534]:  INFO  Gracefully shutting down. Please wait...\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: uiadapt-static.service: Deactivated successfully.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopped uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Started uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Started uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopping uiadapt-gateway.service - UIAdapt password gateway...\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: uiadapt-gateway.service: Deactivated successfully.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopped uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Started uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopping uiadapt-gateway.service - UIAdapt password gateway...\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: uiadapt-gateway.service: Deactivated successfully.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopped uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopping uiadapt-static.service - UIAdapt static site...\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: uiadapt-static.service: Deactivated successfully.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Stopped uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Started uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:45:42+00:00 new-world-gpu systemd[1]: Started uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:45:42+00:00 new-world-gpu node[440477]: UIAdapt password gateway listening on http://127.0.0.1:4180\n2026-08-21T01:45:42+00:00 new-world-gpu serve[440475]:  INFO  Accepting connections at http://127.0.0.1:5173\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Stopping uiadapt-gateway.service - UIAdapt password gateway...\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: uiadapt-gateway.service: Deactivated successfully.\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Stopped uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Stopping uiadapt-static.service - UIAdapt static site...\n2026-08-21T01:46:49+00:00 new-world-gpu serve[440475]:  INFO  Gracefully shutting down. Please wait...\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: uiadapt-static.service: Deactivated successfully.\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Stopped uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Started uiadapt-static.service - UIAdapt static site.\n2026-08-21T01:46:49+00:00 new-world-gpu systemd[1]: Started uiadapt-gateway.service - UIAdapt password gateway.\n2026-08-21T01:46:49+00:00 new-world-gpu node[442166]: UIAdapt password gateway listening on http://127.0.0.1:4180\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  INFO  Accepting connections at http://127.0.0.1:5173\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 GET /uiadapt_demo/\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 Returned 200 in 18 ms\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 GET /uiadapt_demo/assets/index-DTUIrAxQ.css\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 Returned 200 in 1 ms\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 GET /uiadapt_demo/assets/index-pTZi0Dzb.js\n2026-08-21T01:46:49+00:00 new-world-gpu serve[442164]:  HTTP  8/21/2026 1:46:49 AM 127.0.0.1 Returned 200 in 1 ms\nJOURNAL_END\nSTATIC_NRESTARTS=0\nGATEWAY_NRESTARTS=0\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The journal discloses the first readiness-race deployment attempt, automatic rollback/restart, and the successful 01:46:49 UTC deployment with JS/CSS HTTP 200 responses.",
      "timestamp": "2026-08-21T02:08:09Z",
      "evidence_type": "repro",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/deployment-history.json"
    },
    {
      "command": "pwsh -NoProfile -File \"review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\run-independent-public-smoke.ps1\"",
      "stdout": "{\n  \"schemaVersion\": 1,\n  \"evidenceType\": \"independent-public-runtime-smoke\",\n  \"startedAtUtc\": \"2026-08-21T02:06:28.599Z\",\n  \"completedAtUtc\": \"2026-08-21T02:06:40.894Z\",\n  \"reviewerRelationship\": {\n    \"verifier\": \"independent review subagent\",\n    \"implementationAuthor\": \"different agent\",\n    \"deploymentOperator\": \"different root agent\",\n    \"mutationAuthority\": \"none; read-only public verification\"\n  },\n  \"sourceBinding\": {\n    \"expectedSha\": \"fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\",\n    \"localSha\": \"fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\",\n    \"remoteSha\": \"fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\",\n    \"currentRelease\": \"/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\"\n  },\n  \"funnelMappings\": {\n    \"uiadapt443\": \"http://127.0.0.1:4180\",\n    \"preserved8443\": \"http://127.0.0.1:8101\",\n    \"preserved8787\": \"http://127.0.0.1:8787\"\n  },\n  \"auth\": {\n    \"unauthenticatedNested\": 401,\n    \"incorrectCredentialNested\": 401,\n    \"authenticatedRoot\": 302,\n    \"rootLocation\": \"/uiadapt_demo/\",\n    \"authenticatedNested\": 200\n  },\n  \"viewports\": [\n    {\n      \"viewport\": \"desktop-1440\",\n      \"navigationStatus\": 200,\n      \"exactInvestorCopy\": true,\n      \"liveDemoCta\": true,\n      \"causalTrace\": [\n        \"Behavior\",\n        \"State\",\n        \"Policy\",\n        \"Interface\"\n      ],\n      \"invariants\": [\n        \"Same catalog\",\n        \"Same behavior\",\n        \"Different presentation\"\n      ],\n      \"wantedSans\": {\n        \"cssRuleFound\": true,\n        \"status\": \"loaded\",\n        \"check\": true,\n        \"woff2Status200Count\": 1\n      },\n      \"assetStatus200Count\": {\n        \"javascript\": 1,\n        \"stylesheet\": 1\n      },\n      \"states\": {\n        \"compareAtMs\": 7000,\n        \"compare\": \"COMPARE\",\n        \"focusAtMs\": 21000,\n        \"focus\": \"FOCUS\"\n      },\n      \"overflowPx\": {\n        \"explore\": 0,\n        \"compare\": 0,\n        \"focus\": 0\n      },\n      \"hygieneCounts\": {\n        \"consoleErrors\": 0,\n        \"failedRequests\": 0,\n        \"externalRequests\": 0,\n        \"http4xx5xx\": 0\n      }\n    },\n    {\n      \"viewport\": \"laptop-1024\",\n      \"navigationStatus\": 200,\n      \"exactInvestorCopy\": true,\n      \"liveDemoCta\": true,\n      \"causalTrace\": [\n        \"Behavior\",\n        \"State\",\n        \"Policy\",\n        \"Interface\"\n      ],\n      \"invariants\": [\n        \"Same catalog\",\n        \"Same behavior\",\n        \"Different presentation\"\n      ],\n      \"wantedSans\": {\n        \"cssRuleFound\": true,\n        \"status\": \"loaded\",\n        \"check\": true,\n        \"woff2Status200Count\": 1\n      },\n      \"assetStatus200Count\": {\n        \"javascript\": 1,\n        \"stylesheet\": 1\n      },\n      \"states\": {\n        \"compareAtMs\": 7000,\n        \"compare\": \"COMPARE\",\n        \"focusAtMs\": 21000,\n        \"focus\": \"FOCUS\"\n      },\n      \"overflowPx\": {\n        \"explore\": 0,\n        \"compare\": 0,\n        \"focus\": 0\n      },\n      \"hygieneCounts\": {\n        \"consoleErrors\": 0,\n        \"failedRequests\": 0,\n        \"externalRequests\": 0,\n        \"http4xx5xx\": 0\n      }\n    },\n    {\n      \"viewport\": \"mobile-390\",\n      \"navigationStatus\": 200,\n      \"exactInvestorCopy\": true,\n      \"liveDemoCta\": true,\n      \"causalTrace\": [\n        \"Behavior\",\n        \"State\",\n        \"Policy\",\n        \"Interface\"\n      ],\n      \"invariants\": [\n        \"Same catalog\",\n        \"Same behavior\",\n        \"Different presentation\"\n      ],\n      \"wantedSans\": {\n        \"cssRuleFound\": true,\n        \"status\": \"loaded\",\n        \"check\": true,\n        \"woff2Status200Count\": 1\n      },\n      \"assetStatus200Count\": {\n        \"javascript\": 1,\n        \"stylesheet\": 1\n      },\n      \"states\": {\n        \"compareAtMs\": 7000,\n        \"compare\": \"COMPARE\",\n        \"focusAtMs\": 21000,\n        \"focus\": \"FOCUS\"\n      },\n      \"overflowPx\": {\n        \"explore\": 0,\n        \"compare\": 0,\n        \"focus\": 0\n      },\n      \"hygieneCounts\": {\n        \"consoleErrors\": 0,\n        \"failedRequests\": 0,\n        \"externalRequests\": 0,\n        \"http4xx5xx\": 0\n      }\n    }\n  ],\n  \"verdict\": \"PUBLIC_SMOKE_PASS\"\n}\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "A different review agent performed fresh read-only public Playwright verification across 1440, 1024, and 390 viewports and returned PUBLIC_SMOKE_PASS without exposing the credential.",
      "timestamp": "2026-08-21T02:06:40Z",
      "evidence_type": "runtime",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/independent-public-smoke.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\screenshot-inventory.ps1",
      "stdout": "desktop-1440-compare-viewport.png 302166 c2ce447520c215b8a76a4360c16563e554e1f54076393f4fbf0a2e8aae74b41c\r\ndesktop-1440-compare.png 538591 f24afa844e9404c0076c58aabb7f214a8046917f6174ae7dfe19f2e21d6790c8\r\ndesktop-1440-explore-viewport.png 158088 12a4bbe7e83261f7a09ffbe705cfe01308352f7b4474204e72790db21046a5a3\r\ndesktop-1440-explore.png 512071 c681dc207765ba94162cea3ab16be6fe17454789f198b8c9477b40849f31fdc4\r\ndesktop-1440-focus-viewport.png 442623 5bfce294bc284c05a8243e53bb739bac9c839d302e181612cfa2aeceff121a4e\r\ndesktop-1440-focus.png 685662 464a1723263c2295233fae29d71c29e38c65283671427f35d531e985fa60afca\r\nlaptop-1024-compare-viewport.png 57508 e70275943cce49b3bca1e226ffe6e634d69241b48a4c473f82fea657bcfa5a7a\r\nlaptop-1024-compare.png 593551 68b83441e11cecd01efebdca8209bf9994d1970da78a99296a9b7614d224715d\r\nlaptop-1024-explore-viewport.png 131204 75d6f7e8a7f63dcde822a615ed0e97a65319d9ba984160017622ded0bff2a57e\r\nlaptop-1024-explore.png 566864 fb6f2ccd7ca499cb7681bfadce73cc9e87d8b5086e2df14d4c922f6ceea9b1e9\r\nlaptop-1024-focus-viewport.png 213944 efe0d2f16d0b64ff3d51c34b7ba0e41500d0a34db7ad34f71362c6d1a3ce52e7\r\nlaptop-1024-focus.png 698332 b5b1624f68245ad05cfd1962dd0e915748eb880c47550251af54dad20b509a7f\r\nmobile-390-compare-viewport.png 66613 966be81cbf984355a6025dc3cba7f56e70b0e324ab36a6cd401112439d95359a\r\nmobile-390-compare.png 504153 6a59b8e150da92715fb5642a8bc2ab5cef776c859bc0827874c4ebf4b3f543d4\r\nmobile-390-explore-viewport.png 81084 c3dccc57ce78671c2940aeba170174cb0058956d9800f889a9214f946ddefae2\r\nmobile-390-explore.png 477896 12f52da693c8c5091ae03ab99c3228e0d2c4de3a221448fd13d744a63403a472\r\nmobile-390-focus-viewport.png 132684 554758eb2df5f22cfbaeef592bf09400e2189f61302b35f6a0720aaf70f44591\r\nmobile-390-focus.png 575383 b90fb7173a203ef12c03d86d27cdfc9477c8af4dd3d15d6e8ce22d24924cfb79\r\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "Eighteen fresh PNGs (nine viewport and nine full-page captures) are enumerated with byte lengths and SHA-256 digests.",
      "timestamp": "2026-08-21T02:09:18Z",
      "evidence_type": "manual",
      "capture_file": "evidence/run_20260821_020352_uiadapt_investor_stage/screenshot-inventory.json"
    }
  ],
  "risks": [
    {
      "description": "PRODUCT_CLARITY=NOT_VERIFIED because no actual three-person non-developer comprehension test was performed.",
      "severity": "medium",
      "handling": "plan",
      "plan": "Run the prescribed 30-second no-explanation test before claiming human product clarity."
    },
    {
      "description": "The shared Basic Auth password is short and has previously appeared in conversation context; brute-force resistance is limited.",
      "severity": "medium",
      "handling": "plan",
      "plan": "Rotate to a long unique credential after external review; keep the credential out of Git, argv, logs and evidence."
    },
    {
      "description": "Full nwg host reboot was not executed, so end-to-end recovery after a host reboot is inferred from enabled systemd services and Tailscale's documented --bg persistence rather than observed live.",
      "severity": "medium",
      "handling": "safeguard",
      "safeguard": "Services are enabled and active, Funnel status is live, old release is retained, and full reboot was avoided to protect unrelated services."
    },
    {
      "description": "Tailscale Funnel availability and non-configurable bandwidth limits are external operational dependencies.",
      "severity": "low",
      "handling": "accepted_unresolved"
    },
    {
      "description": "The evidence package does not contain raw logs for the first absent-file SCP anomaly, one auxiliary PowerShell syntax error, or the original implementation RED runs.",
      "severity": "low",
      "handling": "accepted_unresolved",
      "safeguard": "All known incidents are disclosed; final target behavior has fresh full regression, live runtime, independent public smoke and provenance evidence."
    },
    {
      "description": "Evidence and this spec are local review artifacts outside commit fba3d9d; a reviewer who receives only the saved path does not have a complete package.",
      "severity": "medium",
      "handling": "safeguard",
      "safeguard": "Submission contract requires spec content, source.diff, the entire evidence directory and runtime outputs to be transferred together."
    }
  ],
  "request": [
    "Verify the declared target and comparison base independently from Git objects and GitHub remote state.",
    "Recompute source.diff and run finalize_evidence.py verify against the evidence directory's self-excluding SHA256SUMS.",
    "Audit the seven changed source paths against the product-data/runtime invariants.",
    "Confirm the fresh automated capture's exact commands, streams, exit codes and timestamps.",
    "Review the first deployment failure, rollback, readiness correction and final runtime state without treating author narrative as evidence.",
    "Validate the independent public smoke and independent provenance receipts.",
    "Issue a verdict only for the declared source, deployment and live-runtime scope; do not promote PRODUCT_CLARITY beyond NOT_VERIFIED."
  ],
  "brief": {
    "잘된 점": "The investor thesis, exact source identity, packaged bytes, running release and public browser behavior are tied together with fresh independent evidence.",
    "애매한 점": "Human comprehension and full-host reboot recovery remain unobserved and are explicitly excluded from success claims.",
    "어려웠던 점": "The deployment exposed a real systemd-active/listener-readiness race; the evidence workflow also exposed Windows caret parsing and an auditor sort-key defect, all preserved rather than erased."
  },
  "companion_processes": {
    "evidence_quote_linter": {
      "applicability": "APPLICABLE",
      "status": "COMPLETED",
      "invocation": "python E:/03_AllWork/grafana/.agents/skills/evidence-quote-linter/scripts/lint_evidence.py review/spec_20260821_113808_uiadapt_investor_stage_nwg_release_r3.md",
      "bounded_output": "Evidence lint passed: review\\spec_20260821_113808_uiadapt_investor_stage_nwg_release_r3.md; exit code 0",
      "completed_at_utc": "2026-08-21T02:38:20Z",
      "artifact": "review/evidence-lint-r3.json"
    },
    "verification_before_completion": {
      "applicability": "APPLICABLE",
      "status": "COMPLETED",
      "invocation": "Two exact invocations indexed in verification-before-completion-receipt.json: the full npm source gate and the read-only remote runtime gate.",
      "bounded_output": "Source gate RC 0: Vitest 19/19, gateway 16/16, deployment 5/5, Playwright 45/45, production audit 0; runtime gate RC 0: services enabled/active, auth 401/200, public root 302, nested app 200, parent dirty 0, Funnel 443 -> 4180.",
      "completed_at_utc": "2026-08-21T02:06:29Z",
      "artifact": "review/evidence/run_20260821_020352_uiadapt_investor_stage/verification-before-completion-receipt.json"
    },
    "independent_review": {
      "applicability": "APPLICABLE",
      "status": "COMPLETED_WITH_DISCLOSED_CORRECTION",
      "invocation": "Different-session public Playwright smoke, source-to-runtime provenance audit, and exact 18-image visual review; exact invocations and command receipts are retained in the referenced artifacts.",
      "bounded_output": "PUBLIC_SMOKE_PASS; provenance PASS_WITH_DISCLOSED_AUDITOR_CORRECTION; visual review PASS with Critical 0, Important 0, Minor 0.",
      "completed_at_utc": "2026-08-21T02:32:00Z",
      "artifacts": [
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-review-receipt.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-public-smoke.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/independent-provenance.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/visual-review-final.json"
      ],
      "provenance_result": "PASS_WITH_DISCLOSED_AUDITOR_CORRECTION",
      "visual_result": "PASS"
    },
    "first_pre_court_review": {
      "applicability": "APPLICABLE",
      "status": "REMAND_PRESERVED",
      "invocation": "Different-session read-only audit of revision 1 and the then-unsealed package.",
      "bounded_output": "NOT_READY_FOR_COURT; Critical 0, High 0, Medium 3: missing SHA256SUMS, incomplete companion receipts, and missing visual-verdict receipt.",
      "completed_at_utc": "2026-08-21T02:24:20Z",
      "artifact": "review/evidence/run_20260821_020352_uiadapt_investor_stage/pre-court-independent-review.json",
      "correction": "Revision 2 adds both companion receipts and the visual receipt; evidence sealing and a fresh independent re-review remain mandatory before submission."
    },
    "second_pre_court_review": {
      "applicability": "APPLICABLE",
      "status": "REMAND_PRESERVED",
      "invocation": "Different-session read-only re-review of revision 2 and the sealed evidence package.",
      "bounded_output": "NOT_READY_FOR_COURT; Critical 0, High 0, Medium 1. PC-M2 and PC-M3 resolved; PC-M1 manifest verified GREEN but R2 retained the R1 self path and omitted manifest digest binding.",
      "completed_at_utc": "2026-08-21T02:39:00Z",
      "artifact": "review/pre-court-final-review-r2.json",
      "correction": "Revision 3 changes only the spec self path and adds manifest path, SHA-256, entry count, self-exclusion and verification result."
    }
  },
  "status": "success",
  "authority_matrix": {
    "local_file_reads": "authorized",
    "local_review_artifact_writes": "authorized only under review/ for this submission",
    "product_source_writes": "not authorized and not performed during Court packaging",
    "git_mutation": "not authorized and not performed during Court packaging",
    "network_reads": "authorized for GitHub and public-runtime verification",
    "remote_service_reads": "authorized read-only",
    "remote_service_or_deployment_mutation": "not authorized and not performed during Court packaging",
    "payment_or_provider_changes": "not authorized",
    "credential_content_access": "not authorized; only metadata and runtime auth outcomes were observed"
  }
}
