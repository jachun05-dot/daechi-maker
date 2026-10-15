# .story 작성법

`src/content/stories/` 아래의 모든 `.story` 파일을 게임이 자동으로 읽습니다. 새 파일을 만들어도 됩니다.
수정한 뒤 `npm test` 를 돌리면 오타(없는 인물, 없는 배경, 잘못된 조건)를 줄 번호와 함께 알려줍니다.

## 장면

```
=== 장면id 속성=값 속성="띄어 쓴 값"
내용…
```

- 다음 `===` 가 나올 때까지가 한 장면입니다.
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
- 수치: `ian+5` `int+2` `stress-10` `money+50000` `hp+5` (인물 id·스탯·체력/스트레스/용돈)
- `flag:이름` — 플래그 켜기 (조건에서 `flag.이름`)
- `special` — 강조된 선택지
- `if:조건` — 조건이 맞을 때만 보이기 (공백 없이: `if:met.sihyun&&aff.sihyun>=30`)
- `value:값` — 엔진에 넘기는 값 (슬럼프·진로 상담처럼 코드가 결과를 처리할 때)

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
| 스탯 | `int>=100` `spirit>=50` (int, art, sense, cha, charm, spirit, fit) |
| 리소스 | `hp<30` `stress>=70` `money>=100000` |
| 호감도 / 만남 | `aff.ian>=40` `met.saya` |
| 루트 / 꿈 | `route=med` (전생) · `goal=idol` (현생 꿈) |
| 플래그 / 기억 | `flag.saya_hope` · `mem.saya4` |
| 엔진 변수 | `var.tier=top` (이벤트 장면에서 코드가 넘겨줌) |

- `&&`(그리고), `||`(또는), 앞에 `!`(아님). 괄호는 안 됩니다.

## 치환자

| 쓰면 | 나오는 것 |
|---|---|
| `{name}` | 주인공 이름 |
| `{goal}` | 현생의 꿈 (예: 한국대 의대 진학) |
| `{role}` `{past}` `{item}` `{pastDream}` | 전생 관련 (routes.ts) |
| `{var.이름}` | 엔진 변수 |

조사는 `을(를)` `이(가)` `은(는)` `와(과)` `(으)로` 처럼 쓰면 앞 글자에 맞춰 자동으로 바뀝니다. 예) `{name}이(가)` → 서단비가 / 한소율이

## 장면 머리말 속성

| 파일 | 속성 |
|---|---|
| `encounters/*.story` | `=== enc.ian.3 min=25` — 호감도 25 이상이면 3번째 조우 (번호 순서대로 진행). `enc.ian.small pick=random` 은 한 줄씩 무작위 |
| `dreams/*.story` | `=== ian2 title="산중의 달" ep=2 aff=40 spirit=50` — 호감도·감응력 조건. `hidden=1` `requires=saya1,saya2` `auto=1`(이야기 진행으로 자동) |
| `endings/*.story` | `ending=t_ian` — 엔딩 컬렉션 id (`content/endings.ts`) |

새 인물 조우를 추가하려면 `enc.{인물}.{다음 번호}` 장면을 만들면 끝입니다. 새 전생 꿈도 `dreams/{인물}.story` 에 장면을 추가하면 도감과 해금 판정에 자동으로 들어갑니다.
