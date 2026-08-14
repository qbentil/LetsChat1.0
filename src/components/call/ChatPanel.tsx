import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Box,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { IconMessage, IconSend, IconX } from "@tabler/icons-react";
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

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(uid: string): string {
  const palette = ["blue", "teal", "violet", "grape", "cyan", "indigo"];
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function isNewSenderBlock(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.uid !== curr.uid) return true;
  return curr.sentAt - prev.sentAt > 5 * 60 * 1000;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.isLocal) {
    return (
      <Box
        px="md"
        py={8}
        style={{
          maxWidth: "78%",
          borderRadius: "20px 20px 6px 20px",
          background:
            "linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-blue-7))",
          boxShadow: "light-dark(0 2px 8px rgba(37, 99, 235, 0.18), 0 2px 12px rgba(0, 0, 0, 0.35))",
        }}
      >
        <Text size="sm" c="white" lh={1.55} style={{ wordBreak: "break-word" }}>
          {message.text}
        </Text>
        <Text size="xs" c="rgba(255,255,255,0.72)" ta="right" mt={6} lh={1}>
          {formatTime(message.sentAt)}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      px="md"
      py={8}
      style={{
        maxWidth: "78%",
        borderRadius: "20px 20px 20px 6px",
        background: "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))",
        border:
          "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
        color: "light-dark(var(--mantine-color-dark-8), var(--mantine-color-gray-1))",
      }}
    >
      <Text size="sm" lh={1.55} style={{ wordBreak: "break-word" }}>
        {message.text}
      </Text>
      <Text size="xs" c="dimmed" ta="right" mt={6} lh={1}>
        {formatTime(message.sentAt)}
      </Text>
    </Box>
  );
}

function MessageRow({
  message,
  messages,
  index,
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  index: number;
}) {
  const showHeader = isNewSenderBlock(messages, index);

  if (message.isLocal) {
    return (
      <Box style={{ display: "flex", justifyContent: "flex-end" }}>
        <ChatBubble message={message} />
      </Box>
    );
  }

  return (
    <Group align="flex-end" gap="sm" wrap="nowrap" style={{ maxWidth: "100%" }}>
      {showHeader ? (
        <Avatar
          size={32}
          radius="xl"
          color={avatarColor(message.uid)}
          style={{ flexShrink: 0 }}
        >
          {initialsFromName(message.senderName)}
        </Avatar>
      ) : (
        <Box w={32} style={{ flexShrink: 0 }} />
      )}
      <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
        {showHeader && (
          <Text size="xs" fw={600} c="dimmed" ml={4}>
            {message.senderName}
          </Text>
        )}
        <ChatBubble message={message} />
      </Stack>
    </Group>
  );
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
      withCloseButton={false}
      position="right"
      size="md"
      styles={{
        content: {
          borderLeft: "1px solid var(--mantine-color-default-border)",
        },
        body: {
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          padding: 0,
          background: "var(--mantine-color-body)",
        },
      }}
    >
      <Box
        px="lg"
        py="md"
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--mantine-color-default-border)",
          background:
            "light-dark(var(--mantine-color-white), rgba(0, 0, 0, 0.22))",
          backdropFilter: "blur(12px)",
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="xl" variant="light" color="blue">
              <IconMessage size={20} stroke={1.8} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="sm" lh={1.2}>
                {roomName}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {chatReady ? "In-call messages" : "Connecting…"}
              </Text>
            </Box>
          </Group>
          <UnstyledButton
            onClick={onClose}
            aria-label="Close chat"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--mantine-color-dimmed)",
            }}
          >
            <IconX size={18} />
          </UnstyledButton>
        </Group>
      </Box>

      <Box
        flex={1}
        style={{
          minHeight: 0,
          overflow: "hidden",
          background:
            "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
        }}
      >
        {!chatReady ? (
          <Stack align="center" justify="center" h="100%" gap="md">
            <Loader size="md" type="dots" />
            <Text size="sm" c="dimmed">
              Connecting chat…
            </Text>
          </Stack>
        ) : messages.length === 0 ? (
          <Stack align="center" justify="center" h="100%" gap="md" px="xl">
            <ThemeIcon size={56} radius="xl" variant="light" color="blue">
              <IconMessage size={28} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={4} align="center">
              <Text fw={600} size="sm">
                Start the conversation
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Send a message to everyone in the call. Only participants in this
                meeting can see it.
              </Text>
            </Stack>
          </Stack>
        ) : (
          <ScrollArea h="100%" viewportRef={viewportRef} type="auto" offsetScrollbars>
            <Stack gap="md" px="md" py="lg" pb="xl">
              {messages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  messages={messages}
                  index={index}
                />
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Box>

      <Box
        px="md"
        py="md"
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--mantine-color-default-border)",
          background:
            "light-dark(var(--mantine-color-white), rgba(0, 0, 0, 0.22))",
          backdropFilter: "blur(12px)",
        }}
      >
        <Group
          align="flex-end"
          gap="xs"
          wrap="nowrap"
          p="xs"
          style={{
            borderRadius: 16,
            background:
              "light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))",
            border: "1px solid var(--mantine-color-default-border)",
            boxShadow: "light-dark(0 1px 4px rgba(0,0,0,0.06), none)",
          }}
        >
          <Textarea
            flex={1}
            placeholder="Write a message…"
            value={draft}
            disabled={!chatReady || sending}
            autosize
            minRows={1}
            maxRows={4}
            variant="unstyled"
            px="xs"
            py={6}
            styles={{
              input: {
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--mantine-color-text)",
              },
            }}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <ActionIcon
            size={38}
            radius="xl"
            variant="filled"
            color="blue"
            disabled={!chatReady || !draft.trim() || sending}
            onClick={() => void handleSend()}
            style={{ flexShrink: 0 }}
          >
            <IconSend size={18} stroke={2} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" ta="center" mt={8}>
          Enter to send · Shift+Enter for new line
        </Text>
      </Box>
    </Drawer>
  );
}
