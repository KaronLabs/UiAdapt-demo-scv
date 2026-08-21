# UIAdapt Investor Stage R8 Live Deployment Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` for separated operator and verifier roles.

**Goal:** Deploy exact app SHA `00c4c47a63f859d33b4264f6e6ddb3c5ef71913b` to NWG once, preserve rollback to `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`, independently verify the public runtime, and seal append-only evidence.

**Architecture:** Build and verify in a detached clean worktree. Package tracked source plus generated `www/uiadapt_demo`, transfer by SHA-256-verified archive to a new version-addressed release, then use the exact fail-closed switch from the target commit's runbook. Do not modify source, units, credentials, Funnel mappings, main, or the previous release.

**Tech Stack:** Git, npm/Node, Vite, Vitest, Playwright, OpenSSH, Bash, systemd, Tailscale Funnel.

---

## Frozen identities

- Repository: `https://github.com/KaronLabs/UiAdapt-demo-scv`
- Source branch: `codex/uiadapt-investor-r8-remediation`
- Target SHA: `00c4c47a63f859d33b4264f6e6ddb3c5ef71913b`
- Expected previous live SHA: `fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91`
- Deployment root: `/mnt/nvme-hot/ne/karon_api_lab/07_UiAdapt-demo`
- Public URL: `https://00-new-world-gpu.tail645adc.ts.net/uiadapt_demo/`
- Static service: `uiadapt-static.service`
- Gateway service: `uiadapt-gateway.service`
- Credential metadata only: `/etc/uiadapt-demo/password` must be root:root mode 0600 and non-empty.

## Absolute prohibitions

- Never print, hash, encode, copy, or persist the credential value.
- Never alter Funnel configuration, including ports 443, 8443, and 8787.
- Never overwrite, delete, or reuse an existing `releases/<target SHA>`.
- Never run build or deployment tests inside remote `current`.
- Never edit installed systemd units during this mission.
- Never retry the live switch in this mission.
- Never merge main, delete R3, hotfix source, or change the app branch.
- Never accept `SWITCH_STATUS=PASS` as full browser acceptance; it proves only the runbook's bounded readiness/authentication smoke.

## Test coverage perimeter

1. Git target and clean detached worktree.
2. `npm ci`, lint, Vitest, gateway, deployment, two-base build, nested build, E2E, production audit, diff check.
3. Expected minimum counts: Vitest 19, gateway 16, deployment 17, Playwright 45; raw output is authoritative.
4. Archive and expanded release manifests.
5. R3 local and public authentication baseline.
6. Unit bytes, service state, credential metadata, free space, symlink and Funnel invariants.
7. Atomic switch, readiness, authentication, public browser states, console/network hygiene.
8. Independent read-only verifier and evidence manifest.

Additional GO predicates:

- `releases/<target SHA>` is absent before staging and becomes a real directory, never a symlink.
- The remote Node executable and production dependency tree can start the exact target gateway/static commands.
- Installed unit bytes equal the exact target unit bytes before the switch; this mission does not install or rewrite units.
- If the automatic switch exits nonzero, the prior R3 pointer, both services, gateway 401, local authenticated 200, and public authenticated 200 must all be revalidated before assigning `ROLLED_BACK`.
- If the automatic switch prints `SWITCH_STATUS=PASS` but asset, Replay, console, network, or independent verification fails, the exact manual rollback block must run once.

No production code is modified. Therefore the RED-GREEN-REFACTOR boundary is the already-committed R8 regression suite: the deployment executes only if the complete suite remains GREEN. Any source change would terminate this mission and require a new TDD cycle and authorization.

## Ordered execution

- [ ] Record local and remote read-only preflight.
- [ ] Record R3 rollback baseline.
- [ ] Create detached exact-SHA build worktree.
- [ ] Run full source gate and capture raw stdout, stderr, RC, UTC timestamps.
- [ ] Build `www/uiadapt_demo`.
- [ ] Create tracked-source-plus-build archive; exclude `.git`, `node_modules`, review data, and test artifacts.
- [ ] Record archive SHA-256 and expanded manifest.
- [ ] Transfer to a new remote staging path and verify archive SHA-256.
- [ ] Run `npm ci --omit=dev --ignore-scripts`, `npm ls --omit=dev`, and `systemd-analyze verify` in staging.
- [ ] Rename staging to final `releases/<target SHA>`; do not touch `current`.
- [ ] Re-run all GO predicates.
- [ ] Execute the exact runbook one-shell switch once.
- [ ] Run operator local/public smoke and browser acceptance.
- [ ] Dispatch an independent read-only verifier.
- [ ] If post-switch acceptance fails, execute the exact manual rollback block once.
- [ ] Re-measure Funnel and parent repository invariants.
- [ ] Seal UTF-8 LF evidence with a self-excluding SHA-256 manifest.
- [ ] Create and push `codex/uiadapt-investor-r8-live-evidence` based on the exact app SHA, containing only `review/live-r8_<UTC>/**`.

## Terminal outcomes

- `SUCCESS`: switch, operator acceptance, independent verification, and evidence seal passed.
- `ROLLED_BACK`: R8 failed after switch and R3 was restored and revalidated.
- `NOT_ATTEMPTED_NO_GO`: a pre-switch predicate failed; live pointer unchanged.
- `ROLLBACK_FAILED_EMERGENCY`: rollback failed; report exact runtime state without further mutation.

## Product clarity

`PRODUCT_CLARITY=NOT_VERIFIED` remains unchanged. Automated deployment acceptance cannot replace the required non-developer test.
