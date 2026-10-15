# 엄마 — 용돈(3달마다), 성적, 진로

=== chat.mom.allow1 on=allowance repeat=1
엄마| 이번 달 용돈 넣었다. 밥 거르지 말고!
* 고마워 엄마 ❤ {stress-2}
  엄마| 사랑해 우리 딸
* 조금만 더 주면 안 돼? {cha+1}
  엄마| 성적 보고 생각해 볼게 ㅋㅋ

=== chat.mom.allow2 on=allowance repeat=1
엄마| 용돈 보냈어. 학원비 아끼지 말고, 대신 몸 챙겨.
* 응. 엄마도. {stress-2}
  엄마| 엄마는 괜찮아. 너만 잘 자면 돼

=== chat.mom.allow3 on=allowance repeat=1
엄마| 요즘 늦게 들어오던데. 피곤하지?
엄마| 용돈 넣었어. 맛있는 거 사 먹어.
* 응, 좀 피곤해. {stress-3}
  엄마| 오늘은 일찍 자. 엄마가 깎은 사과 식탁에 있다
* 괜찮아! {stress-1}
  엄마| 괜찮다는 말은 엄마 닮았네

=== chat.mom.top on=exam:top repeat=1 delay=0
엄마| 우리 딸 전교 1등!!!
엄마| 용돈 더 보냈다!! 사랑해!!
* 엄마 딸이니까! {stress-3}
  엄마| 맞아 엄마 딸이니까!!!

=== chat.mom.high on=exam:high repeat=1 delay=0
엄마| 성적표 봤어~ 잘했다 우리 딸
* 다음엔 더 잘할게. {int+1}
  엄마| 지금도 충분해. 진짜야

=== chat.mom.mid on=exam:mid repeat=1 delay=0
엄마| 성적표 봤다.
엄마| 다음엔 조금만 더 해 보자? 엄마는 믿어.
* 응. 해 볼게. {stress+1}
  엄마| 그래. 대신 무리는 하지 말고
* 나 진짜 열심히 했어… {stress-2}
  엄마| 알아. 엄마가 말을 잘못했네. 수고했어

=== chat.mom.low on=exam:low repeat=1 delay=0
엄마| …성적표 봤다.
엄마| 저녁에 얘기 좀 하자.
* 알았어… {stress+3}
  엄마| 혼내려는 거 아니야. 네가 요즘 어떤지 듣고 싶어서
* 나도 속상해. {stress+1}
  엄마| 그래. 그럼 오늘은 그냥 같이 밥 먹자

=== chat.mom.goal on=counsel:decide delay=0
엄마| 담임 선생님한테 전화 왔었어. {goal}, 하고 싶다며?
엄마| 엄마한테 먼저 말해 주지.
* 엄마가 반대할까 봐. {spirit+1}
  엄마| 반대 안 해. 걱정은 하겠지만.
  엄마| 네 꿈이니까 네가 정해. 엄마는 뒤에 있을게
* 응, 정했어. 해 볼래. {stress-3}
  엄마| 그래. 우리 딸이 정한 거면.

=== chat.mom.tired on=tired delay=0
엄마| 너 요즘 얼굴이 반쪽이야.
엄마| 학원 하루 빼. 엄마가 전화할게.
* 응… 하루만. {stress-6}
  엄마| 하루 쉰다고 안 무너져. 엄마가 해 봐서 알아
* 괜찮아. 할 수 있어. {stress+2}
  엄마| 고집은 누굴 닮아서… 그럼 밥이라도 꼭 먹어
