import { ImageResponse } from "next/og";

export const alt = "AI Digital Transformation Workbench";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 分享卡片（Open Graph / Twitter）。
 * 采用拉丁字符，避免 ImageResponse 缺少 CJK 字体导致的渲染问题。
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #2348c7 0%, #1d2f6b 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: "26px", color: "#bcd3ff" }}>
            Enterprise AI · Digital Transformation
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "68px", fontWeight: 700, lineHeight: 1.15 }}>
            AI Digital Transformation Workbench
          </div>
          <div style={{ fontSize: "34px", color: "#d9e6ff" }}>
            Diagnose → Design → Deliver
          </div>
        </div>

        <div style={{ fontSize: "26px", color: "#bcd3ff" }}>
          by Connie Wang · 
        </div>
      </div>
    ),
    { ...size },
  );
}
