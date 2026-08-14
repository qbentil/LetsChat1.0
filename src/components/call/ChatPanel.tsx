import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Drawer,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconMessage, IconSend } from "@tabler/icons-react";
import type { ChatMessage } from "../../types/chat";

interface ChatPanelProps {
  opened: boolean;
  onClose: () => void;
  roomName: string;
  messages: ChatMessage[];
  chatReady: boolean;
  onSend: (text: string) => Promise<void>;
}

function formatTime(sentAt: number): string {
  return new Date(sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatPanel({
  opened,
  onClose,
  roomName,
  messages,
  chatReady,
  onSend,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (opened && viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, opened]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await onSend(draft);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMessage size={18} />
          <Text fw={600}>{roomName}</Text>
        </Group>
      }
      position="right"
      size="md"
    >
      {!chatReady ? (
        <Stack align="center" justify="center" h={200} gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Connecting chat…
          </Text>
        </Stack>
      ) : messages.length === 0 ? (
        <Stack align="center" justify="center" h={200} gap="sm">
          <ThemeIcon size="xl" variant="light" radius="xl">
            <IconMessage size={20} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            No messages yet
          </Text>
        </Stack>
      ) : (
        <ScrollArea h="calc(100vh - 180px)" viewportRef={viewportRef}>
          <Stack gap="sm" pb="md">
            {messages.map((message) => (
              <Box
                key={message.id}
                style={{
                  alignSelf: message.isLocal ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <Paper
                  p="sm"
                  radius="md"
                  withBorder={!message.isLocal}
                  bg={message.isLocal ? "blue.6" : undefined}
                  c={message.isLocal ? "white" : undefined}
                >
                  {!message.isLocal && (
                    <Text size="xs" fw={600} mb={4}>
                      {message.senderName}
                    </Text>
                  )}
                  <Text size="sm">{message.text}</Text>
                  <Text size="xs" c={message.isLocal ? "blue.1" : "dimmed"} ta="right" mt={4}>
                    {formatTime(message.sentAt)}
                  </Text>
                </Paper>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      )}

      <Group mt="md" align="flex-end">
        <TextInput
          flex={1}
          placeholder="Type a message…"
          value={draft}
          disabled={!chatReady || sending}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <ActionIcon
          size="lg"
          variant="filled"
          disabled={!chatReady || !draft.trim() || sending}
          onClick={() => void handleSend()}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Drawer>
  );
}
