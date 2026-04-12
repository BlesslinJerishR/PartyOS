import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inconsolata_400Regular,
  Inconsolata_500Medium,
  Inconsolata_600SemiBold,
  Inconsolata_700Bold,
} from '@expo-google-fonts/inconsolata';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { AuthProvider, useAuth, useTheme } from '../context/AuthContext';
import { Fonts } from '../constants/Fonts';
import { ToastProvider } from '../components/Toast';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { colors, isDark, isDemo } = useAuth();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isDemo && (
        <View style={[demoBannerStyles.banner, { backgroundColor: colors.primary }]}>
          <Text style={[demoBannerStyles.text, { fontFamily: Fonts.semiBold }]}>
            DEMO MODE — Read Only
          </Text>
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="roleselect" />
        <Stack.Screen name="(host)" />
        <Stack.Screen name="(guest)" />
        <Stack.Screen name="showdetail/[id]" options={{ headerShown: true, title: 'Show Details' }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: 'Book Tickets' }} />
        <Stack.Screen name="review/[ticketId]" options={{ headerShown: true, title: 'Write Review' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inconsolata_400Regular,
    Inconsolata_500Medium,
    Inconsolata_600SemiBold,
    Inconsolata_700Bold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <InnerLayout />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const demoBannerStyles = StyleSheet.create({
  banner: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 1,
  },
});
