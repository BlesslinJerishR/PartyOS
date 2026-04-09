import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import Colors from '../../constants/Colors';
import { Show, Review, Snack } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Armchair,
  Cookie,
} from 'lucide-react-native';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [show, setShow] = useState<Show | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const showData = (await api.shows.getOne(id)) as Show;
      setShow(showData);

      const [reviewData, snackData] = await Promise.all([
        api.reviews.getByShow(id) as Promise<Review[]>,
        showData.venueId
          ? (api.snacks.getByVenue(showData.venueId) as Promise<Snack[]>)
          : Promise.resolve([]),
      ]);

      setReviews(reviewData);
      setSnacks(snackData.filter((s: Snack) => s.available));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !show) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isBookable = show.status === 'SCHEDULED' || show.status === 'NOW_PLAYING';
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <ScrollView style={styles.container}>
      {show.moviePoster && (
        <Image source={{ uri: show.moviePoster }} style={styles.heroPoster} />
      )}

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  show.status === 'NOW_PLAYING' ? '#FFE8E3' : '#E3F2FD',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    show.status === 'NOW_PLAYING'
                      ? Colors.nowPlaying
                      : Colors.upcoming,
                },
              ]}
            >
              {show.status === 'NOW_PLAYING' ? 'LIVE' : show.status}
            </Text>
          </View>
          <Text style={styles.priceTag}>
            {show.isFree ? 'Free Entry' : `${show.price}`}
          </Text>
        </View>

        <Text style={styles.title}>{show.movieTitle}</Text>

        <View style={styles.detailRow}>
          <Calendar size={16} color={Colors.textSecondary} strokeWidth={1.8} />
          <Text style={styles.detailText}>
            {new Date(show.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color={Colors.textSecondary} strokeWidth={1.8} />
          <Text style={styles.detailText}>
            {new Date(show.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            to{' '}
            {new Date(show.endTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {show.venue && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.textSecondary} strokeWidth={1.8} />
            <Text style={styles.detailText}>
              {show.venue.name} ({show.venue.screenType.replace('_', ' ')})
            </Text>
          </View>
        )}

        {show.host && (
          <View style={styles.hostCard}>
            <Text style={styles.hostLabel}>Hosted by</Text>
            <Text style={styles.hostName}>{show.host.username}</Text>
            {averageRating && (
              <View style={styles.ratingRow}>
                <Star size={14} color={Colors.accent} strokeWidth={2} fill={Colors.accent} />
                <Text style={styles.ratingText}>{averageRating}</Text>
                <Text style={styles.ratingCount}>({reviews.length} reviews)</Text>
              </View>
            )}
          </View>
        )}

        {isBookable && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/booking/${show.id}`)}
          >
            <Armchair size={20} color={Colors.white} strokeWidth={2} />
            <Text style={styles.bookButtonText}>Book a Seat</Text>
          </TouchableOpacity>
        )}

        {snacks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Cookie size={18} color={Colors.text} strokeWidth={1.8} />
              <Text style={styles.sectionTitle}>Available Snacks</Text>
            </View>
            {snacks.map((snack) => (
              <View key={snack.id} style={styles.snackItem}>
                <Text style={styles.snackName}>{snack.name}</Text>
                <Text style={styles.snackPrice}>
                  {snack.price === 0 ? 'Free' : `${snack.price}`}
                </Text>
              </View>
            ))}
          </>
        )}

        {reviews.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Star size={18} color={Colors.text} strokeWidth={1.8} />
              <Text style={styles.sectionTitle}>Reviews</Text>
            </View>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>
                    {review.user?.username || 'User'}
                  </Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        color={Colors.accent}
                        strokeWidth={2}
                        fill={i < review.rating ? Colors.accent : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))}
          </>
        )}
      </View>

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
  heroPoster: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  hostCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hostLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  snackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  snackName: {
    fontSize: 15,
    color: Colors.text,
  },
  snackPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
