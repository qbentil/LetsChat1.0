import type { MutableRefObject } from "react";
import AgoraRTM from "agora-rtm-sdk";
import { AGORA_APP_ID } from "./agora";
import { fetchAgoraToken } from "./fetchAgoraToken";

const { RTM } = AgoraRTM;

export type RtmPayload =
  | { type: "name"; displayName: string }
  | { type: "chat"; text: string; senderName: string; sentAt: number };

export interface RtmService {
  join(
    roomId: string,
    uid: string,
    displayName: string,
    token: string,
  ): Promise<void>;
  leave(): Promise<void>;
  sendChat(text: string, senderName: string): Promise<void>;
  onName(callback: (uid: string, displayName: string) => void): void;
  onChat(
    callback: (payload: {
      uid: string;
      text: string;
      senderName: string;
      sentAt: number;
    }) => void,
  ): void;
  isConnected(): boolean;
}

function announceName(
  client: InstanceType<typeof RTM>,
  channel: string,
  displayName: string,
) {
  return client.publish(
    channel,
    JSON.stringify({ type: "name", displayName }),
  );
}

export async function createRtmService(): Promise<RtmService> {
  let roomId = "";
  let localUid = "";
  let connected = false;
  let localDisplayName = "";
  let client: InstanceType<typeof RTM> | null = null;
  let nameHandler: ((uid: string, displayName: string) => void) | null = null;
  let chatHandler: ((payload: {
    uid: string;
    text: string;
    senderName: string;
    sentAt: number;
  }) => void) | null = null;
  let nameRetryTimer: number | null = null;

  const dispatchMessage = (messageText: string, memberId: string) => {
    try {
      const payload = JSON.parse(messageText) as RtmPayload;
      const uid = String(memberId);
      if (payload.type === "name" && payload.displayName && nameHandler) {
        nameHandler(uid, payload.displayName);
      }
      if (payload.type === "chat" && chatHandler) {
        chatHandler({
          uid,
          text: payload.text,
          senderName: payload.senderName,
          sentAt: payload.sentAt,
        });
      }
    } catch {
      // ignore malformed messages
    }
  };

  const broadcastName = () => {
    if (!client || !roomId || !localDisplayName) return;
    void announceName(client, roomId, localDisplayName).catch(() => undefined);
  };

  return {
    async join(roomIdParam, uid, displayName, token) {
      roomId = roomIdParam;
      localUid = String(uid);
      localDisplayName = displayName;

      client = new RTM(AGORA_APP_ID, localUid, { useStringUserId: true });

      client.addEventListener("message", (event) => {
        if (event.channelName !== roomId) return;
        const text = typeof event.message === "string" ? event.message : "";
        if (!text) return;
        dispatchMessage(text, event.publisher);
      });

      client.addEventListener("presence", (event) => {
        if (event.channelName !== roomId) return;
        if (event.eventType === "REMOTE_JOIN" && String(event.publisher) !== localUid) {
          broadcastName();
        }
      });

      await client.login({ token });
      await client.subscribe(roomId);

      await announceName(client, roomId, displayName);
      nameHandler?.(localUid, displayName);
      connected = true;

      // Catch late subscribers who missed the first name announcement.
      nameRetryTimer = window.setTimeout(() => {
        broadcastName();
      }, 2500);
    },
    async leave() {
      connected = false;
      if (nameRetryTimer) {
        window.clearTimeout(nameRetryTimer);
        nameRetryTimer = null;
      }
      if (client) {
        if (roomId) {
          await client.unsubscribe(roomId).catch(() => undefined);
        }
        await client.logout().catch(() => undefined);
        client = null;
      }
      roomId = "";
      localUid = "";
    },
    async sendChat(text, senderName) {
      if (!client || !connected || !roomId) {
        throw new Error("Chat is not connected yet.");
      }
      const sentAt = Date.now();
      await client.publish(
        roomId,
        JSON.stringify({ type: "chat", text, senderName, sentAt }),
      );
    },
    onName(callback) {
      nameHandler = callback;
    },
    onChat(callback) {
      chatHandler = callback;
    },
    isConnected() {
      return connected;
    },
  };
}

const RTM_MAX_ATTEMPTS = 3;
const RTM_TIMEOUT_MS = 20_000;

export async function connectRtmService(
  roomId: string,
  uid: string,
  displayName: string,
  displayNamesRef: MutableRefObject<Map<string, string>>,
  onNameUpdate: () => void,
  onChatMessage: (payload: {
    uid: string;
    text: string;
    senderName: string;
    sentAt: number;
  }) => void,
): Promise<RtmService | null> {
  for (let attempt = 1; attempt <= RTM_MAX_ATTEMPTS; attempt++) {
    let service: RtmService | null = null;
    try {
      service = await createRtmService();
      service.onName((memberId, memberName) => {
        displayNamesRef.current.set(String(memberId), memberName);
        onNameUpdate();
      });
      service.onChat(onChatMessage);

      const rtmToken = await fetchAgoraToken(roomId, uid, "rtm");
      await Promise.race([
        service.join(roomId, uid, displayName, rtmToken),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("RTM timed out")), RTM_TIMEOUT_MS);
        }),
      ]);
      return service;
    } catch (error) {
      console.error(`RTM connection attempt ${attempt}/${RTM_MAX_ATTEMPTS} failed:`, error);
      if (service) {
        await service.leave().catch(() => undefined);
      }
      if (attempt < RTM_MAX_ATTEMPTS) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 1500 * attempt);
        });
      }
    }
  }

  return null;
}
