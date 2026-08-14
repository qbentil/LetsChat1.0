import type { Connect, Plugin } from "vite";
import { loadEnv } from "vite";
import {
  handleAgoraTokenRequest,
  parseAgoraTokenQuery,
} from "../server/handleAgoraTokenRequest";

function createTokenHandler(mode: string): Connect.NextHandleFunction {
  const env = loadEnv(mode, process.cwd(), "");

  return (req, res, next) => {
    if (!req.url?.startsWith("/api/agora/token")) {
      next();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const result = handleAgoraTokenRequest(
      {
        appId: env.VITE_AGORA_APP_ID,
        appCertificate: env.AGORA_APP_CERTIFICATE,
      },
      parseAgoraTokenQuery(url.searchParams),
    );

    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result.body));
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
