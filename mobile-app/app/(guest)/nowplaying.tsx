import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { isDemoMode } from '../../services/demo';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Show } from '../../types';
import { MapPin, Clock, Users, Lock } from 'lucide-react-native';

const ShowCard = memo(function ShowCard({ show, colors, onPress }: { show: Show; colors: any; onPress: (id: string) => void }) {
  return (
    <TouchableOpacity
      style={[styles.showCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress(show.id)}
    >
      {show.moviePoster && (
        <View style={styles.posterContainer}>
          <Image source={{ uri: show.moviePoster, cache: 'force-cache' }} style={styles.poster} resizeMode="cover" />
        </View>
      )}
      <View style={styles.showInfo}>
        <View style={[styles.liveBadge, { backgroundColor: colors.primary + '20' }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.nowPlaying }]} />
          <Text style={[styles.liveText, { color: colors.nowPlaying, fontFamily: Fonts.semiBold }]}>LIVE</Text>
        </View>
        <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>{show.movieTitle}</Text>
        <View style={styles.metaRow}>
          <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Ends{' '}
            {new Date(show.endTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {show.venue && (
          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{show.venue.name}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {show.isPrivate && <Lock size={12} color={colors.primary} strokeWidth={2} style={{ marginRight: 4 }} />}
          <Text style={[styles.price, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
            {show.isFree ? 'Free Entry' : `${show.price}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function NowPlayingScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();

  const loadShows = useCallback(async () => {
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      if (!isDemoMode()) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      }

      const data = (await api.shows.getNowPlaying(lat, lng)) as Show[];
      setShows(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShows();
    setRefreshing(false);
  }, [loadShows]);

  const handlePress = useCallback((id: string) => {
    router.push(`/showdetail/${id}`);
  }, [router]);

  const keyExtractor = useCallback((item: Show) => item.id, []);

  const renderItem = useCallback(({ item }: { item: Show }) => (
    <ShowCard show={item} colors={colors} onPress={handlePress} />
  ), [colors, handlePress]);

  const ListHeader = useMemo(() => (
    <Text style={[styles.heading, { color: colors.text, fontFamily: Fonts.hero }]}>Playing Now</Text>
  ), [colors.text]);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Shows Playing</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
        Check back later for live shows near you
      </Text>
    </View>
  ), [colors.text, colors.textSecondary]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Finding shows near you...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={shows}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[styles.container, { backgroundColor: colors.surface }]}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={<View style={styles.bottomSpacer} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  heading: {
    fontSize: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  showCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
  },
  posterContainer: {
    width: 100,
  },
  poster: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
  },
  showInfo: {
    flex: 1,
    padding: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
  },
  movieTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
  },
  price: {
    fontSize: 14,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
