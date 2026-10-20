# 구조와 확장 가이드

"무엇을 바꾸려면 어디를 고치나"를 모은 문서입니다. 숫자는 `config/`, 글은 `.story`, 설정 데이터는 `content/`, 규칙은 `engine/` 에 있고 화면(`ui/`)은 상태를 그리기만 합니다.

## 한눈에 보기

```
config/        game.ts (전생 시대 선택) · balance.ts (모든 수치)
content/       데이터 — 인물·진로·장소·시간표·메신저 설정·배경·엔딩 목록
  stories/       현생(대치동) 대사 .story
  eras/{시대}/   전생 시대 팩 — 전생 이름·역할, 전생의 꿈, 밤 배경, 크레딧 문구
    stories/       프롤로그(죽음의 순간 · 손의 장면) · 전생 꿈 dreams/
engine/        규칙
  month.ts       한 달 흐름 (달 시작 → 평일·주말 × 4주 → 월말 → 꿈 → 다음 달)
  weekday.ts     평일 5일 자동 진행 (weekdayStep = 하루 계산, 예측과 공유)
  forecast.ts    시간표 한 달 예측 · 추천 4종 · 이달의 목표
  progress.ts    정수 성장 표시(스냅샷 비교) · 이정표(등급·특기·새 일정) · 이달의 기록
  report.ts      월말 성적표
  career.ts      커리어 엔딩 판정 (꿈 → 다른 길 → 아쉬운 → 웃픈 → 새내기)
  weekend.ts     주말 계획판 (약속·장소·날씨·이동비)
  people.ts      인물 메인 이벤트 · 짧은 만남 · 호감도 기록
  dreams.ts      밤의 꿈 고르기 · 재생
  crisis.ts      슬럼프 · 시현의 구조
  events.ts      월말 학사 이벤트 (시험·체육대회·축제·상담·수능)
  vacation.ts / finale.ts / newgame.ts
  phone.ts       메신저 (사건을 듣고 톡을 보냄, 읽씹·안읽씹, 먼저 연락하기)
  triggers.ts    사건 목록 + emit/onTrigger
  state.ts       게임 상태 · 호감도 규칙
  save/          세이브 (index.ts 슬롯·백업 · migrate.ts 버전 변환·정리 · ids.ts 세이브에 들어가는 id)
  story/         .story 해석기 · 재생기 · 장면 사전(library.ts)
store/ui.ts    엔진 ↔ 화면 다리 (await ui.playScene(...) 처럼 화면이 끝나길 기다림)
ui/            React 화면
platform/      웹과 앱이 다른 부분 — storage.ts (저장 위치) · native.ts (뒤로 가기 등)
```

### 흐름

1. 엔진이 `game.state` 를 직접 고치고 `refresh()` 를 부르면 화면이 다시 그려집니다.
2. 장면·선택지·지도처럼 플레이어의 입력이 필요한 곳은 `await ui.…()` 로 기다립니다.
3. "무슨 일이 있었다"는 `emit(st, '사건 키')` 로 알립니다. 메신저는 `onTrigger` 로 듣고, 그 사건을 기다리는 톡(`chat.*` 의 `on=`)을 보냅니다. 엔진은 메신저를 몰라도 됩니다.

## 전생 시대 바꾸기 (예: 구한말)

현생 쪽은 그대로 두고 **전생 시대 팩 하나를 새로 만들어** 갈아 끼웁니다.

1. `src/content/eras/joseon/` 폴더를 복사해 `src/content/eras/gubanmal/` 로 만듭니다.
2. `gubanmal/index.ts` — `id: 'gubanmal'`, 이름·시기·크레딧 문구, 인물별 전생 이름(`past`)·역할·설명, 진로별 전생(의녀 → 간호부 등), 밤 배경 목록을 고칩니다.
3. `gubanmal/stories/` — `prologue.story` 와 `dreams/*.story` 를 새 시대로 다시 씁니다.
   **장면 id 는 그대로** 둡니다 (`prologue`, `prologue.hand`, `ian1`, `self2` …). 메신저(`on=dream:ian1`)와 도감이 id 로 부르기 때문입니다. 내용·제목·조건은 자유.
4. `src/content/eras/index.ts` 의 `ERAS` 에 `gubanmal` 을 추가합니다.
5. 그림은 `src/assets/images/eras/gubanmal/` 아래에 같은 구조(`bg/` `cg/` `ui/title.jpg`)로 넣으면 공용 그림보다 우선합니다.
6. `npm test` — 시대 팩마다 빠진 장면·꿈 id·인물 설정·배경을 검사합니다.

고르는 법:
- 기본값은 `src/config/game.ts` 의 `GAME.era`.
- 비교할 때는 주소 뒤에 `?era=gubanmal` 을 붙이거나, 팩이 둘 이상이면 시스템 탭 → 설정 → 「전생 시대」에서 바꿉니다 (기기에 기억됨).
- 세이브에는 시작한 시대가 기록되어, 다른 시대에서 불러오면 알려 줍니다.

**공용 대사 중 시대 이야기가 섞인 곳**: 시대 팩 `stories/` 에 **같은 id 의 장면**을 넣으면 그 시대에서만 그 장면으로 바뀝니다 (시대 쪽이 이김). 지금 확인할 곳:
- `main.ian.2` (stories/main/ian.story) — 「피란길 그림」
- `career.actor` (stories/endings/career.story) — 데뷔작이 임진왜란 이야기
- `prologue.hand` 의 "사백 년 전" 같은 숫자 (시대 팩 안이라 함께 고치면 됨)

## 자주 하는 확장

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 대사 고치기 · 장면 추가 | `content/stories/**/*.story` — 문법은 [STORY_GUIDE.md](STORY_GUIDE.md) |
| 인물 메인 이벤트 추가 | `main/*.story` 에 `=== main.{인물}.{다음 번호} aff= place=` |
| 전생 꿈 추가 | 시대 팩 `stories/dreams/` 에 장면 (모든 시대 팩에 같은 id 로) |
| 톡 추가 | `stories/chat/{방}.story` 에 `=== chat.{방}.{이름} on=사건` |
| 새 사건(톡 트리거) | `engine/triggers.ts` 의 `TRIGGERS` 와 `Trigger` 에 한 줄 → 엔진에서 `emit(st, '키')` |
| 사건을 듣는 새 기능 (업적·SNS 등) | `onTrigger((st, key) => { … })` 를 새 모듈에서 등록 |
| 수치 조정 | `config/balance.ts` → `npm run sim` 으로 전략별 결과 확인 |
| 평일 일정 추가 | `content/timetable.ts` — `req` 로 잠금 조건, `lines` 로 생활 한 줄 → `content/rolls.ts` 에 갈래·대성공/실수 문장 (테스트가 빠진 것을 알려 줌) |
| 학교 사건 · 작은 선택 추가 | `content/dayEvents.ts` SCHOOL / CHOICES 에 한 덩어리 (`when` 으로 시기, `check` 로 판정, `skip`·`next` 로 선택의 대가) |
| 커리어 엔딩 추가 | `content/careerEndings.ts` 에 한 줄(req·max·need·hint) + `stories/endings/*.story` 에 `=== career.{key} ending={id}` → `tests/career.test.ts` SETUP 에 도달 조건 |
| 전생과 이어진 엔딩 | 시대 팩 `careerEndings` + 그 팩 `stories/endings_past.story` |
| 새 생활 기록 | `bump(st, '키')` (engine/progress.ts) → 엔딩 조건에서 `h.t('키')` |
| 장소 추가 | `content/places.ts` (지도 핀 `pos` 는 `ui/map.jpg` 기준 %) · 배경은 `content/backgrounds.ts` |
| 인물 추가 | `engine/types.ts` CharId → `content/characters.ts` → 모든 시대 팩 `chars` → `content/phone.ts` (HABIT·IGNORE) → `basic.` `main.` `vac.` `call.` 장면 (테스트가 빠진 것을 알려 줌) |
| 화면 | `ui/` 컴포넌트 · 색과 글꼴은 `styles/tokens.css` |
| 장면·장소·일정 id 바꾸기/지우기 | `content/renames.ts` 에 기록 (아래 「세이브와 업데이트」) |
| 세이브에 새 필드 | `engine/types.ts` GameState + `state.ts` newState (기본값이면 끝) · 모양이 바뀌면 `save/migrate.ts` MIGRATIONS |

## 세이브와 업데이트

출시 뒤에도 이야기·설계를 고치면 이미 플레이 중인 사람의 세이브를 지켜야 합니다.

**저장 위치** — `platform/storage.ts`. 게임은 `store.get/set` 만 씁니다.
- 웹: 브라우저 저장소 · 앱: 앱 전용 저장소(Capacitor Preferences). 웹뷰 저장소는 기기 공간이 부족하면 OS 가 지울 수 있어서 앱에서는 쓰지 않습니다.
- 예전 앱(웹뷰에 저장하던 때)의 기록은 처음 실행할 때 한 번 옮겨 옵니다.
- **백업 코드**: 시스템 탭 → 백업. 모든 세이브·도감·엔딩을 글자 한 줄(압축)로 만들고, 다른 기기에서 들여옵니다.

**불러오기는 항상 `save/migrate.ts` 를 거칩니다**
1. 버전 변환 — 세이브 **구조**를 바꾸면(새 필드, 모양 변경) `MIGRATIONS` 에 한 단계를 추가하고 `SAVE_VERSION` 을 올립니다. 새 필드에 새 게임 기본값만 넣으면 되는 경우는 자동이라 단계가 필요 없습니다.
2. 내용 정리 — 지금 콘텐츠에 없는 꿈·톡·장소·일정·동아리·인물은 정리하고, 무엇을 정리했는지 불러올 때 알려 줍니다.
3. 답장 대기 중인 톡은 고른 답장의 **글**도 기록해 두어, 선택지 순서가 바뀌어도 이어집니다. 이어 갈 수 없으면 읽씹 벌점 없이 닫습니다.

**id 를 바꾸거나 지울 때** → `content/renames.ts`
- 바꿨다: `RENAMES` 에 `'옛 id': '새 id'` — 세이브와 앨범이 새 id 를 따라갑니다.
- 지웠다: `RETIRED` 에 옛 id.
- `tests/fixtures/save-ids.json` 이 출시된 id 목록입니다. 어느 쪽에도 적지 않고 id 가 사라지면 `npm test` 가 알려 줍니다.
- **새 버전을 낼 때** `npm run save-ids` 로 목록을 갱신하고 함께 커밋합니다.
- 메인 이벤트는 번호(`main.ian.3`)로 진행도가 저장되니, 중간에 끼워 넣지 말고 **뒤에 추가**합니다.

`tests/fixtures/save-v3.json` 은 실제로 10턴까지 플레이한 예전 세이브입니다. 세이브 구조를 바꾼 뒤에도 이게 불러와지는지 테스트가 확인합니다.

## 검사

- `npm test` — 이야기 문법, 없는 배경·인물·장면, 톡 사건 키(triggers.ts 기준), 메인 이벤트 번호, 시대 팩 완결성, 예전 세이브 불러오기, 출시된 id 유지, 백업 코드.
- `npm run typecheck` — 사건 키 오타는 타입 오류로도 잡힙니다 (`emit(st, 'exam:best')` ✘).

## 앱 배포

- **안드로이드**: 이 브랜치나 main 에 푸시하면 GitHub Actions(`.github/workflows/android.yml`)가 테스트 → 웹 빌드 → APK 를 만들어
  저장소 **Releases → `apk-latest`** 에 올립니다. 폰에서 `ehwa.apk` 를 받아 설치 (출처를 알 수 없는 앱 허용 필요).
  - 서명 키 `android/app/ehwa-debug.keystore` 는 테스트용이라 저장소에 있습니다. 같은 키라서 새 APK 를 덮어 설치해도 세이브가 남습니다.
  - Play 스토어에 올릴 때는 별도 출시 키를 만들어 저장소 밖(GitHub Secrets)에 두고 `assembleRelease`/`bundleRelease` 로 바꿉니다.
- **직접 빌드**: `npm run cap:android` → Android Studio 에서 Run.
- **iOS**: Mac + Xcode 필요. `npx cap add ios` 후 `npm run cap:ios`.
- 아이콘·스플래시: `android/app/src/main/res/` (타이틀 그림에서 만듦). 세로 화면 고정.
