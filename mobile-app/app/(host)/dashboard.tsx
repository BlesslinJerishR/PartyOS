import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth, useTheme } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Fonts } from '../../constants/Fonts';
import { Venue, Show as ShowType } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  MapPin,
  Film,
  Clapperboard,
  CheckCircle2,
  Clock,
  Armchair,
  CircleDot,
  ChevronRight,
  Monitor,
  Projector,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  const activeShows = useMemo(
    () => shows.filter((s) => s.status === 'NOW_PLAYING' || s.status === 'SCHEDULED'),
    [shows],
  );
  const completedCount = useMemo(
    () => shows.filter((s) => s.status === 'COMPLETED').length,
    [shows],
  );
  const totalSeats = useMemo(
    () => venues.reduce((sum, v) => sum + (v.seats?.length || 0), 0),
    [venues],
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
            Welcome back
          </Text>
          <Text style={[styles.username, { color: colors.text, fontFamily: Fonts.dashBold }]}>
            {user?.username}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <MapPin size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.dashBold }]}>
            {venues.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
            Venues
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <Clapperboard size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.dashBold }]}>
            {activeShows.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
            Active
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <CheckCircle2 size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.dashBold }]}>
            {completedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
            Done
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            <Armchair size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: Fonts.dashBold }]}>
            {totalSeats}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
            Seats
          </Text>
        </View>
      </View>

      {/* Active Shows */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: Fonts.dashMedium }]}>
          ACTIVE SHOWS
        </Text>
        {activeShows.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Film size={24} color={colors.textLight} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
              No active shows — go to Shows tab to schedule one
            </Text>
          </View>
        ) : (
          activeShows.map((show) => (
            <View key={show.id} style={[styles.showRow, { backgroundColor: colors.surface }]}>
              {show.moviePoster && (
                <Image
                  source={{ uri: show.moviePoster, cache: 'force-cache' }}
                  style={styles.showPoster}
                  resizeMode="cover"
                />
              )}
              <View style={styles.showLeft}>
                <View style={styles.showTitleRow}>
                  <CircleDot
                    size={10}
                    color={show.status === 'NOW_PLAYING' ? colors.primary : colors.textSecondary}
                    strokeWidth={2.5}
                    style={{ marginTop: 4, marginRight: 8 }}
                  />
                  <Text
                    style={[styles.showTitle, { color: colors.text, fontFamily: Fonts.dashMedium }]}
                    numberOfLines={1}
                  >
                    {show.movieTitle}
                  </Text>
                </View>
                <View style={styles.showMeta}>
                  <Clock size={12} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.showMetaText, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
                    {formatDate(show.startTime)} · {formatTime(show.startTime)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.showPrice, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>
                {show.isFree ? 'Free' : `\u20b9${show.price}`}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Venues */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: Fonts.dashMedium }]}>
          MY VENUES
        </Text>
        {venues.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <MapPin size={24} color={colors.textLight} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}>
              No venues yet — go to Canvas tab to create one
            </Text>
          </View>
        ) : (
          venues.map((venue) => (
            <View key={venue.id} style={[styles.venueRow, { backgroundColor: colors.surface }]}>
              <View style={styles.venueLeft}>
                <Text
                  style={[styles.venueName, { color: colors.text, fontFamily: Fonts.dashMedium }]}
                  numberOfLines={1}
                >
                  {venue.name}
                </Text>
                <Text
                  style={[styles.venueAddr, { color: colors.textSecondary, fontFamily: Fonts.dashRegular }]}
                  numberOfLines={1}
                >
                  {venue.address}
                </Text>
              </View>
              <View style={styles.venueRight}>
                {venue.screenType === 'TV_4K' ? (
                  <Monitor size={13} color={colors.textSecondary} strokeWidth={1.8} />
                ) : (
                  <Projector size={13} color={colors.textSecondary} strokeWidth={1.8} />
                )}
                <View style={styles.venueDivider} />
                <Armchair size={13} color={colors.primary} strokeWidth={1.8} />
                <Text style={[styles.venueSeatCount, { color: colors.primary, fontFamily: Fonts.dashMedium }]}>
                  {venue.seats?.length || 0}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {},
  greeting: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  username: {
    fontSize: 22,
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  emptyCard: {
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  showPoster: {
    width: 40,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
  },
  showLeft: {
    flex: 1,
    marginRight: 12,
  },
  showTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  showTitle: {
    fontSize: 15,
    flex: 1,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    marginLeft: 18,
  },
  showMetaText: {
    fontSize: 12,
  },
  showPrice: {
    fontSize: 14,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  venueLeft: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 15,
  },
  venueAddr: {
    fontSize: 12,
    marginTop: 3,
  },
  venueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueSeatCount: {
    fontSize: 13,
  },
  venueDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(128,128,128,0.25)',
    marginHorizontal: 6,
  },
});
