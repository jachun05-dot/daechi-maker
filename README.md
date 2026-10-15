# 이화(梨花)에 지는 달 : 대치동 환생록

현대 대치동 육성 시뮬레이션 + 임진왜란 전생 비주얼 노벨.

**스택**: React 19 · TypeScript · Vite 6 · PixiJS 8(파티클) · Zustand(상태) · Capacitor 7(앱 패키징) · Vitest(테스트)

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm install` | 처음 한 번 |
| `npm run dev` | 개발 서버. 파일을 저장하면 바로 반영 (휴대폰에서도 같은 와이파이로 접속 가능) |
| `npm test` | **스토리·스케줄 오타 검사** + 문법 테스트. 내용을 고친 뒤 꼭 돌리세요 |
| `npm run images` | 넣어야 할 이미지 목록과 이미 넣은 이미지 확인 |
| `npm run build` | `dist/` 생성 (앱 패키징용) |
| `npm run build:single` | `dist-single/index.html` 한 파일 생성 (링크 공유용) |
| `npm run cap:android` / `cap:ios` | 빌드 → 네이티브 프로젝트 동기화 → Android Studio / Xcode 열기 (처음엔 `npx cap add android` 먼저) |

## 무엇을 어디서 고치나

```
src/
├─ config/balance.ts         ← 모든 수치 (시작 스탯, 용돈, 확률, 엔딩 조건, 시험 기준…)
├─ content/                  ← 게임 데이터
│  ├─ characters.ts          인물 이름·설정·색
│  ├─ routes.ts              진로 4종, 새 게임 질문 3개
│  ├─ schedule.ts            주간 5슬롯 일정 (효과·장소·만나는 인물·로그 문장)
│  ├─ calendar.ts            학사 일정 (몇 월에 무슨 이벤트)
│  ├─ phone.ts               메신저 메시지
│  ├─ backgrounds.ts         배경 목록
│  ├─ endings.ts             엔딩 컬렉션 목록
│  └─ stories/               ← 모든 대사 (.story 텍스트 파일)
│     ├─ prologue.story
│     ├─ encounters/{인물}.story   낮 조우 (호감도 단계별)
│     ├─ dreams/{인물}.story       밤 전생 기억 (해금 조건은 머리말에)
│     ├─ events/*.story            시험·축제·위기·사야 출국
│     └─ endings/*.story           엔딩
├─ assets/images/            ← 이미지 넣는 곳 (아래 규칙)
├─ engine/                   게임 진행 로직 (평소엔 손댈 필요 없음)
├─ ui/                       화면 컴포넌트
└─ styles/tokens.css         ← 색·글꼴 (낮/밤 테마)
```

- **대사·장면 수정**: `src/content/stories/` 의 `.story` 파일. 문법은 [docs/STORY_GUIDE.md](docs/STORY_GUIDE.md)
- **밸런스 수정**: `src/config/balance.ts` 한 파일
- **디자인 수정**: 색·글꼴은 `src/styles/tokens.css`, 화면별 스타일은 `src/styles/*.css`
- 스토리 파일에 문법 오류가 있으면 게임 화면에 **파일 이름과 줄 번호**가 표시됩니다.

## 이미지 넣기

`src/assets/images/` 아래에 **정해진 이름으로 파일만 넣으면** 코드 수정 없이 화면에 나옵니다.
확장자는 png / jpg / webp 등 아무거나 됩니다. 비어 있는 칸은 게임 안에 파일 이름이 점선으로 표시됩니다(시스템 탭에서 끌 수 있음).

| 경로 | 용도 |
|---|---|
| `chars/{인물id}/default.png` | 스탠딩 기본 (인물 id: ian, mujin, sihyun, seoha, taejun, saya) |
| `chars/{인물id}/{표정}.png` | 표정 차분 — 스토리에서 `ian(smile)| 대사` 로 사용 |
| `chars/{인물id}/past_default.png` | 밤(전생) 스탠딩. `past_{표정}` 도 가능. 없으면 현생 이미지 사용 |
| `chars/{인물id}/avatar.png` | 프로필·메신저 아이콘 |
| `bg/{배경key}.jpg` | 배경 (key 목록은 `src/content/backgrounds.ts`) |
| `cg/{장면id}.jpg` | 이벤트 CG — 스토리에서 `[cg 이름]`, 도감 카드는 `cg/ian1` 처럼 꿈 id |
| `schedule/{일정id}.png` | 스케줄 아이콘 |
| `ui/title.jpg` | 타이틀 배경 |

`npm run images` 로 빠진 이미지를 확인하세요.
