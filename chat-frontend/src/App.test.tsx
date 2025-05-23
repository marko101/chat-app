// src/App.tsx
import React from "react";
import ChatPage from "./ChatPage";

function App() {
  return (
    <div style={{ background: "#f6f8fa", minHeight: "100vh" }}>
      <ChatPage onClose={() => {}} />  {/* Proveravajući samo da radi */}
    </div>
  );
}

export default App;
