import { createContext, useContext, useMemo } from "react";
import { useAgoraCall } from "../hooks/useAgoraCall";

type AgoraCallContextValue = ReturnType<typeof useAgoraCall>;

const AgoraCallContext = createContext<AgoraCallContextValue | null>(null);

export function AgoraCallProvider({ children }: { children: React.ReactNode }) {
  const call = useAgoraCall();
  const value = useMemo(
    () => call,
    [
      call.status,
      call.error,
      call.participants,
      call.isMicOn,
      call.isCameraOn,
      call.canToggleCamera,
      call.localUid,
      call.localDisplayName,
      call.messages,
      call.isChatOpen,
      call.unreadCount,
      call.chatReady,
      call.joinCall,
      call.leaveCall,
      call.toggleMic,
      call.toggleCamera,
      call.openChat,
      call.closeChat,
      call.sendChatMessage,
    ],
  );

  return (
    <AgoraCallContext.Provider value={value}>{children}</AgoraCallContext.Provider>
  );
}

export function useAgoraCallContext(): AgoraCallContextValue {
  const context = useContext(AgoraCallContext);
  if (!context) {
    throw new Error("useAgoraCallContext must be used within AgoraCallProvider");
  }
  return context;
}
