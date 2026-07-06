import { fireEvent, render } from '@testing-library/react-native';

import { App } from './App';
import { useAppStore } from '../state/app-store';

describe('App shell', () => {
  beforeEach(() => {
    useAppStore.setState({ activeTab: 'home' });
  });

  it('boots into Home with the Safe to Spend amount once fonts load (mocked as loaded)', async () => {
    const { findByText, findByLabelText } = render(<App />);
    expect(await findByText('$316')).toBeTruthy();
    expect(await findByLabelText('COVET')).toBeTruthy();
  });

  it('keeps the canonical tab order Activity / Upcoming / Home with Home active by default', async () => {
    const { findAllByRole } = render(<App />);
    const tabs = await findAllByRole('tab');
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual(['Activity', 'Upcoming', 'Home']);
    const selected = tabs.filter((t) => t.props.accessibilityState?.selected);
    expect(selected[0]?.props.accessibilityLabel).toBe('Home');
  });

  it('switches to Activity when the Activity tab is pressed', async () => {
    const { findAllByRole, findByText } = render(<App />);
    const [activityTab] = await findAllByRole('tab');
    fireEvent.press(activityTab!);
    expect(await findByText('Insights')).toBeTruthy();
    expect(await findByText('Transactions')).toBeTruthy();
  });

  it('switches to Upcoming when the Upcoming tab is pressed', async () => {
    const { findAllByRole, findByText } = render(<App />);
    const tabs = await findAllByRole('tab');
    fireEvent.press(tabs[1]!);
    expect(await findByText('Vaults')).toBeTruthy();
  });

  it('returns to Home when the Home tab is pressed', async () => {
    const { findAllByRole, findByText } = render(<App />);
    const tabs = await findAllByRole('tab');
    fireEvent.press(tabs[0]!); // Activity
    await findByText('Insights');
    fireEvent.press(tabs[2]!); // Home
    expect(await findByText('$316')).toBeTruthy();
  });
});
