import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, typography } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { ...typography.subtitle },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'World Capitals' }} />
          <Stack.Screen
            name="location/[id]"
            options={{
              title: '',
              headerBackTitle: 'Map',
              presentation: 'card',
            }}
          />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
