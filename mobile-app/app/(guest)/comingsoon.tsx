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
import Colors from '../../constants/Colors';
import { Show } from '../../types';
import { Calendar, Clock, MapPin } from 'lucide-react-native';

export default function ComingSoonScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

      const data = (await api.shows.getUpcoming(lat, lng)) as Show[];
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

  const getTimeUntil = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = then.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading upcoming shows...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>Coming Soon</Text>
      {shows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Upcoming Shows</Text>
          <Text style={styles.emptyText}>
            New shows will appear here when hosts schedule them
          </Text>
        </View>
      ) : (
        shows.map((show) => (
          <TouchableOpacity
            key={show.id}
            style={styles.showCard}
            onPress={() => router.push(`/showdetail/${show.id}`)}
          >
            {show.moviePoster && (
              <Image source={{ uri: show.moviePoster }} style={styles.poster} />
            )}
            <View style={styles.showInfo}>
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>
                  {getTimeUntil(show.startTime)}
                </Text>
              </View>
              <Text style={styles.movieTitle}>{show.movieTitle}</Text>
              <View style={styles.metaRow}>
                <Calendar size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.metaText}>
                  {new Date(show.startTime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Clock size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.metaText}>
                  {new Date(show.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {show.venue && (
                <View style={styles.metaRow}>
                  <MapPin size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                  <Text style={styles.metaText}>{show.venue.name}</Text>
                </View>
              )}
              <Text style={styles.price}>
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
    backgroundColor: Colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  showCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poster: {
    width: 100,
    height: 150,
  },
  showInfo: {
    flex: 1,
    padding: 14,
  },
  countdownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.upcoming,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
