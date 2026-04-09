import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'partyos_onboarding_complete';
const TOKEN_KEY = 'partyos_auth_token';
const USER_KEY = 'partyos_user_data';

export const storage = {
  async getOnboardingComplete(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};
