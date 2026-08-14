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

  const dispatchMessage = (messageText: string, memberId: string) => {
    try {
      const payload = JSON.parse(messageText) as RtmPayload;
      if (payload.type === "name" && payload.displayName && nameHandler) {
        nameHandler(memberId, payload.displayName);
      }
      if (payload.type === "chat" && chatHandler) {
        chatHandler({
          uid: memberId,
          text: payload.text,
          senderName: payload.senderName,
          sentAt: payload.sentAt,
        });
      }
    } catch {
      // ignore malformed messages
    }
  };

  return {
    async join(roomIdParam, uid, displayName, token) {
      roomId = roomIdParam;
      localUid = uid;
      localDisplayName = displayName;

      client = new RTM(AGORA_APP_ID, uid);

      client.addEventListener("message", (event) => {
        if (event.channelName !== roomId) return;
        const text = typeof event.message === "string" ? event.message : "";
        if (!text) return;
        dispatchMessage(text, event.publisher);
      });

      client.addEventListener("presence", (event) => {
        if (event.channelName !== roomId) return;
        if (event.eventType === "REMOTE_JOIN" && event.publisher !== localUid) {
          void client?.publish(
            roomId,
            JSON.stringify({ type: "name", displayName: localDisplayName }),
          );
        }
      });

      await client.login({ token });
      await client.subscribe(roomId);

      await client.publish(
        roomId,
        JSON.stringify({ type: "name", displayName }),
      );
      nameHandler?.(uid, displayName);
      connected = true;
    },
    async leave() {
      connected = false;
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
  try {
    const service = await createRtmService();
    service.onName((memberId, memberName) => {
      displayNamesRef.current.set(memberId, memberName);
      onNameUpdate();
    });
    service.onChat(onChatMessage);
    const rtmToken = await fetchAgoraToken(roomId, uid, "rtm");
    await Promise.race([
      service.join(roomId, uid, displayName, rtmToken),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("RTM timed out")), 15000);
      }),
    ]);
    return service;
  } catch (error) {
    console.error("RTM connection failed:", error);
    return null;
  }
}
