import { Platform, StatusBar, View, type ViewProps } from 'react-native';

import { useTheme } from '../design/theme';

export interface ScreenProps extends ViewProps {
  /** Disable the standard horizontal gutter (e.g. for full-bleed auras). */
  edgeToEdge?: boolean;
}

/**
 * Screen container: themed background, generous top inset, standard
 * horizontal gutters. Whitespace is part of the emotional experience
 * (docs/04_design_system.md) — screens should not fight these margins.
 */
export function Screen({ edgeToEdge = false, style, children, ...rest }: ScreenProps) {
  const theme = useTheme();
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 56;

  return (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: theme.color.background.primary,
          paddingTop: topInset,
          paddingHorizontal: edgeToEdge ? 0 : theme.spacing.screen,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
