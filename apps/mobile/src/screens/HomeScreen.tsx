import { Pressable, View } from 'react-native';

import type { SafeToSpendSnapshot } from '@covet/shared-types';

import { ChatFab, Screen, StatusPill, Text, WalletVisual, Wordmark } from '../components';
import { LockIcon, MenuIcon, SearchIcon } from '../components/icons';
import { useTheme } from '../design/theme';
import { useSafeToSpend } from '../hooks/useSafeToSpend';
import { toMonthDay } from '../utils/dates';
import { formatDollarsAndCents, formatWholeDollars } from '../utils/money';

export interface HomeScreenProps {
  /** Wired to mocked Purchase Check once that screen exists (founder ruling #6). */
  onOpenChat?: () => void;
  /** Wired to Settings once that screen exists (founder ruling #4). */
  onOpenMenu?: () => void;
}

/**
 * Home (canonical: assets/references/01-home-reference.png). Answers
 * "Am I good?" in under three seconds: wordmark, quiet status line, the
 * Safe to Spend number as the dominant element, muted daily pace, the
 * wallet as the emotional center, and one commitment-reassurance line.
 * Everything money-related comes straight off the SafeToSpendSnapshot —
 * this screen computes nothing.
 */
export function HomeScreen({ onOpenChat, onOpenMenu }: HomeScreenProps) {
  const theme = useTheme();
  const { data: snapshot } = useSafeToSpend();

  return (
    <Screen edgeToEdge testID="home-screen">
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.screen }}>
        {/* Header: wordmark left, search + menu right */}
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Wordmark />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
            {/* Search renders per the reference but is a no-op in Phase 5 (founder ruling #5). */}
            <Pressable accessibilityRole="button" accessibilityLabel="Search" hitSlop={8}>
              <SearchIcon />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Menu"
              hitSlop={8}
              onPress={onOpenMenu}
            >
              <MenuIcon />
            </Pressable>
          </View>
        </View>

        {snapshot ? <HomeBody snapshot={snapshot} /> : <View style={{ flex: 1 }} />}

        <View
          style={{
            position: 'absolute',
            right: theme.spacing.screen,
            bottom: theme.spacing.md,
          }}
        >
          <ChatFab onPress={onOpenChat} />
        </View>
      </View>
    </Screen>
  );
}

function HomeBody({ snapshot }: { snapshot: SafeToSpendSnapshot }) {
  const theme = useTheme();

  const protectedCount =
    snapshot.protectedHardCommitments.length +
    snapshot.protectedSemiHardCommitments.length +
    snapshot.protectedSoftCommitments.length;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: theme.spacing.xs }}>
        <StatusPill status={snapshot.status} />
      </View>

      {/* Hero: label, dominant serif amount, muted pace line */}
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xl }}>
        <Text variant="label" color={theme.color.text.secondary}>
          Safe to spend:
        </Text>
        <Text
          variant="money"
          accessibilityLabel={`Safe to spend ${formatWholeDollars(snapshot.amount)}`}
        >
          {formatWholeDollars(snapshot.amount)}
        </Text>
        {snapshot.dailyPace !== null && (
          <Text variant="muted" style={{ fontSize: 14 }}>
            {formatDollarsAndCents(snapshot.dailyPace)}/day until {toMonthDay(snapshot.payCycleEnd)}
          </Text>
        )}
      </View>

      {/* The wallet: emotional center, supporting the number */}
      <View style={{ alignItems: 'center', marginTop: -theme.spacing.lg }}>
        <WalletVisual status={snapshot.status} width={280} />
      </View>

      {/* Reassurance line */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          marginTop: -theme.spacing.xl,
        }}
      >
        <LockIcon />
        <Text variant="body">{protectedCount} Commitments Protected.</Text>
      </View>
    </View>
  );
}
