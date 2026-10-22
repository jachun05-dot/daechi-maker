# 연애 공용 장면 [임시] — 인물 전용 장면(confess.taejun · jealous.ian · breakup.mujin · miss.seoha …)이 생기면 그쪽이 쓰인다
# 엔진이 앞에 그 사람 대사 한 줄을 붙인다 (content/romance.ts LOVE_LINES)
# 변수: {var.who} 그 사람 이름 · 질투에선 {var.who} 소문 난 사람, {var.by} 질투하는 사람
# 선택지 value: 는 엔진이 결과를 처리한다 — 바꾸지 말 것

# 고백 — yes 받기 / wait 기다려 달라기(한 번) / no 거절
=== confess.common
[bg rooftop]
{var.who}의 목소리가 조금 떨렸다. 이 말을 꺼내려고 오래 고른 얼굴이었다.
* 고개를 끄덕인다. “나도.” {value:yes special}
  한참 동안 아무 말도 하지 않았다. 그래도 하나도 어색하지 않았다.
* “조금만 기다려 줄래? 아직 내 마음을 다 모르겠어.” {value:wait if:var.canwait=1}
  {var.who}은(는) 잠깐 웃었다. “기다릴게. 대신 너무 오래는 말고.”
* “미안. 우리는 지금이 좋은 것 같아.” {value:no}
  {var.who}은(는) 고개를 끄덕였다. 끝까지 웃으려고 애쓰는 얼굴이었다.

# 질투 — explain 해명 / honest 솔직히 / ignore 모른 척
=== jealous.common
[bg school]
복도 끝, 지나가던 애들이 우리 쪽을 힐끔거렸다. {var.who}(이)랑 같이 다닌다는 소문이 꽤 퍼진 모양이었다.
* “그런 사이 아니야. 오해야.” {value:explain}
  {var.by}의 어깨에서 힘이 조금 빠졌다.
* “{var.who}(이)랑 친한 거 맞아. 숨길 생각 없어.” {value:honest}
  {var.by}은(는) 한참 나를 보다가, “…그래.” 하고 짧게 답했다.
* 대답하지 않고 화제를 돌린다 {value:ignore}
  {var.by}은(는) 더 묻지 않았다. 묻지 않는 게 더 마음에 걸렸다.

# 연인 위기 — stay 붙잡는다 / go 놓아준다
=== breakup.common
[bg rain]
[fx rain]
요즘 우리는 톡으로만 이어져 있었다. 마지막으로 얼굴을 본 게 언제였는지 기억나지 않았다.
* “미안해. 내가 더 시간 낼게.” 손을 잡는다 {value:stay special}
  {var.who}의 손이 차가웠다. 그래도 빼지 않았다.
* “…우리 잠깐 생각할 시간을 갖자.” {value:go}
  {var.who}은(는) 대답 대신 우산을 내 쪽으로 기울여 주고 돌아섰다.

# 엇갈림 엔딩 — 썸까지 갔는데 고백을 놓쳤다 (엔딩 id 는 엔진이 m_{인물} 로 기록)
=== miss.common
[bg school]
[fx petal]
졸업식이 끝난 교문 앞. 사람들 사이로 {var.who}의 뒷모습이 보였다.
부르면 돌아볼 것 같았다. 그런데 이름이 목에 걸려 나오지 않았다.
그때 말할걸. 그 봄에, 그 여름에, 몇 번이고 기회가 있었는데.
배꽃이 떨어졌다. {var.who}은(는) 끝내 돌아보지 않았다.
