import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { SettingsScreen } from './SettingsScreen';
import { ThemeProvider } from '../design/theme';
import { demoSettings } from '../services/fixtures';

function renderSettings(onClose = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  // Seed the settings cache so the fixture-driven state is present at first
  // render (avoids the async re-seed racing a user interaction in the test).
  client.setQueryData(['user-settings'], demoSettings);
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <SettingsScreen onClose={onClose} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('SettingsScreen', () => {
  it('renders every required section from the spec', async () => {
    const { findByText, getByText } = renderSettings();
    expect(await findByText('Profile')).toBeTruthy();
    for (const section of [
      'Connections',
      'Notifications',
      'How Covet manages money',
      'Trust & data',
    ]) {
      expect(getByText(section)).toBeTruthy();
    }
    // Required individual controls.
    for (const row of [
      'Bank accounts',
      'Calendar',
      'Quiet hours',
      'Financial goal',
      'Privacy & data',
      'Security',
      'Review patterns & archetype',
    ]) {
      expect(getByText(row)).toBeTruthy();
    }
  });

  it('offers the three lock-screen privacy levels, seeded to the fixture (discreet)', async () => {
    const { findByLabelText, getByLabelText } = renderSettings();
    expect(await findByLabelText('Lock-screen privacy: Full detail')).toBeTruthy();
    expect(getByLabelText('Lock-screen privacy: Discreet')).toBeTruthy();
    expect(getByLabelText('Lock-screen privacy: Hidden')).toBeTruthy();
    expect(getByLabelText('Lock-screen privacy: Discreet').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('offers the three strictness levels, seeded to Balanced', async () => {
    const { findByLabelText, getByLabelText } = renderSettings();
    expect(await findByLabelText('Strictness: Light')).toBeTruthy();
    expect(getByLabelText('Strictness: Protective')).toBeTruthy();
    expect(getByLabelText('Strictness: Balanced').props.accessibilityState.selected).toBe(true);
  });

  it('lets a privacy level be selected (visual-only in Phase 5)', async () => {
    const { findByLabelText, getByLabelText } = renderSettings();
    fireEvent.press(await findByLabelText('Lock-screen privacy: Hidden'));
    expect(getByLabelText('Lock-screen privacy: Hidden').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('shows quiet hours from the fixture settings', async () => {
    const { findByText } = renderSettings();
    expect(await findByText('21:00 – 09:00')).toBeTruthy();
  });

  it('fires onClose from the header close button', async () => {
    const onClose = jest.fn();
    const { findByLabelText } = renderSettings(onClose);
    fireEvent.press(await findByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
