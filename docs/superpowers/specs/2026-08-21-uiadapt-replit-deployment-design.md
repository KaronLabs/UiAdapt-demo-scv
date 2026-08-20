# UIAdapt Replit Static Deployment Design

**Date:** 2026-08-21  
**Repository:** `git@github-karonlabs:KaronLabs/UiAdapt-demo-scv.git`  
**Source baseline:** `02a8df57e8b10fa1094b6b2a5ca5fe19bf031a22` (`fix/uiadapt-v4.1-product-contract`)  
**Implementation branch:** `codex/replit-deployment`  
**Status:** Approved for implementation

## 1. Decision

Publish UIAdapt as an anonymous Replit Static Deployment. The public URL is the Replit-provided `https://<subdomain>.replit.app/` URL unless a later, explicit custom-domain request is made.

The Replit deployment is a publication target for the GitHub source. It is not a second source of truth and it must not change the product catalog, runtime reducer, replay policy, or UI behavior. The existing unfinished `nwg` worktree remains untouched and is not an input to this branch.

## 2. Scope

### In scope

- A clean worktree created from the source baseline above.
- Replit-specific build/public-directory configuration for a root-hosted static SPA.
- A deterministic local contract proving the Replit build emits `dist/index.html`, root-relative asset URLs, and all referenced files.
- Documentation of the exact branch, source SHA, build command, public directory, and publish evidence.
- GitHub publication of the implementation branch after local verification.
- Codex Replit MCP setup using the official Streamable HTTP endpoint and OAuth.
- Replit private GitHub import, branch/SHA confirmation, Static Deployment publish, and anonymous public smoke verification.
- Separate ChatGPT Replit OAuth connection when the user’s ChatGPT settings surface is available.

### Out of scope

- Any edit, commit, reset, stash, clean, or deployment action in `park-web-demo-v4.1`.
- nwg, systemd, Tailscale Funnel, Windows Funnel, Cloudflare, nginx, or custom-domain migration.
- Basic Auth or any application password. The selected Replit contract is intentionally public and anonymous.
- Replit Agent rewriting source files or inventing a new application.
- Backend, database, analytics, user accounts, payment, secrets, or server-side API routes.
- Claims about availability, cost, cold-start latency, or production SLA.

## 3. Source-backed facts and assumptions

### Confirmed

- The clean product baseline is `02a8df57...` on the remote `fix/uiadapt-v4.1-product-contract` branch.
- The implementation worktree is `E:\03_AllWork\uiadapt-replit-deploy` on `codex/replit-deployment`.
- `vite.config.ts` uses `/uiadapt_demo/` as the normal nested deployment base.
- `package.json` already provides `build:pages`, which builds with root `/` assets.
- The app is a client-only Vite React SPA with no backend route or runtime API dependency.
- Baseline lint, unit/component, gateway, root build, nested-path E2E, production audit, and diff-check completed successfully before implementation.
- Replit official documentation supports private GitHub guided import and Static Deployment for browser-rendered sites.
- Replit official MCP endpoint is `https://replit-mcp.com/server/mcp` with OAuth.

### Uncertain until live verification

- Whether the user’s Replit GitHub OAuth connection can see the private organization repository.
- Whether the guided import UI exposes branch selection directly. If not, the imported workspace must switch branches in Replit’s Git pane before publishing.
- The exact generated Replit subdomain.
- Whether the user’s Replit plan exposes Static Deployment without a payment prompt.
- Whether the ChatGPT Replit connector is enabled for the current account and region.

### Safe defaults

- Use `npm run build:pages` for Replit Static Deployment because Replit serves the published directory at `/`, while the normal product build targets `/uiadapt_demo/`.
- Use `dist` as the Static Deployment public directory.
- Do not add runtime secrets because the app is anonymous and client-only.
- Treat any source SHA mismatch, asset 404, failed request, console error, or unexpected source modification as a publish failure.

## 4. Architecture and data flow

```text
GitHub branch codex/replit-deployment
        │ exact source SHA
        ▼
Replit guided private-repository import
        │ verify branch + SHA before publish
        ▼
npm run build:pages  ──► dist/
        │ verify index.html + root asset references
        ▼
Replit Static Deployment (public directory dist)
        │ anonymous HTTPS URL
        ▼
Independent browser smoke
```

Replit’s managed publisher owns HTTPS, CDN, and public URL routing. The application owns only static files. No password gateway is inserted into this path.

## 5. Contract boundaries

### Build contract

- `npm run build:pages` exits 0.
- `dist/index.html` exists.
- All script, stylesheet, font, and module-preload references in `dist/index.html` are root-relative or absolute URLs valid from the published root.
- Every referenced local asset exists under `dist` and is not an HTML fallback.
- No source file under `src/` is changed solely to make Replit publish.

### Product contract

- Existing product data, state transitions, replay, Adaptive ON/OFF semantics, accessibility, and responsive behavior remain covered by the existing 17 unit/component tests and 36 Playwright tests.
- Replit-specific tests must not replace or weaken those tests.

### Public smoke contract

Given `REPLIT_PUBLIC_URL`:

- `GET /` returns 200 HTML.
- All local JS, CSS, and bundled font requests return 2xx with non-HTML MIME types where applicable.
- No failed request, asset 404, or browser console error occurs.
- `Watch UIAdapt` starts the replay.
- The canonical replay reaches COMPARE and FOCUS.
- The smoke report records URL, source SHA evidence, timestamp, viewport, request failures, console errors, and result.

The smoke command is opt-in and must fail closed when `REPLIT_PUBLIC_URL` is absent; local tests must never pretend to verify the public deployment.

## 6. Failure handling

- If Replit cannot access the private GitHub repository, stop before importing a ZIP or manually copying files. Report the OAuth/organization access blocker.
- If Replit imports the wrong branch or SHA, stop publication and correct the branch selection. Do not publish an unverified snapshot.
- If root asset paths are wrong, fix only the Replit build contract and repeat the RED→GREEN cycle.
- If Static Deployment cannot serve the client-only app, stop and report the platform limitation; do not silently switch to Autoscale.
- If public smoke fails after publishing, preserve the Replit deployment evidence, unpublish or leave it unpublished as appropriate, and do not claim readiness.
- No live `uiadapt.com`, nwg, or existing Funnel endpoint is modified by this design.

## 7. Security and privacy

- No password, API key, token, analytics identifier, or personal data is added to source, Replit configuration, or public HTML.
- GitHub OAuth and Replit OAuth permissions are reviewed on their consent screens; credentials are never pasted into source or command lines.
- The app remains anonymous and contains only demo data.
- Public URL means anyone with the URL can view the demo. This is intentional and must be stated in the final report.

## 8. Evidence and completion

The implementation must produce:

- baseline command log with exit codes and timestamps;
- RED test output showing the missing Replit contract;
- GREEN test output after the minimal configuration;
- final source SHA and changed-path list;
- build output and asset manifest evidence;
- Replit MCP/OAuth connection status evidence without tokens;
- Replit import branch/SHA evidence;
- public URL smoke output and screenshot paths;
- independent reviewer verdict.

The implementation agent stops at `READY_FOR_INDEPENDENT_REVIEW`. Only the separate reviewer may grant a final publication PASS.

## 9. Product clarity and future work

This deployment does not add the 30-second human product-clarity test. If performed later, it must be reported as `VERIFIED` or `NOT_VERIFIED`; it must never be simulated. Password protection, custom domain, and server-side authentication remain separate future decisions.

