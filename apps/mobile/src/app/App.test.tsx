import { render } from '@testing-library/react-native';

import { App } from './App';

describe('App shell', () => {
  it('renders without crashing, proving the app skeleton and test tooling wire up correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Covet')).toBeTruthy();
  });
});
