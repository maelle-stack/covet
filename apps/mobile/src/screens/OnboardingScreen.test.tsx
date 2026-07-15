import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { OnboardingScreen } from './OnboardingScreen';
import { ThemeProvider } from '../design/theme';
import { ARCHETYPE_QUIZ } from '../features/onboarding/archetype-quiz';

function renderOnboarding(onComplete = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const utils = render(
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <OnboardingScreen onComplete={onComplete} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...utils, onComplete };
}

/** Walk welcome → account → bank → calendar, landing on the first quiz question. */
async function advanceToQuiz(utils: ReturnType<typeof renderOnboarding>) {
  const { getByLabelText, findByText } = utils;
  fireEvent.press(getByLabelText('Begin')); // welcome
  fireEvent.press(getByLabelText('Continue with Apple')); // account
  fireEvent.press(getByLabelText('Connect a bank')); // bank
  fireEvent.press(getByLabelText('Connect Apple Calendar')); // calendar
  await findByText('Question 1 of 6');
}

/** Answer all six with the first option; deterministically yields Drifter/Spontaneous. */
function answerQuizWithFirstOption(utils: ReturnType<typeof renderOnboarding>) {
  const { getByTestId } = utils;
  for (let i = 0; i < ARCHETYPE_QUIZ.length; i += 1) {
    fireEvent.press(getByTestId('quiz-answer-0'));
  }
}

describe('OnboardingScreen', () => {
  it('opens on the welcome step with a name field and the wordmark', () => {
    const utils = renderOnboarding();
    expect(utils.getByLabelText('Your name')).toBeTruthy();
    expect(utils.getByLabelText('COVET')).toBeTruthy();
    expect(utils.getByText("Let's get you fitted.")).toBeTruthy();
  });

  it('progresses through account, bank, and calendar into the quiz', async () => {
    const utils = renderOnboarding();
    fireEvent.press(utils.getByLabelText('Begin'));
    // Account creation options are shown visually (no real auth).
    expect(utils.getByLabelText('Continue with Apple')).toBeTruthy();
    expect(utils.getByLabelText('Continue with phone')).toBeTruthy();
    expect(utils.getByLabelText('Continue with email')).toBeTruthy();
    fireEvent.press(utils.getByLabelText('Continue with phone'));

    // Bank (Plaid visual only) with a skip path.
    expect(utils.getByLabelText('Connect a bank')).toBeTruthy();
    fireEvent.press(utils.getByLabelText('Connect a bank'));

    // Calendar (visual only) with Apple / Google / skip.
    expect(utils.getByLabelText('Connect Google Calendar')).toBeTruthy();
    fireEvent.press(utils.getByLabelText('Not now'));

    expect(await utils.findByText('Question 1 of 6')).toBeTruthy();
  });

  it('advances the quiz progress bar as questions are answered', async () => {
    const utils = renderOnboarding();
    await advanceToQuiz(utils);

    const progressAt = () => utils.getByTestId('quiz-progress').props.accessibilityValue;
    expect(progressAt()).toEqual({ now: 1, min: 0, max: 6 });

    fireEvent.press(utils.getByTestId('quiz-answer-0'));
    expect(await utils.findByText('Question 2 of 6')).toBeTruthy();
    expect(progressAt()).toEqual({ now: 2, min: 0, max: 6 });

    fireEvent.press(utils.getByTestId('quiz-answer-0'));
    expect(await utils.findByText('Question 3 of 6')).toBeTruthy();
    expect(progressAt()).toEqual({ now: 3, min: 0, max: 6 });
  });

  it('reveals a primary and secondary archetype after the sixth answer', async () => {
    const utils = renderOnboarding();
    await advanceToQuiz(utils);
    answerQuizWithFirstOption(utils);

    // First option of every question tallies to Drifter (primary) + Spontaneous.
    expect(await utils.findByText('Your archetype')).toBeTruthy();
    expect(await utils.findByText("You're The Drifter, with a little Spontaneous.")).toBeTruthy();
  });

  it('reveals the fixture Safe to Spend and routes into Home on completion', async () => {
    const utils = renderOnboarding();

    // Capture the name so the final step can greet by it.
    fireEvent.changeText(utils.getByLabelText('Your name'), 'Maelle');
    fireEvent.press(utils.getByLabelText('Begin'));
    fireEvent.press(utils.getByLabelText('Continue with Apple'));
    fireEvent.press(utils.getByLabelText('Connect a bank'));
    fireEvent.press(utils.getByLabelText('Connect Apple Calendar'));
    await utils.findByText('Question 1 of 6');
    answerQuizWithFirstOption(utils);

    await utils.findByText('Your archetype');
    fireEvent.press(utils.getByLabelText('This is me'));

    // Fixture-backed Safe to Spend reveal ($316 from demoSnapshot).
    expect(await utils.findByText('$316')).toBeTruthy();
    expect(utils.getByText("You're all set, Maelle.")).toBeTruthy();

    fireEvent.press(utils.getByLabelText('Enter Covet'));
    expect(utils.onComplete).toHaveBeenCalledTimes(1);
  });
});
