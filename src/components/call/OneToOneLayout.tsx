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

  return (
    <Box pos="relative" h="100dvh" bg="black">
      {remote ? (
        <VideoTile
          participant={remote}
          showName={false}
          size="stage"
          isPinned
        />
      ) : (
        <Box
          h="100%"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--mantine-color-dark-8)",
          }}
        >
          <Text c="dimmed">Waiting for others to join…</Text>
        </Box>
      )}

      {local && (
        <Box
          pos="absolute"
          top={80}
          right={16}
          w={140}
          style={{ zIndex: 10 }}
        >
          <VideoTile participant={local} showName={false} size="filmstrip" />
        </Box>
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
