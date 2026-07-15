import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { UpcomingScreen } from './UpcomingScreen';
import { ThemeProvider } from '../design/theme';

function renderUpcoming() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <UpcomingScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('UpcomingScreen', () => {
  it('renders the three sections: Upcoming events, Recurring, Vaults', async () => {
    const { findByText, getByText } = renderUpcoming();
    expect(await findByText('Upcoming events')).toBeTruthy();
    expect(getByText('Recurring')).toBeTruthy();
    expect(getByText('Vaults')).toBeTruthy();
  });

  it('shows the candidate birthday dinner with date, estimate circle, Edit, and check/X review', async () => {
    const { findByText, getAllByText, getByText, getByLabelText } = renderUpcoming();
    expect(await findByText('Birthday dinner')).toBeTruthy();
    // 07/11 also appears on the brunch habit's next-expected date.
    expect(getAllByText('07/11').length).toBeGreaterThan(0);
    expect(getByText('$90')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
    expect(getByLabelText('Confirm Birthday dinner')).toBeTruthy();
    expect(getByLabelText('Dismiss Birthday dinner')).toBeTruthy();
  });

  it('shows bills and habits together in Recurring, with type and hardness wording', async () => {
    const { findByText, getByText, getAllByText } = renderUpcoming();
    expect(await findByText('Brunch – $75')).toBeTruthy();
    expect(getByText('Rent – $1200')).toBeTruthy();
    expect(getByText('Pilates – $50')).toBeTruthy();
    expect(getByText(/BILL · essential/)).toBeTruthy();
    expect(getAllByText(/HABIT · flexible/).length).toBe(2);
  });

  it('offers check/X only on the detected (unconfirmed) recurring item', async () => {
    const { findByLabelText, queryByLabelText } = renderUpcoming();
    expect(await findByLabelText('Confirm Brunch')).toBeTruthy();
    expect(queryByLabelText('Confirm Rent')).toBeNull();
    expect(queryByLabelText('Confirm Pilates')).toBeNull();
  });

  it('renders vault state verbatim from fixtures: active protecting vs passive saved', async () => {
    const { findByText, getByText } = renderUpcoming();
    expect(await findByText('Camera – $600')).toBeTruthy();
    expect(getByText('Actively protected · $180 set aside')).toBeTruthy();
    expect(getByText('Jacket – $180')).toBeTruthy();
    expect(getByText('Saved · not reducing Safe to Spend')).toBeTruthy();
  });

  it('shows the quiet status line in the header', async () => {
    const { findByText } = renderUpcoming();
    expect(await findByText("YOU'RE GOOD")).toBeTruthy();
  });
});
