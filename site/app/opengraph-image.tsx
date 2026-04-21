import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at top, rgba(59,130,246,0.28), transparent 25%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.22), transparent 22%), linear-gradient(180deg, #050816 0%, #070d1d 40%, #04070f 100%)",
          color: "white",
          padding: "56px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              height: "72px",
              width: "72px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #34d399 0%, #38bdf8 50%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            Tipspay
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: "920px",
            }}
          >
            Reserve your Tipspay username before wallet access begins
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.8)",
              maxWidth: "840px",
              lineHeight: 1.4,
            }}
          >
            OTP-based launch access, secure reservation locks and premium wallet
            onboarding for Tipschain.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
