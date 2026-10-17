/* =========================================================
   이름(id) 바꾼 기록 — 출시 뒤 세이브를 지키는 장치
   세이브에는 장면·장소·일정 id 가 들어 있다 (본 꿈, 답장 대기 중인 톡, 단골 장소, 시간표 …).
   id 를 바꾸거나 지우면 이미 플레이 중인 사람의 세이브가 그 기록을 잃는다.

   - 바꿨다 → RENAMES 에 '옛 id': '새 id'   (세이브가 새 id 를 따라간다)
   - 지웠다 → RETIRED 에 옛 id               (세이브에서 조용히 정리된다)
   npm test 가 tests/fixtures/save-ids.json (출시된 id 목록) 과 비교해서
   어느 쪽에도 적지 않고 사라진 id 를 알려 준다. 새 버전을 낼 때 npm run save-ids 로 목록을 갱신.
   ========================================================= */
export interface IdMap { scenes: Record<string, string>; places: Record<string, string>; options: Record<string, string>; photos: Record<string, string> }

export const RENAMES: IdMap = {
  /** 장면: 전생 꿈(ian1 …), 톡(chat.… / call.…), 인물 이야기(main.…) — 앨범에도 쓰인다 */
  scenes: {},
  /** 주말 지도 장소 (content/places.ts) */
  places: {},
  /** 평일 일정·동아리 (content/timetable.ts) */
  options: {},
  /** 톡 사진 ([photo id …]) — 앨범 */
  photos: {},
};

export const RETIRED: Record<keyof IdMap, string[]> = {
  scenes: [],
  places: [],
  options: [],
  photos: [],
};
