export interface RoomSessionState {
  participantIds: string[];
  expired: boolean;
}

const EMPTY_STATE: RoomSessionState = {
  participantIds: [],
  expired: false,
};

type MemoryGlobal = typeof globalThis & {
  __letschatRoomSessions?: Map<string, RoomSessionState>;
};

function memoryMap(): Map<string, RoomSessionState> {
  const g = globalThis as MemoryGlobal;
  if (!g.__letschatRoomSessions) {
    g.__letschatRoomSessions = new Map();
  }
  return g.__letschatRoomSessions;
}

function redisConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url, token };
}

function roomKey(roomId: string): string {
  return `letschat:room:${roomId}`;
}

async function redisGet(key: string): Promise<RoomSessionState | null> {
  const config = redisConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });

  if (!response.ok) {
    throw new Error(`Redis GET failed (${response.status})`);
  }

  const payload = (await response.json()) as { result?: RoomSessionState | null };
  return payload.result ?? null;
}

async function redisSet(key: string, value: RoomSessionState): Promise<void> {
  const config = redisConfig();
  if (!config) return;

  const response = await fetch(`${config.url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`Redis SET failed (${response.status})`);
  }
}

async function readState(roomId: string): Promise<RoomSessionState> {
  if (redisConfig()) {
    const stored = await redisGet(roomKey(roomId));
    return stored ?? { ...EMPTY_STATE };
  }

  return memoryMap().get(roomId) ?? { ...EMPTY_STATE };
}

async function writeState(roomId: string, state: RoomSessionState): Promise<void> {
  if (redisConfig()) {
    await redisSet(roomKey(roomId), state);
    return;
  }

  memoryMap().set(roomId, state);
}

export interface RoomSessionStatus {
  expired: boolean;
  participantCount: number;
}

export interface RoomSessionMutation {
  ok: boolean;
  expired: boolean;
  participantCount: number;
  error?: string;
}

export async function getRoomSessionStatus(
  roomId: string,
): Promise<RoomSessionStatus> {
  const state = await readState(roomId);
  return {
    expired: state.expired,
    participantCount: state.participantIds.length,
  };
}

export async function joinRoomSession(
  roomId: string,
  participantId: string,
): Promise<RoomSessionMutation> {
  const state = await readState(roomId);

  if (state.expired) {
    return {
      ok: false,
      expired: true,
      participantCount: 0,
      error: "This meeting has ended and the link is no longer valid.",
    };
  }

  if (!state.participantIds.includes(participantId)) {
    state.participantIds.push(participantId);
  }

  await writeState(roomId, state);

  return {
    ok: true,
    expired: false,
    participantCount: state.participantIds.length,
  };
}

export async function leaveRoomSession(
  roomId: string,
  participantId: string,
): Promise<RoomSessionMutation> {
  const state = await readState(roomId);
  state.participantIds = state.participantIds.filter((id) => id !== participantId);

  if (state.participantIds.length === 0) {
    state.expired = true;
  }

  await writeState(roomId, state);

  return {
    ok: true,
    expired: state.expired,
    participantCount: state.participantIds.length,
  };
}
