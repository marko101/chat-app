import React from "react";
import { Session } from "./types";

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  closeSession: (id: string) => void;
}

export default function SessionList({
  sessions,
  activeSessionId,
  setActiveSessionId,
  closeSession
}: Props) {
  return (
    <div>
      <h5 className="mt-2">Aktivne sesije</h5>
      <ul className="list-group">
        {sessions.map(sess => (
          <li
            key={sess.id}
            className={
              "list-group-item list-group-item-action d-flex justify-content-between align-items-center" +
              (sess.id === activeSessionId ? " active" : "")
            }
            style={{ cursor: "pointer" }}
            onClick={() => setActiveSessionId(sess.id)}
          >
            <div>
              <strong>{sess.userName || "Gost"}</strong>
              <br />
              <small className="text-muted">{new Date(sess.createdAt).toLocaleString()}</small>
            </div>
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
          </li>
        ))}
      </ul>
    </div>
  );
}