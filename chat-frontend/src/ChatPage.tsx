import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";


const API_URL = "http://localhost:5000"; // prilagodi port prema backendu

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [userName, setUserName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Start chat sesije
  const startSession = async () => {
    const res = await axios.post(`${API_URL}/api/session`, { userName });
    setSessionId(res.data.sessionId);
  };

  // Prikupi istoriju i poveži Socket.io kad imamo sessionId
  useEffect(() => {
    if (!sessionId) return;

    // Dohvati istoriju poruka
    axios.get(`${API_URL}/api/session/${sessionId}/messages`)
      .then(res => setMessages(res.data));

    // Poveži Socket.io
    const socket = io(API_URL);
    socket.emit("join", { sessionId });

    socket.on("message", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Slanje poruke
  const sendMessage = () => {
    if (message.trim() && sessionId && socketRef.current) {
      socketRef.current.emit("message", {
        sessionId,
        sender: "user",
        content: message
      });
      setMessage("");
    }
  };

  if (!sessionId) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: "60px auto" }}>
        <h2>Pokreni chat</h2>
        <input
          type="text"
          placeholder="Unesi ime (opciono)"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button onClick={startSession} style={{ width: "100%", padding: 8 }}>
          Startuj chat
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "30px auto", border: "1px solid #ddd", borderRadius: 8, padding: 24 }}>
      <h3>Chat ({userName || "Gost"})</h3>
      <div style={{ minHeight: 200, maxHeight: 320, overflowY: "auto", marginBottom: 8, background: "#fafaff", borderRadius: 4, padding: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 6, color: msg.sender === "user" ? "#235" : "#070" }}>
            <strong>{msg.sender === "user" ? (userName || "Gost") : "Agent"}:</strong> {msg.content}
            <div style={{ fontSize: 11, color: "#999" }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Poruka..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          onKeyDown={e => (e.key === "Enter") && sendMessage()}
        />
        <button onClick={sendMessage}>Pošalji</button>
      </div>
    </div>
  );
}