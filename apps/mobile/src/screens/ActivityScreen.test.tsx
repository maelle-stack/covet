import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { ActivityScreen } from './ActivityScreen';
import { ThemeProvider } from '../design/theme';
import type { ActivityFeed } from '../services/api';
import { demoTransactions } from '../services/fixtures';

function renderActivity(seed?: ActivityFeed) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  if (seed) client.setQueryData(['activity'], seed);
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <ActivityScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('ActivityScreen', () => {
  it('renders the three sections in order: Insights, Actions, Transactions', async () => {
    const { findByText, getByText } = renderActivity();
    expect(await findByText('Insights')).toBeTruthy();
    expect(getByText('Actions')).toBeTruthy();
    expect(getByText('Transactions')).toBeTruthy();
  });

  it('shows the fixture insight because the feed has >= 25 transactions', async () => {
    const { findByText } = renderActivity();
    expect(await findByText('Your weekends run warm')).toBeTruthy();
  });

  it('shows the still-learning state when the backend feed carries no insights (< 25 transactions)', async () => {
    const { findByText, queryByText } = renderActivity({
      insights: [], // backend gate withheld them
      actions: [],
      transactions: demoTransactions.slice(0, 10),
    });
    expect(await findByText('Covet is still learning.')).toBeTruthy();
    expect(queryByText('Your weekends run warm')).toBeNull();
  });

  it('renders review actions with specific copy and check/X controls', async () => {
    const { findByText, getByText, getAllByLabelText } = renderActivity();
    expect(
      await findByText('Looks like brunch usually lands around $75 on weekends. Plan around this?'),
    ).toBeTruthy();
    expect(getByText('Looks like payday is every other Friday. Confirm?')).toBeTruthy();
    expect(getAllByLabelText(/^Confirm /)).toHaveLength(3);
    expect(getAllByLabelText(/^Dismiss /)).toHaveLength(3);
  });

  it('renders transactions with merchant, date, and amount, secondary in tone', async () => {
    const { findAllByText, getAllByText } = renderActivity();
    expect(await findAllByText('Tatte Bakery')).toBeTruthy();
    expect(getAllByText(/06\/\d{2}/).length).toBeGreaterThan(0);
    expect(getAllByText('$14.50').length).toBeGreaterThan(0);
  });

  it('contains no charts, category breakdowns, budget bars, or analytics', async () => {
    const { findByText, queryByText } = renderActivity();
    await findByText('Insights');
    for (const banned of [/chart/i, /budget/i, /category/i, /net worth/i, /analytics/i]) {
      expect(queryByText(banned)).toBeNull();
    }
  });
});
