import type { Connect, Plugin } from "vite";
import { loadEnv } from "vite";
import { generateAgoraToken, type AgoraTokenType } from "../server/generateAgoraToken";

function createTokenHandler(mode: string): Connect.NextHandleFunction {
  const env = loadEnv(mode, process.cwd(), "");
  const appId = env.VITE_AGORA_APP_ID;
  const appCertificate = env.AGORA_APP_CERTIFICATE;

  return (req, res, next) => {
    if (!req.url?.startsWith("/api/agora/token")) {
      next();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const channel = url.searchParams.get("channel") ?? "";
    const uid = url.searchParams.get("uid") ?? "";
    const type = (url.searchParams.get("type") ?? "rtc") as AgoraTokenType;

    if (!appId || !appCertificate) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error:
            "Missing VITE_AGORA_APP_ID or AGORA_APP_CERTIFICATE in .env. Add your Primary Certificate from Agora Console.",
        }),
      );
      return;
    }

    if (!uid || (type === "rtc" && !channel)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing channel or uid query parameters." }));
      return;
    }

    if (type !== "rtc" && type !== "rtm") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "type must be rtc or rtm." }));
      return;
    }

    try {
      const token = generateAgoraToken(
        { appId, appCertificate },
        channel,
        uid,
        type,
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ token }));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to generate token",
        }),
      );
    }
  };
}

export function agoraTokenPlugin(): Plugin {
  return {
    name: "agora-token-server",
    configureServer(server) {
      server.middlewares.use(createTokenHandler("development"));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createTokenHandler("production"));
    },
  };
}
