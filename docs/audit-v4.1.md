# UIAdapt v4.1 production dependency audit

이 문서는 v4.1 remediation branch에서 실행한 production dependency audit의 원시 결과를 보존합니다. `npm audit fix`는 실행하지 않았습니다.

## 명령 및 결과

```text
Command: npm audit --omit=dev --audit-level=high
Exit code: 0
Output: found 0 vulnerabilities
Packages audited: 241 (npm ci installed 240 packages)
Run window: 2026-08-20T06:51:53.1528917+09:00–2026-08-20T06:51:54.0757764+09:00
```

`--omit=dev` 결과는 production dependency release gate로 사용했습니다. 개발 의존성을 포함한 전체 audit 결과도 같은 명령 실행에서 확인했으며, npm은 알려진 취약점 0건을 보고했습니다. lockfile을 자동 수정하는 `npm audit fix`는 실행하지 않았습니다.

## 해석 및 한계

- 현재 프로젝트는 정적 Vite 산출물이며 runtime backend, analytics, 외부 API가 없습니다.
- 이 결과는 audit 실행 시점의 `package-lock.json`에 대한 결과입니다. dependency 변경 후에는 같은 명령을 다시 실행해야 합니다.
- GitHub Actions에서도 동일한 production audit 명령을 실행하도록 `.github/workflows/verify.yml`에 고정했습니다.

## 최종 close-out 재실행

문서와 CI artifact 단계가 작업 트리에 존재하는 상태에서 다시 실행한 최종 audit도 RC 0이며 출력은 `found 0 vulnerabilities`입니다. `npm audit fix`는 실행하지 않았습니다.
