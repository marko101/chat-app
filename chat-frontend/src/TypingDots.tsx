import React from "react";

export default function TypingDots() {
  return (
    <span style={{ display: "inline-block", marginLeft: 4 }}>
      <span className="dot" style={dotStyle(0)}>.</span>
      <span className="dot" style={dotStyle(1)}>.</span>
      <span className="dot" style={dotStyle(2)}>.</span>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0);}
            40% { transform: translateY(-7px);}
          }
        `}
      </style>
    </span>
  );
}
function dotStyle(i: number): React.CSSProperties {
  return {
    display: "inline-block",
    margin: "0 2px",
    fontSize: 18,
    animation: `bounce 1s infinite`,
    animationDelay: `${i * 0.18}s`
  };
}