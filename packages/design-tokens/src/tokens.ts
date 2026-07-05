/**
 * Covet design tokens (docs/04_design_system.md), with values derived from
 * the founder's canonical references in /design:
 *
 * - Colors sampled from `01 home reference.png` (soft white ground, pale
 *   blue Good-state aura around the wallet, thin near-black outlines) and
 *   the wallet/status guidance in docs/04_design_system.md (pale amber for
 *   Take It Easy, muted silver for Wait Until Payday, restrained red-black
 *   for Let's Not — never bright green / panic red).
 * - Type families from /design/fonts: The Silver Editorial (display serif
 *   for money numbers + wordmark) and Neue Montreal (sans for labels/body).
 *
 * These are brand-level tokens shared by every surface. Screens consume
 * them via the app's theme layer; nothing should hard-code styling.
 */

export const colorTokens = {
  background: {
    /** Soft white ground of the light UI. */
    primary: '#FDFDFB',
    /** Slightly warmer secondary surface (grouped sections, settings). */
    secondary: '#F5F5F2',
    /** Luxury night-mode ground (dark mode is not an inversion). */
    dark: '#0D0D0F',
  },
  text: {
    primary: '#141414',
    secondary: '#4A4A4F',
    muted: '#8A8A90',
  },
  status: {
    /** Good state: the pale-blue wallet/aura from the canonical Home reference. */
    good: '#A9D2E4',
    /** Pale amber / warm glow. */
    takeItEasy: '#E4C88E',
    /** Muted silver-gray. */
    waitUntilPayday: '#B9BDC3',
    /** Restrained red-black. Serious, never frantic. */
    letsNot: '#3B2528',
  },
  aura: {
    /** Good-state radial glow behind the wallet (Home reference). */
    primary: '#C9E6F2',
    warning: '#EFDCB2',
  },
  border: {
    /** Thin near-black outline used on cards in the references. */
    subtle: '#1C1C1E',
  },
  surface: {
    card: '#FFFFFF',
  },
} as const;

/** Dark-mode palette: deep grounds, softened contrast, restrained glow. */
export const darkColorTokens = {
  background: {
    primary: '#0D0D0F',
    secondary: '#17171A',
    dark: '#0D0D0F',
  },
  text: {
    primary: '#F1F0EC',
    secondary: '#B8B8BC',
    muted: '#77777D',
  },
  status: {
    good: '#8FC3DA',
    takeItEasy: '#CBB077',
    waitUntilPayday: '#8F949B',
    letsNot: '#4A3034',
  },
  aura: {
    primary: '#28404C',
    warning: '#453A22',
  },
  border: {
    subtle: '#3A3A3E',
  },
  surface: {
    card: '#161619',
  },
} as const;

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  /** Horizontal screen padding (matches reference gutters). */
  screen: 24,
} as const;

export const radiusTokens = {
  card: 14,
  input: 10,
  pill: 999,
} as const;

/**
 * Font family names as registered with Expo Font (apps/mobile loads the
 * files from assets/fonts under these exact keys).
 */
export const fontFamilies = {
  serif: 'TheSilverEditorial-Regular',
  sans: 'NeueMontreal-Regular',
  sansLight: 'NeueMontreal-Light',
  sansMedium: 'NeueMontreal-Medium',
  sansBold: 'NeueMontreal-Bold',
} as const;

export const typeTokens = {
  /** The Safe to Spend amount — always the largest element on Home. */
  displayMoney: {
    fontFamily: fontFamilies.serif,
    fontSize: 96,
    lineHeight: 100,
    letterSpacing: -2,
  },
  /** COVET wordmark scale (when rendered as text rather than the logo asset). */
  displayLogo: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  /** Uppercase section labels ("INSIGHTS", "SAFE TO SPEND:"). */
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
  },
} as const;

/** Durations in ms. Soft material movement — no bounce, no springs. */
export const motionTokens = {
  /** Slow idle breathing of the wallet glow on Home. */
  walletBreath: 4200,
  fadeIn: 240,
  softSlide: 320,
  statusChange: 480,
} as const;

export const hapticTokens = {
  /** Expo Haptics impact style used for confirmations. */
  confirmation: 'light',
} as const;

export const tokens = {
  color: colorTokens,
  colorDark: darkColorTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  font: fontFamilies,
  type: typeTokens,
  motion: motionTokens,
  haptic: hapticTokens,
} as const;

export type Tokens = typeof tokens;
