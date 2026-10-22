# .story 작성법

`src/content/stories/` (현생) 와 지금 전생 시대 팩의 `src/content/eras/{시대}/stories/` (프롤로그 · 전생 꿈) 아래의 모든 `.story` 파일을 게임이 자동으로 읽습니다. 새 파일을 만들어도 됩니다.
시대 팩에 공용과 같은 id 의 장면이 있으면 그 시대에서는 시대 팩 쪽이 쓰입니다 → [ARCHITECTURE.md](ARCHITECTURE.md#전생-시대-바꾸기-예-구한말)
수정한 뒤 `npm test` 를 돌리면 오타(없는 인물, 없는 배경, 잘못된 조건)를 줄 번호와 함께 알려줍니다.

## 장면

```
=== 장면id 속성=값 속성="띄어 쓴 값"
내용…
```

- 다음 `===` 가 나올 때까지가 한 장면입니다.
- `when="점심시간"` `where="본관 2층 계단"` `day="토"` — 장면 앞 **전환 자막**(“1학년 3월 첫째 주 수요일 · 점심시간 / 본관 2층 계단”)에 쓰입니다.
  - 날짜는 엔진의 이야기 시계(`engine/clock.ts`)가 채우고, `when` 은 시간대만 씁니다. `TIME_ORDER` 에 있는 말만 (아침 · 입학식 · 조회 · 1교시 전 · 쉬는 시간 · 2교시 쉬는 시간 · 점심시간 · 5교시 · 낮 · 오후 · 방과후 · 저녁 · 야간 · 밤 …)
  - `where` 가 없으면 지도 장소 이름 → 첫 `[bg]` 의 이름 순으로 채웁니다.
  - 자막은 main · basic · vac · weather · street · promise · event · opening 장면에 자동으로 붙습니다 (다시 보기 · 야식 제외).
  - 같은 달에 첫 만남(auto=1, 1번)이 여럿이면 `when` 순서대로 **같은 날 이어 붙습니다** — 1학년 3월: 입학식 → 1교시 전 이안 → 2교시 쉬는 시간 무진 → 점심시간 도윤.
  - 첫 줄은 “왜 여기 왔는지”로 시작하면 덜 어색합니다. (나쁜 예: “계단. 누가 어깨를 쳤다.” / 좋은 예: “점심을 먹고 출석부를 갖다 주러 가는 길이었다. 계단 한가운데서…”)
- `#` 이나 `//` 로 시작하는 줄은 메모(게임에 안 나옴), 빈 줄은 무시됩니다.

## 한 줄의 종류

```
나레이션은 그냥 씁니다.
ian| 인물 대사          ← 인물 id. 낮엔 '이안', 밤(전생)엔 '영안대군'으로 이름표 표시, 스탠딩 자동 표시
ian(smile)| 표정 지정    ← chars/ian/smile.png 사용
me| 주인공 대사         ← 플레이어가 정한 이름으로 표시
엄마| 조연 대사          ← 아무 이름이나 (스탠딩은 숨김)
???| 정체불명            ← 스탠딩 유지
\* 별표·[ 로 시작하는 나레이션은 앞에 \ 를 붙입니다
줄바꿈은 \n
```

## 연출 명령 `[ ]`

| 명령 | 뜻 |
|---|---|
| `[bg library]` | 배경 바꾸기 (`backgrounds.ts` 의 key) |
| `[fx petal]` | 파티클: petal(배꽃) · sakura · leaf · snow · rain · ember(불티) · none |
| `[stand ian]` / `[stand ian sad]` / `[stand off]` | 스탠딩 직접 지정 / 숨기기 |
| `[cg ian_rain]` / `[cg off]` | 전체 화면 CG (`cg/ian_rain.jpg`) |
| `[shake]` | 화면 흔들림 |
| `[flash #a01010]` | 화면 번쩍임 (색) |
| `[card 머리말 \| 제목 \| 설명]` | 장 제목 카드 |
| `[move rain \| 학원 건물 앞]` | 장면 안에서 장소 옮기기 — 배경이 천천히 겹쳐 바뀌고 자막이 잠깐 뜸 (`[bg]` 는 자막 없이 바꾸기) |
| `[effect ian+3 spirit+2 stress-5 flag:이름]` | 수치 변화 |
| `[call 장면id]` | 다른 장면을 이 자리에 끼워 넣기 |

## 선택지

```
* 선택지 문장 {ian+5 spirit+2}
  고르면 나오는 내용 (2칸 들여쓰기)
  ian| 대사
* 두 번째 선택지 {special}
  …
```

`{ }` 안에 쓸 수 있는 것:
- 수치: `ian+5` `int+2` `vocal+1` `stress-10` `money+50000` `hp+5`
  - 인물 id: ian mujin doyun taejun seoha ihyun sihyun
  - 기초 능력: int(지성) sense(감성) cha(사교) fit(근력) spirit(감응)
  - 특기: science medicine vocal dance acting voice language debate
  - 리소스: hp stress money
- `flag:이름` — 플래그 켜기 (조건에서 `flag.이름`)
- `special` — 강조된 선택지
- `if:조건` — 조건이 맞을 때만 보이기 (공백 없이: `if:met.sihyun&&aff.sihyun>=30`)
- `value:값` — 엔진에 넘기는 값 (슬럼프·진로 상담처럼 코드가 결과를 처리할 때)
- **연애** ([romance/README.md](romance/README.md)) — 선택지 `{ }` 나 `[effect …]` 에 씁니다
  - `key:taejun.1` — 그 사람의 속마음 열쇠 🔑 열기 (열쇠 목록은 `content/romance.ts`)
  - `lock:taejun.1` — 그 열쇠를 이번 생에 닫기 (잠금 선택지)
  - `stage:ian.친구` — 관계 단계 올리기 (첫 만남 · 아는 사이 · 친구 · 썸. 연인은 고백으로만, 단계는 내려가지 않음)
  - `like:taejun.river` — 그 사람 취향 하나를 알게 됨 (도감에 기록)
  - 열쇠 선택지는 세 갈래로: **열쇠**(`key:`) / **다정한 오답**(호감만 `taejun+3`) / **잠금**(`lock:`)

## 조건 분기

```
[if aff.ian>=30 && met.ian]
  호감도 30 이상일 때
[elif route=med]
  의대 루트일 때
[else]
  그 밖의 경우
```

| 쓸 수 있는 값 | 예 |
|---|---|
| 기초 능력 · 특기 | `int>=100` `spirit>=50` `vocal>=30` |
| 학년 | `year>=2` |
| 메인 이벤트 진행 | `main.ian>=2` |
| 리소스 | `hp<30` `stress>=70` `money>=100000` |
| 호감도 / 만남 | `aff.ian>=40` `hearts.ian>=2` (하트 칸) `met.saya` |
| 연애 | `stage.ian>=3` (0 모르는 사이 … 4 썸 · 5 연인) · `key.taejun>=2` (연 열쇠 수) · `key.taejun.1` (그 열쇠) · `lover=taejun` (`lover=none`) · `rumor.ian>=5` |
| 전생의 꿈 / 현생의 꿈 | `past=med` · `goal=idol` (아직 안 정했으면 `goal=none`) — med idol actor leader |
| 플래그 / 기억 | `flag.saya_hope` · `mem.saya4` |
| 엔진 변수 | `var.tier=top` (이벤트 장면에서 코드가 넘겨줌) |

- `&&`(그리고), `||`(또는), 앞에 `!`(아님). 괄호는 안 됩니다.

## 치환자

| 쓰면 | 나오는 것 |
|---|---|
| `{name}` | 주인공 이름 |
| `{goal}` | 현생의 꿈 (예: 한국대 의대 진학) |
| `{role}` `{past}` `{item}` `{pastDream}` | 전생 관련 (careers.ts) |
| `{var.이름}` | 엔진 변수 |

조사는 `을(를)` `이(가)` `은(는)` `와(과)` `(으)로` 처럼 쓰면 앞 글자에 맞춰 자동으로 바뀝니다. 예) `{name}이(가)` → 서단비가 / 한소율이

## 장면 종류와 머리말 속성

| 장면 id | 어디서 | 속성 |
|---|---|---|
| `basic.{인물}` | 출몰 장소·학교에서 짧게 마주칠 때 | `pick=random` — 대사 한 줄이 무작위로 나온다 |
| `main.{인물}.{번호}` | 인물 메인 이벤트. 번호 순서대로 진행 | `stage=` 마치면 오르는 관계 단계 (없으면 첫 만남) · `aff=` 최소 호감도 · `year=` 최소 학년 · `spirit=` 최소 감응 · `place=` 지도 장소 id(그 장소에 "!" 표시) 또는 `auto=1`(조건이 되면 달 시작에 자동 재생) |
| `vac.{인물}.summer1~3`, `winter1~2` | 방학 이벤트. 그 인물의 제안을 받아들인 횟수 = 단계 | `title=` |
| `{인물}{번호}` (시대 팩 dreams/) | 밤 — 전생의 기억 | `ch=` 인물 · `title=` · `ep=` 순서 · `aff=` · `spirit=` · `hidden=1` · `requires=a,b` · `auto=1` |
| `true.` `normal.` `reject.{인물}` | 마지막 선택의 결과 | `ending=` 엔딩 컬렉션 id (`content/endings.ts`) |
| `career.{key}` | 커리어 엔딩 59종 (목록·조건 `content/careerEndings.ts`) | `ending=` · 꿈 4종은 `var.kind`(dream / other). 다른 길 장면 첫 줄 `[call career._other]` = 정했던 꿈이 있었다면 한 줄 |
| `event.snack.{1~3}` | 야식 — 스트레스 쌓인 주 밤 | 선택지 `value:ramen / tteok / none` |

| `promise.{인물}` (weekend/) | 주말 약속(데이트) 장소에서. 한 줄 무작위 | `pick=random` |
| `date.{인물}.{great\|ok\|fail}` | 데이트 판정 결과 장면 (없으면 공용 한 줄) | — |
| `confess.{인물}` / `confess.common` (events/romance.story) | 그 사람이 먼저 고백 | 선택지 `value:yes / wait / no` (`wait` 는 `if:var.canwait=1`) · `{var.who}` |
| `jealous.{인물}` / `jealous.common` | 소문 때문에 질투 | `value:explain / honest / ignore` · `{var.who}` 소문 난 사람 · `{var.by}` 질투하는 사람 |
| `breakup.{인물}` / `breakup.common` | 연인을 오래 못 봤을 때 위기 | `value:stay / go` |
| `miss.{인물}` / `miss.common` | 엇갈림 엔딩 (썸까지 갔는데 고백을 놓침) | 엔딩 id 는 엔진이 `m_{인물}` 로 기록 |
| `weather.{인물}.{rain\|snow}` (weekend/) | 비·눈 오는 주말에 그 인물을 만나면 기본 이벤트 대신 | — |
| `street.{장소id}.{번호}` (street/) | 주말에 아무도 안 만난 칸에서 가끔 | `title=` · `weather=` · `year=` · `if=조건` |

- 새 메인 이벤트를 추가하려면 `main.{인물}.{다음 번호}` 장면을 만들면 끝입니다. 지도 장소 id는 `content/places.ts`에 있어요.
- 새 전생 꿈도 시대 팩의 dreams/ 에 장면을 추가하면 도감과 해금 판정에 자동으로 들어갑니다.
- `npm test`가 메인 이벤트 번호가 빠졌는지, 장소 id가 맞는지도 검사합니다.

## 메신저 대화 (stories/chat/)

자세한 규칙은 `stories/chat/_README.story` 맨 위 설명에 있습니다.

```
=== chat.mujin.rain on=weather:rain aff=30 delay=0
mujin| 비 온다!!!          ← 상대 말풍선
me| 우산 있어?             ← 내 말풍선 (선택 없이)
메시지를 삭제했습니다       ← 가운데 회색 문구
[photo mujin_sunset 한강 노을]   ← 사진 (앨범에 저장, 이미지 photo/mujin_sunset.png)
* 잘했어. 많이 아파? {mujin+3}   ← 답장 선택지 = 내 말풍선
  mujin| 쬐끔…                    ← 그 답장에 대한 반응
```

- `on=` 사건 (전체 목록과 설명: `src/engine/triggers.ts`) / `aff=` 최소 호감도 / `if=` 조건 / `delay=` 며칠 뒤 도착(기본 1) / `repeat=1` 여러 번
- `[promise]` → 그 주말 그 사람이 있는 곳에 약속을 잡고, 다음 줄부터 `{var.when}` `{var.where}`
- 먼저 연락하기 답장: `=== call.{인물}.{hello|promise|worry|dream}` — 호감도에 따라 `[if aff.ian<20]` 로 단답을 나눈다
- 읽씹·안읽씹 반응과 호감도, 톡 시각, 답이 늦는 사람은 `content/phone.ts`
