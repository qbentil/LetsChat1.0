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
  const { uid, hasVideo, videoTrack, isLocal, displayName, hasAudio } = participant;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    if (hasVideo && videoTrack) {
      videoTrack.play(container, {
        fit: "cover",
        mirror: isLocal,
      });
    }

    return () => {
      // Never call stop() on remote tracks — other tiles or re-mounts may still need them.
      container.replaceChildren();
    };
  }, [uid, hasVideo, videoTrack, isLocal]);

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const height = size === "stage" ? "100%" : undefined;
  const minHeight = size === "stage" ? 0 : 100;

  return (
    <Paper
      radius="md"
      withBorder
      onClick={onSelect}
      className="video-tile"
      data-size={size}
      style={{
        cursor: onSelect ? "pointer" : "default",
        overflow: "hidden",
        position: "relative",
        height,
        minHeight,
        width: "100%",
        aspectRatio: size === "filmstrip" ? "16 / 9" : undefined,
        borderColor: isPinned ? "var(--mantine-color-blue-5)" : undefined,
        borderWidth: isPinned ? 2 : 1,
        boxShadow: isPinned ? "0 0 0 2px var(--mantine-color-blue-2)" : undefined,
      }}
    >
      <Box
        ref={containerRef}
        className="video-tile-player"
        pos="absolute"
        inset={0}
        bg="dark.7"
      />

      {!hasVideo && (
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
          <Text size="sm" c="white" fw={500} truncate>
            {displayName}
            {isLocal ? " (You)" : ""}
          </Text>
          {!hasAudio && (
            <Badge size="xs" color="red" variant="filled" mt={4}>
              Muted
            </Badge>
          )}
        </Box>
      )}
    </Paper>
  );
}
