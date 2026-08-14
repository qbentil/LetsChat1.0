import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { RtcRole, RtcTokenBuilder } = require("agora-token");

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

function generateToken(appId, appCertificate, channel, uid) {
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS,
  );
}

export default function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const appId = process.env.VITE_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({
        error:
          "Missing VITE_AGORA_APP_ID or AGORA_APP_CERTIFICATE. Add them in your Vercel project settings.",
      });
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const channel = url.searchParams.get("channel") ?? "";
    const uid = url.searchParams.get("uid") ?? "";

    if (!uid || !channel) {
      return res.status(400).json({ error: "Missing channel or uid query parameters." });
    }

    const token = generateToken(appId, appCertificate, channel, uid);
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Agora token error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate token",
    });
  }
}
