import { useEffect, useState } from "react";
import { Text } from "@mantine/core";

interface CallTimerProps {
  className?: string;
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CallTimer({ className }: CallTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Text size="sm" c="gray.3" ff="monospace" className={className}>
      {formatElapsed(elapsed)}
    </Text>
  );
}
