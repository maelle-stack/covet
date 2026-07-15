import { Image } from 'react-native';

import { useTheme } from '../design/theme';

// The glasses motif (docs/04_design_system.md): a quiet brand symbol for
// onboarding, empty, and loading states — "keeping an eye on your money."
// Never a mascot; used sparingly and tinted per theme.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glasses = require('../../assets/references/brand-glasses.png');

export function Glasses({ width = 64 }: { width?: number }) {
  const theme = useTheme();
  return (
    <Image
      source={glasses}
      accessibilityLabel="Covet"
      resizeMode="contain"
      style={{ width, height: width * 0.42, tintColor: theme.color.text.primary, opacity: 0.9 }}
    />
  );
}
