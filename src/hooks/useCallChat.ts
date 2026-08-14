import { useCallback, useEffect, useRef, useState } from "react";
import type { CallMessagingService } from "../lib/rtcMessaging";
import type { ChatMessage } from "../types/chat";

export function useCallChat(
  localUid: string,
  localDisplayName: string,
  messagingRef: React.MutableRefObject<CallMessagingService | null>,
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

      if (!isChatOpenRef.current && payload.uid !== localUid) {
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

      const messaging = messagingRef.current;
      if (!messaging?.isConnected()) {
        throw new Error("Chat is not connected yet.");
      }

      const sentAt = Date.now();
      // RTC stream messages are not echoed back to the sender — show locally immediately.
      handleIncomingChat({
        uid: localUid,
        text: trimmed,
        senderName: localDisplayName,
        sentAt,
      });

      await messaging.sendChat(trimmed, localDisplayName, sentAt);
    },
    [handleIncomingChat, localDisplayName, localUid, messagingRef],
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
