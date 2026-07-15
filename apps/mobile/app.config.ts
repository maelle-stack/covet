import type { ExpoConfig } from 'expo/config';

/**
 * iOS-first Expo config. Bundle identifier, icons, splash, and other
 * production assets are added once brand assets (fonts, references) are
 * placed in `assets/` and finalized for App Store submission.
 */
const config: ExpoConfig = {
  name: 'Covet',
  slug: 'covet',
  scheme: 'covet',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.covet.app',
  },
  assetBundlePatterns: ['**/*'],
  plugins: [],
};

export default config;
