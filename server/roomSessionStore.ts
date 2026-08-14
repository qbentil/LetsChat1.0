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
  return { url: url.replace(/\/$/, ""), token };
}

function roomKey(roomId: string): string {
  return `letschat:room:${roomId}`;
}

function parseStoredState(raw: unknown): RoomSessionState | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as RoomSessionState;
    } catch {
      return null;
    }
  }
  return raw as RoomSessionState;
}

async function redisCommand(
  config: { url: string; token: string },
  command: (string | number)[],
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Redis command failed (${response.status})`);
  }

  const payload = (await response.json()) as { result?: unknown };
  return payload.result;
}

async function readState(roomId: string): Promise<RoomSessionState> {
  const config = redisConfig();
  if (config) {
    try {
      const raw = await redisCommand(config, ["GET", roomKey(roomId)]);
      const parsed = parseStoredState(raw);
      if (parsed) return parsed;
    } catch (error) {
      console.error("Redis read failed, falling back to memory:", error);
    }
  }

  return memoryMap().get(roomId) ?? { ...EMPTY_STATE };
}

async function writeState(roomId: string, state: RoomSessionState): Promise<void> {
  const config = redisConfig();
  if (config) {
    try {
      await redisCommand(config, ["SET", roomKey(roomId), JSON.stringify(state)]);
      return;
    } catch (error) {
      console.error("Redis write failed, falling back to memory:", error);
    }
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
