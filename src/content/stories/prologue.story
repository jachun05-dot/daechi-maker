# 새 게임 시작 — 전생의 죽음의 순간 (얼굴은 보이지 않는다)

=== prologue
[card 序 · 프롤로그 | 계사년, 유월 | 1593년, 진주성.]
[bg fortress]
[fx ember]
성벽이 무너지는 소리가 들렸다. 아니, 어쩌면 내 안의 무언가가 무너지는 소리였을지도 모른다.
하늘은 낮인지 밤인지 모를 붉은빛으로 끓고 있었다.
손에서 힘이 빠져나갔다. 평생 놓지 않으려 했던 것이 손가락 사이로 흘러내렸다.
[shake]
등이 차가운 돌바닥에 닿았다. 연기 너머로 하늘이 기울었다.
???| ……{name}!
누군가 내 이름을 불렀다. 무너지는 성 한가운데서, 모든 소리를 뚫고.
???| {name}, 눈 감지 마. 나를 봐.
[cg prologue_hand]
따뜻한 손이 식어 가는 내 손을 붙잡았다. 꽉, 놓치면 세상이 끝나기라도 할 것처럼.
얼굴을 보고 싶었다. 그런데 눈앞이 자꾸만 붉게 번졌다.
누구였을까. 내 마지막을 붙잡아 준 사람은.
[flash #ff6a2a]
[cg off]
다음 생에는— 다음 생에는 꼭, 그 얼굴을—
[fx none]
[bg dream]
……
[card 2026년 3월 1일 · 새벽 4시 44분 | 대치동, 내 방 | 새 학기 전날 밤이었다.]

=== wakeup
[bg room_night]
[fx none]
숨을 몰아쉬며 눈을 떴다. 베갯잇이 땀인지 눈물인지 모를 것으로 젖어 있었다.
창밖으로 대치동 학원가의 간판들이 새벽까지 꺼지지 않고 깜빡였다.
2026년. 서울. 내일은 이화고등학교 입학식이다.
…그런데 왜, 오른손에 아직도 누군가의 손이 남아 있는 것 같을까.
지유| 야 너 안 자?? 내일 입학식인데 나 떨려서 잠이 안 와ㅠㅠ
지유| 우리 반에 그 로열패밀리 이안 있대. 실화냐;;
…피식, 웃음이 나왔다. 그래, 여긴 대치동이다.
나는 새 다이어리를 펼쳤다. 첫 장은 아직, 비워 두기로 했다.

# 엔딩 직전 — 프롤로그 장면 다시 보기. 엔진이 var.partner(인물 id / none / ihyun), var.truth(1이면 이안의 진실)를 넘긴다
=== prologue.hand
[card 다시, 계사년 유월 | 진주성 | 그날의 손.]
[bg fortress]
[fx ember]
성이 무너지던 그날로, 꿈이 다시 나를 데려갔다.
???| ……{name}!
[cg prologue_hand]
따뜻한 손이 식어 가는 내 손을 붙잡았다.
[if var.partner=none || var.partner=ihyun]
  이번에도 얼굴은 보이지 않았다.
  붉게 번지는 시야 너머, 누군가의 목소리만이 오래 남았다.
  [cg off]
[elif var.truth=1]
  [cg off]
  [stand ian]
  번지던 시야가 처음으로 맑아졌다.
  ian| 이번엔… 내가 잡았어. 놓지 않아.
  이안이었다. 사백 년 전에도, 내 마지막을 붙잡은 손은.
  모두가 그를 버렸던 그 나라에서, 그는 끝까지 나를 버리지 않았다.
[elif var.partner=ian]
  [cg off]
  [stand ian]
  ian| {name}. 나를 봐.
  그 얼굴은— 이안이었다.
[elif var.partner=mujin]
  [cg off]
  [stand mujin]
  mujin| 아씨, 아니… {name}. 눈 감지 마.
  그 얼굴은— 무진이었다.
[elif var.partner=doyun]
  [cg off]
  [stand doyun]
  doyun| 계산에 없었어. 네가 먼저 쓰러지는 건.
  그 얼굴은— 도윤이었다.
[elif var.partner=taejun]
  [cg off]
  [stand taejun]
  taejun| 이번엔 안 도망쳐. 여기 있어.
  그 얼굴은— 태준이었다.
[elif var.partner=seoha]
  [cg off]
  [stand seoha]
  seoha| 아직 마지막 장을 못 썼어요. 그러니까 가지 마요.
  그 얼굴은— 서하였다.
[elif var.partner=sihyun]
  [cg off]
  [stand sihyun]
  sihyun| {name}. 네 이름, 끝까지 부를게.
  그 얼굴은— 시현이었다.
[fx none]
[bg dream]
