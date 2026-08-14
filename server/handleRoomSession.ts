import {
  getRoomSessionStatus,
  joinRoomSession,
  leaveRoomSession,
} from "../server/roomSessionStore";

export function handleRoomSessionGet(roomId: string) {
  if (!roomId) {
    return {
      status: 400,
      body: { error: "Missing room id." },
    };
  }

  return getRoomSessionStatus(roomId).then((status) => ({
    status: 200,
    body: status,
  }));
}

export async function handleRoomSessionPost(
  roomId: string,
  body: { action?: string; participantId?: string },
) {
  if (!roomId) {
    return {
      status: 400,
      body: { error: "Missing room id." },
    };
  }

  const { action, participantId } = body;

  if (!participantId || (action !== "join" && action !== "leave")) {
    return {
      status: 400,
      body: { error: "Expected action (join|leave) and participantId." },
    };
  }

  const result =
    action === "join"
      ? await joinRoomSession(roomId, participantId)
      : await leaveRoomSession(roomId, participantId);

  return {
    status: result.ok ? 200 : 410,
    body: result,
  };
}
