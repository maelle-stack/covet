import { render } from '@testing-library/react-native';

import { App } from './App';

describe('App shell', () => {
  it('boots into Home with the Safe to Spend amount once fonts load (mocked as loaded)', async () => {
    const { findByText, findByLabelText } = render(<App />);
    expect(await findByText('$316')).toBeTruthy();
    expect(await findByLabelText('COVET')).toBeTruthy();
  });
});
