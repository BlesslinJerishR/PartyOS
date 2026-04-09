import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import Colors from '../constants/Colors';

export default function IndexScreen() {
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const navigate = async () => {
      const onboardingDone = await storage.getOnboardingComplete();

      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      if (!isAuthenticated) {
        router.replace('/(auth)/login');
        return;
      }

      if (!user?.role) {
        router.replace('/roleselect');
        return;
      }

      if (user.role === 'HOST') {
        router.replace('/(host)/dashboard');
      } else {
        router.replace('/(guest)/nowplaying');
      }
    };

    navigate();
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
