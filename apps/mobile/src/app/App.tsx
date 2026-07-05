import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { Screen } from '../components';
import { useCovetFonts } from '../design/fonts';
import { ThemeProvider } from '../design/theme';
import { HomeScreen } from '../screens/HomeScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Query GC schedules a long setTimeout that keeps the Jest worker
      // alive after tests; disable it under test only.
      gcTime: process.env.NODE_ENV === 'test' ? Infinity : undefined,
    },
  },
});

/**
 * App shell. Fonts gate the first paint so the serif display never flashes
 * a system font. Renders Home; the remaining screens and tab switching
 * land in the next Phase 5 checkpoints.
 */
export function App() {
  const { loaded } = useCovetFonts();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {loaded ? <HomeScreen /> : <Screen />}
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
