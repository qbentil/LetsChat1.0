import {
  ActionIcon,
  AppShell,
  Badge,
  Group,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun, IconVideo } from "@tabler/icons-react";

interface LayoutShellProps {
  children: React.ReactNode;
  withHeader?: boolean;
}

export function LayoutShell({ children, withHeader = true }: LayoutShellProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  if (!withHeader) {
    return <>{children}</>;
  }

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconVideo size={22} stroke={1.8} />
            <Text fw={700} size="lg">
              LetsChat
            </Text>
            <Badge variant="light" size="sm">
              2.0
            </Badge>
          </Group>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Toggle color scheme"
            onClick={() => toggleColorScheme()}
          >
            {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
