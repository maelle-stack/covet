import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { fontFamilies } from '@covet/design-tokens';

import { BottomNav, Button, Card, Screen, StatusPill, Text, WalletVisual } from './index';
import { ThemeProvider } from '../design/theme';

function renderWithTheme(ui: ReactElement, scheme: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>);
}

describe('Text', () => {
  it('renders the money variant in the editorial serif at display scale', () => {
    const { getByText } = renderWithTheme(<Text variant="money">$316</Text>);
    const node = getByText('$316');
    const flat = Object.assign({}, ...[node.props.style].flat(2));
    expect(flat.fontFamily).toBe(fontFamilies.serif);
    expect(flat.fontSize).toBe(96);
  });

  it('renders labels uppercase in the sans-medium family', () => {
    const { getByText } = renderWithTheme(<Text variant="label">Safe to spend</Text>);
    const flat = Object.assign({}, ...[getByText('Safe to spend').props.style].flat(2));
    expect(flat.fontFamily).toBe(fontFamilies.sansMedium);
    expect(flat.textTransform).toBe('uppercase');
  });
});

describe('Screen', () => {
  it('paints the themed background for light and dark schemes', () => {
    const light = renderWithTheme(<Screen testID="screen" />);
    const lightStyle = Object.assign({}, ...[light.getByTestId('screen').props.style].flat(2));
    expect(lightStyle.backgroundColor).toBe('#FDFDFB');

    const dark = renderWithTheme(<Screen testID="screen" />, 'dark');
    const darkStyle = Object.assign({}, ...[dark.getByTestId('screen').props.style].flat(2));
    expect(darkStyle.backgroundColor).toBe('#0D0D0F');
  });
});

describe('Card', () => {
  it('renders children inside a hairline-bordered surface', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <Card testID="card">
        <Text>Nothing needs you right now.</Text>
      </Card>,
    );
    expect(getByText('Nothing needs you right now.')).toBeTruthy();
    const flat = Object.assign({}, ...[getByTestId('card').props.style].flat(2));
    expect(flat.borderWidth).toBe(1);
  });
});

describe('Button', () => {
  it('fires onPress and exposes an accessibility label', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button label="Protect" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports the quiet minimal-text variant', () => {
    const { getByText } = renderWithTheme(<Button variant="quiet" label="Ignore" />);
    expect(getByText('Ignore')).toBeTruthy();
  });
});

describe('BottomNav', () => {
  it('renders tabs in the canonical mockup order: Activity / Upcoming / Home', () => {
    const { getAllByRole } = renderWithTheme(<BottomNav active="home" onChange={() => {}} />);
    const labels = getAllByRole('tab').map((tab) => tab.props.accessibilityLabel);
    expect(labels).toEqual(['Activity', 'Upcoming', 'Home']);
  });

  it('marks only the active tab with the dot and selected state', () => {
    const { getByTestId, queryByTestId, getAllByRole } = renderWithTheme(
      <BottomNav active="upcoming" onChange={() => {}} />,
    );
    expect(getByTestId('nav-dot-upcoming')).toBeTruthy();
    expect(queryByTestId('nav-dot-home')).toBeNull();
    const selected = getAllByRole('tab').filter((t) => t.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
  });

  it('reports tab changes', () => {
    const onChange = jest.fn();
    const { getAllByRole } = renderWithTheme(<BottomNav active="home" onChange={onChange} />);
    fireEvent.press(getAllByRole('tab')[0]!);
    expect(onChange).toHaveBeenCalledWith('activity');
  });
});

describe('StatusPill', () => {
  it("renders the low-key status line: status : YOU'RE GOOD", () => {
    const { getByText } = renderWithTheme(<StatusPill status="YOURE_GOOD" />);
    expect(getByText("YOU'RE GOOD")).toBeTruthy();
    expect(getByText(/status :/)).toBeTruthy();
  });
});

describe('WalletVisual', () => {
  it('renders the wallet with an aura for every status', () => {
    for (const status of ['YOURE_GOOD', 'TAKE_IT_EASY', 'WAIT_UNTIL_PAYDAY', 'LETS_NOT'] as const) {
      const { getByTestId, unmount } = renderWithTheme(<WalletVisual status={status} />);
      expect(getByTestId('wallet-visual')).toBeTruthy();
      expect(getByTestId('wallet-aura')).toBeTruthy();
      unmount();
    }
  });
});
