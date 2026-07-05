import { render } from '@testing-library/react-native';

import { App } from './App';

describe('App shell', () => {
  it('renders the wordmark once fonts are loaded (fonts are mocked as loaded in tests)', () => {
    const { getByText } = render(<App />);
    expect(getByText('COVET')).toBeTruthy();
  });
});
