export interface RoomSessionStatus {
  expired: boolean;
  participantCount: number;
}

export interface RoomSessionResult {
  ok: boolean;
  expired: boolean;
  participantCount: number;
  error?: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      response.status === 404
        ? "Room session API is unavailable."
        : `Room session API returned an invalid response (${response.status}).`,
    );
  }
}

export async function fetchRoomSessionStatus(
  roomId: string,
): Promise<RoomSessionStatus> {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
  return parseJson<RoomSessionStatus>(response);
}

export async function joinRoomSession(
  roomId: string,
  participantId: string,
): Promise<RoomSessionResult> {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", participantId }),
  });
  return parseJson<RoomSessionResult>(response);
}

export async function leaveRoomSession(
  roomId: string,
  participantId: string,
): Promise<RoomSessionResult> {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "leave", participantId }),
    keepalive: true,
  });
  return parseJson<RoomSessionResult>(response);
}
