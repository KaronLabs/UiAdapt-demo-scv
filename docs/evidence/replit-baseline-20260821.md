# Replit Deployment Baseline Receipt

- Captured: 2026-08-21 07:49-07:50 KST
- Branch: `codex/replit-deployment`
- HEAD: `e84ab6fd4e39c51b9c44fe9b0fb901321a0be42e`
- Worktree: `E:\03_AllWork\uiadapt-replit-deploy`
- Source baseline: `02a8df57e8b10fa1094b6b2a5ca5fe19bf031a22`

## Repository identity

`git status --short --branch` returned only `## codex/replit-deployment` (RC 0). The implementation worktree was clean before the baseline commands.

The unfinished nwg worktree remained at `E:\03_AllWork\grafana\park-web-demo-v4.1`, branch `fix/uiadapt-v4.1-nwg-deployment`, HEAD `1f9e07ee264a36ad85a7569422d019306f5d54bf`. Its pre-existing status was read only:

```text
 M .gitignore
 M deploy/systemd/uiadapt-static.service
 M package.json
 M scripts/nwg-deployment-contract.test.mjs
?? evidence/retrial_20260820_084917_uiadapt_v41/
?? evidence/retrial_20260820_093322_uiadapt_v41/
?? review/evidence/
?? review/retrial_20260820_084917_uiadapt_v41/
?? review/spec_20260820_070752_uiadapt_v41_publication.md
?? scripts/stage-nwg.mjs
```

## Fresh baseline results

| Command | Started (KST) | Result | Counts / warnings |
|---|---|---:|---|
| `npm ci` | 07:49:05 | RC 0 | 240 packages installed; audit 0 vulnerabilities |
| `npm run lint` | 07:49:18 | RC 0 | 0 reported errors or warnings |
| `npm test` | 07:49:36 | RC 0 | 2 files; 17 passed; 0 failed |
| `npm run test:gateway` | 07:49:55 | RC 0 | 9 passed; 0 failed |
| `npm run build:pages` | 07:49:55 | RC 0 | 27 modules transformed; build completed |
| `npm run test:e2e` | 07:50:00 | RC 0 | 36 passed; 0 failed; Node emitted `NO_COLOR`/`FORCE_COLOR` warnings |
| `npm audit --omit=dev --audit-level=high` | 07:50:21 | RC 0 | 0 vulnerabilities |
| `git diff --check` | 07:50:22 | RC 0 | no whitespace errors |

This receipt records the pre-implementation state only. It is not evidence of a Replit deployment or public URL.
