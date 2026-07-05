import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

import type { SpendStatus } from '@covet/shared-types';

import { statusVisual, useTheme } from '../design/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Static assets in React Native must use require() so Metro can bundle them.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const walletImage = require('../../assets/references/brand-wallet.png');

export interface WalletVisualProps {
  status: SpendStatus;
  /** Rendered width; height keeps the asset's card proportions. */
  width?: number;
}

/**
 * The wallet: the financial-state avatar (docs/04_design_system.md). A
 * soft radial aura colored by status sits behind the wallet asset and
 * breathes very slowly — barely noticeable, stops under reduced motion.
 * It supports the number emotionally; it never replaces it.
 */
export function WalletVisual({ status, width = 300 }: WalletVisualProps) {
  const theme = useTheme();
  const visual = statusVisual(status, theme);
  const reducedMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: theme.motion.walletBreath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: theme.motion.walletBreath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reducedMotion, theme.motion.walletBreath]);

  const height = width * 0.66;
  const auraSize = width * 1.5;

  return (
    <View
      testID="wallet-visual"
      accessibilityLabel={`wallet, ${visual.label.toLowerCase()}`}
      style={{ width: auraSize, height: auraSize, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        testID="wallet-aura"
        style={{
          position: 'absolute',
          width: auraSize,
          height: auraSize,
          borderRadius: auraSize / 2,
          backgroundColor: visual.aura,
          opacity: breath.interpolate({
            inputRange: [0, 1],
            outputRange: visual.dimmed ? [0.18, 0.24] : [0.4, 0.55],
          }),
          transform: [
            { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
          ],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: auraSize * 0.72,
          height: auraSize * 0.72,
          borderRadius: (auraSize * 0.72) / 2,
          backgroundColor: visual.aura,
          opacity: visual.dimmed ? 0.22 : 0.45,
        }}
      />
      <Image
        source={walletImage}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width, height, opacity: visual.dimmed ? 0.72 : 1 }}
      />
    </View>
  );
}
