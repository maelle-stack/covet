import { View, type ViewProps } from 'react-native';

import { useTheme } from '../design/theme';

export interface CardProps extends ViewProps {
  /** Soft aura-tinted fill (the pale gradient cards in the Activity reference). */
  tinted?: boolean;
}

/**
 * The thin-outlined card from the references: near-black hairline border,
 * soft radius, generous padding. Not a shadowed SaaS card.
 */
export function Card({ tinted = false, style, children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.color.border.subtle,
          borderRadius: theme.radius.card,
          backgroundColor: tinted ? theme.color.aura.primary + '33' : theme.color.surface.card,
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
