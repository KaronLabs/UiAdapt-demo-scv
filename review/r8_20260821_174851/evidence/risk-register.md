# R8 residual risk register

Review target: `00c4c47a63f859d33b4264f6e6ddb3c5ef71913b`

| Risk | Severity | Handling | Evidence / safeguard |
|---|---|---|---|
| The live nwg service remains on `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`; R8 has not been deployed. | Medium | `accepted_unresolved` | R8 is a source/test/document/CI remediation. No live-deployment success is claimed. The historical R3 runtime receipt remains the live-state evidence. |
| `PRODUCT_CLARITY=NOT_VERIFIED`; no real three-person non-developer test was run. | Medium | `plan` | Run the prescribed 30-second external comprehension test before claiming human product clarity. |
| The shared Basic Auth credential has no application-layer rate limiter. | Medium | `safeguard` | Keep it behind Funnel TLS, use a strong rotated credential, limit distribution, and rotate after review. See `docs/security/investor-preview-threat-model.md`. |
| The service still runs as the broad `ubuntu` account, and explicit hop-by-hop filtering plus request/WebSocket timeout pinning remain backlog. | Medium | `accepted_unresolved` | Existing loopback binding, fixed upstream, Authorization stripping, fail-closed credentials, and systemd hardening remain. Do not claim those absent controls exist. |
| The deployment integration test obtains dynamic ports before child processes bind, leaving a bounded local TOCTOU possibility under concurrent test pressure. | Low | `accepted_unresolved` | The regression reserves OS-assigned ports and retries only through normal test failure; external `5173` occupation is proven non-conflicting. |
| Sequential integration-child shutdown can short-circuit if the first stop operation throws. | Low | `accepted_unresolved` | The impact is limited to temporary test-process or directory residue; the integration never stages or removes `projectRoot/www`. |
| The release runbook recovery helper may report the terminal failure without separately surfacing every intermediate rollback command failure. | Low | `accepted_unresolved` | The one-shell ERR trap preserves the deployment failure, performs rollback, and returns nonzero; independent review classified this as non-blocking. |
| The switch preflight checks credential readability but does not independently assert `root:root` and mode `0600` with `stat`. | Low | `accepted_unresolved` | The required metadata is documented and the fresh live read-only receipt reports `600 root root`; add a fail-closed metadata assertion before the next deployment. |
| GitHub Actions reported Node-20-based action internals being forced onto Node 24. | Low | `accepted_unresolved` | Both `verify` and `runtime-contract` jobs concluded success for exact source SHA; monitor action upgrades. |
| The first source gate and first R3 manifest verification invocation failed. | Low | `safeguard` | Both failed captures are preserved. Corrected fresh captures are separate append-only receipts; failures are not rewritten or hidden. |
| `main` remains `68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0`; R8 is not merged. | Low | `accepted_unresolved` | Review is explicitly branch-scoped. No main-integration claim is made. |
