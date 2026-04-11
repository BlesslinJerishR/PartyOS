import { Tabs } from 'expo-router';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Clock, Map, Ticket, User } from 'lucide-react-native';

export default function GuestLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 64 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.semiBold,
        },
        headerStyle: {
          backgroundColor: colors.background,
          height: 36 + insets.top,
        },
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          color: colors.text,
          fontSize: 17,
          marginTop: -25,
        },
      }}
    >
      <Tabs.Screen
        name="nowplaying"
        options={{
          title: 'Now Playing',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Play size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="comingsoon"
        options={{
          title: 'Coming Soon',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Map size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
