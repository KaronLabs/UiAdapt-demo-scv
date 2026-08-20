# UIAdapt Replit Static Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Keep implementation and verification agents separate. Every behavior change follows RED → GREEN → REFACTOR.

**Goal:** Publish the existing UIAdapt Vite SPA through Replit Static Deployment from a verified GitHub branch, without changing product behavior or touching the unfinished nwg worktree.

**Architecture:** Add a small root-hosted build contract (npm run build:replit) that emits dist assets with / base URLs, plus a .replit editor-run configuration. Replit Publishing is configured in its UI with build command npm run build:replit and public directory dist; the public URL is verified by a separate smoke command after publish. The GitHub branch and source SHA remain the source of truth.

**Tech Stack:** React 19, TypeScript, Vite 8, npm lockfile, Node built-in test runner, Playwright, Replit Static Deployment, Replit MCP OAuth.

---

## Repository safety and fixed inputs

- Worktree: E:\03_AllWork\uiadapt-replit-deploy
- Branch: codex/replit-deployment
- Baseline: 02a8df57e8b10fa1094b6b2a5ca5fe19bf031a22
- Untouched worktree: E:\03_AllWork\grafana\park-web-demo-v4.1
- Never run git add ., git reset, git clean, git stash, or a destructive cleanup.
- Stage only the explicit paths listed in each task.
- Do not add a password, secret, analytics package, backend, or Replit-generated replacement app.

## Test perimeter before implementation

The perimeter has four layers:

1. Source/config: Replit build script and .replit values are exact and contain no password or secret.
2. Artifact: dist/index.html exists after the Replit build; every referenced JS/CSS/font asset exists and is not an HTML fallback; URLs begin with /assets/.
3. Existing product regression: the baseline 17 unit/component tests and 36 nested-path Playwright tests remain unchanged and pass.
4. Published runtime: an opt-in public smoke command checks the actual REPLIT_PUBLIC_URL; it fails when the URL is absent and never treats local preview as public proof.

## Task 1: Record and verify the clean baseline

**Files:**

- Create: docs/evidence/replit-baseline-20260821.md

- [ ] Step 1: Capture repository identity and untouched worktree status

Run from E:\03_AllWork\uiadapt-replit-deploy:

~~~powershell
git branch --show-current
git rev-parse HEAD
git status --short --branch
git worktree list --porcelain
~~~

Expected: branch codex/replit-deployment, HEAD 02a8df57..., clean status. Separately run git -C E:\03_AllWork\grafana\park-web-demo-v4.1 status --short --branch and record the pre-existing dirty paths without modifying them.

- [ ] Step 2: Run the fresh baseline commands

~~~powershell
npm ci
npm run lint
npm test
npm run test:gateway
npm run build:pages
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check
~~~

Record command, UTC/local timestamp, exit code, test count, warnings, and failure count. Expected baseline: lint RC0, Vitest 17/17, gateway 9/9, build RC0, Playwright 36/36, production audit 0 vulnerabilities, diff-check RC0.

- [ ] Step 3: Write the baseline receipt and commit it

Use apply_patch to write the captured facts to docs/evidence/replit-baseline-20260821.md. Do not paste secrets or full environment dumps. Stage only that file:

~~~powershell
git add -- docs/evidence/replit-baseline-20260821.md
git commit -m "docs: record Replit deployment baseline"
~~~

## Task 2: RED — add the Replit artifact contract test

**Files:**

- Create: scripts/replit-deployment-contract.test.mjs
- Modify: package.json

- [ ] Step 1: Write the failing test before adding the build script

Create this exact Node test. It intentionally calls the not-yet-existing build:replit script:

~~~javascript
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const dist = join(root, "dist");

function referencedAssets(html) {
  return [...html.matchAll(/(?:src|href)="([^\"]*\/assets\/[^\"]+)"/g)].map((match) => match[1]);
}

test("Replit build emits a root-hosted dist artifact with real assets", () => {
  execFileSync("npm", ["run", "build:replit"], { cwd: root, stdio: "pipe" });
  const htmlPath = join(dist, "index.html");
  if (!existsSync(htmlPath)) throw new Error("dist/index.html is missing");
  const html = readFileSync(htmlPath, "utf8");
  const assets = referencedAssets(html);
  if (assets.length === 0) throw new Error("dist/index.html has no local assets");
  for (const assetUrl of assets) {
    if (!assetUrl.startsWith("/assets/")) throw new Error("non-root Replit asset URL: " + assetUrl);
    const assetPath = join(dist, assetUrl.slice(1));
    if (!existsSync(assetPath) || !statSync(assetPath).isFile()) throw new Error("missing asset: " + assetUrl);
    const body = readFileSync(assetPath);
    if (body.subarray(0, 15).toString("utf8").toLowerCase().includes("<!doctype")) throw new Error("HTML fallback served as asset: " + assetUrl);
  }
  if (!readdirSync(dist).includes("index.html")) throw new Error("dist directory is not publishable");
});
~~~

- [ ] Step 2: Run the RED test and preserve the failure

~~~powershell
node --test scripts/replit-deployment-contract.test.mjs
~~~

Expected: FAIL because npm run build:replit does not exist. If it passes, inspect the repository state; do not proceed until the test is proven to detect the missing contract.

- [ ] Step 3: Add only the test script entry

Add this package script without adding dependencies:

~~~json
"test:replit": "node --test scripts/replit-deployment-contract.test.mjs"
~~~

Run npm run test:replit; it must still fail for the missing build:replit script. Commit the RED test:

~~~powershell
git add -- scripts/replit-deployment-contract.test.mjs package.json
git commit -m "test: add Replit static artifact contract"
~~~

## Task 3: GREEN — add the minimal Replit build/editor configuration

**Files:**

- Modify: package.json
- Create: .replit

- [ ] Step 1: Add the root build command

Add exactly:

~~~json
"build:replit": "tsc -b && vite build --base=/"
~~~

Do not change build, build:pages, vite.config.ts, or any src/** file.

- [ ] Step 2: Add the Replit editor run configuration

Create .replit with:

~~~toml
entrypoint = "index.html"
run = "npm run dev -- --host 0.0.0.0"

[deployment]
build = "npm run build:replit"
~~~

The Publishing UI remains authoritative for Static Deployment public directory dist. Do not add credentials, environment values, external URLs, or a server command to the deployment section.

- [ ] Step 3: Run the GREEN contract

~~~powershell
npm run test:replit
~~~

Expected: 1 test passed, RC0. Confirm dist/index.html asset URLs start with /assets/ and every referenced asset exists.

- [ ] Step 4: Refactor only after GREEN

Remove duplicated path logic only if the test remains behaviorally identical. Run npm run test:replit again. Do not add abstractions or unrelated cleanup.

- [ ] Step 5: Commit the minimal implementation

~~~powershell
git add -- package.json .replit scripts/replit-deployment-contract.test.mjs
git commit -m "build: add Replit static deployment contract"
~~~

## Task 4: Add publication instructions and an opt-in public smoke

**Files:**

- Create: docs/replit-deployment-v4.1.md
- Create: scripts/replit-public-smoke.mjs
- Modify: package.json

- [ ] Step 1: Write the smoke test before implementation

The smoke command must require REPLIT_PUBLIC_URL, reject non-HTTPS URLs, navigate the root, collect console errors/request failures/external requests, click Watch UIAdapt, and verify both COMPARE and FOCUS. It must not print cookies, authorization headers, or environment values. The first RED run must fail with a clear missing-URL message when the variable is absent.

The script must exit nonzero for:

- missing or non-HTTPS REPLIT_PUBLIC_URL;
- HTTP status >= 400 for the document or any local asset;
- a request failure, console error, unexpected external request, or asset URL returning HTML;
- missing Watch control, COMPARE transition, or FOCUS transition.

The script must print only URL, timestamp, request counts, state observations, and pass/fail summaries.

- [ ] Step 2: Verify RED

~~~powershell
Remove-Item Env:REPLIT_PUBLIC_URL -ErrorAction SilentlyContinue
npm run smoke:replit
~~~

Expected: RC1 with REPLIT_PUBLIC_URL is required; no browser is launched.

- [ ] Step 3: Implement the minimal smoke and script entry

Add:

~~~json
"smoke:replit": "node scripts/replit-public-smoke.mjs"
~~~

Use Playwright's existing dependency and the canonical selectors/replay timing from e2e/storefront.spec.ts. Keep the smoke to one Chromium viewport (1440x900); the existing local E2E suite remains responsible for the three viewport matrix.

- [ ] Step 4: Document the manual Replit publish settings

Write docs/replit-deployment-v4.1.md with exact values:

~~~text
Source repository: KaronLabs/UiAdapt-demo-scv
Branch: codex/replit-deployment
Build command: npm run build:replit
Public directory: dist
Deployment type: Static
Access: anonymous public
Secrets: none
~~~

Include placeholders only for values that do not exist until publish: Replit app URL, publish timestamp, imported SHA, and smoke evidence path. Mark each as PENDING_LIVE_PUBLISH, not vague prose.

- [ ] Step 5: Commit documentation and smoke

~~~powershell
git add -- docs/replit-deployment-v4.1.md scripts/replit-public-smoke.mjs package.json
git commit -m "test: add Replit public smoke contract"
~~~

## Task 5: Full local verification and implementation review gate

**Files:** no new files; review the complete branch.

- [ ] Step 1: Run the complete local gate

~~~powershell
npm ci
npm run lint
npm test
npm run test:gateway
npm run test:replit
npm run build:pages
npm run test:e2e
npm audit --omit=dev --audit-level=high
git diff --check
git status --short --branch
git log -1 --oneline
~~~

Expected: all RC0; Vitest 17/17, gateway 9/9, Replit 1/1, Playwright 36/36, production audit 0 vulnerabilities. Record fresh timestamps and raw output.

- [ ] Step 2: Request code review

Send a separate reviewer:

- base SHA: d7bc73bc0101ed3873fa722e0339d22a1e36f51e
- head SHA: current branch HEAD
- changed paths: explicit output from git diff --name-status base..HEAD
- requirements: no product-file changes, root asset contract, opt-in smoke, no secrets, no nwg changes

Resolve every Critical/Important finding before any push or Replit import.

- [ ] Step 3: Stop implementation at the review handoff

Produce READY_FOR_INDEPENDENT_REVIEW with source SHA, test counts, changed paths, and the exact Replit UI values. Do not call the branch published yet.

## Task 6: Connect Replit MCP and ChatGPT OAuth

**Files:** no repository files.

- [ ] Step 1: Add Codex Custom MCP

In Codex Settings → Plugins → MCPs, add a custom MCP named Replit:

~~~text
Transport: Streamable HTTP
URL: https://replit-mcp.com/server/mcp
Bearer token: empty
Custom headers: empty
~~~

Select Authenticate, choose the intended Replit workspace, and Allow. Verify by asking the connected MCP to list or search apps. Never paste or record OAuth tokens.

- [ ] Step 2: Connect ChatGPT Replit separately

In ChatGPT Settings → Apps & Connectors → Replit → Connect, complete OAuth. This is an independent connection and may only operate on apps created in that ChatGPT conversation; it is not the source-of-truth path for the imported GitHub app.

- [ ] Step 3: Record connection status

Record only connected/disconnected status, workspace/app identifier, timestamp, and any consent blocker. Do not record tokens or screenshots containing secrets.

## Task 7: Push, import, publish, and capture evidence

**Files:** update docs/replit-deployment-v4.1.md only after live values exist.

- [ ] Step 1: Push the verified branch

~~~powershell
git push -u origin codex/replit-deployment
git ls-remote origin refs/heads/codex/replit-deployment
~~~

Expected remote SHA equals the locally reviewed HEAD. If private GitHub OAuth access is unavailable in Replit, stop and report the exact consent blocker.

- [ ] Step 2: Import the private repository

Use Replit guided import at https://replit.com/import: select GitHub, authorize the repository, select KaronLabs/UiAdapt-demo-scv, import, then use the Replit Git pane to switch to codex/replit-deployment if the import screen does not offer branch selection.

- [ ] Step 3: Verify branch and SHA before publishing

In the Replit Shell run:

~~~bash
git branch --show-current
git rev-parse HEAD
npm ci
npm run test:replit
~~~

The branch must be codex/replit-deployment and the SHA must equal the pushed local HEAD. Do not publish on mismatch.

- [ ] Step 4: Configure Static Deployment

In Publish → Adjust settings choose:

~~~text
Deployment type: Static
Build command: npm run build:replit
Public directory: dist
Access: public/anonymous
~~~

Publish once. Do not add secrets or enable Agent source rewrites.

- [ ] Step 5: Run public smoke

Set the URL only in the current process:

~~~powershell
$env:REPLIT_PUBLIC_URL='https://<actual-subdomain>.replit.app/'
npm run smoke:replit
Remove-Item Env:REPLIT_PUBLIC_URL
~~~

Expected RC0 with document/assets 2xx, console errors 0, failed requests 0, external runtime requests 0, Watch started, COMPARE observed, FOCUS observed.

- [ ] Step 6: Update and commit the live publication receipt

Replace only PENDING_LIVE_PUBLISH values in docs/replit-deployment-v4.1.md with actual URL, imported SHA, publish timestamp, and smoke evidence path. Do not rewrite the historical v4.0/v4.1 receipts. Commit:

~~~powershell
git add -- docs/replit-deployment-v4.1.md
git commit -m "docs: record Replit publication evidence"
git push
~~~

If the receipt commit changes the deployed SHA, republish and rerun smoke; never leave the receipt SHA different from the published SHA.

## Task 8: Independent public verification and final report

**Files:** Create: docs/replit-independent-verification-v4.1.md

- [ ] Step 1: Fresh reviewer checks out the pushed SHA

Reviewer records repository URL, branch, SHA, UTC timestamp, and local checkout path. Reviewer does not trust the implementer's test output.

- [ ] Step 2: Re-run local artifact and regression gates

Reviewer runs npm ci, npm run lint, npm test, npm run test:gateway, npm run test:replit, npm run build:pages, npm run test:e2e, npm audit --omit=dev --audit-level=high, and git diff --check. All must be RC0.

- [ ] Step 3: Verify public URL independently

Reviewer runs REPLIT_PUBLIC_URL=<actual-url> npm run smoke:replit from a fresh process and records raw output. Reviewer confirms the HTML, JS, CSS, bundled fonts, Watch, COMPARE, FOCUS, zero console errors, zero failed requests, and zero unexpected external requests.

- [ ] Step 4: Verify source attribution and safety

Reviewer confirms:

- park-web-demo-v4.1 dirty paths are unchanged from the preflight receipt;
- no password, API key, token, or personal data appears in tracked files or publication evidence;
- no src/** product files changed in the Replit branch;
- published SHA equals the reviewed GitHub SHA;
- the public access mode is anonymous and intentional.

- [ ] Step 5: Issue the verdict

Only the independent reviewer may issue PASS or REMAND. The implementation report must stop at READY_FOR_INDEPENDENT_REVIEW if any live evidence is missing.

