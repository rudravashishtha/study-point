import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.description;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700, marginBottom: 8 }}>
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 28, color: "#94a3b8", textAlign: "center", maxWidth: 600 }}>
          {siteConfig.description}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: "#64748b",
            borderTop: "1px solid #334155",
            paddingTop: 24,
          }}
        >
          Classes IX — XII
        </div>
      </div>
    ),
    size,
  );
}
