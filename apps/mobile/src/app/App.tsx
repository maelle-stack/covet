import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

/**
 * App shell placeholder. Navigation (Activity / Home / Upcoming per
 * docs/04_design_system.md) and real screens are built in Phase 5.
 * This intentionally renders no product UI yet.
 */
export function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Covet</Text>
      <StatusBar style="auto" />
    </View>
  );
}
