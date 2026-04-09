import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Star } from 'lucide-react-native';

export default function ReviewScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { colors } = useTheme();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!ticketId) return;

    setSubmitting(true);
    try {
      await api.reviews.create({
        ticketId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thank you', 'Your review has been submitted', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.hero }]}>Leave a Review</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
          How was your experience?
        </Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(value)}>
              <Star
                size={40}
                color={colors.primary}
                strokeWidth={1.8}
                fill={value <= rating ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.ratingLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
          {rating === 0
            ? 'Tap a star to rate'
            : rating === 1
            ? 'Poor'
            : rating === 2
            ? 'Fair'
            : rating === 3
            ? 'Good'
            : rating === 4
            ? 'Great'
            : 'Excellent'}
        </Text>

        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
          placeholder="Share your experience (optional)"
          placeholderTextColor={colors.textLight}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={[styles.submitText, { color: colors.white, fontFamily: Fonts.bold }]}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  commentInput: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 18,
  },
});
