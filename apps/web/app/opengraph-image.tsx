import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Maine CyberTech";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0A1118 0%, #121E2D 50%, #0A1118 100%)",
        fontFamily: "sans-serif",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(5, 150, 105, 0.3)",
          borderRadius: "24px",
          padding: "60px 80px",
          background: "rgba(5, 150, 105, 0.05)",
        }}
      >
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            letterSpacing: "4px",
            color: "#f8fafc",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Maine <span style={{ color: "#059669" }}>Cyber</span>
          Tech
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          Managed IT &amp; Cybersecurity for Maine Organizations
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "#059669",
            letterSpacing: "8px",
            textTransform: "uppercase",
          }}
        >
          mainecybertech.com
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
