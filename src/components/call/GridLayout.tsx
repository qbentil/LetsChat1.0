import { useMemo, useState } from "react";
import { Box, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { IconPin } from "@tabler/icons-react";
import type { Participant } from "../../types/room";
import { ControlBar } from "./ControlBar";
import { VideoTile } from "./VideoTile";

interface GridLayoutProps {
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

function pickDefaultSpotlight(participants: Participant[]): Participant | undefined {
  const remote = participants.filter((p) => !p.isLocal);
  const withVideo = remote.find((p) => p.hasVideo);
  return withVideo ?? remote[0] ?? participants[0];
}

export function GridLayout({
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
}: GridLayoutProps) {
  const [pinnedUid, setPinnedUid] = useState<string | null>(null);

  const spotlight = useMemo(() => {
    if (pinnedUid) {
      return participants.find((p) => p.uid === pinnedUid) ?? pickDefaultSpotlight(participants);
    }
    return pickDefaultSpotlight(participants);
  }, [participants, pinnedUid]);

  const filmstrip = participants.filter((p) => p.uid !== spotlight?.uid);

  return (
    <Box h="100dvh" bg="var(--mantine-color-body)" style={{ display: "flex", flexDirection: "column" }}>
      <Group justify="space-between" p="md" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Box>
          <Text fw={600} size="lg">
            {roomName}
          </Text>
          <Text size="sm" c="dimmed">
            {participants.length} participants
          </Text>
        </Box>
        {spotlight && (
          <Group gap={6}>
            <IconPin size={16} />
            <Text size="sm" c="dimmed">
              Viewing: {spotlight.displayName}
            </Text>
          </Group>
        )}
      </Group>

      <Box flex={1} p="md" style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Desktop / tablet: stage + vertical filmstrip */}
        <Box visibleFrom="sm" style={{ flex: 1, minHeight: 0, display: "flex", gap: 12 }}>
          <Box style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            {spotlight && (
              <VideoTile participant={spotlight} size="stage" isPinned showName />
            )}
          </Box>
          <ScrollArea w={300} type="auto">
            <Stack gap="sm" pr={4}>
              {filmstrip.map((participant) => (
                <VideoTile
                  key={participant.uid}
                  participant={participant}
                  size="filmstrip"
                  isPinned={pinnedUid === participant.uid}
                  onSelect={() => setPinnedUid(participant.uid)}
                />
              ))}
            </Stack>
          </ScrollArea>
        </Box>

        {/* Mobile: stage + horizontal filmstrip */}
        <Box hiddenFrom="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <Box style={{ flex: 1, minHeight: "50vh" }}>
            {spotlight && (
              <VideoTile participant={spotlight} size="stage" isPinned showName />
            )}
          </Box>
          <ScrollArea type="scroll" scrollbarSize={6}>
            <Group gap="sm" wrap="nowrap" pb={4}>
              {filmstrip.map((participant) => (
                <Box key={participant.uid} w={160} style={{ flexShrink: 0 }}>
                  <VideoTile
                    participant={participant}
                    size="filmstrip"
                    isPinned={pinnedUid === participant.uid}
                    onSelect={() => setPinnedUid(participant.uid)}
                  />
                </Box>
              ))}
            </Group>
          </ScrollArea>
        </Box>
      </Box>

      <Box p="md" style={{ display: "flex", justifyContent: "center" }}>
        <ControlBar
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
