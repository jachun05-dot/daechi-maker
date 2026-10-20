/* 메신저 대화방 — 폰 탭과 진행 중 알림(오버레이)에서 같이 쓴다 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { useGame } from '@/store/game';
import { useUI, ui } from '@/store/ui';
import { CHARACTERS, NPCS, isCharId } from '@/content/characters';
import { POLITE, TOPICS } from '@/content/phone';
import type { CharId } from '@/engine/types';
import { choicesOf, dayTitle, openRoom, reply, roomName, startCall, topicsFor, type Room } from '@/engine/phone';
import { avatarImage, photoImage } from '@/engine/assets';
import { game } from '@/engine/state';
import { Mono } from '../common/Mono';
import { Icon } from '../common/Icon';

export const roomInfo = (r: string) => (isCharId(r)
  ? { name: CHARACTERS[r].name, color: CHARACTERS[r].color, mark: CHARACTERS[r].hanja[0], img: avatarImage(r) }
  : { name: NPCS[r]?.name ?? r, color: NPCS[r]?.color, mark: (NPCS[r]?.name ?? r).slice(-2, -1) || r[0], img: avatarImage(r) });

export function ChatRoom({ room, onBack, backLabel }: { room: Room; onBack: () => void; backLabel?: string }) {
  const { state: st } = useGame();
  const typing = useUI(s => s.typing);
  const [calling, setCalling] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (st) openRoom(st, room); }, [room]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }); });
  // 방을 보고 있는 동안 도착한 말풍선도 바로 읽음
  useEffect(() => { if (st?.unread[room]) openRoom(st, room); });
  if (!st) return null;
  const info = roomInfo(room);
  const msgs = st.chats[room] ?? [];
  const choices = typing ? [] : choicesOf(st, room);
  const canCall = isCharId(room) && !st.pending[room] && !game.midMonth && !typing;
  const topics = isCharId(room) ? topicsFor(st, room) : [];

  return (
    <div className="phone chatroom">
      <div className="phone-top">
        <button onClick={onBack} aria-label={backLabel ?? '뒤로'}><Icon name="back" /></button>
        <Mono src={info.img} text={info.mark} color={info.color} round size={28} />
        <b>{info.name}</b>
        {st.pending[room] && <span className="wait">답장 기다리는 중</span>}
      </div>
      <div className="chat" ref={ref}>
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const newDay = m.day !== undefined && m.day !== prev?.day;
          const head = m.from === 'them' && (prev?.from !== 'them' || newDay);
          return (
            <Fragment key={i}>
            {newDay && <div className="bday">{dayTitle(m.day!)}</div>}
            <div className={`brow ${m.from}${head ? ' head' : ''}`}>
              {m.from === 'them' && <span className="bav">{head && <Mono src={info.img} text={info.mark} color={info.color} round size={30} />}</span>}
              <div className="bcol">
                {head && <small className="bname">{info.name}</small>}
                {m.photo
                  ? <div className="bubble photo">{photoImage(m.photo) ? <img src={photoImage(m.photo)} alt={m.text} /> : <div className="ph">📷<span>{m.text}</span>{game.settings.showSlots && <code>photo/{m.photo}</code>}</div>}</div>
                  : <div className={`bubble ${m.from}`}>{m.text}</div>}
              </div>
              {m.time && m.from !== 'sys' && <time>{m.time.split(' ')[1]}</time>}
            </div>
            </Fragment>
          );
        })}
        {typing === room && <div className="brow them"><span className="bav" /><div className="bubble them typing"><i /><i /><i /></div></div>}
      </div>
      {choices.length > 0 && (
        <div className="replies">
          {choices.map((c, i) => <button key={i} onClick={() => reply(st, room, i)}>{c}</button>)}
        </div>
      )}
      {!choices.length && isCharId(room) && (
        <div className="call-bar">
          {calling ? (
            <div className="topics">
              {topics.map(t => (
                <button key={t.topic} disabled={!t.ok} onClick={() => { setCalling(false); startCall(st, room, t.topic); }}>
                  <b>{TOPICS[t.topic].label}</b><span>{t.ok ? (POLITE.includes(room as CharId) ? TOPICS[t.topic].polite : TOPICS[t.topic].text) : t.why}</span>
                </button>
              ))}
              <button className="cancel" onClick={() => setCalling(false)}>닫기</button>
            </div>
          ) : (
            <button className="call" disabled={!canCall || st.phoneTime <= 0} onClick={() => setCalling(true)}>
              먼저 톡 보내기 <small>이번 달 {st.phoneTime}번 남음{game.midMonth ? ' · 한 달이 끝난 뒤에' : ''}</small>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** 진행 중에 도착한 톡 알림 */
export function ChatNotice() {
  const n = useUI(s => s.notice);
  if (!n) return null;
  const info = roomInfo(n.room);
  return (
    <div className="layer notice-layer">
      <div className="notice">
        <div className="notice-h"><span>메시지</span><time>{n.time}</time></div>
        <div className="notice-b">
          <Mono src={info.img} text={info.mark} color={info.color} round size={38} />
          <div><b>{roomName(n.room)}</b><p>{n.text}</p></div>
        </div>
        <div className="notice-f">
          <button className="btn" onClick={() => ui.noticeDone(false)}>나중에</button>
          <button className="btn primary" onClick={() => ui.noticeDone(true)}>지금 보기</button>
        </div>
      </div>
    </div>
  );
}

/** 진행 화면 위에 띄우는 대화방 */
export function ChatOverlay() {
  const room = useUI(s => s.chatRoom);
  const typing = useUI(s => s.typing);
  if (!room) return null;
  return (
    <div className="layer chat-layer">
      <ChatRoom room={room as Room} backLabel="닫기" onBack={() => { if (!typing) ui.closeChat(); }} />
    </div>
  );
}
