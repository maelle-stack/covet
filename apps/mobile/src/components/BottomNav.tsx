import { Pressable, View } from 'react-native';

import { useTheme } from '../design/theme';
import { Text } from './Text';

export type NavTab = 'activity' | 'upcoming' | 'home';

/**
 * Tab order follows the canonical mockups: Activity / Upcoming / Home.
 * This is an INTENTIONAL deviation from docs/04_design_system.md ("Home
 * centered"), ruled by the founder: the visual references control Phase 5.
 * Do not "correct" this into a centered-Home or generic icon tab bar.
 */
export const NAV_ORDER: readonly NavTab[] = ['activity', 'upcoming', 'home'];

const NAV_LABELS: Record<NavTab, string> = {
  activity: 'Activity',
  upcoming: 'Upcoming',
  home: 'Home',
};

export interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

/** Text-label bottom navigation with a dot under the active tab, per the references. */
export function BottomNav({ active, onChange }: BottomNavProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.color.background.primary,
      }}
    >
      {NAV_ORDER.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={NAV_LABELS[tab]}
            onPress={() => onChange(tab)}
            hitSlop={12}
            style={{ alignItems: 'center' }}
          >
            <Text variant="body" color={theme.color.text.primary}>
              {NAV_LABELS[tab]}
            </Text>
            <View
              testID={isActive ? `nav-dot-${tab}` : undefined}
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                marginTop: 6,
                backgroundColor: isActive ? theme.color.text.primary : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
