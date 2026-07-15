import { View } from 'react-native';

import { useTheme } from '../design/theme';

/**
 * Minimal line icons drawn with plain views — sparse, line-based utility
 * icons per docs/04_design_system.md, without adding an icon library.
 */

export function SearchIcon({ size = 20 }: { size?: number }) {
  const theme = useTheme();
  const ring = size * 0.7;
  return (
    <View
      accessibilityLabel="search"
      style={{ width: size, height: size, alignItems: 'flex-start', justifyContent: 'flex-start' }}
    >
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 1.5,
          borderColor: theme.color.text.primary,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.06,
          bottom: size * 0.02,
          width: size * 0.38,
          height: 1.5,
          backgroundColor: theme.color.text.primary,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="close"
      style={{ width: size, height: size, justifyContent: 'center' }}
    >
      {[45, -45].map((deg) => (
        <View
          key={deg}
          style={{
            position: 'absolute',
            width: size,
            height: 1.5,
            backgroundColor: theme.color.text.primary,
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
    </View>
  );
}

export function MenuIcon({ size = 22 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="menu"
      style={{ width: size, height: size * 0.6, justifyContent: 'space-between' }}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: size, height: 1.5, backgroundColor: theme.color.text.primary }}
        />
      ))}
    </View>
  );
}

export function LockIcon({ size = 16 }: { size?: number }) {
  const theme = useTheme();
  const bodyWidth = size;
  const bodyHeight = size * 0.72;
  const shackle = size * 0.55;
  return (
    <View accessibilityLabel="protected" style={{ alignItems: 'center' }}>
      <View
        style={{
          width: shackle,
          height: shackle * 0.7,
          borderTopLeftRadius: shackle / 2,
          borderTopRightRadius: shackle / 2,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: theme.color.text.primary,
        }}
      />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: theme.color.text.primary,
          marginTop: -1,
        }}
      />
    </View>
  );
}
