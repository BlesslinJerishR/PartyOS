import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { MovieRequest } from '../../types';
import { Check, XCircle, MessageSquare } from 'lucide-react-native';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const loadRequests = useCallback(async () => {
    try {
      const data = (await api.movieRequests.getByHost()) as MovieRequest[];
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (id: string) => {
    try {
      await api.movieRequests.accept(id);
      await loadRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.movieRequests.decline(id);
      await loadRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');
  const handled = requests.filter((r) => r.status !== 'PENDING');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Pending Requests</Text>
      {pending.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={32} color={colors.textLight} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>No pending movie requests</Text>
        </View>
      ) : (
        pending.map((request) => (
          <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.requestInfo}>
              <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>{request.movieTitle}</Text>
              <Text style={[styles.requestFrom, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                Requested by {request.guest?.username || 'Unknown'}
              </Text>
              <Text style={[styles.requestDate, { color: colors.textLight, fontFamily: Fonts.regular }]}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAccept(request.id)}
              >
                <Check size={20} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.declineBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleDecline(request.id)}
              >
                <XCircle size={20} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {handled.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Previous Requests</Text>
          {handled.map((request) => (
            <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.requestInfo}>
                <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>{request.movieTitle}</Text>
                <Text style={[styles.requestFrom, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                  From {request.guest?.username || 'Unknown'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>{request.status}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  requestInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
  },
  requestFrom: {
    fontSize: 13,
    marginTop: 4,
  },
  requestDate: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
