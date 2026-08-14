import { generateAgoraToken } from "./generateAgoraToken";

export interface AgoraTokenEnv {
  appId?: string;
  appCertificate?: string;
}

export interface AgoraTokenQuery {
  channel: string;
  uid: string;
}

export function parseAgoraTokenQuery(searchParams: URLSearchParams): AgoraTokenQuery {
  return {
    channel: searchParams.get("channel") ?? "",
    uid: searchParams.get("uid") ?? "",
  };
}

export function handleAgoraTokenRequest(
  env: AgoraTokenEnv,
  query: AgoraTokenQuery,
): { status: number; body: { token?: string; error?: string } } {
  const { appId, appCertificate } = env;
  const { channel, uid } = query;

  if (!appId || !appCertificate) {
    return {
      status: 500,
      body: {
        error:
          "Missing VITE_AGORA_APP_ID or AGORA_APP_CERTIFICATE. Add them in your environment.",
      },
    };
  }

  if (!uid || !channel) {
    return {
      status: 400,
      body: { error: "Missing channel or uid query parameters." },
    };
  }

  try {
    const token = generateAgoraToken({ appId, appCertificate }, channel, uid);
    return { status: 200, body: { token } };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "Failed to generate token",
      },
    };
  }
}
