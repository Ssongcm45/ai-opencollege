# 프로덕션 빌드

```sh
npm run build
npm run start
```

일반 파일시스템에서는 기존 Next.js 빌드를 그대로 실행한다. Windows exFAT처럼 일반 파일의 `readlink`가 `EISDIR`를 반환하는 환경에서는 빌드 스크립트가 운영체제 임시 폴더에 소스와 의존성을 복사하고 Webpack으로 빌드한다. 성공한 결과를 프로젝트의 `.next`로 가져오므로 서버는 원래 프로젝트에서 실행한다. 임시 폴더는 정상적인 파일 링크 조회를 지원하는 볼륨에 있어야 한다. 원본 의존성이나 디스크 포맷은 변경하지 않는다.

D: 드라이브에서 발생한 오류는 다음 두 가지였다.

- Turbopack: `sharp` 의존성용 junction 생성 실패.
- Webpack: 일반 파일 `app/icon.png`의 `readlink`가 `EISDIR`로 실패.

실제 볼륨 조회 결과 D:는 exFAT였고, `package.json` 등 다른 일반 파일에서도 같은 오류를 재현했다. Next.js 저장소에도 [exFAT에서 발생한 동일 오류 사례](https://github.com/vercel/next.js/discussions/77912)가 있다.

환경변수는 원래 프로젝트에서 Next.js 규칙으로 불러와 빌드 프로세스에 전달한다. `.env` 파일 자체는 임시 폴더로 복사하지 않는다. 다만 `NEXT_PUBLIC_*` 변수는 일반 Next.js 빌드와 동일하게 클라이언트 결과물에 포함될 수 있다.

## 로컬 검증

운영 DB에 연결하지 않고 기본 콘텐츠로 빌드를 검증하려면 PowerShell에서 다음과 같이 실행한다.

```powershell
$env:DATABASE_URL=''
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd run build
npm.cmd run test:build
npm.cmd run typecheck
npm.cmd run test:auth
```

`test:build`는 프로젝트의 `.next`로 로컬 프로덕션 서버를 띄우고 공개 페이지, 이미지, JavaScript 파일, 관리자 접근 차단을 확인한 뒤 서버를 종료한다. DB 연결은 비활성화한다. 이 검증은 실제 DB·메일·업로드 서비스와 연결하는 배포 검증을 대신하지 않는다. 배포용 콘텐츠를 생성할 때는 위 명령의 빈 `DATABASE_URL` 설정을 제거하고 실제 배포 환경에서 다시 빌드한다.

2026-09-25에 exFAT인 D:에서 위 빌드와 실행 검증이 모두 종료 코드 0으로 완료됐다. 정적 페이지 25개를 생성했고, 원래 프로젝트 위치에서 목록·상세 화면, 이미지, JavaScript 파일 응답과 관리자 비로그인 접근 차단을 확인했다.

## 운영 DB 연결 검증

`.env.local` 또는 배포 환경의 실제 DB 설정을 사용하는 새 터미널에서 실행한다. 앞서 `DATABASE_URL`을 빈 값으로 덮어썼다면 해당 프로세스 환경변수를 먼저 해제해야 환경 파일의 값이 적용된다.

```powershell
npm.cmd run db:check
npm.cmd run build
npm.cmd run test:live
npm.cmd run start -- --hostname 127.0.0.1 --port 3900
```

- `db:check`: 실제 DB 연결, 테이블·컬럼·타입, 공개 콘텐츠 개수와 관리자 설정 상태를 확인한다. 개인정보나 접속 비밀은 출력하지 않는다.
- `test:live`: 실제 공개 콘텐츠를 조회해 페이지 응답과 대조한다. 메모리에서만 사용하는 5분 유효 테스트 세션으로 관리자 페이지의 GET 응답도 확인한다. 기존 관리자 비밀번호나 세션 버전을 변경하지 않으며, 로그인 감사 기록·문의·진단 응답을 생성하거나 이메일을 발송하지 않는다.
- 마지막 `start` 명령은 운영 DB를 사용하는 로컬 프로덕션 서버를 실행한다. 공개 호스팅 서비스에 배포하는 명령은 아니다.

2026-09-25에 실제 DB 설정으로 `db:check`, `build`, `test:live`가 모두 통과했다. 필요한 테이블 12개를 확인했고, 실제 게시 콘텐츠와 인증된 관리자 화면 9개가 정상 응답했다. 이후 3900 포트의 백그라운드 서버를 실행해 홈과 관리자 로그인 화면을 다시 확인했다. 현재 실행의 PID 기록은 `.next/prod3900.pid`, 로그는 `prod3900.log`·`prod3900.err.log`에 저장한다.
