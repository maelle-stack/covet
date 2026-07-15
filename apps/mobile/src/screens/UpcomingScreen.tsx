import { Pressable, ScrollView, View } from 'react-native';

import type { Commitment, CommitmentHardness, RecurringItem, Vault } from '@covet/shared-types';

import { Button, Card, CheckX, StatusPill, Text } from '../components';
import { MenuIcon, SearchIcon } from '../components/icons';
import { Screen } from '../components/Screen';
import { useTheme } from '../design/theme';
import { useSafeToSpend } from '../hooks/useSafeToSpend';
import { useUpcoming } from '../hooks/useUpcoming';
import { toMonthDay } from '../utils/dates';
import { formatWholeDollars } from '../utils/money';

/** Quiet, human wording for the three protection tiers. */
const HARDNESS_LABELS: Record<CommitmentHardness, string> = {
  hard: 'essential',
  semi_hard: 'important',
  soft: 'flexible',
};

export interface UpcomingScreenProps {
  onOpenMenu?: () => void;
}

/**
 * Upcoming (canonical: assets/references/03-upcoming-reference.png): what
 * Covet is planning around — Upcoming Events, Recurring (bills,
 * subscriptions, and habits together), and Vaults. All protection and
 * affordability state is rendered verbatim from the backend-shaped
 * fixtures; nothing is computed here.
 */
export function UpcomingScreen({ onOpenMenu }: UpcomingScreenProps) {
  const theme = useTheme();
  const { data } = useUpcoming();
  const { data: snapshot } = useSafeToSpend();

  return (
    <Screen edgeToEdge testID="upcoming-screen">
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.screen }}>
        {/* Header: quiet status line left, search + menu right */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          {snapshot ? <StatusPill status={snapshot.status} /> : <View />}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
            Upcoming events
          </Text>
          {data?.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}

          <Text
            variant="label"
            style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}
          >
            Recurring
          </Text>
          {data?.recurring.map((item) => (
            <RecurringRow key={item.id} item={item} />
          ))}

          <Text
            variant="label"
            style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}
          >
            Vaults
          </Text>
          {data?.vaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      </View>
    </Screen>
  );
}

function EventCard({ event }: { event: Commitment }) {
  const theme = useTheme();
  const amount = event.confirmedAmount ?? event.amount ?? event.estimatedAmount;
  const needsReview = event.status === 'candidate';

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      {event.dueAt && (
        <Text variant="label" style={{ alignSelf: 'flex-end' }}>
          {toMonthDay(event.dueAt)}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.sm,
        }}
      >
        <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
          <Text variant="title" style={{ fontSize: 22 }}>
            {event.title}
          </Text>
          <Text variant="muted" style={{ fontSize: 12, marginTop: theme.spacing.xs }}>
            {HARDNESS_LABELS[event.hardness]}
            {needsReview ? ' · needs your ok' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          {/* The estimated-cost circle from the reference */}
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              borderWidth: 1,
              borderColor: theme.color.border.subtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="body" style={{ fontSize: 14 }}>
              {amount !== null ? formatWholeDollars(amount) : '$—'}
            </Text>
          </View>
          <Button variant="quiet" label="Edit" />
        </View>
      </View>
      {needsReview && (
        <View style={{ alignItems: 'flex-end', marginTop: theme.spacing.sm }}>
          <CheckX subject={event.title} />
        </View>
      )}
    </Card>
  );
}

function RecurringRow({ item }: { item: RecurringItem }) {
  const theme = useTheme();
  const needsReview = item.status === 'detected';

  return (
    <Card style={{ marginBottom: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
      {item.nextExpectedAt && (
        <Text variant="label" style={{ alignSelf: 'flex-end', fontSize: 10 }}>
          {toMonthDay(item.nextExpectedAt)}
        </Text>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="body" style={{ fontSize: 17 }}>
            {item.title}
            {item.amountEstimate !== null ? ` – ${formatWholeDollars(item.amountEstimate)}` : ''}
          </Text>
          <Text variant="muted" style={{ fontSize: 11, marginTop: 2 }}>
            {item.recurringType.toUpperCase()} · {HARDNESS_LABELS[item.hardness]}
            {item.userPaused ? ' · paused' : ''}
          </Text>
        </View>
        {needsReview && <CheckX subject={item.title} />}
      </View>
    </Card>
  );
}

function VaultCard({ vault }: { vault: Vault }) {
  const theme = useTheme();

  // Fixture-backed state only: wording keyed off the vault's own fields.
  const stateLine = vault.activelyProtected
    ? `Actively protected · ${formatWholeDollars(vault.currentProtectedAmount)} set aside`
    : 'Saved · not reducing Safe to Spend';

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      {vault.affordabilityDate && (
        <Text variant="label" style={{ alignSelf: 'flex-end', fontSize: 10 }}>
          Expected date: {toMonthDay(vault.affordabilityDate)}
        </Text>
      )}
      <Text variant="body" style={{ fontSize: 17, marginTop: theme.spacing.xs }}>
        {vault.title} – {formatWholeDollars(vault.targetAmount)}
      </Text>
      <Text variant="muted" style={{ fontSize: 11, marginTop: 2 }}>
        {stateLine}
      </Text>
    </Card>
  );
}
