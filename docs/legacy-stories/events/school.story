# 월말 학사 이벤트. 수치 판정은 src/engine/events.ts, 수치 기준은 src/config/balance.ts
# 엔진이 넘겨주는 값은 {var.이름} 으로 출력하고 [if var.이름=값] 으로 분기합니다.

# --- 중간/기말고사 : var.exam(시험 이름), var.rank(등급 이름), var.tier(top/high/mid/low)
=== event.exam
[bg school]
{var.exam}. 사각사각, 답안지를 채우는 소리가 교실을 메웠다.
결과는 — {var.rank}.
[if var.tier=top]
  담임 선생님이 성적표를 건네며 어깨를 두드렸다. “전교 1등. 이화고 역사에 남겠다.”
[elif var.tier=high]
  성적표의 숫자들이 가지런했다. 노력은 배신하지 않았다.
[elif var.tier=mid]
  나쁘지 않았다. 하지만 대치동에서 ‘나쁘지 않음’은 칭찬이 아니었다.
[else]
  성적표를 가방 깊숙이 넣었다. 집에 가는 발걸음이 무거웠다.

# --- 체육대회 : var.win(1/0)
=== event.sports
[bg gym]
[fx petal]
이화고 체육대회. 운동장이 함성으로 들끓었다.
[if var.win=1]
  계주 마지막 주자. 바통을 받는 순간, 다리가 저절로 움직였다. 결승선, 1등!
[else]
  줄다리기에서 넘어져 무릎이 까졌다. 그래도 반 친구들과 함께 웃었다.
[if met.mujin]
  운동장 한쪽, 3학년 응원석에서 누군가 유난히 큰 목소리로 내 이름을 외쳤다.
  mujin| ……{name}! 가라!
  …강무진 선배였다. 말수 적은 그 사람이.
  [effect mujin+4]

# --- 이화제 : var.stage(밴드 공연/연극 무대/축제 MC), var.kind(art/sense/cha), var.ok(1/0)
=== event.festival
[bg stage]
[fx sakura]
이화제(梨花祭). 나는 {var.stage}(으)로 무대에 섰다.
[if var.ok=1]
  조명이 쏟아졌다. 첫 순간의 떨림이 지나자, 무대는 온전히 내 것이 되었다. 객석에서 함성이 터졌다.
[else]
  실수가 있었다. 그래도 끝까지 해냈다. 박수는 따뜻했다.
[if var.kind=art && met.sihyun]
  공연이 끝나고 무대 뒤, 꽃다발 하나가 기다리고 있었다.
  sihyun| …범생이 아가씨, 무대 체질이네. 오늘은 인정.
  [effect sihyun+5]
[elif var.kind=sense && met.seoha]
  공연이 끝나고 무대 뒤, 꽃다발 하나가 기다리고 있었다.
  seoha| 오늘의 기록: “그 사람이 무대 위에서 빛났다. 나는 박수를 멈출 수 없었다.”
  [effect seoha+5]
[elif var.kind=cha && met.taejun]
  공연이 끝나고 무대 뒤, 꽃다발 하나가 기다리고 있었다.
  taejun| …너 진짜 사람 앞에서 말 잘하더라. 멋있었다. 진짜로.
  [effect taejun+5]
[if met.saya]
  축제 인파 사이로 갈색 머리가 보였다. 사야가 엄지를 치켜들고 있었다. 박수를, 아주 크게 치면서.

# --- 진로 상담 : var.pct(달성도 %), var.level(good/maybe/hard), var.switch(1/0), var.bestGoal
# 선택지 value:switch 를 고르면 엔진이 꿈을 var.best 로 바꿉니다.
=== event.counsel
[bg school]
진로 상담실. 담임 선생님이 생활기록부를 펼쳤다.
담임| {goal}이(가) 목표라고 했지? 지금 페이스면… 달성도 {var.pct}% 정도야.
[if var.level=good]
  담임| 이대로만 가면 충분해. 자신감 가져.
[elif var.level=maybe]
  담임| 가능성은 있어. 다만 지금보다 더 집중해야 해.
[else]
  담임| 솔직히 말하면… 쉽지 않아. 그래도 꿈은 네 거니까, 포기하라는 말은 안 할게.
[if var.switch=1]
  담임| 그런데 말이야. 네 기록을 보면 {var.bestGoal} 쪽 재능이 눈에 띄는구나. 생각해 본 적 있니?
  * 진로를 {var.bestGoal}(으)로 바꾼다 {value:switch}
    꿈은 바뀔 수 있다. 중요한 건, 그 꿈이 내 것이라는 사실이다.
  * 지금의 꿈을 지킨다 {spirit+2}
    me| 아니요. 제 꿈은 그대로예요. 끝까지 가 볼게요.
    담임| …그래. 그 눈이면 됐다.

# --- 수능 : var.result(great/ok/bad)
=== event.suneung
[bg winter]
[fx snow]
수능 날 아침. 첫눈이 내렸다. 수험장 앞에는 후배들의 응원 소리가 가득했다.
[if met.mujin && aff.mujin>=30]
  수험장 정문 앞, 커다란 그림자가 말없이 핫팩과 초코우유를 쥐여 주고 사라졌다.
[if met.ian && aff.ian>=30]
  휴대폰을 끄기 직전, 메시지 하나. “넌 할 수 있어. 내가 끝까지 봤으니까.” — 이안
[if var.result=great]
  마지막 교시 종이 울렸을 때, 이상하게 마음이 고요했다. 해냈다. 그 느낌이 손끝에 남아 있었다.
[elif var.result=ok]
  몇 문제가 마음에 걸렸다. 그래도 최선을 다했다.
[else]
  시험지 위의 글자들이 흐릿하게 번졌다. 그래도 끝까지 앉아 있었다. 그것만으로도.

=== event.summer
[bg hangang]
[fx rain]
여름방학이 시작됐다. 대치동의 방학은 학기보다 뜨겁다.
엄마| 방학 특강 등록했니? 옆집 애는 벌써 3과목 끊었다더라.
…그래도 장마 끝의 하늘은 맑았다.

# --- 겨울방학 (기말고사 뒤에 이어서 재생) : var.year
=== event.winter
[bg winter]
[fx snow]
[if var.year=1]
  1학년이 끝났다. 창밖에 함박눈이 쏟아졌다.
[else]
  2학년이 끝났다. 이제, 고3이다.
눈 내리는 대치동 거리. 학원가 불빛이 눈송이에 번졌다.
[if met.saya && aff.saya>=25]
  새해 첫날, 사야에게서 사진 한 장이 왔다. 눈 덮인 경복궁. “올해도 같이 봐요. 될 수 있으면, 오래.”

=== event.graduation
[bg school]
[fx snow]
이화고등학교 졸업식. 강당 창밖, 앙상한 배나무 가지 위에 눈이 꽃처럼 쌓여 있었다.
지유| 야… 우리 진짜 졸업한다. 대치동에서 3년. 살아남았다, 우리.
3년 전, 새 학기 전날 밤에 꾼 꿈이 떠올랐다. 불타는 마을. 피 묻은 손. 여섯 개의 목소리.
그리고 이번 생에서 다시 만난 얼굴들.
나는 이번 생에서, 꿈을 먼저 꾸었을까.
