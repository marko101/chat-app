import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import SessionList from "./SessionList";
import ChatWindow from "./ChatWindow";
import { Session, Message } from "./types";

const API_URL = "http://localhost:5000";

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const token = localStorage.getItem("adminToken");
  const [unread, setUnread] = useState<{ [sessionId: string]: boolean }>({});

  // Povuci sve AKTIVNE sesije na početku
  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setSessions(res.data));
  }, [token]);

  // Slušaj za nove sesije uživo (preko poruka)
  useEffect(() => {
  const socket = io(API_URL, { transports: ["websocket"] });

  // Listener za novu sesiju (new chat)
  socket.on("newSession", (data: { sessionId: string }) => {
    // Povuci podatke o novoj sesiji iz backend-a
    axios.get(`${API_URL}/api/admin/session/${data.sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setSessions(sessions => [res.data, ...sessions]);
    });
  });

  return () => { socket.disconnect(); };
}, [token]);

  // Pronađi trenutno aktivnu sesiju
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Zatvori sesiju (na X dugme)
  const closeSession = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/session/${id}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(sessions => sessions.filter(s => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (err) {
      alert("Greška pri zatvaranju sesije!");
    }
  };

  const handleSetActiveSession = (id: string) => {
  setActiveSessionId(id);
  setUnread(prev => ({ ...prev, [id]: false }));
};

  return (
    <div className="row" style={{ minHeight: 540 }}>
      <div className="col-12 col-md-4 border-end">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={handleSetActiveSession}
          closeSession={closeSession}
          unread={unread}
        />
      </div>
      <div className="col-12 col-md-8">
        {activeSession ? (
          <ChatWindow session={activeSession} token={token!} />
        ) : (
          <div className="d-flex h-100 align-items-center justify-content-center">
            <span className="text-secondary">Izaberi chat sesiju sa leve strane</span>
          </div>
        )}
      </div>
    </div>
  );
}