# UIAdapt v4.1 Replit Static Deployment

## Fixed publication settings

| Setting | Value |
|---|---|
| Source repository | `KaronLabs/UiAdapt-demo-scv` |
| Branch | `codex/replit-deployment` |
| Build command | `npm run build:replit` |
| Public directory | `dist` |
| Deployment type | Static |
| Access | anonymous public |
| Secrets | none |

Replit is a publication target. GitHub remains the source of truth. Do not let Replit Agent rewrite the application, add a backend, or add runtime secrets.

## Import and publish procedure

1. Open `https://replit.com/import` and select the private GitHub repository above.
2. Select or switch to `codex/replit-deployment`.
3. In the Replit Shell, run `git branch --show-current`, `git rev-parse HEAD`, `npm ci`, and `npm run test:replit`.
4. Stop if branch, SHA, install, or artifact verification differs from the reviewed GitHub source.
5. In Publish settings, select Static, set the build command and public directory exactly as listed above, and keep access anonymous/public.
6. Publish once, then run `npm run smoke:replit` from a fresh local process with only `REPLIT_PUBLIC_URL` set.

## Live publication receipt

- Replit app URL: `PENDING_LIVE_PUBLISH`
- Publish timestamp: `PENDING_LIVE_PUBLISH`
- Imported SHA: `PENDING_LIVE_PUBLISH`
- Public smoke evidence path: `PENDING_LIVE_PUBLISH`

These placeholders are not proof of a live deployment. They may be replaced only with values captured from the actual publication and independent smoke verification.

## Public smoke

```powershell
$env:REPLIT_PUBLIC_URL='https://<actual-subdomain>.replit.app/'
npm run smoke:replit
Remove-Item Env:REPLIT_PUBLIC_URL
```

The smoke fails closed when the variable is absent, rejects non-HTTPS URLs, and checks the document, local assets, browser console, failed requests, unexpected external requests, `Watch UIAdapt`, COMPARE, and FOCUS. It does not establish an SLA or prove a future run will remain available.
