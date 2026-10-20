# 한태준 — 동갑 반말. 새벽에 온다. 보냈다 지운다

=== chat.taejun.lounge on=main:taejun.1
taejun| 어제 라운지.
taejun| 본 거 다 잊어. 통화한 거.
* 아무것도 못 봤어. {taejun+3}
  taejun| …그래. 고맙다.
  taejun| 디저트 맛있었어? 다음엔 제대로 사 줄게.
* 엄마랑은 괜찮아? {taejun+2 spirit+1}
  taejun| 뭘 물어. 괜찮아.
  메시지를 삭제했습니다
  taejun| 아니. 근데 괜찮아질 거야. 늘 그랬어.

=== chat.taejun.question on=main:taejun.2
taejun| 아까 그 질문.
taejun| 내가 뭘 하고 싶냐고.
taejun| 새벽 세 시인데 아직도 생각 중이야. 너 때문에.
* 답 안 나와도 돼. 생각해 본 게 처음이잖아. {taejun+4 spirit+1}
  taejun| …응. 처음이야.
  taejun| 이상하게 숨이 좀 쉬어져.
* 생각나면 제일 먼저 말해 줘. {taejun+3}
  taejun| 제일 먼저.
  taejun| 그런 자리 아무한테도 안 줬는데. 줄게.

=== chat.taejun.bag on=main:taejun.3
taejun| 오늘 그 쇼핑백. 버렸어.
taejun| 그런 걸로 덮으려고 한 거, 나 원래 그래. 알아.
* 알아. 그래도 말해 줘서 고마워. {taejun+3}
  taejun| 무서웠다는 말, 너한테 처음 해 봤어.
  taejun| 이상하다. 말하고 나니까 덜 무서워.
* 다음엔 늦을 것 같으면 미리 말해 줘. 그거면 돼. {taejun+4}
  taejun| 미리.
  taejun| …해 볼게. 진짜로 해 볼게.

=== chat.taejun.kept on=promise:kept:taejun
taejun| 오늘 아무것도 안 샀다.
taejun| 너랑 있으면 뭘 안 사도 되더라.
* 원래 그런 거야. {taejun+3}
  taejun| 원래 그런 걸 나만 몰랐네.
* 다음엔 떡볶이 사. {taejun+2}
  taejun| 떡볶이. 메모했어.
  [photo taejun_gift 떡볶이 기프티콘]
  taejun| 미리 보냈어. 이건 비싼 거 아니니까 받아.
  [effect stress-5]

=== chat.taejun.declined on=promise:declined:taejun
taejun| 됐어.
taejun| 바쁘겠지, 너도.
메시지를 삭제했습니다
* 미안. 바빴던 거 맞아. 다음 주는 꼭. {taejun+3}
  taejun| …진짜지.
  taejun| 진짜라고 해 줘.
* 방금 지운 거 뭐야? {taejun+2 spirit+1}
  taejun| 아무것도.
  taejun| ‘나도 그냥 버려지는 거냐’였어. 지운 이유 알겠지.

=== chat.taejun.night on=idle aff=15
taejun| 자?
taejun| 아 안 자도 돼. 그냥 엄마 잠들어서. 집이 조용해서.
* 안 자. 얘기해. {taejun+3}
  taejun| 무슨 얘기를 해야 할지 모르겠어. 그냥 있어 줘.
  taejun| …고맙다.
* 너도 자. 새벽 세 시야. {taejun+2}
  taejun| 잔다.
  taejun| 네 말이니까.

=== chat.taejun.watch on=idle aff=35
[photo taejun_watch 새로 산 시계]
taejun| 샀어. 오늘.
taejun| 별로 기쁘진 않더라. 이상하지.
* 왜 샀는데? {taejun+3 spirit+1}
  taejun| 엄마가 울었어. 그래서.
  taejun| 이거 말한 사람 너밖에 없다.
* 예쁘다. 근데 너 얼굴이 더 안 좋아 보여. {taejun+3}
  taejun| 들켰네.
  taejun| …다음엔 사기 전에 너한테 톡할게.

=== chat.taejun.dream on=dream:taejun1
taejun| 꿈에서 담을 넘었어.
taejun| 웃기지. 나 담 같은 거 넘어 본 적도 없는데. 엄청 시원했어.
* 넘어 보면 되지. 같이. {taejun+4 spirit+2}
  taejun| 같이.
  taejun| …그럼 무서워도 될 것 같다.
* 꿈에서라도 시원했으면 됐어. {taejun+2}
  taejun| 응. 근데 깨기 직전엔 대문 앞이었어.
  taejun| 이상하게 그게 계속 생각나.

=== chat.taejun.stress on=stress aff=25
taejun| 너 요즘 표정 안 좋더라.
taejun| …나 같아서 신경 쓰여.
* 너도 그래? {taejun+3 spirit+1}
  taejun| 나는 원래 그래. 근데 너까지 그러면 안 되지.
  taejun| 내일 아무것도 하지 말고 나와. 아무것도 안 사고 걷기만 하자.
* 괜찮아. 지나갈 거야. {taejun+2}
  taejun| 그 말 나도 맨날 해.
  taejun| 그러니까 안 믿어.

# ---------- 먼저 연락하기 ----------
=== call.taejun.hello
[if aff.taejun<20]
  taejun| 뭔데.
  * 그냥. {taejun+1}
    taejun| 그냥으로 연락하는 사람 처음 봐.
    taejun| …나쁘진 않다.
[else]
  taejun| 너 먼저 연락한 거 처음이다.
  taejun| 캡처했어. 아 이건 말 안 하려고 했는데.
  * 캡처는 왜 해 ㅋㅋ {taejun+3}
    taejun| 증거. 네가 먼저 찾았다는 증거.
  * 앞으로 자주 할게. {taejun+3}
    taejun| …진짜지. 말 바꾸지 마.

=== call.taejun.promise
[if aff.taejun<25]
  taejun| 주말엔 엄마랑 일정 있어.
  taejun| …미안.
[else]
  [promise]
  taejun| {var.when}. {var.where}.
  taejun| 엄마한텐 친구 만난다고 할게. 진짜 친구 만나는 거니까 거짓말도 아니고.

=== call.taejun.worry
taejun| 누가 그랬어. 말해.
* 누가 그런 게 아니라 그냥 지쳐서. {taejun+3 stress-6}
  taejun| …그거 나도 알아. 이유 없이 무거운 거.
  taejun| 오늘은 아무것도 하지 마. 내가 허락할게. 웃기지.
* 들어 줘서 고마워. {taejun+2 stress-4}
  taejun| 나한테 고맙다고 하는 사람, 너밖에 없다.

=== call.taejun.dream
taejun| 무슨 꿈.
* 네가 문 뒤에 서 있었어. 나오지 못하고. {taejun+4 spirit+2}
  taejun| ……
  taejun| 그거 나 맞다. 이상하게 너무 나 같아.
  taejun| 다음엔 나올게. 꿈에서라도.
* 그냥 네가 나왔어. {taejun+1}
  taejun| 꿈에서도 비싼 거 입고 있었냐 ㅋ
