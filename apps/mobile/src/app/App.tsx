import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { BottomNav, Screen } from '../components';
import { useCovetFonts } from '../design/fonts';
import { ThemeProvider, useTheme } from '../design/theme';
import { ActivityScreen } from '../screens/ActivityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PurchaseCheckScreen } from '../screens/PurchaseCheckScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
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
 * with the active tab in lightweight Zustand state. Purchase Check
 * (from the Home Chat FAB) and Settings (from any screen's menu) present
 * as full-screen overlays over the shell.
 */
function Shell() {
  const theme = useTheme();
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const overlay = useAppStore((s) => s.overlay);
  const openOverlay = useAppStore((s) => s.openOverlay);
  const closeOverlay = useAppStore((s) => s.closeOverlay);

  const openSettings = () => openOverlay('settings');

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background.primary }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomeScreen onOpenChat={() => openOverlay('purchase-check')} onOpenMenu={openSettings} />
        )}
        {activeTab === 'activity' && <ActivityScreen onOpenMenu={openSettings} />}
        {activeTab === 'upcoming' && <UpcomingScreen onOpenMenu={openSettings} />}
      </View>
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {overlay === 'purchase-check' && (
        <Overlay>
          <PurchaseCheckScreen onClose={closeOverlay} />
        </Overlay>
      )}
      {overlay === 'settings' && (
        <Overlay>
          <SettingsScreen onClose={closeOverlay} />
        </Overlay>
      )}
    </View>
  );
}

/** Full-bleed layer above the tab shell for presented screens. */
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>{children}</View>
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
