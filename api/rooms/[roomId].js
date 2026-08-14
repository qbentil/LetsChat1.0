const EMPTY_STATE = { participantIds: [], expired: false };

function memoryMap() {
  if (!globalThis.__letschatRoomSessions) {
    globalThis.__letschatRoomSessions = new Map();
  }
  return globalThis.__letschatRoomSessions;
}

function redisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function roomKey(roomId) {
  return `letschat:room:${roomId}`;
}

function parseStoredState(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

async function redisCommand(config, command) {
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

  const payload = await response.json();
  return payload.result;
}

async function readState(roomId) {
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

async function writeState(roomId, state) {
  const config = redisConfig();
  if (config) {
    try {
      await redisCommand(config, [
        "SET",
        roomKey(roomId),
        JSON.stringify(state),
      ]);
      return;
    } catch (error) {
      console.error("Redis write failed, falling back to memory:", error);
    }
  }

  memoryMap().set(roomId, state);
}

async function getRoomSessionStatus(roomId) {
  const state = await readState(roomId);
  return {
    expired: state.expired,
    participantCount: state.participantIds.length,
  };
}

async function joinRoomSession(roomId, participantId) {
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

async function leaveRoomSession(roomId, participantId) {
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const roomId = String(req.query?.roomId ?? "");

    if (!roomId) {
      return res.status(400).json({ error: "Missing room id." });
    }

    if (req.method === "GET") {
      const status = await getRoomSessionStatus(roomId);
      return res.status(200).json(status);
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const { action, participantId } = body;

      if (!participantId || (action !== "join" && action !== "leave")) {
        return res.status(400).json({
          error: "Expected action (join|leave) and participantId.",
        });
      }

      const result =
        action === "join"
          ? await joinRoomSession(roomId, participantId)
          : await leaveRoomSession(roomId, participantId);

      return res.status(result.ok ? 200 : 410).json(result);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Room session error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Room session failed",
    });
  }
}
