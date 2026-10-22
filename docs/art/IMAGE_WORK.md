# 이미지 작업 인계서 — 이 파일 하나만 읽고 시작하면 된다

> 게임: **이화(梨花)에 지는 달: 대치동 환생록** — 대치동 육성 시뮬 + 임진왜란 전생 오토메 비주얼 노벨 (모바일 세로 화면)
> 저장소: `/home/user/daechi-maker` (GitHub `jachun05-dot/daechi-maker`) · **작업은 main 브랜치에서 바로**
> 플레이 링크(아티팩트): https://claude.ai/artifact/Nbb1D7g9nUgQEHpWo244gw
> 마지막 정리: 2026-10-22 · 지금 들어간 그림 6장 / 게임이 찾는 그림 121장 (`npm run images`)

---

## 0. 이 사용자와 일하는 법 (꼭 지킬 것)

- **대답은 전부 한국어로.** 진행 상황 한 줄도 영어로 쓰지 않는다 (사용자가 "왜 자꾸 영어로 말하냐"고 지적함).
- 폰으로 본다 → 결과부터 짧게. 표·목록 위주.
- **그림은 사용자가 제미나이(Gemini)로 직접 뽑는다.** Claude가 할 일:
  1. 장면에 맞는 **제미나이 프롬프트**를 준다 (설명은 한국어, 프롬프트 본문은 영어 — 영어가 결과가 안정적이었다. 평일 일정 그림은 한국어 프롬프트로 이미 정리돼 있음)
  2. 사용자가 올린 그림을 **리터치**(워터마크 지우기 · 가짜 글자 흐리기 · 크기 줄이기)해서 정해진 이름으로 넣는다
  3. 게임 화면(폰 390×844)에서 **캡처로 확인**하고 보여 준다
  4. 커밋 · 푸시 → 플레이 링크 갱신
- 큰 방향이 바뀌는 일은 **초안(제안)을 먼저** 보여 주고, 사용자가 "진행해"라고 하면 한다. 그림 리터치·넣기처럼 요청이 분명한 건 바로 해도 된다.
- 사용자가 고른 그림을 마음대로 다시 그리거나 크게 바꾸지 않는다. 리터치는 티 안 나게.

## 1. 확정된 그림 규칙

| 규칙 | 내용 |
|---|---|
| 그림체 | **반실사** 디지털 페인팅 — 부드러운 붓 터치, 은은한 빛, 채도 낮은 차분한 색. 애니풍·두꺼운 선·셀 채색·3D·실사 사진 **아님** |
| 화풍 기준 | 사용자가 가진 **이안 샘플 그림**을 "화풍 기준"으로 첨부해서 뽑는다 (그림 속 사람은 무시하라고 적는다). 파일은 저장소에 없음 — 필요하면 사용자에게 다시 올려 달라고 한다 |
| 사람 얼굴 | **제미나이로 뽑는 배경 · 일정 그림 · 톡 사진 · 기억 카드에는 사람 얼굴을 넣지 않는다.** 사물 · 장소, 사람은 **손이나 소매 끝까지만** (1인칭 시점). 얼굴이 들어가면 그림마다 얼굴이 달라져서 쓸 수 없었다 |
| 글자 | 그림 안에 글자 · 숫자 · 로고 · 간판 문구 · 워터마크 없음 (제미나이가 쓰는 한글은 거의 다 깨진다) |
| 배꽃 | 이 게임의 상징. **흰 배꽃**(다섯 장 꽃잎, 작은 송이, 가운데 연두빛) — 분홍 벚꽃이 나오면 다시 |
| 시대 | 현생 = 2026년 서울 대치동 고등학생의 일상 / 전생 = 1592~1593년 임진왜란, 조선 |
| 대사창 자리 | 배경 · CG는 **아래 30%** 를 단순하게 (대사창이 덮는다) |

### 공통 스타일 문단 — 프롬프트 맨 앞에 붙인다
```
STYLE: match the painting style of the attached reference only (ignore the person in it): semi-realistic digital painting, soft painterly brushwork with smooth gradients, soft diffused natural light, realistic textures, muted and slightly desaturated palette. NOT anime, no line art, no cel shading, not 3D, not a photograph. No text, no letters, no signs with writing, no logo, no watermark, no signature. No human faces — if a person appears at all, show only hands or sleeves.
```

### 제미나이 요령 (지난 작업에서 확인한 것)
- 한 대화에서 같은 화풍으로 이어 뽑으면 그림체가 맞춰진다 — 첫 장이 좋으면 "앞 그림과 같은 화풍으로"를 붙여 계속
- 결과가 멀어지면 **새 대화**를 열고 기준 그림부터 다시 첨부
- 같은 프롬프트로 3~4장 뽑아서 고르기
- 투명 배경을 시키면 가짜 체크무늬를 그린다 → 필요하면 흰 단색 배경으로 뽑고 나중에 지운다
- 말로 설명한 구도보다 **보여 준 그림**(배치 가이드, 포즈 참고 사진)을 훨씬 잘 따른다

## 2. 파일 넣는 규칙 — 이름만 맞추면 코드 수정 없이 화면에 나온다

폴더: `src/assets/images/` (확장자 png / jpg / webp 아무거나. 배경·CG는 jpg 권장)

| 종류 | 경로 | 비율 · 크기 (넣을 때) | 화면 |
|---|---|---|---|
| 배경 | `bg/{key}.jpg` | 세로 **9:16** · **1080×1935** · jpg 품질 86 | 비주얼 노벨 화면 전체 (폰보다 넓으면 가운데를 보여 줌) |
| 전생 배경 | `eras/joseon/bg/{key}.jpg` | 위와 같음 | 전생 꿈 장면 |
| 이벤트 CG | `cg/{이름}.jpg` (전생 시대 전용이면 `eras/joseon/cg/`) | 세로 9:16 · 1080×1935 | 스토리 `[cg 이름]` |
| 전생 기억 카드 | `cg/{꿈id}.jpg` (예 `cg/ian1.jpg`) | 세로 **3:4** 로 보임 · 1080×1440 이상 | 도감 "기억 조각" 카드 |
| 평일 일정 그림 | `schedule/{일정id}.jpg` · 대성공 `{id}_great.jpg` · 실수 `{id}_fail.jpg` | 가로 **16:9** · 1280×720 | 평일 진행 화면 "오늘 장면" (시간표 아이콘에도 작게 잘려 쓰임) |
| 톡 사진 | `photo/{사진id}.jpg` | 세로 **3:4** (폰 사진 느낌) · 1080×1440 | 메신저 말풍선 · 앨범(정사각형으로 잘림) |
| 타이틀 | `eras/joseon/ui/title.jpg` | 9:16 · 1080×1935 | ✔ 이미 있음 |
| 서울 지도 | `ui/map.jpg` | 4:5 | ✔ 이미 있음 (핀 위치는 `src/content/places.ts` 의 `pos`) |
| 스탠딩 | `chars/{인물id}/default.png` · 표정 `{표정}.png` · 전생 `past_default.png` | 세로 2:3 · 투명 배경 png | ⏸ 보류 (6번) |
| 프로필 | `chars/{인물id}/avatar.png` | 정사각형 512×512 | ⏸ 보류 |

- 인물 id: `ian` 이안 · `mujin` 강무진 · `doyun` 차도윤 · `taejun` 한태준 · `seoha` 윤서하 · `ihyun` 김이현 · `sihyun` 류시현
- 배경이 폰 화면보다 넓어서 중요한 게 잘리면 `src/content/backgrounds.ts` 의 그 배경에 `focus: '28% center'` 처럼 보여 줄 위치를 적는다 (전생 배경은 `src/content/eras/joseon/index.ts`). 진주성이 이렇게 돼 있다
- 확인: `npm run images` → ✔ 있음 · ✘ 필수인데 없음 · · 선택
- 그림이 없는 칸은 게임 안에 파일 이름이 점선으로 뜬다 (시스템 탭에서 끌 수 있음) — 넣으면 바로 바뀐다

## 3. 리터치 — 사용자가 올린 그림을 넣기 전에

사용자가 올린 파일은 `/root/.claude/uploads/{세션id}/` 아래에 있다 (대화에 첨부된 경로를 그대로 쓴다).

1. **제미나이 워터마크(✦) 지우기** — 거의 항상 **오른쪽 아래 모서리**에 작은 반짝이 별이 있다. 그림을 열어 위치를 먼저 눈으로 확인하고(오른쪽 아래를 잘라 확대해 보기) 주변 색으로 메운다
2. **가짜 글자 흐리기** — 간판 · 칠판 · 표지에 깨진 글자가 있으면 그 칸만 살짝 블러
3. **경계 다듬기** — 아래쪽 어두운 띠가 칼로 자른 듯 끊기면 위아래로 부드럽게 이어 붙인다
4. **크기 줄이기** — 위 표의 크기로 (너비 기준 비율 유지), jpg 품질 86, progressive
5. 비율이 다르게 나왔으면 잘라서 맞추되, 중요한 대상이 잘리지 않게. 잘라야 하면 사용자에게 먼저 말한다

지난번에 쓴 코드 (Pillow + numpy):
```python
import numpy as np
from PIL import Image, ImageFilter

def remove_star(im, cx, cy, r=70):
    """(cx, cy) 둘레 r 안에서 주변보다 밝은 별 모양을 찾아 주변 색으로 메운다"""
    a = np.asarray(im).astype(np.float32)
    reg = a[cy-r:cy+r, cx-r:cx+r].copy()
    lum = reg.mean(axis=2)
    border = np.concatenate([lum[:6].ravel(), lum[-6:].ravel(), lum[:, :6].ravel(), lum[:, -6:].ravel()])
    mask = lum > np.median(border) + 18
    mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    fill = reg.copy(); fill[mask] = reg[~mask].mean(axis=0)
    for _ in range(400):                       # 바깥에서 안으로 번지게 메우기
        p = np.pad(fill, ((1, 1), (1, 1), (0, 0)), mode='edge')
        fill[mask] = ((p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4)[mask]
    fill[mask] += np.random.default_rng(1).normal(0, reg[~mask].std(axis=0).mean() * 0.35, fill.shape)[mask]
    a[cy-r:cy+r, cx-r:cx+r] = fill
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), int(mask.sum())

def blur_rects(im, rects, radius=4):           # 가짜 글자 칸만 흐리게 [(x0, y0, x1, y1), …]
    bl = im.filter(ImageFilter.GaussianBlur(radius)); out = im.copy()
    for r in rects: out.paste(bl.crop(r), r[:2])
    return out

def save(im, path, width=1080):
    im = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
    im.save('/home/user/daechi-maker/src/assets/images/' + path, quality=86, optimize=True, progressive=True)
```
- 지난번 세로 그림(1536×2752)에서는 별이 대략 (1298, 2512) 근처였다 → 오른쪽 끝에서 약 240px, 아래 끝에서 약 240px 안쪽. 그림 크기가 다르면 비율대로 다르니 **꼭 눈으로 확인**
- 메운 뒤 그 부분을 잘라 확대해서 자국이 안 남았는지 본다

## 4. 할 일 목록 (추천 순서)

### ① 현생 배경 26장 — 체감이 제일 큼
지금은 색 한 칸만 나온다. 장면에 자주 나오는 순 (괄호 = 스토리에서 쓰인 횟수 + 지도 장소)

| 순서 | key | 장소 | 그릴 것 (사람 없이) |
|---|---|---|---|
| 1 | `school` | 이화고 교정·복도 (12) | 봄 아침 사립고 교정과 본관 계단·복도, 흰 배꽃 나무(교목) |
| 2 | `classroom` | 이화고 교실 (7) | 1학년 교실, 창가 맨 뒷자리, 창밖 흰 배꽃, 빈 책상들 |
| 3 | `academy` | 대치동 학원가 (19) | 밤 10시 대치동 학원 건물 숲, 불 켜진 창, 셔틀버스 (간판 글자 없이) |
| 4 | `room` | 내 방(낮) (3 · 집) | 여고생 방 낮, 책상 위 문제집과 스탠드 — ✔ 이미 있는 `room_night` 와 같은 방 |
| 5 | `cheongdam` | 청담동 라운지·카페 (16) | 고급 호텔 라운지 창가 자리, 대리석·황동 조명 |
| 6 | `hongdae` | 홍대 클럽 거리 (16) | 밤 홍대 골목, 지하 클럽 입구 계단, 줄 조명 |
| 7 | `daehakro` | 대학로 소극장 (11) | 공연 끝난 소극장 객석과 무대, 붉은 의자 |
| 8 | `stage` | 무대 (11) | 무대 위에서 객석 쪽을 본 시점, 스포트라이트 한 줄기 |
| 9 | `gym` | 이화고 체육관 (11) | 텅 빈 학교 체육관, 농구 골대, 오후 햇빛 |
| 10 | `palace` | 경복궁·봉은사 (10) | 근정전 돌계단과 처마, 맑은 날 |
| 11 | `gallery` | 한남동 갤러리 (9) | 하얀 벽 갤러리 홀, 옛 그림 액자 하나(피란길 그림) |
| 12 | `hangang` | 한강 공원 (7) | 해 질 녘 한강 조깅로와 벤치, 다리 |
| 13 | `hospital` | 병원 (7) | 대학병원 복도 · 창가 대기 의자 |
| 14 | `seongsu` | 성수동 카페 거리 (7) | 붉은 벽돌 공장을 고친 카페 골목 |
| 15 | `rain` | 비 오는 거리 (6) | 비 오는 저녁 버스 정류장, 젖은 아스팔트에 번진 불빛 |
| 16 | `airport` | 인천공항 (6) | 출국장, 큰 유리창 너머 비행기 |
| 17 | `rooftop` | 밤의 옥상 (4) | 밤 옥상 정원, 멀리 서울 야경 |
| 18 | `gangnam` | 강남역 거리 (4) | 강남역 사거리 저녁, 횡단보도 (간판 글자 없이) |
| 19 | `library` | 이화고 도서관 (3) | 학교 도서관 창가 자리, 오후 햇살 |
| 20 | `music` | 낙원상가 악기점 (3) | 낡은 악기 상가, 벽에 걸린 기타들 |
| 21 | `winter` | 겨울 거리 (3) | 눈 내린 서울 골목, 가로등 |
| 22 | `studycafe` | 스터디카페·독서실 (2) | 칸막이 독서실, 스탠드 불빛 |
| 23 | `campus` | 대학 캠퍼스 (2) | 산자락 아래 대학 캠퍼스 봄 |
| 24 | `palace_night` | 경복궁 야간개방 (1) | 밤 경회루, 연못에 비친 등불 |
| 25 | `bukhansan` | 북한산 둘레길 (1) | 숲길과 화강암 봉우리 |
| 26 | `airport_n` | 밤의 공항 (1) | 밤 활주로가 보이는 공항 유리창 |

배경 프롬프트 틀:
```
(공통 스타일 문단)

A background illustration for a Korean otome visual novel, vertical 9:16, no people.
Place: {장소 — 위 표의 "그릴 것"을 영어로}. Seoul, 2026.
Time and light: {시간대 · 날씨}.
Composition: eye-level view as if the heroine is standing there. Keep the main subject in the upper-middle; keep the bottom 30% simple (floor, desk, ground) because a dialogue box covers it. Leave a little open space in the center where a character sprite may stand later.
Mood: {분위기}.
Avoid: people, faces, text, readable signs, logos, pink cherry blossoms, oversaturated colors, anime style.
```

### ② 전생 배경 10장 — `eras/joseon/bg/`
전생 꿈 장면용. 어둡고 처연한 밤 색조 (✔ 이미 있는 `fortress` 진주성 · `dream` 과 톤을 맞춘다)

| key | 장소 | 쓰인 횟수 |
|---|---|---|
| `mansion` | 양반가·약방 | 7 |
| `camp` | 의병 진영 (밤, 횃불, 천막) | 4 |
| `market` | 장터 | 3 |
| `enemy` | 왜군 진영 | 3 |
| `river` | 달밤의 강·암자 | 2 |
| `palace_n` | 밤의 임금 막사 (피란 중인 왕의 임시 거처) | 2 |
| `mountain` | 피란길 산길 | 2 |
| `moonfield` | 달빛 아래 배꽃 들판 | 2 |
| `burning` | 불타는 마을 | 2 |
| `field` | 전장 | 1 |

### ③ 평일 일정 그림 — 프롬프트가 이미 따로 정리돼 있다
→ **[schedule_prompts.md](schedule_prompts.md)** 를 그대로 쓴다 (한국어 프롬프트, 16:9 가로, 1인칭, 얼굴 없이 손까지)
- 보통 28장 먼저, 그다음 대성공 · 실수 버전 (편집 프롬프트도 그 파일에 있음)
- 자주 나오는 순: `study` `academy` `rest` `home` `library` `dokseo` `cafe` `gym`
- 동아리 6개(`council` `athletics` `science` `drama` `band` `mun`)도 같은 폴더 같은 규칙 (`npm run images` 목록엔 아직 안 나오지만 게임은 찾는다)

### ④ 톡 사진 11장 — `photo/` (세로 3:4, 폰으로 찍은 사진 느낌의 반실사)
| id | 보낸 사람 | 내용 | 메모 |
|---|---|---|---|
| `mujin_sunset` | 무진 | 뛰고 나서 찍은 한강 노을 | |
| `mujin_record` | 무진 | 체육관 기록판 — 신기록 | 숫자 없이 빈 칸에 별표 |
| `doyun_note` | 도윤 | 빨간 펜으로 고친 풀이 세 장 | 수식은 읽히지 않게 흐리게 |
| `doyun_puzzle` | 도윤 | 화이트보드에 적힌 문제 하나 | 글자 대신 도형 |
| `ian_night` | 이안 | 한남동 옥상에서 본 서울 야경 | |
| `ihyun_palace` | 이현 | 경회루 앞에서 찍어 준 내 사진 | **주인공 뒷모습**만 (얼굴 없이) |
| `ihyun_snow` | 이현 | 눈 쌓인 궁궐 지붕 | |
| `ihyun_hair` | 이현 | 거울 앞에서 찍은 셀카 | **휴대폰이 얼굴을 가리는 거울 셀카** — 얼굴 규칙 때문에 |
| `seoha_backstage` | 서하 | 무대 뒤에서 몰래 찍은 객석 | |
| `taejun_gift` | 태준 | 떡볶이 기프티콘 | 화면 속 떡볶이 사진 느낌, 글자 없이 |
| `taejun_watch` | 태준 | 새로 산 시계 | 손목 위 명품 시계, 로고 없이 |

### ⑤ 전생 기억 카드 25장 — `cg/{꿈id}.jpg` (선택)
도감 "기억 조각" 카드(세로 3:4, 금테 어두운 카드 위에 깔림). 얼굴 규칙 때문에 **그 기억을 상징하는 사물 정물**로 제안 — 사용자 확인 후 진행

| 꿈 id | 제목 | 상징 사물 (제안) |
|---|---|---|
| `self1` | 계사년, 유월 | 불티 속 진주성 성벽 위 떨어진 머리끈 |
| `self2` | 꺾인 꿈 | 부러진 붓 (전생의 꿈에 따라 다르게 — 지금은 공용 한 장) |
| `self3` | 진주성, 마지막 밤 | 맞잡은 두 손 실루엣 위로 지는 달 |
| `ian1` · `ian2` · `ian3` | 미끼로 버려진 왕자 · 산중의 달 · 진주성 전야 | 산길에 떨어진 왕실 옥 노리개 · 산 위 달과 꺼진 모닥불 · 성벽 위 두 그림자 대신 나란한 두 자루 칼 |
| `mujin1` · `mujin2` · `mujin3` | 남겨진 무사 · 등 뒤 · 말하지 못한 것 | 피 묻은 호위 무사의 환도 · 등을 맞댄 두 그림자 (얼굴 없음) · 접힌 채 부치지 못한 서찰 |
| `doyun1` · `doyun2` · `doyun3` | 어전의 계책 · 왕을 떠난 책사 · 진짜 계산 | 지도 위 바둑돌 · 놓고 간 관모 · 계산이 적힌(읽히지 않게) 서책과 꺼진 촛불 |
| `taejun1` · `taejun2` · `taejun3` | 권문세가의 도령 · 어머니의 그늘 · 닫힌 대문 | 비단 도포와 금 장신구 · 문틈으로 드는 촛불 그림자 · 굳게 닫힌 솟을대문 |
| `seoha1` · `seoha2` · `seoha3` | 쫓기는 기록관 · 잊히지 않게 · 비어 있는 마지막 장 | 달리다 흩어진 종이 · 먹으로 빼곡한 기록첩(글자는 흐리게) · 마지막 장이 빈 기록첩 |
| `ihyun1` ~ `ihyun4` | 적장 사야가 · 귀화 · 먼저 떠난 사람 · 남겨진 사람 | 왜군 투구 · 조선 갓 옆에 놓인 왜도 · 강가에 놓인 신발 한 켤레 · 빈 자리에 떨어진 배꽃 |
| `sihyun1` ~ `sihyun3` | 천민 악공의 지음 · 적진의 거문고 · 끊어진 현 | 거문고와 술대 · 적진 천막 앞 거문고 · 줄 하나가 끊어진 거문고 |

### ⑥ 보류 — 지금은 하지 않는다
- **캐릭터 스탠딩 · 표정 · 프로필 · 인물 이벤트 CG:** 제미나이로 얼굴을 매번 같게 뽑는 데 실패해서 사용자가 보류함 ("사람은 내가 못하겠고"). 남주 플롯도 한태준 말고는 다시 쓰는 중이라 설정 확정 뒤에 다시 다룬다. 사용자가 먼저 꺼내면 그때 이어서
  - 그때 참고: 스탠딩은 세로 2:3, 허벅지~머리 위 여백, 흰 단색 배경으로 뽑고 배경 지우기. 얼굴을 지키려면 ① 기준 그림을 먼저 다듬고 ② 같은 얼굴 각도 시트를 만든 뒤 ③ 장면을 그리게 하는 순서가 가장 나았다. 앉히는 등 자세를 크게 바꾸면 얼굴이 바뀐다
  - 이안 외형(샘플 기준): 은백색 살짝 흐트러진 짧은 머리, 옆으로 넘긴 앞머리, 옅은 호박색 눈, 창백한 피부, 날렵한 턱. 교복 = 네이비 블레이저(연회색 파이핑, 금색 단추, 왼쪽 가슴 금색 백합+월계수 문장) · 네이비 줄 연회색 V넥 조끼 · 흰 셔츠 · 버건디에 네이비·흰 사선 넥타이 · 차콜 바지
- 학교 사건 그림 `schedule/sc_{사건id}` · 작은 선택 그림 `schedule/ch_{선택id}` — **코드 연결이 아직 없다** (지금은 아이콘). 하려면 `src/ui/overlays/LiveWeek.tsx` 에서 연결부터

## 5. 넣은 뒤 확인

```bash
cd /home/user/daechi-maker
npm run images          # ✔ 로 바뀌었는지
npx tsc --noEmit -p .   # 타입 검사 (그림만 넣었으면 그대로 통과)
npm test                # 71개 통과해야 함
npm run build:single    # dist-single/index.html (한 파일짜리 게임)
```

**화면 캡처 확인** — Playwright가 깔려 있다 (`/opt/node-tools/node_modules/playwright`, 브라우저 `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). `playwright install` 은 하지 않는다.
- 폰 크기 `{ width: 390, height: 844 }` 로 `file:///home/user/daechi-maker/dist-single/index.html` 을 연다
- 디버그 핸들 `window.__ehwa = { game, ui, act, refresh }` — `ui` 는 화면 상태 저장소(zustand), `act` 는 화면 동작(`act.playScene(장면id 또는 노드 배열, 옵션)`)
- 배경 하나만 빨리 보려면, 새 게임을 시작해 첫 장면이 지난 뒤:
  ```js
  await page.evaluate(() => window.__ehwa.act.playScene([{ t: 'say', text: '배경 확인', line: 0 }], { bg: 'school' }));
  ```
  → 그 배경 위에 대사창이 뜬 화면을 캡처 (이렇게 부르면 자막 없이 바로 뜬다)
- 실제 이야기 장면(장면 id)으로 볼 때는 시작에 "언제 · 어디서" 검은 자막이 2초 뜨니 2.5초 기다렸다 찍는다
- 확인할 것: 폰 폭에서 중요한 게 잘리지 않는지(잘리면 `focus`), 대사창이 그림의 중요한 부분을 가리지 않는지, 이름표·글자가 잘 읽히는지

## 6. 올리기

1. **커밋 · 푸시 (main):**
   ```bash
   git add src/assets/images docs   # 바꾼 것만
   git commit -m "이미지: …"         # 메시지는 한국어
   git push origin main
   ```
   커밋 메시지 끝에는 그 세션의 시스템 안내(attribution)에 나오는 `Co-Authored-By` · `Claude-Session` 줄을 붙인다.
2. **플레이 링크 갱신** (아티팩트 — 같은 링크 유지):
   - `npm run build:single` 결과 `dist-single/index.html` 에서 `<!doctype>` · `<html>` · `<head>` · `<body>` 태그, `<meta charset>` · `<meta name="viewport">` · `<title>` 을 지우고, 맨 앞에 `<title>이화에 지는 달</title>` 한 줄을 붙여 스크래치 폴더에 저장 (파이썬 정규식으로 하면 된다)
   - Artifact 도구 **publish** 에 `url: https://claude.ai/artifact/Nbb1D7g9nUgQEHpWo244gw` 를 같이 넘긴다. 다른 대화에서 만든 아티팩트라서 **먼저 `read` 한 번** 해야 publish가 된다
   - 용량 한도 16MB — 지금 약 3MB. 그림을 많이 넣으면 커지니 jpg 품질 86 · 너비 1080 을 지킨다 (한 장 150~200KB 목표)
3. 사용자에게: 넣은 그림 목록 + 손본 것(워터마크 등) + 캡처 한두 장, 짧게.

## 7. 참고 — 어디에 무엇이 있나
| 무엇 | 위치 |
|---|---|
| 이미지 자동 연결 규칙 | `src/engine/assets.ts` |
| 배경 key 목록 · 보여 줄 위치(focus) | `src/content/backgrounds.ts` (현생) · `src/content/eras/joseon/index.ts` (전생) |
| 평일 일정 id · 이름 | `src/content/timetable.ts` |
| 지도 장소 · 핀 위치 · 장소별 배경 | `src/content/places.ts` |
| 톡 사진이 나오는 대화 | `src/content/stories/chat/*.story` 의 `[photo id 설명]` |
| 전생 꿈 목록 (기억 카드 id) | `src/content/eras/joseon/stories/dreams/*.story` |
| 평일 일정 그림 프롬프트 | `docs/art/schedule_prompts.md` |
| 지도 배치 가이드 그림 | `docs/art/map_layout_guide.png` |
| 게임 전체 설계 · 인물 설정 | `docs/GAME_DESIGN.md` · `docs/CHARACTERS.md` |
