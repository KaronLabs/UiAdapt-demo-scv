# UIAdapt R8 Readiness Live Deployment Receipt

STATUS: SUCCESS
VERDICT: NOT SELF-ADJUDICATED
PRODUCT_CLARITY: NOT_VERIFIED

## Identity
- target_app_sha: a0c701d6a9f8737e787e607106da87185bf19319
- previous_live_sha: fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91
- evidence_branch: codex/uiadapt-r8-readiness-live-20260822
- public_url: https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/
- deployment_utc: 2026-08-21T18:11:32Z

## Fresh source gate
- npm ci: RC 0
- lint: RC 0
- Vitest: 19/19
- gateway: 16/16
- deployment: 18/18
- build bases: RC 0
- build nwg: RC 0
- Playwright: 48/48
- production audit: 0 vulnerabilities
- git diff check: RC 0

## Artifact
- archive_sha256: f4509967f5229e3e26c3e9405910dc35eb5bd72075f78b612bc1fb1820c1ee8d
- archive_bytes: 13447981
- payload_files: 119
- local_roundtrip: PASS
- remote_payload_manifest: PASS
- switch_block_sha256: 1f8eeb47cdfdd89d0bacfe4ac049e1bb17335a31181e93f7a3480db6088b1fd1

## Live result
- current_pointer: a0c701d6a9f8737e787e607106da87185bf19319
- rollback_release: fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91 preserved
- switch_attempts: 1
- switch_result: PASS
- services: active and enabled
- gateway unauthenticated: 401
- gateway wrong credential: 401
- gateway authenticated root: 302
- gateway authenticated nested: 200
- public authenticated: 200
- public favicon: 200 image/svg+xml
- public Replay: EXPLORE to COMPARE to FOCUS
- console errors: 0
- page errors: 0
- failed requests: 0
- HTTP 404: 0
- external runtime requests: 0
- WOFF2 assets: 11 with 200 font/woff2
- parent git dirty count: 0
- secret leak count: 0
- Funnel mappings: unchanged

## Disclosures
- Failed evidence-collection attempts are preserved in their original logs.
- The first R3 browser attempt lacked Playwright in the production dependency tree.
- The first combined browser hygiene attempt exposed only the allowed legacy implicit favicon console error and was rerun with URL-bound classification.
- The first final invariant wrapper failed because grep no-match returns RC 1 under pipefail; component diagnostics showed all invariants green and the corrected evidence wrapper passed.
- No source file was edited during deployment.
- No main merge, host reboot, Funnel change, credential change, or R3 deletion was performed.
- Final adjudication belongs to a separate verifier.
