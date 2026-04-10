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
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
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
  const { colors } = useTheme();

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
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isBookable = show.status === 'SCHEDULED' || show.status === 'NOW_PLAYING';
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
      {show.moviePoster && (
        <Image source={{ uri: show.moviePoster }} style={styles.heroPoster} />
      )}

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.primary + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {show.status === 'NOW_PLAYING' ? 'LIVE' : show.status}
            </Text>
          </View>
          <Text style={[styles.priceTag, { color: colors.primary, fontFamily: Fonts.bold }]}>
            {show.isPrivate ? '🔒 ' : ''}{show.isFree ? 'Free Entry' : `${show.price}`}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.hero }]}>{show.movieTitle}</Text>

        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.detailText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            {new Date(show.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.detailText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
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
            <MapPin size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.detailText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
              {show.venue.name} ({show.venue.screenType.replace('_', ' ')})
            </Text>
          </View>
        )}

        {show.host && (
          <View style={[styles.hostCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.hostLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Hosted by</Text>
            <Text style={[styles.hostName, { color: colors.text, fontFamily: Fonts.semiBold }]}>{show.host.username}</Text>
            {averageRating && (
              <View style={styles.ratingRow}>
                <Star size={14} color={colors.primary} strokeWidth={2} fill={colors.primary} />
                <Text style={[styles.ratingText, { color: colors.text, fontFamily: Fonts.semiBold }]}>{averageRating}</Text>
                <Text style={[styles.ratingCount, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>({reviews.length} reviews)</Text>
              </View>
            )}
          </View>
        )}

        {isBookable && (
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/booking/${show.id}`)}
          >
            <Armchair size={20} color={colors.white} strokeWidth={2} />
            <Text style={[styles.bookButtonText, { color: colors.white, fontFamily: Fonts.bold }]}>Book a Seat</Text>
          </TouchableOpacity>
        )}

        {snacks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Cookie size={18} color={colors.text} strokeWidth={1.8} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Available Snacks</Text>
            </View>
            {snacks.map((snack) => (
              <View key={snack.id} style={[styles.snackItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.snackName, { color: colors.text, fontFamily: Fonts.regular }]}>{snack.name}</Text>
                <Text style={[styles.snackPrice, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                  {snack.price === 0 ? 'Free' : `${snack.price}`}
                </Text>
              </View>
            ))}
          </>
        )}

        {reviews.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Star size={18} color={colors.text} strokeWidth={1.8} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Reviews</Text>
            </View>
            {reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewUser, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                    {review.user?.username || 'User'}
                  </Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        color={colors.primary}
                        strokeWidth={2}
                        fill={i < review.rating ? colors.primary : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={[styles.reviewComment, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{review.comment}</Text>
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  priceTag: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
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
  },
  hostCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  hostLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 14,
  },
  ratingCount: {
    fontSize: 13,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 18,
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
  },
  snackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  snackName: {
    fontSize: 15,
  },
  snackPrice: {
    fontSize: 14,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUser: {
    fontSize: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
