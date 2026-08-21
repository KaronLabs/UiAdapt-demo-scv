# Residual Risk Register

| Risk | Severity | Handling | Evidence |
|---|---|---|---|
| External Windows browser lacks a non-recording credential input channel | High | blocking; live switch not attempted | `raw/external-browser-secret-channel.no-go.json` |
| Browser dry-run error is summarized rather than preserved as native raw transcript | Medium | disclosed; not used as sole proof | `independent-verification.md` |
| R8 is not deployed | Expected terminal state | accepted for this NO_GO execution | remote current remains R3 |
| Product clarity test is not performed | Medium | `PRODUCT_CLARITY=NOT_VERIFIED` | execution plan |
| Phase 1 helper had three local failures | Low | append-only preserved; final archive independently verified | `raw/phase1-*failure*.json` |

