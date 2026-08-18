import React from "react";
import { C } from "../theme";

/** Simple phone shell. Children render inside the screen area. */
export const PhoneFrame: React.FC<{
  width: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, children, style }) => {
  const height = width * 2.02;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.13,
        background: C.bg,
        border: `${Math.max(3, width * 0.018)}px solid ${C.border}`,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: height * 0.018,
          left: "50%",
          transform: "translateX(-50%)",
          width: width * 0.3,
          height: width * 0.032,
          borderRadius: 999,
          background: C.border,
        }}
      />
      <div style={{ position: "absolute", inset: 0, paddingTop: height * 0.06 }}>
        {children}
      </div>
    </div>
  );
};
