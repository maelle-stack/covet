import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import type { Archetype } from '@covet/shared-types';

import { Button, Glasses, Screen, Text, WalletVisual, Wordmark } from '../components';
import { useTheme, type CovetTheme } from '../design/theme';
import { ARCHETYPE_QUIZ, scoreQuiz, type QuizAnswer } from '../features/onboarding/archetype-quiz';
import { buildArchetypeReveal } from '../features/onboarding/archetype-profiles';
import { useSafeToSpend } from '../hooks/useSafeToSpend';
import { formatWholeDollars } from '../utils/money';

export interface OnboardingScreenProps {
  /** Fires when the user finishes the final reveal and enters the app. */
  onComplete?: () => void;
}

/**
 * The onboarding sequence (docs/01_consumer_experience.md): being fitted for
 * a personal money manager, not filling out a form. Seven steps —
 * welcome, account, bank, calendar, the six-question archetype quiz, the
 * archetype reveal, and the first Safe to Spend. Everything shown is
 * fixture-backed: no real auth, Plaid, calendar, or client-side money math.
 * The final Safe to Spend comes straight off the pre-integration snapshot.
 */
type Step = 'welcome' | 'account' | 'bank' | 'calendar' | 'quiz' | 'reveal' | 'safeToSpend';

const STEP_ORDER: readonly Step[] = [
  'welcome',
  'account',
  'bank',
  'calendar',
  'quiz',
  'reveal',
  'safeToSpend',
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const advance = () => {
    const next = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
    if (next) setStep(next);
  };

  const result = useMemo(
    () => (answers.length === ARCHETYPE_QUIZ.length ? scoreQuiz(answers) : null),
    [answers],
  );

  const answerQuestion = (questionIndex: number, answer: QuizAnswer) => {
    const nextAnswers = [...answers.slice(0, questionIndex), answer];
    setAnswers(nextAnswers);
    if (nextAnswers.length === ARCHETYPE_QUIZ.length) setStep('reveal');
  };

  return (
    <Screen testID="onboarding-screen">
      {step === 'welcome' && <WelcomeStep name={name} onChangeName={setName} onNext={advance} />}
      {step === 'account' && <AccountStep onNext={advance} />}
      {step === 'bank' && <BankStep onNext={advance} />}
      {step === 'calendar' && <CalendarStep onNext={advance} />}
      {step === 'quiz' && <QuizStep answers={answers} onAnswer={answerQuestion} />}
      {step === 'reveal' && result && (
        <RevealStep primary={result.primary} secondary={result.secondary} onNext={advance} />
      )}
      {step === 'safeToSpend' && <SafeToSpendStep name={name} onEnter={onComplete} />}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Shared layout pieces                                                */
/* ------------------------------------------------------------------ */

/** A calm centered step: brand mark, an editorial serif headline, support copy. */
function StepFrame({
  eyebrow,
  title,
  children,
  footer,
  glasses = false,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  glasses?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', paddingTop: theme.spacing.sm }}>
        {glasses ? <Glasses width={56} /> : <Wordmark width={92} />}
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          {eyebrow && (
            <Text variant="label" color={theme.color.text.secondary}>
              {eyebrow}
            </Text>
          )}
          <Text variant="title" style={{ fontSize: 30, lineHeight: 38 }}>
            {title}
          </Text>
        </View>
        {children}
      </View>

      {footer && (
        <View style={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.sm }}>{footer}</View>
      )}
    </View>
  );
}

/** Supporting paragraph under a step headline. */
function Support({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text variant="body" color={theme.color.text.secondary} style={{ lineHeight: 24 }}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Welcome                                                          */
/* ------------------------------------------------------------------ */

function WelcomeStep({
  name,
  onChangeName,
  onNext,
}: {
  name: string;
  onChangeName: (next: string) => void;
  onNext: () => void;
}) {
  const theme = useTheme();
  return (
    <StepFrame title="Let's get you fitted." eyebrow="Welcome to Covet">
      <Support>
        Covet keeps an eye on your money, protects what's coming up, and tells you when you're good
        to spend. First — what should we call you?
      </Support>
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color={theme.color.text.secondary}>
          Your name
        </Text>
        <TextInput
          accessibilityLabel="Your name"
          placeholder="First name"
          placeholderTextColor={theme.color.text.muted}
          value={name}
          onChangeText={onChangeName}
          returnKeyType="next"
          onSubmitEditing={onNext}
          autoCapitalize="words"
          style={inputStyle(theme)}
        />
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <Button label="Begin" onPress={onNext} />
      </View>
    </StepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Account creation (visual only)                                   */
/* ------------------------------------------------------------------ */

const ACCOUNT_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'apple', label: 'Continue with Apple' },
  { id: 'phone', label: 'Continue with phone' },
  { id: 'email', label: 'Continue with email' },
];

function AccountStep({ onNext }: { onNext: () => void }) {
  const theme = useTheme();
  return (
    <StepFrame eyebrow="Create your account" title="Save your place.">
      <Support>
        Your account keeps Covet's read on your money private to you, and lets it pick up exactly
        where you left off.
      </Support>
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {ACCOUNT_OPTIONS.map((option) => (
          <Button key={option.id} label={option.label} onPress={onNext} />
        ))}
      </View>
    </StepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Bank connection (Plaid visual only)                              */
/* ------------------------------------------------------------------ */

function BankStep({ onNext }: { onNext: () => void }) {
  return (
    <StepFrame eyebrow="Connect your bank" title="This is where Covet learns you." glasses>
      <Support>
        Covet reads your real spending through a secure connection to see what's coming, what
        repeats, and what's already spoken for. It never moves your money — it only watches, so it
        can tell you when you're good.
      </Support>
      <View style={{ height: 0 }} />
      <FooterlessNote>Bank-grade encryption. You can disconnect anytime.</FooterlessNote>
      <View style={{ marginTop: 8, gap: 8 }}>
        <Button label="Connect a bank" onPress={onNext} />
        <Button label="I'll do this later" variant="quiet" onPress={onNext} />
      </View>
    </StepFrame>
  );
}

function FooterlessNote({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text variant="muted" style={{ fontSize: 13 }} color={theme.color.text.muted}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Calendar connection (visual only)                               */
/* ------------------------------------------------------------------ */

function CalendarStep({ onNext }: { onNext: () => void }) {
  const theme = useTheme();
  return (
    <StepFrame eyebrow="Connect your calendar" title="So Covet sees life coming.">
      <Support>
        Birthdays, trips, dinners — the things that quietly cost money. If Covet can see them, it
        can set money aside before they arrive instead of after.
      </Support>
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <Button label="Connect Apple Calendar" onPress={onNext} />
        <Button label="Connect Google Calendar" onPress={onNext} />
        <Button label="Not now" variant="quiet" onPress={onNext} />
      </View>
    </StepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Archetype quiz                                                   */
/* ------------------------------------------------------------------ */

function QuizStep({
  answers,
  onAnswer,
}: {
  answers: readonly QuizAnswer[];
  onAnswer: (questionIndex: number, answer: QuizAnswer) => void;
}) {
  const theme = useTheme();
  const index = Math.min(answers.length, ARCHETYPE_QUIZ.length - 1);
  const question = ARCHETYPE_QUIZ[index]!;
  const total = ARCHETYPE_QUIZ.length;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: theme.spacing.sm, gap: theme.spacing.md }}>
        <QuizProgress current={index + 1} total={total} />
        <Text variant="label" color={theme.color.text.secondary}>
          Question {index + 1} of {total}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" style={{ fontSize: 26, lineHeight: 34 }}>
          {question.prompt}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          {question.answers.map((answer, i) => (
            <Pressable
              key={answer.id}
              testID={`quiz-answer-${i}`}
              accessibilityRole="button"
              accessibilityLabel={answer.label}
              onPress={() => onAnswer(index, answer)}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: theme.color.border.subtle,
                borderRadius: theme.radius.card,
                backgroundColor: pressed
                  ? theme.color.background.secondary
                  : theme.color.surface.card,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
              })}
            >
              <Text variant="body">{answer.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function QuizProgress({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  return (
    <View
      testID="quiz-progress"
      accessibilityRole="progressbar"
      accessibilityValue={{ now: current, min: 0, max: total }}
      style={{
        height: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.border.subtle + '22',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${(current / total) * 100}%`,
          height: '100%',
          backgroundColor: theme.color.text.primary,
          borderRadius: theme.radius.pill,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Archetype reveal                                                 */
/* ------------------------------------------------------------------ */

function RevealStep({
  primary,
  secondary,
  onNext,
}: {
  primary: Archetype;
  secondary: Archetype;
  onNext: () => void;
}) {
  const theme = useTheme();
  const reveal = buildArchetypeReveal(primary, secondary);
  return (
    <StepFrame eyebrow="Your archetype" title={reveal.headline} glasses>
      <Support>{reveal.body}</Support>
      <FooterlessNote>
        This shapes how protective Covet is with you. You can revisit it anytime in Settings.
      </FooterlessNote>
      <View style={{ marginTop: theme.spacing.sm }}>
        <Button label="This is me" onPress={onNext} />
      </View>
    </StepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 7. First Safe to Spend                                              */
/* ------------------------------------------------------------------ */

function SafeToSpendStep({ name, onEnter }: { name: string; onEnter?: () => void }) {
  const theme = useTheme();
  const { data: snapshot } = useSafeToSpend();
  const greetingName = name.trim();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', paddingTop: theme.spacing.sm }}>
        <Wordmark width={92} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="label" color={theme.color.text.secondary}>
          {greetingName ? `You're all set, ${greetingName}.` : "You're all set."}
        </Text>
        <Text
          variant="label"
          color={theme.color.text.secondary}
          style={{ marginTop: theme.spacing.lg }}
        >
          Safe to spend:
        </Text>
        {snapshot ? (
          <>
            <Text
              variant="money"
              accessibilityLabel={`Safe to spend ${formatWholeDollars(snapshot.amount)}`}
            >
              {formatWholeDollars(snapshot.amount)}
            </Text>
            <View style={{ alignItems: 'center', marginTop: -theme.spacing.md }}>
              <WalletVisual status={snapshot.status} width={240} />
            </View>
          </>
        ) : (
          <View style={{ height: 240 }} />
        )}
      </View>

      <View style={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.sm }}>
        <Support>
          This is your money, already accounting for what's coming. Welcome to Covet.
        </Support>
        <Button label="Enter Covet" onPress={onEnter} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function inputStyle(theme: CovetTheme) {
  return {
    fontFamily: theme.font.sans,
    fontSize: 17,
    color: theme.color.text.primary,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  } as const;
}
