export async function fetchAgoraToken(channel: string, uid: string): Promise<string> {
  const params = new URLSearchParams({ channel, uid });
  const response = await fetch(`/api/agora/token?${params.toString()}`);
  const raw = await response.text();

  let payload: { token?: string; error?: string };
  try {
    payload = JSON.parse(raw) as { token?: string; error?: string };
  } catch {
    throw new Error(
      response.status === 404
        ? "Token API is unavailable on this deployment. Ensure /api/agora/token is deployed."
        : `Token server returned an invalid response (${response.status}).`,
    );
  }

  if (!response.ok || !payload.token) {
    throw new Error(payload.error ?? "Failed to fetch Agora token");
  }

  return payload.token;
}
