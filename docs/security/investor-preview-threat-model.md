# UIAdapt Investor Preview 위협 모델

## 1. 범위와 보호 자산

대상은 인증된 투자심사용 정적 preview입니다. 보호 자산은 다음입니다.

- `preview content`의 비공개성
- Basic Auth credential
- immutable `release integrity`와 `current` 선택
- gateway/static availability
- 로그의 credential 비노출

실제 결제, 개인정보, analytics, 데이터베이스와 production recommendation service는 존재하지 않습니다.

## 2. 행위자와 신뢰 경계

- 비인증 인터넷 사용자와 자동화된 credential 추측자
- credential을 받은 정상 reviewer
- nwg 운영자와 root 권한 관리자
- Tailscale/Funnel 외부 서비스

신뢰 경계는 정확히 다음입니다.

```text
Internet → Tailscale daemon TLS → loopback gateway → static service
```

Tailscale daemon이 public TLS를 종료하고 `127.0.0.1:4180` gateway로 전달합니다. gateway는 인증 후 고정 설정된 HTTP upstream `127.0.0.1:5173`으로 전달합니다. static service는 `current/www`만 제공합니다.

공식 참조:

- [Tailscale Funnel architecture and limits](https://tailscale.com/docs/features/tailscale-funnel)
- [Tailscale Funnel CLI](https://tailscale.com/docs/reference/tailscale-cli/funnel)
- [Node.js HTTP API](https://nodejs.org/api/http.html)
- [systemd execution credentials](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Credentials)

## 3. 소스에서 강제되는 통제

- gateway/static은 loopback에만 bind합니다.
- password가 없거나 credential file이 없고, 비었거나, 읽을 수 없으면 gateway는 fail-closed합니다.
- credential file이 지정되면 environment password로 fallback하지 않습니다.
- SHA-256 digest와 `timingSafeEqual`로 credential을 비교합니다.
- 무인증/오인증 요청과 WebSocket upgrade는 upstream 접촉 전에 거부합니다.
- absolute-form 및 scheme-relative request target도 configured upstream origin에 고정합니다.
- upstream 전달 전 `Authorization` header만 명시적으로 제거합니다.
- malformed HTTP/WebSocket target은 거부하고 gateway는 계속 동작합니다.
- credential은 `root:root` `0600` source에서 systemd `LoadCredential`로 전달합니다.
- units는 `NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=strict`, `ProtectHome=true`를 적용합니다.
- immutable `releases/<SHA>`와 원자적 `current` symlink가 release integrity와 rollback 경계를 제공합니다.

## 4. 운영 통제

- Basic Auth는 Tailscale Funnel TLS 뒤에서만 공개합니다.
- Funnel 정책, public certificate, bandwidth 및 ingress availability는 Tailscale 운영 경계입니다.
- source/archive/remote manifest hash와 `current` target을 배포마다 대조합니다.
- readiness, authentication, public smoke가 모두 통과하기 전에 기존 release를 제거하지 않습니다.
- credential rotation은 root 소유 파일 원자 교체, gateway restart, 음성·양성 인증 검증으로 수행합니다.
- journal과 배포 증거에는 credential 값이나 credential hash를 기록하지 않습니다.

## 5. 명시적으로 존재하지 않는 통제

다음은 취약점 확정 진술이 아니라 현재 코드와 unit에 없는 hardening 경계입니다.

- gateway에는 `no application-layer rate limiter`가 없습니다. brute-force 완화는 강한 credential, 제한된 공유, rotation과 외부 ingress 통제에 의존합니다.
- gateway에는 `no explicit hop-by-hop header filtering`이 없습니다. 명시적으로 제거하는 값은 `Authorization`입니다.
- gateway에는 `no explicitly pinned upstream idle timeout`이 없습니다.
- gateway에는 `no explicitly pinned WebSocket idle timeout`이 없습니다.
- Node HTTP의 기본 timeout 동작은 runtime version에 의존하며 repository가 별도 request/header/body limit를 고정하지 않습니다.
- service user는 전용 계정이 아니라 비교적 broad한 `ubuntu`입니다. systemd hardening은 적용되어도 사용자 권한 범위는 그대로입니다.
- 애플리케이션은 Funnel relay, certificate issuance, DDoS protection 또는 host firewall을 검증하지 않습니다.

## 6. 위협별 판정

| 위협 | 현재 방어 | 잔존 위험 / 처리 |
|---|---|---|
| credential 누락·오설정 | startup fail-closed | 배포 전 음성·양성 인증 검사 |
| credential 노출 | LoadCredential, loopback upstream, Authorization stripping | 공유 범위 최소화, rotation, 로그 비노출 검사 |
| brute-force | TLS와 Basic Auth | 앱 rate limit 없음; 강한 credential·외부 통제 필요 |
| request-target SSRF | URL을 configured upstream origin에 재구성 | upstream 설정 변경은 운영자 신뢰 경계 |
| WebSocket 인증 우회 | upgrade 전 동일 인증 | idle timeout 미고정 |
| release 변조 | SHA release, manifest/hash, current symlink | 호스트 root는 신뢰 대상 |
| 서비스 중단 | systemd restart, 이전 release rollback | Funnel·host·timeout·rate-limit 잔존 위험 |
| 로그 secret 유출 | 코드가 secret을 출력하지 않으며 tests가 failure output 검사 | 외부 운영 명령과 journal 접근통제 필요 |

## 7. Accepted risks와 backlog

- 현재 공유 credential 강도와 app rate limiter 부재는 단기 감사 preview의 accepted risk입니다. 외부 감사 후 credential을 rotate합니다.
- 전용 `uiadapt` service account 전환은 별도 hardening backlog입니다.
- hop-by-hop header allowlist/denylist와 request, header, body, upstream 및 WebSocket timeout의 명시적 고정은 별도 검토 후 구현합니다.
- Funnel beta와 bandwidth limit, host reboot 미검증, 제품 명확성 미검증을 운영 보고서에 계속 공개합니다.
- 이 문서는 현재 통제를 기술할 뿐, 침투시험·보안 인증 또는 무취약성을 주장하지 않습니다.
