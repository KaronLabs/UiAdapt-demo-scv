# R8 evidence handoff

## Identity

- Repository: `KaronLabs/UiAdapt-demo-scv`
- Branch: `codex/uiadapt-investor-r8-remediation`
- Application source SHA: `00c4c47a63f859d33b4264f6e6ddb3c5ef71913b`
- Comparison base: `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`
- Remote CI: run `32466937260`, exact head SHA, both jobs successful
- Live nwg release: still `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`
- Main branch: not merged

## What R8 changes

1. Runs the deployment contract under a temporary root instead of `projectRoot/www`.
2. Uses OS-assigned dynamic ports for test static and gateway services.
3. Proves project `www` preservation and operation while `127.0.0.1:5173` is occupied.
4. Documents the complete verification/release/rollback contract.
5. Tracks a gateway/Funnel/systemd threat model.
6. Runs GitHub CI on the R8 branch and retains the exact-head workflow receipt.
7. Narrows ESLint exclusions to generated/historical evidence without hiding ordinary source files.

## Evidence reading order

1. `source-gate.json` — disclosed initial lint failure caused by the new evidence helper.
2. `source-gate-rerun2.json` — fresh complete local source gate, RC 0.
3. `sentinel-probation-rerun1.json` — 17 deployment tests and sentinel hash preservation.
4. `port-probation-rerun1.json` — 5173 occupied, 17 deployment tests pass.
5. `r3-manifest-reverify.json` — disclosed wrong CLI invocation.
6. `r3-manifest-reverify-rerun1.json` — corrected R3 40-file verification.
7. `git-target-remote.json` — local/remote branch identity.
8. `github-actions-run-32466937260.json` — exact-head remote CI jobs and artifact.
9. `independent-source-spec-review.json` and `independent-source-quality-review.json` — independent final review receipts.
10. `r8-spec-lint-rerun1.json` — exact R8 spec evidence-boundary lint, RC 0.
11. `SHA256SUMS` — self-excluding package manifest.

## Reproduction

Run from a fresh checkout of the application source SHA:

```powershell
npm ci
npm run lint
npm test
npm run test:gateway
npm run verify:build-bases
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Then run the two isolated probation scripts from this package. Neither script is a deployment command.

## Explicit non-claims

- R8 is not deployed to nwg.
- R8 is not merged to `main`.
- No R8 public-browser smoke exists because the public service still runs R3.
- `PRODUCT_CLARITY=NOT_VERIFIED`.
- The package does not claim rate limiting, a dedicated service account, complete hop-by-hop filtering, or explicit application timeouts.
