import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Message } from "./types"; // Session ti ne treba ovde
import TypingDots from "./TypingDots";

const API_URL = "http://localhost:5000"; // prilagodi port prema backendu

export default function ChatPage() {
  const [userName, setUserName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [someoneTyping, setSomeoneTyping] = useState(false);

  useEffect(() => {
  if (!sessionId || !socketRef.current) return;
  const socket = socketRef.current;
  socket.on("typing", (data: { sender: string }) => {
    
    if (data.sender === "agent") {
      setSomeoneTyping(true);
      setTimeout(() => setSomeoneTyping(false), 2000);
    }
  });
  return () => {
    socket.off("typing");
  };
}, [sessionId]);

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

  // Slušaj zatvaranje sesije od strane admina
  socket.on("sessionClosed", (data: { message: string }) => {
    setMessages(prev => [
      ...prev,
      {
        id: "system-" + Date.now(),
        sessionId: sessionId!,
        sender: "system",
        content: data.message,
        timestamp: new Date().toISOString(),
      },
    ]);
    setSystemMessage(data.message);
    setSessionClosed(true);
  });

  // ---- OVO DODAJ! (slušaj typing event)
  socket.on("typing", (data: { sender: string }) => {
   
    if (data.sender === "agent") {
      setSomeoneTyping(true);
      setTimeout(() => setSomeoneTyping(false), 2000);
    }
  });

  socketRef.current = socket;

  return () => {
    socket.disconnect();
  };
}, [sessionId]);

// useRef za "debounce"
const typingTimeout = useRef<NodeJS.Timeout | null>(null);

const handleTyping = () => {
  if (!sessionId || !socketRef.current) return;
  socketRef.current.emit("typing", { sessionId, sender: "user" });

  if (typingTimeout.current) clearTimeout(typingTimeout.current);
  typingTimeout.current = setTimeout(() => {
    // Optionally: emit a stop-typing event if želiš (nije neophodno)
  }, 2000);
};

  // Slanje poruke
  const sendMessage = () => {
    if (!message.trim() || !sessionId || !socketRef.current || sessionClosed) return;
    socketRef.current.emit("message", {
      sessionId,
      sender: "user",
      content: message
    });
    setMessage("");
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
      <div style={{
        minHeight: 200,
        maxHeight: 320,
        overflowY: "auto",
        marginBottom: 8,
        background: "#fafaff",
        borderRadius: 4,
        padding: 12
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 6, color: msg.sender === "user" ? "#235" : "#070" }}>
            <strong>{msg.sender === "user" ? (userName || "Gost") : "Agent"}:</strong> {msg.content}
            <div style={{ fontSize: 11, color: "#999" }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        {/* Prikaži sistemsku poruku ako postoji */}
        {systemMessage && (
          <div style={{ color: "#d00", marginBottom: 10, fontWeight: 600 }}>
            {systemMessage}
          </div>
        )}

        {someoneTyping && (
        <div style={{ color: "#888", fontSize: 14, margin: "6px 0" }}>
          Agent kuca <TypingDots />
        </div>
      )}
      </div>
      
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Poruka..."
          value={message}
          onChange={e => {
            setMessage(e.target.value);
            handleTyping();
          }}
          style={{ flex: 1, padding: 8 }}
          onKeyDown={e => (e.key === "Enter") && sendMessage()}
          disabled={sessionClosed}
        />
        <button onClick={sendMessage} disabled={sessionClosed}>Pošalji</button>
      </div>
      {/* Opcionalno: dodatni info kada je sesija zatvorena */}
      {sessionClosed && (
        <div style={{ marginTop: 12, color: "#c00", fontWeight: 500 }}>
          Ova chat sesija je završena i više nije moguće slati poruke.
        </div>
      )}
    </div>
  );
}