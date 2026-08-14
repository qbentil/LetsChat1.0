import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleAgoraTokenRequest,
  parseAgoraTokenQuery,
} from "../../server/handleAgoraTokenRequest";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const result = handleAgoraTokenRequest(
    {
      appId: process.env.VITE_AGORA_APP_ID,
      appCertificate: process.env.AGORA_APP_CERTIFICATE,
    },
    parseAgoraTokenQuery(url.searchParams),
  );

  return res.status(result.status).json(result.body);
}
