import { Image } from 'react-native';

import { useTheme } from '../design/theme';

// Founder-ruled: use the logo asset (exact C/O overlap) rather than
// re-typesetting COVET. Black glyphs on transparent, tinted per theme.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logo = require('../../assets/references/brand-logo.png');

export function Wordmark({ width = 108 }: { width?: number }) {
  const theme = useTheme();
  return (
    <Image
      source={logo}
      accessibilityLabel="COVET"
      resizeMode="contain"
      style={{ width, height: width * 0.32, tintColor: theme.color.text.primary }}
    />
  );
}
