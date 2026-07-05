import { View } from 'react-native';

import type { SpendStatus } from '@covet/shared-types';

import { statusVisual, useTheme } from '../design/theme';
import { Text } from './Text';

export interface StatusPillProps {
  status: SpendStatus;
}

/**
 * The low-key status line from the references: "status : YOU'RE GOOD".
 * Small and quiet — the Safe to Spend number is the hero, this is the
 * judgment label (docs/04_design_system.md).
 */
export function StatusPill({ status }: StatusPillProps) {
  const theme = useTheme();
  const visual = statusVisual(status, theme);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`status: ${visual.label}`}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
    >
      <Text
        variant="label"
        color={theme.color.text.secondary}
        style={{ textTransform: 'lowercase' }}
      >
        status :{' '}
      </Text>
      <Text variant="label" color={theme.color.text.primary}>
        {visual.label}
      </Text>
    </View>
  );
}
