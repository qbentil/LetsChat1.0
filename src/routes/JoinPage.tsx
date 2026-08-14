import { useEffect, useMemo, useRef, useState } from "react";
import { Center } from "@mantine/core";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChatPanel } from "../components/call/ChatPanel";
import {
  CallError,
  ConnectingOverlay,
  MeetingEnded,
  RoomFull,
} from "../components/call/CallStates";
import { GridLayout } from "../components/call/GridLayout";
import { OneToOneLayout } from "../components/call/OneToOneLayout";
import { LayoutShell } from "../components/layout/AppShell";
import { JoinNameGate } from "../components/lobby/LobbyForms";
import { useAgoraCallContext } from "../context/AgoraCallContext";
import {
  getAnonymousName,
  getSessionUid,
  getStoredDisplayName,
  roomConfigProvider,
  storeDisplayName,
} from "../services/roomConfig";

export function JoinPage() {
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const call = useAgoraCallContext();
  const joinAttemptedRef = useRef(false);

  const parsed = useMemo(
    () =>
      roomConfigProvider.parseJoinUrl(
        `/join/${roomId}`,
        `?${searchParams.toString()}`,
      ),
    [roomId, searchParams],
  );

  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (!parsed) return null;
    if (parsed.config.identityMode === "required") {
      return getStoredDisplayName(parsed.roomId);
    }
    return getAnonymousName(getSessionUid(parsed.roomId));
  });

  useEffect(() => {
    joinAttemptedRef.current = false;
  }, [roomId, searchParams]);

  useEffect(() => {
    if (!parsed || !displayName || joinAttemptedRef.current) return;
    if (call.status === "connecting" || call.status === "connected") return;

    joinAttemptedRef.current = true;
    void call.joinCall({
      roomId: parsed.roomId,
      config: parsed.config,
      displayName,
    });
  }, [parsed, displayName, call.status, call.joinCall]);

  if (!parsed) {
    return (
      <LayoutShell>
        <CallError
          message="This meeting link is invalid or missing room settings."
          onGoHome={() => navigate("/")}
        />
      </LayoutShell>
    );
  }

  if (parsed.config.identityMode === "required" && !displayName) {
    return (
      <LayoutShell>
        <Center mih="60vh">
          <JoinNameGate
            roomName={parsed.config.name}
            onSubmit={(name) => {
              storeDisplayName(parsed.roomId, name);
              setDisplayName(name);
            }}
          />
        </Center>
      </LayoutShell>
    );
  }

  if (call.status === "connecting") {
    return <ConnectingOverlay message={`Joining ${parsed.config.name}…`} />;
  }

  if (call.status === "room_full") {
    return (
      <LayoutShell withHeader={false}>
        <RoomFull
          roomName={parsed.config.name}
          maxParticipants={parsed.config.maxParticipants}
          onGoHome={() => navigate("/")}
        />
      </LayoutShell>
    );
  }

  if (call.status === "expired") {
    return (
      <LayoutShell withHeader={false}>
        <MeetingEnded
          roomName={parsed.config.name}
          onGoHome={() => navigate("/")}
        />
      </LayoutShell>
    );
  }

  if (call.status === "error") {
    return (
      <LayoutShell>
        <CallError
          message={call.error ?? "Something went wrong while joining the call."}
          onGoHome={() => navigate("/")}
          onRetry={() => {
            joinAttemptedRef.current = false;
            void call.leaveCall().then(() => {
              joinAttemptedRef.current = true;
              void call.joinCall({
                roomId: parsed.roomId,
                config: parsed.config,
                displayName: displayName!,
              });
            });
          }}
        />
      </LayoutShell>
    );
  }

  if (call.status !== "connected") {
    return <ConnectingOverlay message={`Joining ${parsed.config.name}…`} />;
  }

  const handleLeave = async () => {
    await call.leaveCall();
    navigate("/");
  };

  const handleToggleChat = () => {
    if (call.isChatOpen) {
      call.closeChat();
    } else {
      call.openChat();
    }
  };

  const useOneToOne = call.participants.length <= 2;
  const layoutProps = {
    participants: call.participants,
    roomName: parsed.config.name,
    isMicOn: call.isMicOn,
    isCameraOn: call.isCameraOn,
    canToggleCamera: call.canToggleCamera,
    unreadCount: call.isChatOpen ? 0 : call.unreadCount,
    onToggleMic: () => void call.toggleMic(),
    onToggleCamera: () => void call.toggleCamera(),
    onLeave: () => void handleLeave(),
    onToggleChat: handleToggleChat,
  };

  return (
    <>
      {useOneToOne ? (
        <OneToOneLayout {...layoutProps} />
      ) : (
        <GridLayout {...layoutProps} />
      )}
      <ChatPanel
        opened={call.isChatOpen}
        onClose={call.closeChat}
        roomName={parsed.config.name}
        messages={call.messages}
        chatReady={call.chatReady}
        onSend={call.sendChatMessage}
      />
    </>
  );
}
