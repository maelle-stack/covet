import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import type { PurchaseCheck, PurchaseDecision } from '@covet/shared-types';

import { Card, Text } from '../components';
import { CloseIcon } from '../components/icons';
import { Screen } from '../components/Screen';
import { useTheme, type CovetTheme } from '../design/theme';
import { api } from '../services/api';

export interface PurchaseCheckScreenProps {
  onClose?: () => void;
}

interface UserMessage {
  id: string;
  role: 'user';
  text: string;
}
interface CovetMessage {
  id: string;
  role: 'covet';
  check: PurchaseCheck;
}
type Message = UserMessage | CovetMessage;

/** yes / wait / no wording + restrained tone (never bright green / panic red). */
function decisionVisual(decision: PurchaseDecision, theme: CovetTheme) {
  switch (decision) {
    case 'yes':
      return { label: "You're good", accent: theme.color.status.good };
    case 'wait':
      return { label: 'Wait', accent: theme.color.status.takeItEasy };
    case 'no':
      return { label: "Let's not", accent: theme.color.status.letsNot };
  }
}

function threadFromCheck(check: PurchaseCheck): Message[] {
  return [
    { id: `${check.id}-u`, role: 'user', text: check.rawInput },
    { id: `${check.id}-c`, role: 'covet', check },
  ];
}

/**
 * Purchase Check (docs/01_consumer_experience.md): a refined, iMessage-like
 * private money conversation. The user asks naturally; Covet answers with a
 * calm decision message (yes / wait / no) and a short reason — never a
 * lecture, no AI avatar, no typing theatrics. Input is NOT parsed and no
 * affordability is computed here; sent messages append a user bubble and
 * surface a fixture-backed decision from the pre-integration client.
 */
export function PurchaseCheckScreen({ onClose }: PurchaseCheckScreenProps) {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const sentCount = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    api.getSeedPurchaseCheck().then((seed) => {
      if (mounted) setMessages(threadFromCheck(seed));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const index = sentCount.current;
    sentCount.current += 1;
    setDraft('');
    setMessages((prev) => [...prev, { id: `sent-${index}`, role: 'user', text }]);
    const check = await api.createPurchaseCheck(text, index);
    setMessages((prev) => [...prev, { id: `reply-${index}`, role: 'covet', check }]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <Screen edgeToEdge testID="purchase-check-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Contextual header (no wordmark on this utility surface) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.screen,
            paddingBottom: theme.spacing.md,
          }}
        >
          <Text variant="title" style={{ fontSize: 20 }}>
            Purchase Check
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            onPress={onClose}
          >
            <CloseIcon />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.screen, gap: theme.spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserBubble key={message.id} text={message.text} />
            ) : (
              <DecisionMessage key={message.id} check={message.check} />
            ),
          )}
          <View style={{ height: theme.spacing.md }} />
        </ScrollView>

        <InputBar draft={draft} onChangeDraft={setDraft} onSend={send} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

function UserBubble({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
      <View
        style={{
          backgroundColor: theme.color.background.secondary,
          borderRadius: theme.radius.card,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <Text variant="body" style={{ fontSize: 15 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function DecisionMessage({ check }: { check: PurchaseCheck }) {
  const theme = useTheme();
  const visual = decisionVisual(check.decision, theme);
  return (
    <Card
      accessibilityLabel={`Covet decision: ${visual.label}`}
      style={{ alignSelf: 'flex-start', maxWidth: '86%' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.xs,
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: visual.accent }} />
        <Text variant="label" color={theme.color.text.primary}>
          {visual.label}
        </Text>
      </View>
      <Text variant="body" style={{ fontSize: 15, lineHeight: 21 }}>
        {check.decisionReason}
      </Text>
    </Card>
  );
}

function InputBar({
  draft,
  onChangeDraft,
  onSend,
}: {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.screen,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.color.border.subtle + '22',
      }}
    >
      {/* Screenshot / link attach — visually present, inert in Phase 5 */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Attach screenshot or link"
        hitSlop={8}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: theme.color.border.subtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="body" style={{ fontSize: 18 }}>
          +
        </Text>
      </Pressable>
      <TextInput
        accessibilityLabel="Ask Covet about a purchase"
        placeholder="Can I buy…?"
        placeholderTextColor={theme.color.text.muted}
        value={draft}
        onChangeText={onChangeDraft}
        onSubmitEditing={onSend}
        returnKeyType="send"
        style={{
          flex: 1,
          fontFamily: theme.font.sans,
          fontSize: 15,
          color: theme.color.text.primary,
          borderWidth: 1,
          borderColor: theme.color.border.subtle,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send"
        hitSlop={8}
        onPress={onSend}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: theme.spacing.xs })}
      >
        <Text variant="label" color={theme.color.text.primary}>
          Send
        </Text>
      </Pressable>
    </View>
  );
}
