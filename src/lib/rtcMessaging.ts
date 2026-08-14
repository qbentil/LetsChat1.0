import type { IAgoraRTCClient, UID } from "agora-rtc-sdk-ng";
import type { MutableRefObject } from "react";

export type RtcMessagePayload =
  | { type: "name"; displayName: string }
  | { type: "chat"; text: string; senderName: string; sentAt: number };

export interface CallMessagingService {
  sendChat(text: string, senderName: string, sentAt?: number): Promise<void>;
  announceName(): Promise<void>;
  isConnected(): boolean;
}

export interface RtcMessagingHandle extends CallMessagingService {
  detach: () => void;
}

type StreamMessageClient = IAgoraRTCClient & {
  sendStreamMessage(message: string, needRetry?: boolean): Promise<void>;
};

const textDecoder = new TextDecoder();

function encodePayload(payload: RtcMessagePayload): string {
  return JSON.stringify(payload);
}

function decodePayload(raw: Uint8Array): RtcMessagePayload | null {
  try {
    return JSON.parse(textDecoder.decode(raw)) as RtcMessagePayload;
  } catch {
    return null;
  }
}

async function sendPayload(
  client: IAgoraRTCClient,
  payload: RtcMessagePayload,
): Promise<void> {
  await (client as StreamMessageClient).sendStreamMessage(encodePayload(payload));
}

export function attachRtcMessaging(
  client: IAgoraRTCClient,
  localDisplayName: string,
  displayNamesRef: MutableRefObject<Map<string, string>>,
  onNameUpdate: () => void,
  onChatMessage: (payload: {
    uid: string;
    text: string;
    senderName: string;
    sentAt: number;
  }) => void,
): RtcMessagingHandle {
  let active = true;

  const handleStreamMessage = (uid: UID, payload: Uint8Array) => {
    if (!active) return;

    const data = decodePayload(payload);
    if (!data) return;

    const senderUid = String(uid);

    if (data.type === "name" && data.displayName) {
      displayNamesRef.current.set(senderUid, data.displayName);
      onNameUpdate();
    }

    if (data.type === "chat") {
      onChatMessage({
        uid: senderUid,
        text: data.text,
        senderName: data.senderName,
        sentAt: data.sentAt,
      });
    }
  };

  client.on("stream-message", handleStreamMessage);

  return {
    isConnected: () => active,
    async announceName() {
      if (!active) return;
      await sendPayload(client, { type: "name", displayName: localDisplayName });
    },
    async sendChat(text, senderName, sentAt = Date.now()) {
      if (!active) {
        throw new Error("Chat is not connected yet.");
      }
      await sendPayload(client, {
        type: "chat",
        text,
        senderName,
        sentAt,
      });
    },
    detach() {
      active = false;
    },
  };
}
