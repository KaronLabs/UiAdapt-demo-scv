# 형님께서 클라이언트에서 확인해 주실 인수 검증 체크리스트

R8은 자동 rollback되어 공개되지 않았습니다. 따라서 R8 기능 인수는 수행할 수 없습니다. 현재는 R3 연속성만 확인하십시오.

| 확인 부분 | 테스트 방법 | 기대 정상 결과 |
|---|---|---|
| 공개 접속 | 공개 URL 접속 | HTTPS 인증창 표시 |
| 정상 인증 | 기존 reviewer credential 입력 | 기존 R3 UIAdapt 화면 표시 |
| Replay | 라이브 데모 실행 | EXPLORE → COMPARE → FOCUS |
| 서비스 연속성 | 새로고침 | 화면이 계속 정상 표시 |
| 알려진 R3 제한 | 개발자 도구 Console | favicon.ico 404 한 건만 허용 |

R8 favicon 정상 여부는 이번 배포가 rollback되었으므로 확인 대상이 아닙니다.