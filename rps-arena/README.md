# RPS ARENA

원형 가위바위보(RPS-3 ~ RPS-101). 봇과 하는 **SOLO**, 4자리 코드로 친구를 부르는 **ROOM**.
Cloudflare Workers(정적 파일 + API) + Durable Objects(방 하나 = 객체 하나, WebSocket)로 돌아갑니다.

## 규칙

N(홀수)개 항목이 원 위에 놓이고, `diff = (b - a + N) % N`가 `1..(N-1)/2`이면 a가 이깁니다.
모든 항목이 정확히 절반을 이기고 절반에 집니다. 한 라운드는 모든 1:1 조합을 겨루고, 이길 때마다 +1점.

## 모드

- **SOLO**: 봇 1–5명, 난이도 EASY / NORMAL / HARD, 라운드 3/5/7, 타이머 OFF/15/25/45초. 전부 브라우저에서 돌아감(서버 불필요).
- **ROOM**: `CREATE ROOM` → 코드(예: `K7X2`) 공유, 또는 `LINK`로 초대 링크(`/?room=K7X2`) 복사.
  - 방장이 변형·라운드·타이머를 정하고 빈자리에 봇을 채움(최대 6명, 시작은 2명부터)
  - 픽은 서버가 들고 있다가 공개 단계에서만 보냄 → 남의 선택을 미리 볼 수 없음
  - 타이머가 끝나면 안 고른 사람은 무작위로 자동 선택(`AUTO` 표시)
  - 다음 라운드는 접속 중인 모든 사람이 NEXT를 눌러야 진행
  - 새로고침·잠깐 끊김: 같은 브라우저면 자리를 그대로 되찾음. 방장이 나가면 다음 사람이 방장
  - 아무도 없는 방은 10분 뒤 자동 삭제

### 봇 난이도

| 레벨 | 동작 |
| --- | --- |
| EASY | 완전 무작위 |
| NORMAL | 절반은 무작위, 절반은 상대 성향을 느슨하게 읽음 |
| HARD | 각 상대의 지난 픽(최근일수록 가중)으로 다음 픽 분포를 추정 → 가장 많이 이길 항목을 확률적으로 선택 |

## 구조

```
src/
  shared/            클라이언트와 서버가 같이 쓰는 순수 로직
    variants.ts      6개 변형 데이터(RPS-101 목록, 이모지, 카테고리)
    judge.ts         O(1) 판정, 이기는/지는 목록, 클래시 문구
    engine.ts        게임 상태 머신(라운드·점수·자동 픽) + 봇 AI
    protocol.ts      GameView(화면용 상태, 픽 숨김) + WebSocket 메시지 타입
  worker/
    index.ts         POST /api/rooms(코드 발급), GET /api/rooms/:code/ws
    room.ts          Room Durable Object: 상태 저장, 타이머(alarm), 봇, 브로드캐스트
  client/
    main.ts          부팅, 이벤트 연결, 단계 전환
    session.ts       SoloSession(브라우저 안 엔진) / RoomSession(WebSocket) — 같은 인터페이스
    store.ts         앱 상태 + UI 상태
    dom.ts           $, esc, toast, 복사, 옵션 버튼 그리드
    styles.css       Tailwind v4 테마 + 리소 스타일·애니메이션
    screens/         lobby · room · pick · reveal · podium · ring · nav
index.html           마크업(원본 디자인 유지)
scripts/engine-test.ts  엔진 검사(npm test)
```

## 개발

```bash
npm install
```

```bash
npm run dev:worker   # 터미널 1: Worker + Durable Object (localhost:8787)
```

```bash
npm run dev          # 터미널 2: Vite (localhost:5173), /api는 8787로 프록시
```

SOLO만 볼 거면 `npm run dev` 하나로 충분합니다. 빌드 결과물로 실제 배포와 같은 환경을 보려면 `npm run preview`(빌드 후 `wrangler dev`, localhost:8787).

```bash
npm test             # 엔진 검사
npm run typecheck
```

## Cloudflare 배포

```bash
npx wrangler login
```

```bash
npm run deploy       # vite build → wrangler deploy
```

처음 배포하면 `https://rps-arena.<계정>.workers.dev`에 올라갑니다. Durable Objects는 SQLite 저장소(`new_sqlite_classes`)를 써서 무료 플랜에서도 동작합니다.
커스텀 도메인은 Cloudflare 대시보드 → Workers → rps-arena → Settings → Domains & Routes에서 연결하세요.

GitHub에 push할 때 자동 배포하려면 대시보드에서 Workers Builds로 이 저장소를 연결하고 루트 디렉터리를 `rps-arena`, 빌드 명령을 `npm run build`, 배포 명령을 `npx wrangler deploy`로 지정하면 됩니다.

## 원본(RPS_ARENA.html)에서 바뀐 점

- 한 파일(2,287줄)을 위 구조로 분리. Tailwind CDN(운영용 아님) → 빌드 타임 Tailwind v4
- 방 코드가 가짜(무작위 문자열)였던 것 → 실제 멀티플레이 방
- 봇이 항상 무작위였던 것 → 난이도 3단계
- 타이머가 0이 돼도 아무 일 없던 것 → 시간 초과 시 자동 선택(OFF로 끌 수 있음)
- 휴대폰 폭에서 상단 바 글자가 겹치던 것 수정
