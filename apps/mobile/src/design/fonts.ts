import { useFonts } from 'expo-font';
import { fontFamilies } from '@covet/design-tokens';

/**
 * Production font registry. Family names MUST match
 * `@covet/design-tokens` `fontFamilies` exactly — the tokens' type styles
 * reference these keys, so a mismatch would silently fall back to the
 * system font and break the editorial look.
 */
export const FONT_ASSETS = {
  [fontFamilies.serif]: require('../../assets/fonts/TheSilverEditorial-Regular.ttf'),
  [fontFamilies.sans]: require('../../assets/fonts/NeueMontreal-Regular.otf'),
  [fontFamilies.sansLight]: require('../../assets/fonts/NeueMontreal-Light.otf'),
  [fontFamilies.sansMedium]: require('../../assets/fonts/NeueMontreal-Medium.otf'),
  [fontFamilies.sansBold]: require('../../assets/fonts/NeueMontreal-Bold.otf'),
} as const;

/**
 * Loads the Covet fonts at the app root. Screens must not render type
 * styles until this reports loaded, or the serif money display would flash
 * in a system font.
 */
export function useCovetFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts(FONT_ASSETS);
  return { loaded, error: error ?? null };
}
