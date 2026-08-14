import { Badge, Box, Text } from "@mantine/core";
import type { Participant } from "../../types/room";
import { CallTimer } from "./CallTimer";
import { ControlBar } from "./ControlBar";
import { VideoTile } from "./VideoTile";

interface OneToOneLayoutProps {
  participants: Participant[];
  roomName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  canToggleCamera: boolean;
  unreadCount: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
}

export function OneToOneLayout({
  participants,
  roomName,
  isMicOn,
  isCameraOn,
  canToggleCamera,
  unreadCount,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onToggleChat,
}: OneToOneLayoutProps) {
  const local = participants.find((p) => p.isLocal);
  const remote = participants.find((p) => !p.isLocal);
  const alone = !remote;

  return (
    <Box pos="relative" h="100dvh" bg="black" style={{ overflow: "hidden" }}>
      {alone ? (
        local && (
          <Box h="100%" w="100%">
            <VideoTile participant={local} showName size="stage" isPinned />
          </Box>
        )
      ) : (
        <>
          <Box h="100%" w="100%">
            <VideoTile
              participant={remote}
              showName={false}
              size="stage"
              isPinned
            />
          </Box>
          {local && (
            <Box
              pos="absolute"
              top={16}
              right={16}
              w="clamp(120px, 22vw, 200px)"
              style={{ zIndex: 10 }}
            >
              <VideoTile participant={local} showName={false} size="filmstrip" />
            </Box>
          )}
        </>
      )}

      <Badge
        pos="absolute"
        top={16}
        left={16}
        variant="filled"
        color="dark"
        leftSection={
          <Box
            component="span"
            w={8}
            h={8}
            style={{ borderRadius: "50%", background: "var(--mantine-color-red-5)" }}
          />
        }
      >
        Live
      </Badge>

      <Box
        pos="absolute"
        bottom={120}
        left={16}
        p="sm"
        style={{
          borderRadius: 12,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Text fw={600} c="white">
          {remote?.displayName ?? roomName}
        </Text>
        {alone && (
          <Text size="sm" c="dimmed" mt={4}>
            Waiting for others to join…
          </Text>
        )}
        <CallTimer />
      </Box>

      <Box
        pos="absolute"
        bottom={16}
        left="50%"
        style={{ transform: "translateX(-50%)", zIndex: 20, width: "min(92vw, 420px)" }}
      >
        <ControlBar
          variant="compact"
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          canToggleCamera={canToggleCamera}
          participantCount={participants.length}
          unreadCount={unreadCount}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onLeave={onLeave}
          onToggleChat={onToggleChat}
        />
      </Box>
    </Box>
  );
}
