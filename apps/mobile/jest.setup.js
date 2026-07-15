/**
 * Fonts load through native modules that don't exist under Jest; report
 * them as loaded so components render their real type styles in tests.
 */
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));
