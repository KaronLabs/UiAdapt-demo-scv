# UIAdapt R8 favicon live deployment operator report

- Outcome: ROLLED_BACK
- Target: e076d9f90af1cd897842383780053595c8654170
- Previous/current: fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91
- Public URL: https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/
- Operator role: mutation only; no self-adjudication
- Product clarity: NOT_VERIFIED

## Fresh source gate

npm ci, lint, two-base build, build:nwg, audit, and diff check returned RC 0.
Vitest 19/19, gateway 16/16, deployment 17/17, Playwright 48/48 passed.
Production audit reported 0 vulnerabilities.

## Package and pre-switch verification

Fresh archive SHA256: fdf228fb1af1ddf92ef92a3a20f2286245cc02206f9a60234346de41be911055
Archive round-trip manifest: PASS.
R3 pre-switch public browser: HTTP 200 and EXPLORE>COMPARE>FOCUS.
The only allowed R3 exception was one exact /favicon.ico console 404.
Candidate dynamic-loopback browser served favicon as 200 image/svg+xml and had zero console, page, request, 404, and external runtime errors.
Sealed switch block SHA256: 1e0b95167bb9fc475881bf4cec04222156517d1da4ac4fbf59caeb5e2d51635f.

## Switch and rollback

The sealed automatic switch block was executed exactly once. Its immediate static readiness curl failed with connection refused after systemd restart. The same shell entered its automatic rollback trap and restored R3. Journal evidence shows the static listener became available shortly after restart, identifying an immediate-readiness race in the runbook recipe.

No second switch attempt was made. No manual rollback was run because the automatic trap had already restored the previous pointer and this was not a later external post-switch validation failure.

## Final verified state

Current is R3. R8 is not live. R8 final release is preserved and R8 staging is absent.
Static and gateway are active and enabled.
Local static is 200. Gateway unauthenticated and wrong credential are 401.
Gateway authenticated root/nested are 302/200. Public authenticated nested is 200.
Rollback R3 browser Replay passed with only the known favicon 404.
Funnel 443, 8443, and 8787 are unchanged. Parent repository tracked diff is 0.

## Required next action

Do not retry this campaign. A new source remediation must add condition-based readiness waiting to automatic switch and rollback recipes, prove it with a failing-before and passing-after deployment contract, and obtain a new exact SHA and authorization.