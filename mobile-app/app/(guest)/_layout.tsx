import { Tabs } from 'expo-router';
import Colors from '../../constants/Colors';
import { Play, Clock, Map, Ticket, User } from 'lucide-react-native';

export default function GuestLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="nowplaying"
        options={{
          title: 'Now Playing',
          tabBarIcon: ({ color, size }) => (
            <Play size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="comingsoon"
        options={{
          title: 'Coming Soon',
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
