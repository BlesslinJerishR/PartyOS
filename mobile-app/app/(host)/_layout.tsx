import { Tabs } from 'expo-router';
import Colors from '../../constants/Colors';
import {
  LayoutDashboard,
  Grid3x3,
  Film,
  Cookie,
  MessageSquare,
} from 'lucide-react-native';

export default function HostLayout() {
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="canvas"
        options={{
          title: 'Canvas',
          tabBarIcon: ({ color, size }) => (
            <Grid3x3 size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="shows"
        options={{
          title: 'Shows',
          tabBarIcon: ({ color, size }) => (
            <Film size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="snacks"
        options={{
          title: 'Snacks',
          tabBarIcon: ({ color, size }) => (
            <Cookie size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
