import { useCallback, useEffect, useRef, useState } from "react";
import type { RtmService } from "../lib/rtmService";
import type { ChatMessage } from "../types/chat";

export function useCallChat(
  localUid: string,
  localDisplayName: string,
  rtmRef: React.MutableRefObject<RtmService | null>,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatReady, setChatReady] = useState(false);
  const isChatOpenRef = useRef(false);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const handleIncomingChat = useCallback(
    (payload: {
      uid: string;
      text: string;
      senderName: string;
      sentAt: number;
    }) => {
      const message: ChatMessage = {
        id: `${payload.uid}-${payload.sentAt}`,
        uid: payload.uid,
        senderName: payload.senderName,
        text: payload.text,
        sentAt: payload.sentAt,
        isLocal: payload.uid === localUid,
      };

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });

      if (!isChatOpenRef.current) {
        setUnreadCount((count) => count + 1);
      }
    },
    [localUid],
  );

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const rtm = rtmRef.current;
      if (!rtm?.isConnected()) {
        throw new Error("Chat is not connected yet.");
      }

      await rtm.sendChat(trimmed, localDisplayName);
    },
    [localDisplayName, rtmRef],
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsChatOpen(false);
    setUnreadCount(0);
    setChatReady(false);
  }, []);

  const markChatReady = useCallback(() => {
    setChatReady(true);
  }, []);

  return {
    messages,
    isChatOpen,
    unreadCount,
    chatReady,
    openChat,
    closeChat,
    sendMessage,
    resetChat,
    markChatReady,
    handleIncomingChat,
  };
}
