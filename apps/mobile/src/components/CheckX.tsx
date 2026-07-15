import { Pressable, View } from 'react-native';

import { useTheme } from '../design/theme';
import { Text } from './Text';

export interface CheckXProps {
  /** What is being confirmed/dismissed, for accessibility labels. */
  subject: string;
  onConfirm?: () => void;
  onDeny?: () => void;
}

/**
 * The minimal check / X pair for lightweight approve-deny decisions
 * (docs/04_design_system.md: "quick approval, not homework"). Visual
 * confirmation only in Phase 5 — callbacks reach the backend in Phase 6.
 */
export function CheckX({ subject, onConfirm, onDeny }: CheckXProps) {
  const theme = useTheme();

  const glyph = (label: string, symbol: string, onPress?: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${subject}`}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1, padding: theme.spacing.xs })}
    >
      <Text variant="body" style={{ fontSize: 18 }}>
        {symbol}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      {glyph('Confirm', '✓', onConfirm)}
      {glyph('Dismiss', '✕', onDeny)}
    </View>
  );
}
