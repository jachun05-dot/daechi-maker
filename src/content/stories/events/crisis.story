# 위기 이벤트 — 스트레스 100(슬럼프), 스트레스 높을 때 시현의 구조

# 선택지 value 에 따라 엔진이 스트레스를 다시 맞춘다 (src/engine/month.ts)
=== event.slump
[bg room_night]
[fx rain]
밤 열한 시, 학원 화장실 거울 앞. 거울 속의 내가 낯설었다.
이대로는 안 될 것 같았다. 무엇이든 해야 했다.
* 무진에게 전화를 건다 {mujin+5 value:mujin if:met.mujin}
  [bg hangang]
  mujin| 어디야? 지금 갈게! …아니 그냥 가는 거야. 이유는 묻지 마!
  한강 둔치에 주저앉아 있으니, 무진이 숨을 헐떡이며 뛰어왔다. 손에는 초코우유 두 개.
* 시현에게 전화를 건다 {sihyun+6 value:sihyun if:met.sihyun}
  [bg hongdae]
  sihyun| …범생이? 너 목소리 왜 그래. 어디야. 지금 갈게.
  그날 밤, 우리는 홍대 옥상에서 동이 틀 때까지 소리를 질렀다.
* 휴대폰을 끄고 이틀 내내 잠만 잔다 {value:sleep}
  [bg room]
  세상과 연락을 끊었다. 엄마는 아무 말 없이 방문 앞에 밥상을 놓고 갔다.
* 모아둔 용돈으로 충동 일탈을 한다 {money-50000 value:spend}
  [bg cheongdam]
  청담동 편집숍에서 필요 없는 걸 잔뜩 샀다. 기분은 아주 잠깐 좋았다.

=== event.sihyun_rescue
[bg academy]
자정의 대치동 학원가. 편의점 앞에 앉아 멍하니 컵라면이 불어 가는 걸 보고 있었다.
부릉— 낡은 스쿠터 한 대가 멈춰 섰다.
sihyun| 역시. 얼굴에 ‘죽겠다’고 써 있네, 범생이. 타. 헬멧 써.
[bg hongdae]
한밤의 강변북로. 바람이 얼굴을 때리고, 그의 등 너머로 서울의 불빛이 흘러갔다.
* “으아아아아—!!” 목이 터져라 소리 지른다 {stress-30 sihyun+5}
  sihyun| 하하! 그래! 그거야!
* 그의 등에 조용히 이마를 기댄다 {stress-25 sihyun+7}
  sihyun| ……기대. 얼마든지.
