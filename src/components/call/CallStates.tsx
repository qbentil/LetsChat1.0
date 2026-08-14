import { Button, Center, Group, Loader, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconAlertCircle, IconLinkOff, IconUsersGroup } from "@tabler/icons-react";

interface ConnectingOverlayProps {
  message?: string;
}

export function ConnectingOverlay({
  message = "Connecting to your meeting…",
}: ConnectingOverlayProps) {
  return (
    <Center h="100dvh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="lg" c="dimmed">
          {message}
        </Text>
      </Stack>
    </Center>
  );
}

interface RoomFullProps {
  roomName: string;
  maxParticipants: number;
  onGoHome: () => void;
}

export function RoomFull({ roomName, maxParticipants, onGoHome }: RoomFullProps) {
  return (
    <Center h="100dvh" p="md">
      <Stack align="center" gap="md" maw={420}>
        <ThemeIcon size={60} radius="xl" variant="light" color="orange">
          <IconUsersGroup size={30} />
        </ThemeIcon>
        <Title order={2}>Room is full</Title>
        <Text c="dimmed" ta="center">
          {roomName} has reached its limit of {maxParticipants} participants.
        </Text>
        <Button onClick={onGoHome}>Back to home</Button>
      </Stack>
    </Center>
  );
}

interface MeetingEndedProps {
  roomName: string;
  onGoHome: () => void;
}

export function MeetingEnded({ roomName, onGoHome }: MeetingEndedProps) {
  return (
    <Center h="100dvh" p="md">
      <Stack align="center" gap="md" maw={420}>
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <IconLinkOff size={30} />
        </ThemeIcon>
        <Title order={2}>Meeting ended</Title>
        <Text c="dimmed" ta="center">
          {roomName} is over and this link can no longer be used. Create a new meeting to
          start again.
        </Text>
        <Button onClick={onGoHome}>Back to home</Button>
      </Stack>
    </Center>
  );
}

interface CallErrorProps {
  message: string;
  onGoHome: () => void;
  onRetry?: () => void;
}

export function CallError({ message, onGoHome, onRetry }: CallErrorProps) {
  return (
    <Center h="100dvh" p="md">
      <Stack align="center" gap="md" maw={420}>
        <ThemeIcon size={60} radius="xl" variant="light" color="red">
          <IconAlertCircle size={30} />
        </ThemeIcon>
        <Title order={2}>Unable to join</Title>
        <Text c="dimmed" ta="center">
          {message}
        </Text>
        <Group>
          {onRetry && (
            <Button variant="default" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button onClick={onGoHome}>Back to home</Button>
        </Group>
      </Stack>
    </Center>
  );
}
