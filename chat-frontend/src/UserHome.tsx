import React, { useState } from "react";
import ChatPage from "./ChatPage"; // tvoje postojeće user chat rešenje

export default function UserHome() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div style={{ position: "relative", minHeight: 400 }}>
      <h1>Dobrodošli na moj sajt!</h1>
      <p>Ovo je opšti sadržaj sajta. Prikaži šta želiš ovde...</p>

      {/* Plutajući taster */}
      <button
        className="btn btn-primary"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          borderRadius: "50%",
          width: 64,
          height: 64,
          boxShadow: "0 4px 20px #0003",
          fontSize: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={() => setShowChat(true)}
        aria-label="Otvori chat"
      >
        💬
      </button>

      {/* Chat prozor kao modal */}
{showChat && (
  <div style={{
    position: "fixed",
    bottom: 100,
    right: 24,
    width: 370,
    maxWidth: "90vw",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    zIndex: 1001,
    boxShadow: "0 8px 48px #0003"
  }}>
    <ChatPage onClose={() => setShowChat(false)} />
  </div>
      )}
    </div>
  );
}