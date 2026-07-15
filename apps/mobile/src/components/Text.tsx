import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../design/theme';

export type TextVariant =
  | 'money' // the Safe to Spend hero number — largest element on Home
  | 'logo' // COVET wordmark scale
  | 'title' // section-leading serif moments
  | 'body'
  | 'label' // uppercase, letter-spaced section labels
  | 'muted';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

/**
 * Themed text primitive. All type styles come from the design tokens; no
 * screen should reach for raw fontFamily/fontSize values.
 */
export function Text({ variant = 'body', color, style, children, ...rest }: TextProps) {
  const theme = useTheme();

  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'money':
        return { ...theme.type.displayMoney, color: color ?? theme.color.text.primary };
      case 'logo':
        return { ...theme.type.displayLogo, color: color ?? theme.color.text.primary };
      case 'title':
        return {
          fontFamily: theme.font.serif,
          fontSize: 24,
          lineHeight: 30,
          color: color ?? theme.color.text.primary,
        };
      case 'label':
        return {
          ...theme.type.label,
          textTransform: 'uppercase',
          color: color ?? theme.color.text.secondary,
        };
      case 'muted':
        return { ...theme.type.body, color: color ?? theme.color.text.muted };
      case 'body':
        return { ...theme.type.body, color: color ?? theme.color.text.primary };
    }
  })();

  return (
    <RNText {...rest} style={[variantStyle, style]}>
      {children}
    </RNText>
  );
}
