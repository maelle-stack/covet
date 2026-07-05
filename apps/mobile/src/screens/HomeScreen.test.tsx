import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { fontFamilies } from '@covet/design-tokens';

import { HomeScreen } from './HomeScreen';
import { ThemeProvider } from '../design/theme';
import { demoSnapshot } from '../services/fixtures';

function renderHome(props: Parameters<typeof HomeScreen>[0] = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <HomeScreen {...props} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('HomeScreen', () => {
  it('shows the Safe to Spend amount from the snapshot as the dominant serif number', async () => {
    const { findByText } = renderHome();
    const amount = await findByText('$316');
    const flat = Object.assign({}, ...[amount.props.style].flat(2));
    expect(flat.fontFamily).toBe(fontFamilies.serif);
    expect(flat.fontSize).toBe(96); // largest text element on the screen
  });

  it("shows the quiet status line: status : YOU'RE GOOD", async () => {
    const { findByText } = renderHome();
    expect(await findByText("YOU'RE GOOD")).toBeTruthy();
  });

  it('shows the daily pace line beneath the amount, formatted like the reference', async () => {
    const { findByText } = renderHome();
    expect(await findByText('$50.00/day until 07/10')).toBeTruthy();
  });

  it('shows the wallet visual and the commitment reassurance line', async () => {
    const { findByText, getByTestId } = renderHome();
    expect(await findByText('3 Commitments Protected.')).toBeTruthy();
    expect(getByTestId('wallet-visual')).toBeTruthy();
  });

  it('shows the brand wordmark, search, menu, and Chat FAB', async () => {
    const { findByLabelText, getByLabelText } = renderHome();
    expect(await findByLabelText('COVET')).toBeTruthy();
    expect(getByLabelText('Search')).toBeTruthy();
    expect(getByLabelText('Menu')).toBeTruthy();
    expect(getByLabelText('Chat')).toBeTruthy();
  });

  it('renders the bottom nav in the canonical order with Home active', async () => {
    const { findAllByRole } = renderHome();
    const tabs = await findAllByRole('tab');
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual(['Activity', 'Upcoming', 'Home']);
    const selected = tabs.filter((t) => t.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.props.accessibilityLabel).toBe('Home');
  });

  it('fires the chat and menu callbacks (search stays a no-op per founder ruling)', async () => {
    const onOpenChat = jest.fn();
    const onOpenMenu = jest.fn();
    const { findByLabelText, getByLabelText } = renderHome({ onOpenChat, onOpenMenu });

    fireEvent.press(await findByLabelText('Chat'));
    fireEvent.press(getByLabelText('Menu'));
    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });

  it('renders no charts, budget bars, category widgets, or dashboard artifacts', async () => {
    const { findByText, queryByText } = renderHome();
    await findByText('$316');
    for (const banned of [/chart/i, /budget/i, /categor/i, /net worth/i, /spent this month/i]) {
      expect(queryByText(banned)).toBeNull();
    }
  });

  it('displays snapshot data verbatim — the screen does not recalculate money', async () => {
    // The rendered amount must be exactly the snapshot's cents formatted for
    // display, not any client-side derivation.
    const { findByText } = renderHome();
    expect(demoSnapshot.amount).toBe(316_00);
    expect(await findByText('$316')).toBeTruthy();
    expect(demoSnapshot.dailyPace).toBe(50_00);
    expect(await findByText('$50.00/day until 07/10')).toBeTruthy();
  });
});
