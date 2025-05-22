import React from "react";
import { Session } from "./types";

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  closeSession: (id: string) => void;
  unread: { [sessionId: string]: boolean };  // OVO DODAJ!
}



export default function SessionList({
  sessions,
  activeSessionId,
  setActiveSessionId,
  closeSession,
  unread
}: Props & { unread: { [id: string]: boolean } }) {
  return (
    <ul className="list-group">
      {sessions.map(sess => (
        <li
  key={sess.id}
  className={
    "list-group-item list-group-item-action d-flex justify-content-between align-items-center" +
    (sess.id === activeSessionId ? " active" : "")
  }
  style={{
    cursor: "pointer",
    background: unread[sess.id] ? "linear-gradient(90deg, #b7fdbb 0%, #fff 100%)" : undefined,
    animation: unread[sess.id]
      ? "unread-flash 0.7s linear infinite alternate"
      : undefined
  }}
  onClick={() => setActiveSessionId(sess.id)}
>
  <div>
    <strong>{sess.userName || "Gost"}</strong>
    <br />
    <small className="text-muted">{new Date(sess.createdAt).toLocaleString()}</small>
  </div>
  {/* Zatvaranje sesije */}
  <button
    className="btn btn-sm btn-outline-danger ms-2"
    title="Zatvori sesiju"
    onClick={e => {
      e.stopPropagation();
      closeSession(sess.id);
    }}
  >
    ✕
  </button>
  {/* Badge ako ima nepročitanih */}
  {unread[sess.id] && (
    <span
      style={{
        marginLeft: 8,
        color: "#28a745",
        fontWeight: 800,
        animation: "unread-pulse 0.9s linear infinite alternate"
      }}
    >●</span>
  )}
</li>
      ))}
    </ul>
  );
}