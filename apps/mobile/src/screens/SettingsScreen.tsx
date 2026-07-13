import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import type { NotificationPrivacyLevel, StrictnessLevel } from '@covet/shared-types';

import { Card, Segmented, Text } from '../components';
import { CloseIcon } from '../components/icons';
import { Screen } from '../components/Screen';
import { useTheme } from '../design/theme';
import { useUserSettings } from '../hooks/useUserSettings';

export interface SettingsScreenProps {
  onClose?: () => void;
}

const PRIVACY_OPTIONS: ReadonlyArray<{ value: NotificationPrivacyLevel; label: string }> = [
  { value: 'full_detail', label: 'Full detail' },
  { value: 'discreet', label: 'Discreet' },
  { value: 'hidden', label: 'Hidden' },
];

const STRICTNESS_OPTIONS: ReadonlyArray<{ value: StrictnessLevel; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'protective', label: 'Protective' },
];

const GOAL_LABELS: Record<string, string> = {
  stop_overspending: 'Stop overspending',
  build_cushion: 'Build a cushion',
  pay_down_debt: 'Pay down debt',
  know_what_i_can_spend: 'Know what I can spend',
  save_for_something: 'Save for something',
  stay_on_track: 'Stay on track',
};

/**
 * Settings (docs/01_consumer_experience.md): a calm control room, not a
 * settings dump. Grouped, quiet sections; the two fixed choice sets
 * (lock-screen privacy, strictness) use segmented selectors. All values are
 * fixture-backed; local toggles/selection are visual only in Phase 5 and
 * are not persisted or sent anywhere.
 */
export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const theme = useTheme();
  const { data: settings } = useUserSettings();

  // Local, visual-only state seeded from the fixture. No persistence,
  // no backend writes — Phase 6 wires these to /settings.
  const [privacy, setPrivacy] = useState<NotificationPrivacyLevel>('discreet');
  const [strictness, setStrictness] = useState<StrictnessLevel>('balanced');
  const [dailyPacing, setDailyPacing] = useState(true);
  const [saleAlerts, setSaleAlerts] = useState(false);
  const [biometric, setBiometric] = useState(true);

  useEffect(() => {
    if (!settings) return;
    setPrivacy(settings.notificationPrivacyLevel);
    setStrictness('balanced');
    setDailyPacing(settings.dailyPacingNotificationsEnabled);
    setSaleAlerts(settings.saleAlertsEnabled);
    setBiometric(settings.biometricLockEnabled);
  }, [settings]);

  return (
    <Screen edgeToEdge testID="settings-screen">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.screen,
          paddingBottom: theme.spacing.md,
        }}
      >
        <Text variant="title" style={{ fontSize: 24 }}>
          Settings
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={onClose}
        >
          <CloseIcon />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.screen, gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Section title="Profile">
          <RowValue label="Name" value="Maelle" />
          <RowValue label="Archetype" value="The Spontaneous · a little Keeper" />
        </Section>

        {/* Connections */}
        <Section title="Connections">
          <RowLink label="Bank accounts" value="1 connected" />
          <RowLink label="Calendar" value="Connected" />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <RowToggle
            label="Daily pacing alerts"
            value={dailyPacing}
            onValueChange={setDailyPacing}
          />
          <RowToggle
            label="Sale & discount alerts"
            value={saleAlerts}
            onValueChange={setSaleAlerts}
          />
          <RowValue
            label="Quiet hours"
            value={`${settings?.quietHours.start ?? '21:00'} – ${settings?.quietHours.end ?? '09:00'}`}
          />
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
            <Text variant="label" color={theme.color.text.secondary}>
              Lock-screen privacy
            </Text>
            <Segmented
              accessibilityLabel="Lock-screen privacy"
              options={PRIVACY_OPTIONS}
              value={privacy}
              onChange={setPrivacy}
            />
          </View>
        </Section>

        {/* How Covet manages money */}
        <Section title="How Covet manages money">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="label" color={theme.color.text.secondary}>
              Strictness
            </Text>
            <Segmented
              accessibilityLabel="Strictness"
              options={STRICTNESS_OPTIONS}
              value={strictness}
              onChange={setStrictness}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <RowValue label="Financial goal" value={GOAL_LABELS['know_what_i_can_spend'] ?? '—'} />
          </View>
        </Section>

        {/* Trust & data */}
        <Section title="Trust & data">
          <RowToggle label="Biometric unlock" value={biometric} onValueChange={setBiometric} />
          <RowLink label="Privacy & data" value="What Covet uses" />
          <RowLink label="Security" value="Manage" />
          <RowLink label="Review patterns & archetype" value="Review or reset" />
        </Section>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{title}</Text>
      <Card style={{ gap: theme.spacing.md }}>{children}</Card>
    </View>
  );
}

function RowValue({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="body" style={{ fontSize: 15 }}>
        {label}
      </Text>
      <Text variant="muted" style={{ fontSize: 14 }} color={theme.color.text.secondary}>
        {value}
      </Text>
    </View>
  );
}

function RowLink({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Text variant="body" style={{ fontSize: 15 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Text variant="muted" style={{ fontSize: 14 }} color={theme.color.text.muted}>
          {value}
        </Text>
        <Text variant="muted" color={theme.color.text.muted}>
          ›
        </Text>
      </View>
    </Pressable>
  );
}

function RowToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="body" style={{ fontSize: 15 }}>
        {label}
      </Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} />
    </View>
  );
}
