import { Pressable, ScrollView, View } from 'react-native';

import type { Transaction } from '@covet/shared-types';

import { Card, CheckX, Text } from '../components';
import { MenuIcon, SearchIcon } from '../components/icons';
import { Screen } from '../components/Screen';
import { useTheme } from '../design/theme';
import { useActivity } from '../hooks/useActivity';
import { toMonthDay } from '../utils/dates';
import { formatDollarsAndCents } from '../utils/money';

export interface ActivityScreenProps {
  onOpenMenu?: () => void;
}

/**
 * Activity (canonical: assets/references/02-activity-reference.png).
 * An elegant feed — Insights, Actions, Transactions — never a ledger or a
 * notification log (docs/01_consumer_experience.md). Insights arrive
 * already gated by the backend's >=25-transaction rule; this screen just
 * renders what the feed contains.
 */
export function ActivityScreen({ onOpenMenu }: ActivityScreenProps) {
  const theme = useTheme();
  const { data: feed } = useActivity();

  return (
    <Screen edgeToEdge testID="activity-screen">
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.screen }}>
        {/* Header: account selector pill left, search + menu right */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          {/* Static in Phase 5: one connected account in the fixtures. */}
          <View
            accessibilityLabel="Account selector"
            style={{
              borderWidth: 1,
              borderColor: theme.color.border.subtle,
              borderRadius: theme.radius.input,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Text variant="label">Account •1234</Text>
          </View>
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
          {/* INSIGHTS — behavioral layer; hidden-with-grace before 25 transactions */}
          <Text variant="label" style={{ marginBottom: theme.spacing.sm }}>
            Insights
          </Text>
          {feed && feed.insights.length > 0 ? (
            feed.insights.map((insight) => (
              <Card key={insight.id} tinted style={{ marginBottom: theme.spacing.md }}>
                <Text variant="title" style={{ fontSize: 18, marginBottom: theme.spacing.xs }}>
                  {insight.title}
                </Text>
                <Text variant="body" style={{ fontSize: 14, lineHeight: 20 }}>
                  {insight.body}
                </Text>
              </Card>
            ))
          ) : (
            <Card tinted style={{ marginBottom: theme.spacing.md }}>
              <Text variant="muted" style={{ fontSize: 14 }}>
                Covet is still learning.
              </Text>
            </Card>
          )}

          {/* ACTIONS — items that need quick attention, check/X controls */}
          <Text
            variant="label"
            style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}
          >
            Actions
          </Text>
          {feed?.actions.length ? (
            feed.actions.map((action) => (
              <Card key={action.id} style={{ marginBottom: theme.spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.spacing.md,
                  }}
                >
                  <Text variant="body" style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>
                    {action.body}
                  </Text>
                  <CheckX subject={action.id} />
                </View>
              </Card>
            ))
          ) : (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <Text variant="muted" style={{ fontSize: 14 }}>
                Nothing needs you right now.
              </Text>
            </Card>
          )}

          {/* TRANSACTIONS — present, readable, visually secondary */}
          <Text
            variant="label"
            style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}
          >
            Transactions
          </Text>
          {feed?.transactions.map((txn) => (
            <TransactionRow key={txn.id} txn={txn} />
          ))}
          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      </View>
    </Screen>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.color.border.subtle + '22',
      }}
    >
      <View>
        <Text variant="body" style={{ fontSize: 14 }}>
          {txn.merchantName ?? 'Transaction'}
        </Text>
        <Text variant="muted" style={{ fontSize: 12 }}>
          {toMonthDay(txn.date)}
          {txn.pending ? ' · pending' : ''}
        </Text>
      </View>
      <Text variant="muted" style={{ fontSize: 14 }}>
        {formatDollarsAndCents(txn.amount)}
      </Text>
    </View>
  );
}
