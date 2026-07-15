import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  colorTokens,
  darkColorTokens,
  fontFamilies,
  motionTokens,
  radiusTokens,
  spacingTokens,
  typeTokens,
} from '@covet/design-tokens';
import type { SpendStatus } from '@covet/shared-types';

/**
 * The app-side theme: brand tokens resolved for the active color scheme.
 * Dark mode is a deliberate luxury night mode (docs/04_design_system.md),
 * not an inversion — both palettes come from the tokens package.
 */
export interface CovetTheme {
  scheme: 'light' | 'dark';
  color: typeof colorTokens | typeof darkColorTokens;
  spacing: typeof spacingTokens;
  radius: typeof radiusTokens;
  type: typeof typeTokens;
  font: typeof fontFamilies;
  motion: typeof motionTokens;
}

export function buildTheme(scheme: 'light' | 'dark'): CovetTheme {
  return {
    scheme,
    color: scheme === 'dark' ? darkColorTokens : colorTokens,
    spacing: spacingTokens,
    radius: radiusTokens,
    type: typeTokens,
    font: fontFamilies,
    motion: motionTokens,
  };
}

const ThemeContext = createContext<CovetTheme>(buildTheme('light'));

export function ThemeProvider({
  children,
  scheme,
}: {
  children: ReactNode;
  /** Override for tests/previews; defaults to the OS setting. */
  scheme?: 'light' | 'dark';
}) {
  const systemScheme = useColorScheme();
  const resolved = scheme ?? (systemScheme === 'dark' ? 'dark' : 'light');
  return <ThemeContext.Provider value={buildTheme(resolved)}>{children}</ThemeContext.Provider>;
}

export function useTheme(): CovetTheme {
  return useContext(ThemeContext);
}

/** User-facing wording for each engine status (presentation only). */
export const STATUS_LABELS: Record<SpendStatus, string> = {
  YOURE_GOOD: "YOU'RE GOOD",
  TAKE_IT_EASY: 'TAKE IT EASY',
  WAIT_UNTIL_PAYDAY: 'WAIT UNTIL PAYDAY',
  LETS_NOT: 'LET’S NOT…',
};

export interface StatusVisual {
  label: string;
  /** Aura/glow color behind the wallet for this state. */
  aura: string;
  /** Accent used for the status wording. */
  accent: string;
  /** Let's Not gets a darker, low-glow, dimmed treatment — serious, not frantic. */
  dimmed: boolean;
}

/**
 * Wallet/status visual mapping (docs/04_design_system.md): Good uses the
 * pale-blue aura from the canonical reference; Take It Easy a pale amber
 * glow; Wait Until Payday muted silver; Let's Not a restrained dark
 * treatment. Never bright green, never aggressive red.
 */
export function statusVisual(status: SpendStatus, theme: CovetTheme): StatusVisual {
  switch (status) {
    case 'YOURE_GOOD':
      return {
        label: STATUS_LABELS[status],
        aura: theme.color.aura.primary,
        accent: theme.color.status.good,
        dimmed: false,
      };
    case 'TAKE_IT_EASY':
      return {
        label: STATUS_LABELS[status],
        aura: theme.color.aura.warning,
        accent: theme.color.status.takeItEasy,
        dimmed: false,
      };
    case 'WAIT_UNTIL_PAYDAY':
      return {
        label: STATUS_LABELS[status],
        aura: theme.color.status.waitUntilPayday,
        accent: theme.color.status.waitUntilPayday,
        dimmed: false,
      };
    case 'LETS_NOT':
      return {
        label: STATUS_LABELS[status],
        aura: theme.color.status.letsNot,
        accent: theme.color.status.letsNot,
        dimmed: true,
      };
  }
}
