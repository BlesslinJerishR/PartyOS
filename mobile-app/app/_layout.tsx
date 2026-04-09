import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    SplashScreen.hideAsync();
  }, []);

  if (!ready) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="roleselect" />
        <Stack.Screen name="(host)" />
        <Stack.Screen name="(guest)" />
        <Stack.Screen name="showdetail/[id]" options={{ headerShown: true, title: 'Show Details' }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: 'Book Tickets' }} />
        <Stack.Screen name="review/[ticketId]" options={{ headerShown: true, title: 'Write Review' }} />
      </Stack>
    </AuthProvider>
  );
}
