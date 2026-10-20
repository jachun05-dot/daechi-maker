# 메신저 대화 작성법 (이 파일은 설명만 — 장면 없음)
#
# === chat.{방}.{이름} on=사건 aff=최소호감도 if=조건 delay=며칠뒤 time=시각 repeat=1
#   방: ian mujin doyun taejun seoha ihyun sihyun jiyu mom
#   상대 말풍선:  ian| 내용   (지유는 지유| , 엄마는 엄마| )
#   내 말풍선:    me| 내용
#   시스템 문구:  그냥 쓰면 가운데 회색 (예: 메시지를 삭제했습니다)
#   답장 선택지:  * 내 답장 {ian+3 stress-2}  → 아래 2칸 들여쓰기에 상대 반응
#   사진:        [photo 사진id 설명]  → 앨범에 저장, 이미지는 photo/사진id.png
#   약속:        [promise]  → 이번 주말 그 사람이 있는 곳에 약속이 잡힌다. 다음 줄부터 {var.when} {var.where}
#   한 회차에 한 번만 온다 (repeat=1 이면 여러 번)
#
# on= 사건 (쉼표로 여러 개) — 전체 목록·설명은 src/engine/triggers.ts
#   main:ian.2        메인 이벤트 본 뒤
#   meet:ian          주말·학교에서 마주친 뒤
#   promise:kept:ian / promise:declined:ian   약속 지킴 / 거절
#   weather:rain / weather:snow               비·눈 오는 주말
#   exam:top|high|mid|low · sports:win|lose · festival:ok|fail · counsel:hint|decide · suneung
#   jealous:ian / jealous:mujin               그 사람이 질투로 호감을 잃었을 때 (한 달에 한 번)
#   dream:ian1        그 전생 기억을 처음 꾼 뒤
#   turn:0 (1학년 3월) · month:12 · year:2 · allowance(3달마다) · idle(근황, 매주 가끔) · stress · tired · slump · vac:ian
#
# 먼저 연락하기 답장: === call.{인물}.{hello|promise|worry|dream}  (on 없음, 여러 번 쓰인다)
#   [if aff.ian<20] 처럼 호감도에 따라 단답·거절을 나눈다. 아무 말도 안 하면 "읽음"만 남는다(읽씹당함)
