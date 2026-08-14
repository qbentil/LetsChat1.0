import type { MutableRefObject } from "react";
import { AGORA_APP_ID } from "./agora";

export type RtmPayload =
  | { type: "name"; displayName: string }
  | { type: "chat"; text: string; senderName: string; sentAt: number };

export interface RtmService {
  join(roomId: string, uid: string, displayName: string): Promise<void>;
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
  const AgoraRTM = (await import("agora-rtm-sdk")).default;
  let rtmUid = "";
  let connected = false;
  let localDisplayName = "";
  const client = AgoraRTM.createInstance(AGORA_APP_ID);
  let channel: ReturnType<typeof client.createChannel> | null = null;
  let nameHandler: ((uid: string, displayName: string) => void) | null = null;
  let chatHandler: ((payload: {
    uid: string;
    text: string;
    senderName: string;
    sentAt: number;
  }) => void) | null = null;

  const dispatchMessage = (message: { text: string }, memberId: string) => {
    try {
      const payload = JSON.parse(message.text) as RtmPayload;
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
    async join(roomId, uid, displayName) {
      rtmUid = uid;
      localDisplayName = displayName;
      await client.login({ uid, token: null });
      channel = client.createChannel(roomId);

      channel.on("ChannelMessage", (message, memberId) => {
        dispatchMessage(message, memberId);
      });

      channel.on("MemberJoined", async (memberId) => {
        if (memberId === uid) return;
        await channel?.sendMessage({
          text: JSON.stringify({ type: "name", displayName: localDisplayName }),
        });
      });

      await channel.join();
      await channel.sendMessage({
        text: JSON.stringify({ type: "name", displayName }),
      });
      nameHandler?.(uid, displayName);
      connected = true;
    },
    async leave() {
      connected = false;
      if (channel) {
        await channel.leave().catch(() => undefined);
        channel = null;
      }
      if (rtmUid) {
        await client.logout().catch(() => undefined);
      }
    },
    async sendChat(text, senderName) {
      if (!channel || !connected) {
        throw new Error("Chat is not connected yet.");
      }
      const sentAt = Date.now();
      await channel.sendMessage({
        text: JSON.stringify({ type: "chat", text, senderName, sentAt }),
      });
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
    await Promise.race([
      service.join(roomId, uid, displayName),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("RTM timed out")), 8000);
      }),
    ]);
    return service;
  } catch {
    return null;
  }
}
