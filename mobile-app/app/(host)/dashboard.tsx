import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth, useTheme } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Fonts } from '../../constants/Fonts';
import { Venue, Show as ShowType } from '../../types';
import { LogOut, Plus, Film, MapPin } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [shows, setShows] = useState<ShowType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [venueData, showData] = await Promise.all([
        api.venues.getMy() as Promise<Venue[]>,
        api.shows.getMy() as Promise<ShowType[]>,
      ]);
      setVenues(venueData);
      setShows(showData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  const activeShows = useMemo(() => shows.filter(
    (s) => s.status === 'NOW_PLAYING' || s.status === 'SCHEDULED',
  ), [shows]);
  const completedShows = useMemo(() => shows.filter((s) => s.status === 'COMPLETED'), [shows]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.text, fontFamily: Fonts.dashBold }]}>Hello, {user?.username}</Text>
          <Text style={[styles.role, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>Party Host</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={22} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary, fontFamily: Fonts.dashBold }]}>{venues.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>Venues</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary, fontFamily: Fonts.dashBold }]}>{activeShows.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>Active Shows</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary, fontFamily: Fonts.dashBold }]}>{completedShows.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.dashBold }]}>My Venues</Text>
        </View>
        {venues.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MapPin size={32} color={colors.textLight} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.text, fontFamily: Fonts.dashMedium }]}>No venues yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
              Go to Canvas tab to create your first venue
            </Text>
          </View>
        ) : (
          venues.map((venue) => (
            <View key={venue.id} style={[styles.venueCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.venueName, { color: colors.text, fontFamily: Fonts.dashMedium }]}>{venue.name}</Text>
              <Text style={[styles.venueAddress, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>{venue.address}</Text>
              <Text style={[styles.venueSeats, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>
                {venue.seats?.length || 0} seats configured
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.dashBold }]}>Active Shows</Text>
        {activeShows.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Film size={32} color={colors.textLight} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.text, fontFamily: Fonts.dashMedium }]}>No active shows</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
              Go to Shows tab to schedule a show
            </Text>
          </View>
        ) : (
          activeShows.map((show) => (
            <View key={show.id} style={[styles.showCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.showHeader}>
                <Text style={[styles.showTitle, { color: colors.text, fontFamily: Fonts.dashMedium }]}>{show.movieTitle}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>{show.status === 'NOW_PLAYING' ? 'Live' : 'Scheduled'}</Text>
                </View>
              </View>
              <Text style={[styles.showTime, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
                {new Date(show.startTime).toLocaleDateString()} at{' '}
                {new Date(show.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={[styles.showPrice, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>
                {show.isFree ? 'Free Entry' : `Price: ${show.price}`}
              </Text>
            </View>
          ))
        )}
      </View>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
  },
  role: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  venueCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  venueName: {
    fontSize: 16,
  },
  venueAddress: {
    fontSize: 13,
    marginTop: 4,
  },
  venueSeats: {
    fontSize: 12,
    marginTop: 6,
  },
  showCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showTitle: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
  },
  showTime: {
    fontSize: 13,
    marginTop: 6,
  },
  showPrice: {
    fontSize: 13,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 32,
  },
});
