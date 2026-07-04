/**
 * Design token placeholders per docs/04_design_system.md.
 *
 * Values are intentionally unset ("TODO") — the founder's UI/UX references
 * and fonts define the real values. This file only fixes the *shape* of the
 * token system so Phase 5 screens can consume `@covet/design-tokens` without
 * a breaking restructure later. Do not invent final colors, type ramps, or
 * motion curves here.
 */

const TODO = 'TODO' as const;

export const colorTokens = {
  background: {
    primary: TODO,
    secondary: TODO,
    dark: TODO,
  },
  text: {
    primary: TODO,
    secondary: TODO,
    muted: TODO,
  },
  status: {
    good: TODO,
    takeItEasy: TODO,
    waitUntilPayday: TODO,
    letsNot: TODO,
  },
  aura: {
    primary: TODO,
    warning: TODO,
  },
  border: {
    subtle: TODO,
  },
  surface: {
    card: TODO,
  },
};

export const spacingTokens = {
  xs: TODO,
  sm: TODO,
  md: TODO,
  lg: TODO,
  xl: TODO,
  screen: TODO,
};

export const radiusTokens = {
  card: TODO,
  input: TODO,
  pill: TODO,
};

export const typeTokens = {
  displayMoney: TODO,
  displayLogo: TODO,
  body: TODO,
  label: TODO,
};

export const motionTokens = {
  walletBreath: TODO,
  fadeIn: TODO,
  softSlide: TODO,
  statusChange: TODO,
};

export const hapticTokens = {
  confirmation: TODO,
};

export const tokens = {
  color: colorTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  type: typeTokens,
  motion: motionTokens,
  haptic: hapticTokens,
};

export type Tokens = typeof tokens;
