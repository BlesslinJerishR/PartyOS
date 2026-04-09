import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Show } from '../../types';
import { MapPin, Clock, Users } from 'lucide-react-native';

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

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShows();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Finding shows near you...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.heading, { color: colors.text, fontFamily: Fonts.hero }]}>Playing Now</Text>
      {shows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Shows Playing</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Check back later for live shows near you
          </Text>
        </View>
      ) : (
        shows.map((show) => (
          <TouchableOpacity
            key={show.id}
            style={[styles.showCard, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={() => router.push(`/showdetail/${show.id}`)}
          >
            {show.moviePoster && (
              <Image source={{ uri: show.moviePoster }} style={styles.poster} />
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
              <Text style={[styles.price, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                {show.isFree ? 'Free Entry' : `${show.price}`}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  poster: {
    width: 100,
    height: 150,
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
