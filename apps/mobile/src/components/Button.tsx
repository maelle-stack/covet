import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '../design/theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  /**
   * `card`: the tactile luxury card action (soft rectangle, thin border,
   * generous padding, subtle pressed state — COS product card meets Apple
   * settings cell). `quiet`: minimal text action for lightweight decisions.
   * No loud gradients, no chunky fintech pills (docs/04_design_system.md).
   */
  variant?: 'card' | 'quiet';
}

export function Button({ label, variant = 'card', disabled, ...rest }: ButtonProps) {
  const theme = useTheme();

  if (variant === 'quiet') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        hitSlop={8}
        {...rest}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : disabled ? 0.35 : 1 })}
      >
        <Text variant="label">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: theme.color.border.subtle,
        borderRadius: theme.radius.card,
        backgroundColor: pressed ? theme.color.background.secondary : theme.color.surface.card,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}
