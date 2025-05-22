import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Session, Message } from "./types";

const API_URL = "http://localhost:5000";

interface Props {
  session: Session;
  token: string;
}

export default function ChatWindow({ session, token }: Props) {
  const [messages, setMessages] = useState<Message[]>(session.messages || []);
  const [message, setMessage] = useState("");  
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Kad god se menja sesija, povuci poruke iz baze
  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/session/${session.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data));
  }, [session.id, token]);

  // Socket.io veza za ovu sesiju
  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket"] });
    socket.emit("join", { sessionId: session.id });

    socket.on("message", (msg: Message) => {
      if (msg.sessionId === session.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [session.id]);

  // Scroll na dno kad stigne nova poruka
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    socketRef.current.emit("message", {
      sessionId: session.id,
      sender: "agent",
      content: message
    });
    setMessage("");
  };

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 500 }}>
      <div className="flex-grow-1 overflow-auto mb-2" style={{ maxHeight: 420 }}>
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`mb-1 ${msg.sender === "agent" ? "text-end" : ""}`}
          >
            <span
              className={`badge ${msg.sender === "agent" ? "bg-primary" : "bg-secondary"}`}
            >
              {msg.sender === "agent" ? "Vi" : session.userName || "Gost"}
            </span>
            <span className="ms-2">{msg.content}</span>
            <div style={{ fontSize: 11, color: "#999" }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="input-group mt-2">
        <input
          type="text"
          className="form-control"
          placeholder="Poruka..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Pošalji
        </button>
      </div>
    </div>
  );
}