import { useState } from "react";
import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlus,
  IconUser,
  IconUserQuestion,
  IconUsers,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import type { RoomConfig } from "../../types/room";

interface JoinNameGateProps {
  roomName: string;
  onSubmit: (name: string) => void;
}

export function JoinNameGate({ roomName, onSubmit }: JoinNameGateProps) {
  const [name, setName] = useState("");

  return (
    <Stack maw={420} mx="auto" w="100%">
      <Paper p="xl" radius="lg" withBorder shadow="sm">
        <Stack gap="md">
          <Title order={2}>Join {roomName}</Title>
          <Text size="sm" c="dimmed">
            Enter your display name
          </Text>
          <TextInput
            leftSection={<IconUser size={16} />}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            maxLength={40}
            autoFocus
            required
          />
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const trimmed = name.trim();
              if (trimmed) onSubmit(trimmed);
            }}
          >
            Join meeting
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

interface CreateRoomFormProps {
  onCreated: (roomId: string, config: RoomConfig) => void;
}

export function CreateRoomForm({ onCreated }: CreateRoomFormProps) {
  const [name, setName] = useState("Team Meeting");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [identityMode, setIdentityMode] = useState<RoomConfig["identityMode"]>("required");
  const [audioPolicy, setAudioPolicy] = useState<RoomConfig["audioPolicy"]>("muted");
  const [videoPolicy, setVideoPolicy] = useState<RoomConfig["videoPolicy"]>("optional");

  return (
    <Paper p="xl" radius="lg" withBorder shadow="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const config: RoomConfig = {
            name: name.trim() || "Meeting",
            maxParticipants,
            identityMode,
            audioPolicy,
            videoPolicy,
          };
          const roomId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
          onCreated(roomId, config);
        }}
      >
        <Stack gap="lg">
          <div>
            <Title order={3}>Create a meeting</Title>
            <Text size="sm" c="dimmed" mt={4}>
              Configure and share instantly
            </Text>
          </div>

          <TextInput
            label={
              <Tooltip label="Shown to participants in the call header">
                <span>Meeting name</span>
              </Tooltip>
            }
            leftSection={<IconCalendarEvent size={16} />}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <div>
            <GroupLabel icon={<IconUsers size={16} />} label="Max participants" />
            <Group gap="sm" mt="xs">
              <Slider
                style={{ flex: 1 }}
                min={2}
                max={10}
                value={maxParticipants}
                onChange={setMaxParticipants}
              />
              <Badge size="lg" variant="light">
                {maxParticipants}
              </Badge>
            </Group>
          </div>

          <div>
            <GroupLabel icon={<IconUserQuestion size={16} />} label="Identity" />
            <SegmentedControl
              mt="xs"
              fullWidth
              value={identityMode}
              onChange={(v) => setIdentityMode(v as RoomConfig["identityMode"])}
              data={[
                { label: "Anonymous", value: "anonymous" },
                { label: "Name required", value: "required" },
              ]}
            />
          </div>

          <div>
            <GroupLabel icon={<IconMicrophone size={16} />} label="Microphone on join" />
            <SegmentedControl
              mt="xs"
              fullWidth
              value={audioPolicy}
              onChange={(v) => setAudioPolicy(v as RoomConfig["audioPolicy"])}
              data={[
                {
                  value: "unmuted",
                  label: (
                    <CenterLabel icon={<IconMicrophone size={14} />} text="Unmuted" />
                  ),
                },
                {
                  value: "muted",
                  label: (
                    <CenterLabel icon={<IconMicrophoneOff size={14} />} text="Muted" />
                  ),
                },
              ]}
            />
            <Text size="xs" c="dimmed" mt={6}>
              Join state only — participants can unmute themselves anytime.
            </Text>
          </div>

          <div>
            <GroupLabel icon={<IconVideo size={16} />} label="Video policy" />
            <SegmentedControl
              mt="xs"
              fullWidth
              value={videoPolicy}
              onChange={(v) => setVideoPolicy(v as RoomConfig["videoPolicy"])}
              data={[
                {
                  value: "optional",
                  label: (
                    <CenterLabel icon={<IconVideo size={14} />} text="Optional" />
                  ),
                },
                {
                  value: "required",
                  label: (
                    <CenterLabel icon={<IconVideoOff size={14} />} text="Required" />
                  ),
                },
              ]}
            />
            <Text size="xs" c="dimmed" mt={6}>
              {videoPolicy === "required"
                ? "Camera stays on — participants cannot turn video off."
                : "Participants can turn their camera on or off during the call."}
            </Text>
          </div>
            Create meeting link
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

function GroupLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Text size="sm" fw={500} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {icon}
      {label}
    </Text>
  );
}

function CenterLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      {text}
    </span>
  );
}