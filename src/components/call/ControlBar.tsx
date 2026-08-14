import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Tooltip,
} from "@mantine/core";
import {
  IconMessage,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconUsers,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  canToggleCamera: boolean;
  participantCount: number;
  unreadCount: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
  variant?: "compact" | "full";
}

export function ControlBar({
  isMicOn,
  isCameraOn,
  canToggleCamera,
  participantCount,
  unreadCount,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onToggleChat,
  variant = "full",
}: ControlBarProps) {
  return (
    <Paper
      shadow="xl"
      radius="xl"
      p={variant === "compact" ? "sm" : "md"}
      withBorder
      style={{
        backdropFilter: "blur(12px)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <Group gap={variant === "compact" ? "sm" : "md"} justify="center">
        <Tooltip label={isMicOn ? "Mute" : "Unmute"}>
          <ActionIcon
            size="xl"
            radius="xl"
            variant={isMicOn ? "light" : "filled"}
            color={isMicOn ? "gray" : "red"}
            onClick={onToggleMic}
          >
            {isMicOn ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Leave call">
          <ActionIcon size={50} radius="xl" color="red" variant="filled" onClick={onLeave}>
            <IconPhoneOff size={22} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={
            !canToggleCamera && isCameraOn
              ? "Video is required for this meeting"
              : isCameraOn
                ? "Turn off camera"
                : "Turn on camera"
          }
        >
          <ActionIcon
            size="xl"
            radius="xl"
            variant={isCameraOn ? "light" : "filled"}
            color={isCameraOn ? "gray" : "red"}
            disabled={!canToggleCamera && isCameraOn}
            onClick={onToggleCamera}
          >
            {isCameraOn ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Chat">
          <ActionIcon size="xl" radius="xl" variant="light" onClick={onToggleChat} pos="relative">
            <IconMessage size={20} />
            {unreadCount > 0 && (
              <Badge
                size="xs"
                circle
                color="red"
                pos="absolute"
                top={2}
                right={2}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </ActionIcon>
        </Tooltip>

        {variant === "full" && (
          <Group gap={6} ml="xs">
            <IconUsers size={16} />
            <Badge variant="light">{participantCount}</Badge>
          </Group>
        )}
      </Group>
    </Paper>
  );
}
