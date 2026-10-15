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

기획 문서: [docs/CHARACTERS.md](docs/CHARACTERS.md) (캐릭터) · [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (게임 디자인)

```
src/
├─ config/balance.ts         ← 모든 수치 (성장 배율, 체력, 시험·진로 기준, 엔딩 조건…)
├─ content/                  ← 게임 데이터
│  ├─ characters.ts          인물 이름·설정·색·마지막 선택 문구
│  ├─ careers.ts             진로 4종, 기초 능력·특기·집중 과목 이름, 전생의 꿈
│  ├─ timetable.ts           평일 시간표 일정(방과후·야간)과 동아리
│  ├─ places.ts              주말 서울 지도 13곳
│  ├─ presence.ts            인물이 주말에 자주 있는 곳 (학년별) · 학교에서 마주치는 인물
│  ├─ vacation.ts            방학 특강
│  ├─ calendar.ts            학사 일정 (몇 월에 무슨 이벤트)
│  ├─ phone.ts               메신저 메시지
│  ├─ backgrounds.ts         배경 목록
│  ├─ endings.ts             엔딩 컬렉션 목록
│  └─ stories/               ← 모든 대사 (.story 텍스트 파일)
│     ├─ prologue.story            프롤로그 · 엔딩 직전 손의 장면
│     ├─ basic/                    기본 이벤트 (짧은 만남)
│     ├─ main/                     인물 메인 이벤트 (스토리)
│     ├─ vacation/                 방학 이벤트 (여름 3 · 겨울 2단계)
│     ├─ dreams/                   밤 — 전생의 기억
│     ├─ events/                   학사 이벤트 · 위기 · 방학 진행
│     └─ endings/                  커리어 · 진/노멀/차인 · 이현 · 히든
├─ assets/images/            ← 이미지 넣는 곳 (아래 규칙)
├─ engine/                   게임 진행 로직 (month.ts = 한 달 흐름)
├─ ui/                       화면 컴포넌트
└─ styles/tokens.css         ← 색·글꼴 (낮/밤 테마)
docs/legacy-stories/         예전 버전 대사 (참고용, 게임에서 읽지 않음)
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
| `chars/{인물id}/default.png` | 스탠딩 기본 (인물 id: ian, mujin, doyun, taejun, seoha, ihyun, sihyun) |
| `chars/{인물id}/{표정}.png` | 표정 차분 — 스토리에서 `ian(smile)| 대사` 로 사용 |
| `chars/{인물id}/past_default.png` | 밤(전생) 스탠딩. `past_{표정}` 도 가능. 없으면 현생 이미지 사용 |
| `chars/{인물id}/avatar.png` | 프로필·메신저 아이콘 |
| `bg/{배경key}.jpg` | 배경 (key 목록은 `src/content/backgrounds.ts`) |
| `cg/{장면id}.jpg` | 이벤트 CG — 스토리에서 `[cg 이름]`, 도감 카드는 `cg/ian1` 처럼 꿈 id |
| `schedule/{일정id}.png` | 시간표 일정 아이콘 |
| `ui/map.png` | 주말 서울 지도 (4:5 비율). 핀 위치는 `content/places.ts` 의 `pos` 로 맞춘다. 없으면 기본 그림 지도 |
| `ui/title.jpg` | 타이틀 배경 |

`npm run images` 로 빠진 이미지를 확인하세요.
