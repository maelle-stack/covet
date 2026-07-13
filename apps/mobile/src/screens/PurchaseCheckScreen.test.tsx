import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { PurchaseCheckScreen } from './PurchaseCheckScreen';
import { ThemeProvider } from '../design/theme';

function renderPurchaseCheck(onClose = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <PurchaseCheckScreen onClose={onClose} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('PurchaseCheckScreen', () => {
  it('seeds the thread with the fixture jacket exchange (user question + wait decision)', async () => {
    const { findByText, getByText } = renderPurchaseCheck();
    expect(await findByText('can i buy this $180 jacket?')).toBeTruthy();
    expect(
      getByText("I'd wait until Friday. This would leave your weekend too tight."),
    ).toBeTruthy();
    // The decision reads as a labeled decision message, not a lecture.
    expect(getByText('Wait')).toBeTruthy();
  });

  it('offers a text input and a screenshot/link attach affordance', async () => {
    const { findByLabelText } = renderPurchaseCheck();
    expect(await findByLabelText('Ask Covet about a purchase')).toBeTruthy();
    expect(await findByLabelText('Attach screenshot or link')).toBeTruthy();
  });

  it('appends a user bubble and a fixture-backed decision when a message is sent', async () => {
    const { findByLabelText, getByLabelText, findByText } = renderPurchaseCheck();
    const input = await findByLabelText('Ask Covet about a purchase');
    fireEvent.changeText(input, 'can i grab coffee?');
    fireEvent.press(getByLabelText('Send'));

    // The user's own words appear (echoed, not parsed)...
    expect(await findByText('can i grab coffee?')).toBeTruthy();
    // ...and the first canned reply is the "yes" decision.
    expect(await findByText("You're good")).toBeTruthy();
    expect(
      await findByText("You're good. Rent and your birthday dinner are still covered."),
    ).toBeTruthy();
  });

  it('does not send an empty message', async () => {
    const { findByLabelText, getByLabelText, queryAllByLabelText } = renderPurchaseCheck();
    await findByLabelText('Ask Covet about a purchase');
    fireEvent.press(getByLabelText('Send'));
    // Only the seeded Covet decision exists; no new decision message appeared.
    expect(queryAllByLabelText(/^Covet decision:/)).toHaveLength(1);
  });

  it('fires onClose from the header close button', async () => {
    const onClose = jest.fn();
    const { findByLabelText } = renderPurchaseCheck(onClose);
    fireEvent.press(await findByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
