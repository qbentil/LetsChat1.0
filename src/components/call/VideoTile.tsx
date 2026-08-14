import { useEffect, useRef } from "react";
import { Avatar, Badge, Box, Paper, Text } from "@mantine/core";
import type { Participant } from "../../types/room";

interface VideoTileProps {
  participant: Participant;
  onSelect?: () => void;
  isPinned?: boolean;
  size?: "stage" | "filmstrip";
  showName?: boolean;
}

export function VideoTile({
  participant,
  onSelect,
  isPinned = false,
  size = "filmstrip",
  showName = true,
}: VideoTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (participant.hasVideo && participant.videoTrack) {
      participant.videoTrack.play(container, {
        fit: "cover",
        mirror: participant.isLocal,
      });
    }

    return () => {
      if (!participant.isLocal && participant.videoTrack) {
        participant.videoTrack.stop();
      }
    };
  }, [participant]);

  const initials = participant.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const height = size === "stage" ? "100%" : undefined;
  const minHeight = size === "stage" ? 240 : 100;

  return (
    <Paper
      radius="md"
      withBorder
      onClick={onSelect}
      style={{
        cursor: onSelect ? "pointer" : "default",
        overflow: "hidden",
        position: "relative",
        height,
        minHeight,
        aspectRatio: size === "filmstrip" ? "16 / 9" : undefined,
        borderColor: isPinned ? "var(--mantine-color-blue-5)" : undefined,
        borderWidth: isPinned ? 2 : 1,
        boxShadow: isPinned ? "0 0 0 2px var(--mantine-color-blue-2)" : undefined,
      }}
    >
      <Box ref={containerRef} h="100%" w="100%" bg="dark.7" />

      {!participant.hasVideo && (
        <Box
          pos="absolute"
          inset={0}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, var(--mantine-color-dark-6), var(--mantine-color-dark-8))",
          }}
        >
          <Avatar
            size={size === "stage" ? "xl" : "md"}
            radius="xl"
            color="blue"
          >
            {initials}
          </Avatar>
        </Box>
      )}

      {showName && (
        <Box
          pos="absolute"
          bottom={0}
          left={0}
          right={0}
          p="xs"
          style={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          }}
        >
          <GroupTileName participant={participant} />
        </Box>
      )}
    </Paper>
  );
}

function GroupTileName({ participant }: { participant: Participant }) {
  return (
    <Box>
      <Text size="sm" c="white" fw={500} truncate>
        {participant.displayName}
        {participant.isLocal ? " (You)" : ""}
      </Text>
      {!participant.hasAudio && (
        <Badge size="xs" color="red" variant="filled" mt={4}>
          Muted
        </Badge>
      )}
    </Box>
  );
}
