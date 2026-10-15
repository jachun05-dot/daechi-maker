/* 스마트폰 탭 — 메신저 */
import { useGame } from '@/store/game';
import { useUI } from '@/store/ui';
import { TURNS } from '@/content/calendar';
import { CHAR_ORDER } from '@/content/characters';
import { isRoom } from '@/engine/phone';
import { Mono } from '../common/Mono';
import { NeedGame } from '../common/NeedGame';
import { ChatRoom, roomInfo } from '../phone/Chat';

export function PhoneTab() {
  const { state: st } = useGame();
  const room = useUI(s => s.phoneRoom);
  if (!st) return <NeedGame />;
  if (room && isRoom(room)) return <ChatRoom room={room} onBack={() => useUI.setState({ phoneRoom: null })} />;

  // 대화가 있는 방 + 만났지만 아직 대화가 없는 사람 (먼저 연락할 수 있게)
  const rooms = [...new Set([...Object.keys(st.chats), ...CHAR_ORDER.filter(c => st.met[c])])].filter(isRoom);
  const lastIdx = (r: string) => st.chats[r]?.length ?? 0;
  rooms.sort((a, b) => (st.unread[b] ?? 0) - (st.unread[a] ?? 0) || (st.pending[b] ? 1 : 0) - (st.pending[a] ? 1 : 0) || lastIdx(b) - lastIdx(a));
  return (
    <div className="phone">
      <div className="phone-top"><b>메시지</b><span>{TURNS[st.turn].label} · 먼저 톡 {st.phoneTime}번</span></div>
      {!rooms.length && <p className="empty">아직 도착한 메시지가 없어요.</p>}
      {rooms.map(r => {
        const info = roomInfo(r), msgs = st.chats[r] ?? [], last = msgs[msgs.length - 1];
        const p = st.pending[r];
        const left = p ? Math.max(0, 3 - (st.day - p.arrived)) : 0;
        return (
          <button key={r} className="room" onClick={() => useUI.setState({ phoneRoom: r })}>
            <Mono src={info.img} text={info.mark} color={info.color} round />
            <div className="room-tx">
              <b>{info.name}</b>
              <span>{last ? (last.photo ? '사진' : last.text.split('\n')[0]) : '아직 대화가 없다'}</span>
            </div>
            <div className="room-r">
              {last?.time && <time>{last.time}</time>}
              {st.unread[r] ? <span className="badge">{st.unread[r]}</span> : p ? <span className="wait">답장 {left > 0 ? `D-${left}` : '오늘까지'}</span> : null}
            </div>
          </button>
        );
      })}
      <p className="phone-note">답장이 필요한 톡은 3일 안에 답하세요. 읽고 안 하면 읽씹, 안 열면 안읽씹 — 사람마다 받아들이는 게 달라요.</p>
    </div>
  );
}
