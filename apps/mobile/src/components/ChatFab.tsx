import { Pressable } from 'react-native';

import { useTheme } from '../design/theme';
import { Text } from './Text';

export interface ChatFabProps {
  /** Wired to Purchase Check once that screen exists; no-op until then. */
  onPress?: () => void;
}

/** The circular "Chat" button from the Home reference (bottom right). */
export function ChatFab({ onPress }: ChatFabProps) {
  const theme = useTheme();
  const size = 62;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Chat"
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: theme.color.border.subtle,
        backgroundColor: theme.color.surface.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text variant="body" style={{ fontSize: 14 }}>
        Chat
      </Text>
    </Pressable>
  );
}
