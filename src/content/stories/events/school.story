# 월말 학사 이벤트. 수치 판정은 src/engine/events.ts, 수치 기준은 src/config/balance.ts
# 엔진이 넘겨주는 값은 {var.이름} 으로 출력하고 [if var.이름=값] 으로 분기합니다.

# --- 시험 : var.exam(시험 이름), var.rank(등급), var.tier(top/high/mid/low), var.focus(집중 과목 이름)
=== event.exam
[bg classroom]
{var.exam}. 사각사각, 답안지를 채우는 소리가 교실을 메웠다.
[if var.hasFocus=1]
  이번 달 내내 붙들고 있던 {var.focus} 시험지에서, 손이 덜 떨렸다.
결과는 — {var.rank}.
[if var.tier=top]
  담임 선생님이 성적표를 건네며 어깨를 두드렸다. “전교 1등. 이화고 역사에 남겠다.”
  [if year<=2]
    교무실을 나서는데, 복도 끝에서 도윤 선배가 성적표를 흘끗 보고 지나갔다. 아무 말도 없이.
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
  mujin| {name}! 가자! 할 수 있어!!
  응원석에서 제일 크게 소리치는 사람은 늘 무진이었다. 자기 경기보다 더 신나서.
  [effect mujin+3]

# --- 이화제 : var.stage(무대 이름), var.kind(music/acting/debate), var.ok(1/0)
=== event.festival
[bg stage]
[fx sakura]
이화제(梨花祭). 나는 {var.stage}(으)로 무대에 섰다.
[if var.ok=1]
  조명이 쏟아졌다. 첫 순간의 떨림이 지나자, 무대는 온전히 내 것이 되었다.
[else]
  실수가 있었다. 그래도 끝까지 해냈다. 박수는 따뜻했다.
[if var.kind=acting && met.seoha]
  seoha| 오늘의 기록. “선배가 무대 위에서 처음으로, 읽혔다.”
  [effect seoha+4]
[elif var.kind=debate && met.ian]
  ian| …나쁘지 않았어. 아니, 좋았어. 이 말 하기 싫었는데.
  [effect ian+4]
[elif var.kind=music && met.sihyun]
  sihyun| 범생이 아가씨, 무대 체질이네. 오늘은 인정.
  [effect sihyun+4]

# --- 1학년 진로 상담 : var.hint(꿈 후보 이름)
=== event.counsel.hint
[bg classroom]
진로 상담실. 담임 선생님이 생활기록부를 펼쳤다.
담임| 아직 뭘 하고 싶은지 모르겠다고? 괜찮아. 1학년이면 다들 그래.
담임| 그런데 네 기록을 보면 말이야… {var.hint} 쪽으로 손이 자주 가더라.
담임| 정하라는 게 아니야. 그냥, 네가 뭘 할 때 시간 가는 줄 모르는지 한번 봐 둬.
상담실을 나서며 생각했다. 나는, 뭘 할 때 시간이 빨리 갔더라.

# --- 2학년 진로 상담 : 꿈을 정한다. 선택지는 엔진이 만든다 (value = 진로 id)
=== event.counsel.decide
[bg classroom]
진로 상담실. 이번엔 담임 선생님도 웃지 않았다.
담임| 이제 정해야 해. 고3이 되면 고민할 시간이 없어.
담임| 네가 지금까지 쌓아 온 걸 보면, 가능성이 보이는 길은 이쪽이야.
나는 다이어리 첫 장을 떠올렸다. 2년 동안 비워 두었던 그 자리.

# --- 수능 : var.result(great/ok/bad)
=== event.suneung
[bg winter]
[fx snow]
수능 날 아침. 첫눈이 내렸다. 수험장 앞에는 후배들의 응원 소리가 가득했다.
[if met.mujin && aff.mujin>=30]
  mujin| 핫팩! 초코우유! 그리고… 너 진짜 잘할 거야!
[if met.ian && aff.ian>=30]
  휴대폰을 끄기 직전, 메시지 하나. “긴장하지 마. 넌 원래 잘해.” — 이안
[if var.result=great]
  마지막 교시 종이 울렸을 때, 이상하게 마음이 고요했다. 해냈다.
[elif var.result=ok]
  몇 문제가 마음에 걸렸다. 그래도 최선을 다했다.
[else]
  시험지 위의 글자들이 흐릿하게 번졌다. 그래도 끝까지 앉아 있었다.

=== event.graduation
[bg school]
[fx snow]
이화고등학교 졸업식. 강당 창밖, 앙상한 배나무 가지 위에 눈이 꽃처럼 쌓여 있었다.
지유| 야… 우리 진짜 졸업한다. 대치동에서 3년. 살아남았다, 우리.
3년 전, 새 학기 전날 밤에 꾼 꿈이 떠올랐다. 무너지는 성. 붙잡힌 손. 보이지 않던 얼굴.
나는 이번 생에서, 꿈을 먼저 꾸었을까.
