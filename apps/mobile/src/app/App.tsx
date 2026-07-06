import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { BottomNav, Screen } from '../components';
import { useCovetFonts } from '../design/fonts';
import { ThemeProvider, useTheme } from '../design/theme';
import { ActivityScreen } from '../screens/ActivityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { UpcomingScreen } from '../screens/UpcomingScreen';
import { useAppStore } from '../state/app-store';

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
 * Tab shell: Activity / Upcoming / Home in the canonical mockup order,
 * with the active tab in lightweight Zustand state. Purchase Check and
 * Settings arrive in the next checkpoint (the Chat FAB / menu callbacks
 * are wired then).
 */
function Shell() {
  const theme = useTheme();
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background.primary }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'activity' && <ActivityScreen />}
        {activeTab === 'upcoming' && <UpcomingScreen />}
      </View>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </View>
  );
}

/**
 * App root. Fonts gate the first paint so the serif display never flashes
 * a system font.
 */
export function App() {
  const { loaded } = useCovetFonts();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {loaded ? <Shell /> : <Screen />}
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
