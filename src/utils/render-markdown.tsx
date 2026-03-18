import { Text } from "@mantine/core";
import { type ReactNode } from "react";

export function renderMarkdown(text: string): ReactNode[] {
  return text.split("\n\n").map((paragraph, i) => {
    const parts = paragraph.split(/\*\*(.+?)\*\*/g);
    return (
      <Text key={i} size="sm">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
        )}
      </Text>
    );
  });
}
