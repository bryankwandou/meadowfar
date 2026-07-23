import { ImageResponse } from "next/og";

// Preview card shown when a link to Meadowfar is shared in chats / social.
export const alt = "Meadowfar — a gentle 3D open world for kids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(180deg, #9fd8ef 0%, #cdeeda 55%, #7cc26a 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* sun */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 110,
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "#fff3c4",
            boxShadow: "0 0 80px 30px rgba(255,243,196,0.7)",
          }}
        />
        {/* rolling hill */}
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -60,
            width: 1400,
            height: 420,
            borderRadius: "50%",
            background: "#5aa650",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 90px 80px",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 118, fontWeight: 800, color: "#123f1e", letterSpacing: -2 }}>
            Meadowfar
          </div>
          <div style={{ fontSize: 40, color: "#1c5730", marginTop: 8 }}>
            A gentle 3D open world to explore · Dunia terbuka 3D yang ramah anak
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
