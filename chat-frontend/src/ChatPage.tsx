import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Message } from "./types"; // Session ti ne treba ovde
import TypingDots from "./TypingDots";

const API_URL = "http://localhost:5000"; // prilagodi port prema backendu

export default function ChatPage({ onClose }: { onClose: () => void }) {
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
  <div
    style={{
      maxWidth: 410,
      margin: "30px auto",
      border: "1.5px solid #dde4ee",
      borderRadius: 18,
      background: "#f9fbfd",
      boxShadow: "0 8px 40px #1e2b5c14",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: 540
    }}
  >
    {/* HEADER */}
    <div
      style={{
        width: "100%",
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: "18px 18px 0 0",
        padding: "10px 20px 10px 16px",
        background: "linear-gradient(90deg, #2252b8 0%, #51a8f7 100%)",
        color: "#fff",
        boxShadow: "0 2px 10px #2252b811",
        borderBottom: "1px solid #e6ebf2",
        position: "relative"
      }}
    >
      <img
        src="/live-chat_eng_hwholv.avif"
        alt="Podrška"
        width={44}
        height={44}
        style={{
          borderRadius: "50%",
          marginRight: 8,
          border: "2.5px solid #fff",
          boxShadow: "0 0 7px #2252b822",
          background: "#fff"
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>
          Maja • Live Support
        </div>
        <div style={{ fontSize: 13, color: "#d3fff1", display: "flex", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#24e387",
              marginRight: 7,
              boxShadow: "0 0 7px #1bffbb"
            }}
          /> Online
        </div>
      </div>
      {/* Powered by desno */}
      <div style={{ fontSize: 11, color: "#e4ebff", opacity: 0.82, marginRight: 17 }}>
        powered by <span style={{ color: "#fff", fontWeight: 500 }}>LiveChat</span>
      </div>
      <button
        style={{
          position: "absolute",
          top: 14,
          right: 10,
          border: "none",
          background: "transparent",
          color: "#fff",
          fontWeight: 800,
          fontSize: 23,
          cursor: "pointer",
          opacity: 0.7,
          transition: "opacity 0.2s"
        }}
        onClick={onClose}
        aria-label="Zatvori chat"
        title="Zatvori"
      >
        ×
      </button>
    </div>

    {/* CHAT MESSAGES */}
    <div
      style={{
        height: 320, // ili 300 ili 350 po želji
        overflowY: "auto",
        background: "#f9fbfd",
        padding: "22px 12px 8px 12px"
      }}
    >
      {messages.length === 0 && (
        <div style={{ color: "#aaa", textAlign: "center", fontSize: 15, padding: "60px 0 20px 0" }}>
          Nema poruka. Počni razgovor!
        </div>
      )}
      {messages.map(msg => (
        <div
          key={msg.id}
          style={{
            display: "flex",
            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            marginBottom: 10
          }}
        >
          <div
            style={{
              background: msg.sender === "user" ? "#4fa7ff" : "#e5f7ff",
              color: msg.sender === "user" ? "#fff" : "#235",
              borderRadius: msg.sender === "user" ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
              padding: "8px 16px",
              maxWidth: "70%",
              fontSize: 15,
              boxShadow: "0 1px 5px #195bb020",
              border: msg.sender === "user" ? "1px solid #b8e4fc" : "1px solid #d4eefb"
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 2, fontSize: 13, opacity: 0.85 }}>
              {msg.sender === "user" ? (userName || "Gost") : "Agent"}
            </div>
            <span>{msg.content}</span>
            <div style={{ fontSize: 10.5, color: "#7ab8e4", marginTop: 2, textAlign: "right" }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      {/* Sistem poruka */}
      {systemMessage && (
        <div style={{ color: "#d00", marginBottom: 13, fontWeight: 600, textAlign: "center" }}>
          {systemMessage}
        </div>
      )}
      {/* Typing dots */}
      {someoneTyping && (
        <div style={{ color: "#4fa7ff", fontSize: 15, margin: "7px 0", textAlign: "left" }}>
          Agent kuca <TypingDots />
        </div>
      )}
    </div>

    {/* INPUT ZONA */}
    <div
      style={{
        padding: "13px 13px 14px 13px",
        background: "#f4f7fa",
        borderTop: "1px solid #dde6ee",
        display: "flex",
        gap: 8,
        alignItems: "center"
      }}
    >
      <input
        type="text"
        placeholder="Poruka..."
        value={message}
        onChange={e => {
          setMessage(e.target.value);
          handleTyping();
        }}
        style={{
          flex: 1,
          padding: "11px 16px",
          border: "1.5px solid #b8e4fc",
          borderRadius: 10,
          fontSize: 15,
          background: "#fff",
          outline: "none",
          boxShadow: "0 1px 7px #aedfff22",
        }}
        onKeyDown={e => (e.key === "Enter") && sendMessage()}
        disabled={sessionClosed}
      />
      <button
        onClick={sendMessage}
        disabled={sessionClosed}
        style={{
          background: "linear-gradient(90deg, #27b3fe 0%, #51a8f7 100%)",
          color: "#fff",
          border: "none",
          padding: "10px 19px",
          borderRadius: 9,
          fontWeight: 700,
          fontSize: 15.5,
          boxShadow: "0 1px 8px #0b53b722",
          cursor: sessionClosed ? "not-allowed" : "pointer",
          opacity: sessionClosed ? 0.6 : 1,
          transition: "opacity 0.15s"
        }}
      >
        Pošalji
      </button>
    </div>
    {sessionClosed && (
      <div style={{
        marginTop: 0,
        color: "#c00",
        fontWeight: 500,
        textAlign: "center",
        padding: "11px 0 9px 0",
        background: "#fff2f2"
      }}>
        Ova chat sesija je završena i više nije moguće slati poruke.
      </div>
    )}
  </div>
);

}