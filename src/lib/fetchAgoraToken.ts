export type AgoraTokenType = "rtc" | "rtm";

export async function fetchAgoraToken(
  channel: string,
  uid: string,
  type: AgoraTokenType = "rtc",
): Promise<string> {
  const params = new URLSearchParams({ channel, uid, type });
  const response = await fetch(`/api/agora/token?${params.toString()}`);

  const payload = (await response.json()) as { token?: string; error?: string };

  if (!response.ok || !payload.token) {
    throw new Error(payload.error ?? "Failed to fetch Agora token");
  }

  return payload.token;
}
