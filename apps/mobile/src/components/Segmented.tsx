import { Pressable, View } from 'react-native';

import { useTheme } from '../design/theme';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** For screen readers / test lookup, e.g. "Strictness". */
  accessibilityLabel: string;
}

/**
 * A quiet segmented selector for the small fixed choice sets in Settings
 * (lock-screen privacy, strictness). Thin outline, no loud fills — the
 * selected segment is filled with the secondary surface, not a bright
 * accent (docs/04_design_system.md restraint).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: theme.color.border.subtle,
        borderRadius: theme.radius.input,
        overflow: 'hidden',
      }}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${accessibilityLabel}: ${option.label}`}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: 'center',
              backgroundColor: selected ? theme.color.background.secondary : 'transparent',
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: theme.color.border.subtle,
            }}
          >
            <Text
              variant="label"
              color={selected ? theme.color.text.primary : theme.color.text.muted}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
