import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconClipboard,
  IconLink,
  IconShield,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { LayoutShell } from "../components/layout/AppShell";
import { CreateRoomForm } from "../components/lobby/LobbyForms";
import { roomConfigProvider } from "../services/roomConfig";
import type { RoomConfig } from "../types/room";

export function HomePage() {
  const navigate = useNavigate();
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [config, setConfig] = useState<RoomConfig | null>(null);

  return (
    <LayoutShell>
      <Stack gap="xl" maw={1100} mx="auto">
        <Stack gap="sm">
          <Group gap="xs">
            <Badge leftSection={<IconVideo size={12} />} variant="light" size="lg">
              Video meetings
            </Badge>
            <Badge leftSection={<IconUsers size={12} />} variant="light" size="lg">
              Up to 10
            </Badge>
            <Badge leftSection={<IconLink size={12} />} variant="light" size="lg">
              Shareable links
            </Badge>
            <Badge leftSection={<IconShield size={12} />} variant="light" size="lg">
              Join rules
            </Badge>
          </Group>
          <Text c="dimmed" maw={600}>
            Create a room, copy the link, and start calling.
          </Text>
        </Stack>

        <Group align="flex-start" gap="xl" grow preventGrowOverflow={false}>
          <CreateRoomForm
            onCreated={(createdRoomId, createdConfig) => {
              const url = roomConfigProvider.buildJoinUrl(
                createdRoomId,
                createdConfig,
              );
              setRoomId(createdRoomId);
              setConfig(createdConfig);
              setJoinUrl(url);
            }}
          />

          <Paper p="xl" radius="lg" withBorder shadow="sm" maw={420} style={{ flex: 1 }}>
            <Stack gap="md">
              <div>
                <Title order={3}>Share meeting</Title>
                <Text size="sm" c="dimmed" mt={4}>
                  Copy link and invite participants
                </Text>
              </div>

              {joinUrl && config && roomId ? (
                <>
                  <CopyButton value={joinUrl}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Click to copy link"} withArrow>
                        <TextInput
                          label="Meeting link"
                          value={joinUrl}
                          readOnly
                          onClick={() => copy()}
                          rightSectionWidth={42}
                          styles={{
                            input: {
                              cursor: "pointer",
                            },
                          }}
                          rightSection={
                            <ActionIcon
                              variant="light"
                              color={copied ? "teal" : "blue"}
                              size="lg"
                              radius="md"
                              aria-label="Copy meeting link"
                              onClick={(event) => {
                                event.stopPropagation();
                                copy();
                              }}
                            >
                              {copied ? (
                                <IconCheck size={18} stroke={2.5} />
                              ) : (
                                <IconClipboard size={18} stroke={2} />
                              )}
                            </ActionIcon>
                          }
                        />
                      </Tooltip>
                    )}
                  </CopyButton>

                  <Group gap="xs">
                    <Badge variant="outline" leftSection={<IconUsers size={12} />}>
                      {config.maxParticipants} max
                    </Badge>
                    <Badge variant="outline">
                      {config.identityMode === "required" ? "Name required" : "Anonymous"}
                    </Badge>
                    <Badge variant="outline">
                      Mic {config.audioPolicy}
                    </Badge>
                    <Badge variant="outline">
                      Video {config.videoPolicy}
                    </Badge>
                  </Group>

                  <Button
                    onClick={() =>
                      navigate(`/join/${roomId}${new URL(joinUrl).search}`)
                    }
                  >
                    Join now
                  </Button>
                </>
              ) : (
                <Paper p="xl" radius="md" withBorder style={{ borderStyle: "dashed" }}>
                  <Stack align="center" gap="xs">
                    <IconLink size={28} stroke={1.5} opacity={0.5} />
                    <Text size="sm" c="dimmed" ta="center">
                      Link appears here after you create a room
                    </Text>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Paper>
        </Group>
      </Stack>
    </LayoutShell>
  );
}
