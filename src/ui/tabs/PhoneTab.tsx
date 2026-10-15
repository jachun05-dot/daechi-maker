/* 스마트폰 탭 — 메신저 */
import { useEffect, useRef } from 'react';
import { useGame } from '@/store/game';
import { useUI } from '@/store/ui';
import { CHARACTERS, NPCS, isCharId } from '@/content/characters';
import { TURNS } from '@/content/calendar';
import { answer } from '@/engine/phone';
import { refresh, saves } from '@/engine/state';
import { avatarImage } from '@/engine/assets';
import { Mono } from '../common/Mono';
import { Icon } from '../common/Icon';
import { NeedGame } from '../common/NeedGame';

const roomInfo = (r: string) => (isCharId(r) ? { name: CHARACTERS[r].name, color: CHARACTERS[r].color, mark: CHARACTERS[r].hanja[0], img: avatarImage(r) } : { name: NPCS[r]?.name ?? r, color: NPCS[r]?.color, mark: (NPCS[r]?.name ?? r).slice(-2, -1) || r[0], img: avatarImage(r) });

export function PhoneTab() {
  const { state: st } = useGame();
  const room = useUI(s => s.phoneRoom);
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; });
  if (!st) return <NeedGame />;

  if (room) {
    const info = roomInfo(room);
    if (st.unread[room]) { st.unread[room] = 0; queueMicrotask(refresh); }
    return (
      <div className="phone">
        <div className="phone-top"><button onClick={() => useUI.setState({ phoneRoom: null })} aria-label="뒤로"><Icon name="back" /></button><b>{info.name}</b></div>
        <div className="chat" ref={chatRef}>
          {(st.chats[room] ?? []).map((m, i) => <div key={i} className={`bubble ${m.from}`}>{m.text}</div>)}
        </div>
        {st.replies[room] && (
          <div className="replies">
            {st.replies[room].map((r, i) => <button key={i} onClick={() => { answer(st, room, i); saves.autosave(); refresh(); }}>{r.text}</button>)}
          </div>
        )}
      </div>
    );
  }

  const rooms = Object.keys(st.chats).sort((a, b) => (st.unread[b] ?? 0) - (st.unread[a] ?? 0));
  return (
    <div className="phone">
      <div className="phone-top"><b>메시지</b><span>{TURNS[st.turn].label}</span></div>
      {!rooms.length && <p className="empty">아직 도착한 메시지가 없어요.</p>}
      {rooms.map(r => {
        const info = roomInfo(r), msgs = st.chats[r], last = msgs[msgs.length - 1];
        return (
          <button key={r} className="room" onClick={() => useUI.setState({ phoneRoom: r })}>
            <Mono src={info.img} text={info.mark} color={info.color} round />
            <div className="room-tx"><b>{info.name}</b><span>{last.text.split('\n')[0]}</span></div>
            {st.unread[r] ? <span className="badge">{st.unread[r]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
