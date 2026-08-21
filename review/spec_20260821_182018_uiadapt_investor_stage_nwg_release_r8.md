{
  "document_title": "R8 재심청구서 및 무결성 영수증 — UIAdapt Investor Stage NWG Release",
  "meta": {
    "created_at_utc": "2026-08-21T09:20:18Z",
    "review_target": "Git commit 00c4c47a63f859d33b4264f6e6ddb3c5ef71913b on codex/uiadapt-investor-r8-remediation",
    "comparison_base": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
    "main_sha": "68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0",
    "live_nwg_release": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
    "status": "READY_FOR_INDEPENDENT_COURT_REVIEW",
    "verdict_scope": "R8 source remediation, non-destructive deployment-test contract, documentation, tracked threat model, exact-head local and remote CI evidence",
    "excluded_scope": [
      "R8 live deployment",
      "merge to main",
      "full host reboot",
      "three-person product-clarity experiment",
      "new public-browser acceptance of R8"
    ],
    "reviewer_access_assumption": "The reviewer receives this spec, the complete review/r8_20260821_174851/evidence directory, Git access to the target and comparison base, and the historical R3 package under review/evidence/run_20260821_020352_uiadapt_investor_stage.",
    "constitution_paths": [
      "E:/03_AllWork/grafana/AGENTS.md",
      "No repository-local AGENTS.md, CLAUDE.md, GEMINI.md or SECURITY.md was claimed for this worktree."
    ]
  },
  "petition": {
    "requested_disposition": "Dismiss the factually incorrect R3 evidence/live-release absence charges, accept the valid operational and evidence-accessibility findings, and adjudicate the remediated exact R8 source from the sealed package.",
    "remediation_status": "COMPLETED_FOR_DECLARED_SOURCE_SCOPE",
    "live_release_status": "UNCHANGED_R3_FBA3D9D",
    "main_integration_status": "NOT_PERFORMED",
    "product_clarity": "NOT_VERIFIED"
  },
  "rebuttal_matrix": [
    {
      "charge": "R3 evidence package absent",
      "finding": "FACTUALLY_REBUTTED_BUT_ACCESSIBILITY_DEFECT_ACCEPTED",
      "facts": "The append-only R3 package exists locally, contains a self-excluding 40-entry SHA256SUMS manifest, raw command captures, independent receipts and 18 screenshots. The first R8 verification invocation used an invalid CLI option and failed RC 2; the corrected positional invocation verified all 40 files and returned GREEN. The prior materials were untracked and therefore unavailable to a GitHub-only reviewer, so the accessibility criticism is accepted.",
      "evidence": [
        "r3-manifest-reverify.json",
        "r3-manifest-reverify-rerun1.json"
      ]
    },
    {
      "charge": "R3 live release not verified",
      "finding": "FACTUALLY_REBUTTED",
      "facts": "Historical R3 runtime/provenance/public-smoke receipts bind nwg current to fba3d9d. A fresh R8 read-only runtime capture again reports current=fba3d9d with static and gateway active/enabled and credential metadata 600 root root. R8 itself is explicitly not deployed.",
      "evidence": [
        "live-runtime-current-rerun1.json",
        "review/evidence/run_20260821_020352_uiadapt_investor_stage/runtime-verification.json"
      ]
    },
    {
      "charge": "Deployment contract can delete live projectRoot/www and collide with 5173",
      "finding": "ACCEPTED_AND_REMEDIATED",
      "facts": "The integration now uses mkdtemp-owned staging, dynamic ports, and cleanup confined to the temporary root. Durable tests reject project-root staging/removal, preserve a project sentinel hash, and pass with an external listener occupying 127.0.0.1:5173.",
      "evidence": [
        "sentinel-probation-rerun1.json",
        "port-probation-rerun1.json",
        "source-diff-rerun1.json"
      ]
    },
    {
      "charge": "README and release runbook incomplete",
      "finding": "ACCEPTED_AND_REMEDIATED",
      "facts": "README now enumerates the complete local verification contract. docs/investor-stage-nwg-release.md documents version-addressed staging, bounded health checks, one-shell fail-closed switch and rollback, and explicitly denies filesystem immutability.",
      "evidence": [
        "source-diff-rerun1.json",
        "source-gate-rerun2.json"
      ]
    },
    {
      "charge": "Tracked gateway/NWG threat model absent",
      "finding": "ACCEPTED_AND_REMEDIATED",
      "facts": "docs/security/investor-preview-threat-model.md now records assets, trust boundaries, current controls, absent controls, fail-closed conditions, and accepted risks without inventing an exploit.",
      "evidence": [
        "source-diff-rerun1.json",
        "independent-source-spec-review.json"
      ]
    },
    {
      "charge": "Exact R8 remote CI absent",
      "finding": "ACCEPTED_AND_REMEDIATED",
      "facts": "The workflow trigger includes only main and codex/uiadapt-investor-r8-remediation for push, retains main-targeted pull requests, and grants contents:read. GitHub run 32466937260 completed successfully for exact head 00c4c47a; verify and runtime-contract passed and the artifact was uploaded.",
      "evidence": [
        "github-actions-run-32466937260.json",
        "git-target-remote.json"
      ]
    }
  ],
  "implementation_summary": [
    "Isolated deployment tests from project and live-serving paths.",
    "Replaced fixed test ports with OS-assigned ports and added external-5173 regression coverage.",
    "Added tests proving project www hash invariance, canonical staging ownership, rollback failure propagation and bounded smoke deadlines.",
    "Updated README, NWG release runbook and threat model.",
    "Added exact R8 branch CI trigger without deployment permissions or secrets.",
    "Narrowed ESLint exclusions to generated/historical evidence while retaining negative controls for ordinary review and src files."
  ],
  "source_binding": {
    "application_source_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
    "remote_branch_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
    "comparison_base": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
    "changed_paths": [
      ".github/workflows/verify.yml",
      "README.md",
      "docs/investor-stage-nwg-release.md",
      "docs/security/investor-preview-threat-model.md",
      "docs/superpowers/plans/2026-08-21-uiadapt-r8-remediation.md",
      "docs/superpowers/specs/2026-08-21-uiadapt-r8-remediation-design.md",
      "eslint.config.js",
      "scripts/nwg-deployment-contract.test.mjs"
    ],
    "diff_capture": "review/r8_20260821_174851/evidence/source-diff-rerun1.json",
    "diff_capture_sha256": "bc529fe7a2d9f3f7514011fee0d56ee52321b7d006e4f3c46831e9cbc63c6675"
  },
  "verification_summary": {
    "initial_source_gate": "RC 1; expected evidence-helper lint boundary failure preserved",
    "final_source_gate": "RC 0; npm ci, lint, Vitest 19/19, gateway 16/16, two-base build verification, production build, Playwright 45/45, production audit 0 vulnerabilities and diff-check pass",
    "sentinel_probation": "RC 0; deployment 17/17; identical before/after SHA-256",
    "port_probation": "RC 0; dummy 5173 listener active; deployment 17/17",
    "r3_manifest": "initial RC 2 wrong syntax preserved; corrected RC 0 verifies 40 files GREEN",
    "remote_ci": "GitHub run 32466937260 exact head; verify success; runtime-contract success; artifact uploaded",
    "independent_spec_review": "GO; Critical 0, Important 0; two non-blocking minors",
    "independent_quality_review": "GO; Critical 0, Important 0; three non-blocking minors"
  },
  "independent_review_receipts": [
    {
      "path": "review/r8_20260821_174851/evidence/independent-source-spec-review.json",
      "sha256": "5b2608b1c79f4dd19032ad65f2f55064f1daed5c72f61b160bf1f1930e590dc8",
      "verdict": "GO"
    },
    {
      "path": "review/r8_20260821_174851/evidence/independent-source-quality-review.json",
      "sha256": "f29c07d076306645982ace5437d81db157447e410a2829adceb510435643475a",
      "verdict": "GO"
    }
  ],
  "remote_ci_receipt": {
    "path": "review/r8_20260821_174851/evidence/github-actions-run-32466937260.json",
    "sha256": "5ce0fc00f7568d80ebc48ec5f7826ab4603abfeb0cbc2a683e1a327d27d85419",
    "run_id": 32466937260,
    "head_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
    "verify": "success",
    "runtime_contract": "success",
    "artifact_digest": "sha256:885a333e71ce2546e0d720f026b50f5f0eb48ffdcb8f18ad8b3662d142a2fbda"
  },
  "evidence_quotes": [
    {
      "command": "pwsh -NoProfile -File review\\r8_20260821_174851\\evidence\\run-source-gate.ps1",
      "stdout": "COMMAND_BEGIN=npm ci\r\n\nadded 315 packages, and audited 316 packages in 15s\n\n87 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run lint\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 lint\n> eslint .\n\n\nE:\\03_AllWork\\uiadapt-investor-stage\\review\\r8_20260821_174851\\evidence\\hold-5173.mjs\n  5:3   error  'process' is not defined  no-undef\n  9:3   error  'process' is not defined  no-undef\n  9:47  error  'process' is not defined  no-undef\n\n✖ 3 problems (3 errors, 0 warnings)\n\nCOMMAND_EXIT=1\r\n",
      "stderr": "",
      "exit_code": 1,
      "observation": "The first full source gate failed at lint because the newly created evidence helper was outside the prior generated-evidence exclusion. The failure is preserved and not relabeled as a product failure.",
      "timestamp": "2026-08-21T08:50:03Z",
      "evidence_type": "repro",
      "capture_file": "r8_20260821_174851/evidence/source-gate.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\r8_20260821_174851\\evidence\\run-source-gate.ps1",
      "stdout": "COMMAND_BEGIN=npm ci\r\n\nadded 315 packages, and audited 316 packages in 18s\n\n87 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run lint\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 lint\n> eslint .\n\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm test\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test\n> vitest run\n\n\n RUN  v4.1.11 E:/03_AllWork/uiadapt-investor-stage\n\n\n Test Files  2 passed (2)\n      Tests  19 passed (19)\n   Start at  18:11:16\n   Duration  17.86s (transform 245ms, setup 5.41s, import 356ms, tests 705ms, environment 27.30s)\n\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run test:gateway\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:gateway\n> node --test scripts/password-gateway.test.mjs\n\nTAP version 13\n# Subtest: fails closed when the required password is missing\nok 1 - fails closed when the required password is missing\n  ---\n  duration_ms: 3.5718\n  type: 'test'\n  ...\n# Subtest: reads the password file with exactly one trailing LF or CRLF removed\nok 2 - reads the password file with exactly one trailing LF or CRLF removed\n  ---\n  duration_ms: 8.0901\n  type: 'test'\n  ...\n# Subtest: fails closed on a missing password file even when an environment password exists\nok 3 - fails closed on a missing password file even when an environment password exists\n  ---\n  duration_ms: 1.258\n  type: 'test'\n  ...\n# Subtest: fails closed on an empty password file\nok 4 - fails closed on an empty password file\n  ---\n  duration_ms: 2.9059\n  type: 'test'\n  ...\n# Subtest: fails closed on an unreadable password-file target\nok 5 - fails closed on an unreadable password-file target\n  ---\n  duration_ms: 1.3471\n  type: 'test'\n  ...\n# Subtest: does not expose either password source when password-file startup fails\nok 6 - does not expose either password source when password-file startup fails\n  ---\n  duration_ms: 71.7548\n  type: 'test'\n  ...\n# Subtest: keeps the direct environment password compatible when no file is configured\nok 7 - keeps the direct environment password compatible when no file is configured\n  ---\n  duration_ms: 0.268\n  type: 'test'\n  ...\n# Subtest: starts and authenticates when executed through a symlinked current release\nok 8 - starts and authenticates when executed through a symlinked current release\n  ---\n  duration_ms: 147.8736\n  type: 'test'\n  ...\n# Subtest: rejects missing and incorrect credentials without contacting upstream\nok 9 - rejects missing and incorrect credentials without contacting upstream\n  ---\n  duration_ms: 12.7272\n  type: 'test'\n  ...\n# Subtest: redirects an authenticated root request to the nested demo path\nok 10 - redirects an authenticated root request to the nested demo path\n  ---\n  duration_ms: 7.5548\n  type: 'test'\n  ...\n# Subtest: proxies authenticated requests without forwarding the authorization secret\nok 11 - proxies authenticated requests without forwarding the authorization secret\n  ---\n  duration_ms: 15.7176\n  type: 'test'\n  ...\n# Subtest: keeps absolute-form and scheme-relative request targets on the configured upstream\nok 12 - keeps absolute-form and scheme-relative request targets on the configured upstream\n  ---\n  duration_ms: 8.1562\n  type: 'test'\n  ...\n# Subtest: rejects an authenticated malformed HTTP target and remains available\nok 13 - rejects an authenticated malformed HTTP target and remains available\n  ---\n  duration_ms: 8.896\n  type: 'test'\n  ...\n# Subtest: rejects unauthenticated websocket upgrades before contacting upstream\nok 14 - rejects unauthenticated websocket upgrades before contacting upstream\n  ---\n  duration_ms: 6.6219\n  type: 'test'\n  ...\n# Subtest: proxies authenticated websocket upgrades to the fixed upstream without authorization\nok 15 - proxies authenticated websocket upgrades to the fixed upstream without authorization\n  ---\n  duration_ms: 5.8304\n  type: 'test'\n  ...\n# Subtest: rejects an authenticated malformed websocket target and remains available\nok 16 - rejects an authenticated malformed websocket target and remains available\n  ---\n  duration_ms: 6.8215\n  type: 'test'\n  ...\n1..16\n# tests 16\n# suites 0\n# pass 16\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 395.6183\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run verify:build-bases\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 verify:build-bases\n> node scripts/verify-build-bases.mjs\n\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build\n> tsc -b && vite build\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.66 kB │ gzip:  0.45 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\ndist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 701ms\nPASS build: 2 asset URL(s) use /uiadapt_demo/assets/\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build:pages\n> tsc -b && vite build --base=/\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.64 kB │ gzip:  0.44 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-57iRw5Vo.css                                       23.15 kB │ gzip:  5.78 kB\ndist/assets/index-CwtPn8V7.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 138ms\nPASS build:pages: 2 asset URL(s) use /assets/\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run build\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 build\n> tsc -b && vite build\n\nvite v8.2.1 building client environment for production...\ntransforming...\n✓ 26 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                                                       0.66 kB │ gzip:  0.45 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\ndist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\ndist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\ndist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\ndist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\ndist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\ndist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\ndist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\ndist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\ndist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\ndist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\ndist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\ndist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\ndist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\ndist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n\n✓ built in 144ms\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm run test:e2e\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:e2e\n> playwright test\n\n[WebServer] \n[WebServer] > uiadapt-adaptive-storefront-theater@4.1.0 build\n[WebServer] > tsc -b && vite build\n[WebServer] \n[WebServer] vite v8.2.1 building client environment for production...\n[WebServer] transforming...\n[WebServer] ✓ 26 modules transformed.\n[WebServer] rendering chunks...\n[WebServer] computing gzip size...\n[WebServer] dist/index.html                                                       0.66 kB │ gzip:  0.45 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff         5.61 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff         5.62 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff       5.77 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff       5.82 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2        5.86 kB\n[WebServer] dist/assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2        6.04 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2      6.91 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2      6.97 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff           7.20 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff           7.20 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2          8.35 kB\n[WebServer] dist/assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2          8.46 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff         11.76 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff         11.76 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff             13.14 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff             13.15 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2        13.34 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2        13.43 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2            14.70 kB\n[WebServer] dist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2            14.88 kB\n[WebServer] dist/assets/WantedSansVariable-eIorJFXx.woff2                     1,289.29 kB\n[WebServer] dist/assets/index-DTUIrAxQ.css                                       23.42 kB │ gzip:  5.79 kB\n[WebServer] dist/assets/index-pTZi0Dzb.js                                       217.60 kB │ gzip: 68.42 kB\n[WebServer] \n[WebServer] ✓ built in 148ms\n[WebServer] \n[WebServer] > uiadapt-adaptive-storefront-theater@4.1.0 preview\n[WebServer] > vite preview --host 127.0.0.1 --port 8766\n[WebServer] \n[WebServer]   ➜  Local:   http://127.0.0.1:8766/uiadapt_demo/\n\nRunning 45 tests using 3 workers\n\n  ok  1 [mobile-390] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (851ms)\n  ok  3 [desktop-1440] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (953ms)\n  ok  2 [laptop-1024] › e2e\\storefront.spec.ts:98:1 › storefront is responsive, local-only, and diagnostics are collapsed (978ms)\n  ok  4 [mobile-390] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (500ms)\n  ok  5 [desktop-1440] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (583ms)\n  ok  6 [laptop-1024] › e2e\\storefront.spec.ts:108:1 › investor stage uses the local Wanted Sans type scale and causal thesis (557ms)\n  ok  7 [mobile-390] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (467ms)\n  ok  8 [desktop-1440] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (469ms)\n  ok  9 [laptop-1024] › e2e\\storefront.spec.ts:172:1 › reviewed layout keeps laptop cards balanced and mobile evidence controls intact (486ms)\n  ok 10 [mobile-390] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (570ms)\n  ok 12 [laptop-1024] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (602ms)\n  ok 11 [desktop-1440] › e2e\\storefront.spec.ts:189:1 › reviewed text contrast remains WCAG AA in inactive and FOCUS-muted states (667ms)\n  ok 13 [mobile-390] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (764ms)\n  ok 14 [laptop-1024] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (850ms)\n  ok 15 [desktop-1440] › e2e\\storefront.spec.ts:228:1 › nested deployment path loads assets, reloads, and runs the replay (885ms)\n  ok 16 [mobile-390] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.2s)\n  ok 17 [laptop-1024] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.4s)\n  ok 19 [mobile-390] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (524ms)\n  ok 18 [desktop-1440] › e2e\\storefront.spec.ts:250:1 › the canonical replay changes presentation without changing product data (1.6s)\n  ok 21 [mobile-390] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (435ms)\n  ok 20 [laptop-1024] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (645ms)\n  ok 22 [desktop-1440] › e2e\\storefront.spec.ts:289:1 › COMPARE is visible in the main stage and FOCUS becomes decision support (754ms)\n  ok 23 [mobile-390] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (684ms)\n  ok 24 [laptop-1024] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (517ms)\n  ok 25 [desktop-1440] › e2e\\storefront.spec.ts:306:1 › UIAdapt and the sample merchant are named separately (471ms)\n  ok 26 [mobile-390] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (527ms)\n  ok 27 [laptop-1024] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (650ms)\n  ok 28 [desktop-1440] › e2e\\storefront.spec.ts:314:1 › Adaptive OFF keeps the same detected state but baseline presentation (763ms)\n  ok 30 [laptop-1024] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (646ms)\n  ok 29 [mobile-390] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (891ms)\n  ok 31 [desktop-1440] › e2e\\storefront.spec.ts:326:1 › active product control survives the comparison transition (656ms)\n  ok 32 [laptop-1024] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (934ms)\n  ok 34 [desktop-1440] › e2e\\storefront.spec.ts:337:1 › keyboard-only path starts, pauses, resets, and records a product action (923ms)\n  ok 33 [mobile-390] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (3.5s)\n  ok 36 [desktop-1440] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (2.5s)\n  ok 35 [laptop-1024] › e2e\\storefront.spec.ts:364:1 › Pause and Resume preserve virtual progress (3.0s)\n  ok 38 [desktop-1440] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (2.9s)\n  ok 37 [mobile-390] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (4.4s)\n  ok 39 [laptop-1024] › e2e\\storefront.spec.ts:376:1 › Reset cancels every stale Replay timer (4.4s)\n  ok 40 [desktop-1440] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (1.8s)\n  ok 43 [desktop-1440] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (2.1s)\n  ok 41 [mobile-390] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (2.8s)\n  ok 42 [laptop-1024] › e2e\\storefront.spec.ts:387:1 › manual takeover cancels the remaining Replay timers (2.8s)\n  ok 44 [mobile-390] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (2.4s)\n  ok 45 [laptop-1024] › e2e\\storefront.spec.ts:398:1 › Stop preserves state and cancels the remaining Replay timers (2.5s)\n\n  45 passed (25.2s)\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=npm audit --omit=dev --audit-level=high\r\nfound 0 vulnerabilities\nCOMMAND_EXIT=0\r\nCOMMAND_BEGIN=git diff --check fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91..HEAD\r\nCOMMAND_EXIT=0\r\nSOURCE_GATE=PASS\r\n",
      "stderr": "[WebServer] (node:34068) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)\n[WebServer] (node:36816) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)\n(node:33820) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n(node:31960) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n(node:29096) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.\n(Use `node --trace-warnings ...` to show where the warning was created)\n",
      "exit_code": 0,
      "observation": "Fresh final source verification returned RC 0 across install, lint, unit/component, gateway, two-base builds, production build, 45 Playwright cases, production audit and diff check.",
      "timestamp": "2026-08-21T09:12:11Z",
      "evidence_type": "automated",
      "capture_file": "r8_20260821_174851/evidence/source-gate-rerun2.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\r8_20260821_174851\\evidence\\run-sentinel-probation.ps1",
      "stdout": "SENTINEL_BEFORE=42ecead761bd329e40a7c60cfcbaaea1d6595ba76b27bd1af12e159395d453f2\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:deployment\n> node --test scripts/nwg-deployment-contract.test.mjs\n\nTAP version 13\n# Subtest: pins a non-SPA static server to the production loopback endpoint\nok 1 - pins a non-SPA static server to the production loopback endpoint\n  ---\n  duration_ms: 7.6947\n  type: 'test'\n  ...\n# Subtest: defines hardened static and gateway systemd units for the exact current release\nok 2 - defines hardened static and gateway systemd units for the exact current release\n  ---\n  duration_ms: 2.0667\n  type: 'test'\n  ...\n# Subtest: runs deployment contracts in the Node 22 and Node 24 verification jobs\nok 3 - runs deployment contracts in the Node 22 and Node 24 verification jobs\n  ---\n  duration_ms: 0.8895\n  type: 'test'\n  ...\n# Subtest: runs verification pushes only for main and the R8 remediation branch\nok 4 - runs verification pushes only for main and the R8 remediation branch\n  ---\n  duration_ms: 1.543\n  type: 'test'\n  ...\n# Subtest: README records the investor-stage contract and the complete safe verification order\nok 5 - README records the investor-stage contract and the complete safe verification order\n  ---\n  duration_ms: 0.8902\n  type: 'test'\n  ...\n# Subtest: release runbook records version-addressed deployment, readiness, rollback, and measured live status\nok 6 - release runbook records version-addressed deployment, readiness, rollback, and measured live status\n  ---\n  duration_ms: 2.8805\n  type: 'test'\n  ...\n# Subtest: documented automatic switch preserves the original failure after recovery\nok 7 - documented automatic switch preserves the original failure after recovery\n  ---\n  duration_ms: 68.6922\n  type: 'test'\n  ...\n# Subtest: documented auth helper enforces a total wall-clock deadline against trickle responses\nok 8 - documented auth helper enforces a total wall-clock deadline against trickle responses\n  ---\n  duration_ms: 274.6273\n  type: 'test'\n  ...\n# Subtest: tracked threat model states the enforced controls and accepted operational gaps\nok 9 - tracked threat model states the enforced controls and accepted operational gaps\n  ---\n  duration_ms: 1.1379\n  type: 'test'\n  ...\n# Subtest: preserves the existing target when source validation or copying fails\nok 10 - preserves the existing target when source validation or copying fails\n  ---\n  duration_ms: 8.7488\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration preserves the real project www tree\nok 11 - behavior: canonical integration preserves the real project www tree\n  ---\n  duration_ms: 4704.3945\n  type: 'test'\n  ...\n# Subtest: project www preservation probe is read-only\nok 12 - project www preservation probe is read-only\n  ---\n  duration_ms: 0.7629\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration rejects a project www staging mutation\nok 13 - behavior: canonical integration rejects a project www staging mutation\n  ---\n  duration_ms: 2.575\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration rejects an explicitly occupied dynamic static port\nok 14 - behavior: canonical integration rejects an explicitly occupied dynamic static port\n  ---\n  duration_ms: 7685.1084\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration succeeds while port 5173 is externally occupied\nok 15 - behavior: canonical integration succeeds while port 5173 is externally occupied\n  ---\n  duration_ms: 2860.8958\n  type: 'test'\n  ...\n# Subtest: canonical integration owns staging and cleanup below a temporary root\nok 16 - canonical integration owns staging and cleanup below a temporary root\n  ---\n  duration_ms: 1.3928\n  type: 'test'\n  ...\n# Subtest: canonical build:nwg release is served through the static and gateway contracts\nok 17 - canonical build:nwg release is served through the static and gateway contracts\n  ---\n  duration_ms: 2895.5214\n  type: 'test'\n  ...\n1..17\n# tests 17\n# suites 0\n# pass 17\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 18594.1072\nDEPLOYMENT_TEST_EXIT=0\r\nSENTINEL_AFTER=42ecead761bd329e40a7c60cfcbaaea1d6595ba76b27bd1af12e159395d453f2\r\nSENTINEL_PRESERVED=PASS\r\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The deployment suite passed 17 tests and preserved the exact project sentinel SHA-256 across the run.",
      "timestamp": "2026-08-21T09:12:36Z",
      "evidence_type": "integration",
      "capture_file": "r8_20260821_174851/evidence/sentinel-probation-rerun1.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\r8_20260821_174851\\evidence\\run-port-probation.ps1",
      "stdout": "DUMMY_5173=LISTENING\r\n\n> uiadapt-adaptive-storefront-theater@4.1.0 test:deployment\n> node --test scripts/nwg-deployment-contract.test.mjs\n\nTAP version 13\n# Subtest: pins a non-SPA static server to the production loopback endpoint\nok 1 - pins a non-SPA static server to the production loopback endpoint\n  ---\n  duration_ms: 8.3526\n  type: 'test'\n  ...\n# Subtest: defines hardened static and gateway systemd units for the exact current release\nok 2 - defines hardened static and gateway systemd units for the exact current release\n  ---\n  duration_ms: 2.1906\n  type: 'test'\n  ...\n# Subtest: runs deployment contracts in the Node 22 and Node 24 verification jobs\nok 3 - runs deployment contracts in the Node 22 and Node 24 verification jobs\n  ---\n  duration_ms: 0.8984\n  type: 'test'\n  ...\n# Subtest: runs verification pushes only for main and the R8 remediation branch\nok 4 - runs verification pushes only for main and the R8 remediation branch\n  ---\n  duration_ms: 1.5384\n  type: 'test'\n  ...\n# Subtest: README records the investor-stage contract and the complete safe verification order\nok 5 - README records the investor-stage contract and the complete safe verification order\n  ---\n  duration_ms: 0.9351\n  type: 'test'\n  ...\n# Subtest: release runbook records version-addressed deployment, readiness, rollback, and measured live status\nok 6 - release runbook records version-addressed deployment, readiness, rollback, and measured live status\n  ---\n  duration_ms: 3.0798\n  type: 'test'\n  ...\n# Subtest: documented automatic switch preserves the original failure after recovery\nok 7 - documented automatic switch preserves the original failure after recovery\n  ---\n  duration_ms: 69.8419\n  type: 'test'\n  ...\n# Subtest: documented auth helper enforces a total wall-clock deadline against trickle responses\nok 8 - documented auth helper enforces a total wall-clock deadline against trickle responses\n  ---\n  duration_ms: 268.6591\n  type: 'test'\n  ...\n# Subtest: tracked threat model states the enforced controls and accepted operational gaps\nok 9 - tracked threat model states the enforced controls and accepted operational gaps\n  ---\n  duration_ms: 1.6055\n  type: 'test'\n  ...\n# Subtest: preserves the existing target when source validation or copying fails\nok 10 - preserves the existing target when source validation or copying fails\n  ---\n  duration_ms: 8.0986\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration preserves the real project www tree\nok 11 - behavior: canonical integration preserves the real project www tree\n  ---\n  duration_ms: 2942.0085\n  type: 'test'\n  ...\n# Subtest: project www preservation probe is read-only\nok 12 - project www preservation probe is read-only\n  ---\n  duration_ms: 0.8583\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration rejects a project www staging mutation\nok 13 - behavior: canonical integration rejects a project www staging mutation\n  ---\n  duration_ms: 1.6006\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration rejects an explicitly occupied dynamic static port\nok 14 - behavior: canonical integration rejects an explicitly occupied dynamic static port\n  ---\n  duration_ms: 7636.7257\n  type: 'test'\n  ...\n# Subtest: behavior: canonical integration succeeds while port 5173 is externally occupied\nok 15 - behavior: canonical integration succeeds while port 5173 is externally occupied\n  ---\n  duration_ms: 2862.4302\n  type: 'test'\n  ...\n# Subtest: canonical integration owns staging and cleanup below a temporary root\nok 16 - canonical integration owns staging and cleanup below a temporary root\n  ---\n  duration_ms: 1.1953\n  type: 'test'\n  ...\n# Subtest: canonical build:nwg release is served through the static and gateway contracts\nok 17 - canonical build:nwg release is served through the static and gateway contracts\n  ---\n  duration_ms: 2898.4822\n  type: 'test'\n  ...\n1..17\n# tests 17\n# suites 0\n# pass 17\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 16784.4201\nDEPLOYMENT_TEST_EXIT=0\r\nPORT_ISOLATION=PASS\r\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "An external process held 127.0.0.1:5173 while all 17 deployment tests passed, proving the integration no longer requires the live static-service port.",
      "timestamp": "2026-08-21T09:13:02Z",
      "evidence_type": "integration",
      "capture_file": "r8_20260821_174851/evidence/port-probation-rerun1.json"
    },
    {
      "command": "python E:\\03_AllWork\\grafana\\.agents\\skills\\evidence-quote-linter\\scripts\\finalize_evidence.py verify --evidence-dir review\\evidence\\run_20260821_020352_uiadapt_investor_stage",
      "stdout": "",
      "stderr": "usage: finalize_evidence.py [-h] {seal,verify} evidence_dir\r\nfinalize_evidence.py: error: unrecognized arguments: --evidence-dir\r\n",
      "exit_code": 2,
      "observation": "Disclosed failed verification attempt: the unsupported --evidence-dir option produced RC 2. The failed receipt remains append-only.",
      "timestamp": "2026-08-21T08:56:56Z",
      "evidence_type": "repro",
      "capture_file": "r8_20260821_174851/evidence/r3-manifest-reverify.json"
    },
    {
      "command": "python E:\\03_AllWork\\grafana\\.agents\\skills\\evidence-quote-linter\\scripts\\finalize_evidence.py verify review\\evidence\\run_20260821_020352_uiadapt_investor_stage",
      "stdout": "./automated-verification.json: OK\r\n./deployment-history.json: OK\r\n./deployment-history.ps1: OK\r\n./evidence-lint-r2.json: OK\r\n./evidence-lint.json: OK\r\n./git-diff.json: OK\r\n./git-target-attempt1-failed.json: OK\r\n./git-target.json: OK\r\n./independent-provenance.json: OK\r\n./independent-public-smoke.json: OK\r\n./independent-public-smoke.mjs: OK\r\n./independent-review-receipt.json: OK\r\n./pre-court-independent-review.json: OK\r\n./run-independent-public-smoke.ps1: OK\r\n./runtime-check.ps1: OK\r\n./runtime-verification.json: OK\r\n./screenshot-inventory.json: OK\r\n./screenshot-inventory.ps1: OK\r\n./screenshots/desktop-1440-compare-viewport.png: OK\r\n./screenshots/desktop-1440-compare.png: OK\r\n./screenshots/desktop-1440-explore-viewport.png: OK\r\n./screenshots/desktop-1440-explore.png: OK\r\n./screenshots/desktop-1440-focus-viewport.png: OK\r\n./screenshots/desktop-1440-focus.png: OK\r\n./screenshots/laptop-1024-compare-viewport.png: OK\r\n./screenshots/laptop-1024-compare.png: OK\r\n./screenshots/laptop-1024-explore-viewport.png: OK\r\n./screenshots/laptop-1024-explore.png: OK\r\n./screenshots/laptop-1024-focus-viewport.png: OK\r\n./screenshots/laptop-1024-focus.png: OK\r\n./screenshots/mobile-390-compare-viewport.png: OK\r\n./screenshots/mobile-390-compare.png: OK\r\n./screenshots/mobile-390-explore-viewport.png: OK\r\n./screenshots/mobile-390-explore.png: OK\r\n./screenshots/mobile-390-focus-viewport.png: OK\r\n./screenshots/mobile-390-focus.png: OK\r\n./source-diff-receipt.json: OK\r\n./source.diff: OK\r\n./verification-before-completion-receipt.json: OK\r\n./visual-review-final.json: OK\r\nEVIDENCE_FILE_COUNT=40\r\nEVIDENCE_MANIFEST=E:\\03_AllWork\\uiadapt-investor-stage\\review\\evidence\\run_20260821_020352_uiadapt_investor_stage\\SHA256SUMS\r\nEVIDENCE_VERIFY_RESULT=GREEN\r\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "The corrected positional finalizer invocation verified all 40 historical R3 evidence files and reported GREEN.",
      "timestamp": "2026-08-21T09:00:46Z",
      "evidence_type": "automated",
      "capture_file": "r8_20260821_174851/evidence/r3-manifest-reverify-rerun1.json"
    },
    {
      "command": "git rev-parse HEAD && git branch --show-current && git ls-remote origin refs/heads/codex/uiadapt-investor-r8-remediation refs/heads/main && git status --short --branch",
      "stdout": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b\ncodex/uiadapt-investor-r8-remediation\n00c4c47a63f859d33b4264f6e6ddb3c5ef71913b\trefs/heads/codex/uiadapt-investor-r8-remediation\n68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0\trefs/heads/main\n## codex/uiadapt-investor-r8-remediation...origin/codex/uiadapt-investor-r8-remediation\n?? review/evidence-lint-r3.json\n?? review/evidence/\n?? review/pre-court-final-review-r2.json\n?? review/pre-court-final-review-r3.json\n?? review/r8_20260821_174851/\n?? review/spec_20260821_021401_uiadapt_investor_stage_nwg_release.md\n?? review/spec_20260821_113136_uiadapt_investor_stage_nwg_release_r2.md\n?? review/spec_20260821_113808_uiadapt_investor_stage_nwg_release_r3.md\n?? review/visual-review-final.json\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "Local HEAD and the remote R8 branch resolve to the exact review target; main remains at its prior SHA and untracked historical evidence is disclosed.",
      "timestamp": "2026-08-21T09:19:07Z",
      "evidence_type": "automated",
      "capture_file": "r8_20260821_174851/evidence/git-target-remote.json"
    },
    {
      "command": "pwsh -NoProfile -File review\\r8_20260821_174851\\evidence\\run-live-runtime-readonly.ps1",
      "stdout": "captured_utc=2026-08-21T09:20:25Z\ncurrent=/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo/releases/fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91\nstatic_active=active\ngateway_active=active\nstatic_enabled=enabled\ngateway_enabled=enabled\ncredential_mode=600 owner=root group=root size=9\n",
      "stderr": "",
      "exit_code": 0,
      "observation": "Fresh read-only runtime inspection confirms the live current release remains R3 fba3d9d, both services are active/enabled, and only credential metadata was captured.",
      "timestamp": "2026-08-21T09:20:25Z",
      "evidence_type": "runtime",
      "capture_file": "r8_20260821_174851/evidence/live-runtime-current-rerun1.json"
    }
  ],
  "evidence_package": {
    "directory": "review/r8_20260821_174851/evidence",
    "integrity_receipt": "review/r8_20260821_174851/evidence/integrity-receipt.json",
    "risk_register": "review/r8_20260821_174851/evidence/risk-register.md",
    "handoff": "review/r8_20260821_174851/evidence/HANDOFF.md",
    "manifest": "review/r8_20260821_174851/evidence/SHA256SUMS",
    "manifest_sha256": "7204096f40f2b1e90ef4a85101c4def3273bbe040c24f9aa7f29dca7aa08ec5d",
    "manifest_entry_count": 27,
    "manifest_verify_result": "GREEN",
    "manifest_policy": "Self-excluding SHA-256 manifest generated after all evidence payloads and review receipts were present; final direct verification returned RC 0.",
    "failed_captures_preserved": [
      "source-gate.json",
      "r3-manifest-reverify.json"
    ],
    "uncaptured_failure_disclosure": "A first attempt to invoke the live read-only command failed in the orchestrator shell before a capture file was created due to shell parsing. No runtime mutation occurred; the corrected captured command is live-runtime-current-rerun1.json."
  },
  "risks": [
    {
      "description": "R8 has not been deployed; live remains R3 fba3d9d.",
      "severity": "medium",
      "handling": "accepted_unresolved"
    },
    {
      "description": "PRODUCT_CLARITY=NOT_VERIFIED because no real three-person non-developer test was run.",
      "severity": "medium",
      "handling": "plan",
      "plan": "Run the prescribed 30-second test before claiming human clarity."
    },
    {
      "description": "Application-layer rate limiting, dedicated service account, complete hop-by-hop filtering, explicit request/WebSocket timeout pinning, and deployment-preflight credential metadata assertion remain absent.",
      "severity": "medium",
      "handling": "accepted_unresolved"
    },
    {
      "description": "Test-only dynamic port reservation/rebind and sequential cleanup have bounded residue/flakiness windows.",
      "severity": "low",
      "handling": "accepted_unresolved"
    },
    {
      "description": "GitHub Action JavaScript internals reported Node 20 compatibility warnings while both exact-head jobs passed.",
      "severity": "low",
      "handling": "accepted_unresolved"
    }
  ],
  "companion_processes": {
    "evidence_quote_linter": "COMPLETE_RC0; review/r8_20260821_174851/evidence/r8-spec-lint.json",
    "self_excluding_manifest_seal": "COMPLETE_GREEN; 27 payload entries; SHA256SUMS sha256=7204096f40f2b1e90ef4a85101c4def3273bbe040c24f9aa7f29dca7aa08ec5d",
    "independent_source_spec_review": "COMPLETE_GO",
    "independent_source_quality_review": "COMPLETE_GO",
    "verification_before_completion": "COMPLETE; final manifest verify RC 0 and final spec lint RC 0"
  },
  "final_position": {
    "source_remediation": "READY_FOR_COURT",
    "live_r8_acceptance": "NOT_CLAIMED",
    "main_integration": "NOT_PERFORMED",
    "product_clarity": "NOT_VERIFIED",
    "critical_findings": 0,
    "important_findings": 0,
    "minor_findings": 4,
    "required_next_action": "Seal and verify the evidence manifest, then give the spec and whole package to a different-session adjudicator. Deploy R8 only under a separate authorization and fresh public-smoke gate."
  }
}
