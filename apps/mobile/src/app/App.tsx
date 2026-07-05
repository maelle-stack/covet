import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Screen, Text } from '../components';
import { useCovetFonts } from '../design/fonts';
import { ThemeProvider } from '../design/theme';

/**
 * App shell. Fonts gate the first paint so the serif display never flashes
 * a system font. Screens and navigation land in the next Phase 5
 * checkpoints — this renders only the wordmark placeholder for now.
 */
export function App() {
  const { loaded } = useCovetFonts();

  return (
    <ThemeProvider>
      {loaded ? (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="logo">COVET</Text>
          </View>
        </Screen>
      ) : (
        <Screen />
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
