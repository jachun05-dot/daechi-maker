# 방학 — 특강을 고르면 시간이 빠르게 지나간다. 이벤트 제안은 엔진이 톡으로 보여준다
# var.season(summer/winter), var.lecture(특강 이름)

=== vacation.start
[bg academy]
[if var.season=summer]
  [fx rain]
  여름방학. 대치동의 방학은 학기보다 뜨겁다.
  엄마| 방학 특강 등록했니? 옆집 애는 벌써 세 개 끊었다더라.
[else]
  [fx snow]
  겨울방학. 학원가의 불빛이 눈송이에 번졌다.

=== vacation.lecture
[bg academy]
{var.lecture}. 하루하루가 똑같이, 그리고 빠르게 지나갔다.
정신을 차려 보니 방학이 절반쯤 지나 있었다.

=== vacation.decline
[bg room]
두 사람의 메시지에 미안하다고 답장을 보냈다.
이번 방학은, 나에게 쓰기로 했다.
