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
import Colors from '../../constants/Colors';
import { MovieRequest } from '../../types';
import { Check, XCircle, MessageSquare } from 'lucide-react-native';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>Pending Requests</Text>
      {pending.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={32} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyText}>No pending movie requests</Text>
        </View>
      ) : (
        pending.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Text style={styles.movieTitle}>{request.movieTitle}</Text>
              <Text style={styles.requestFrom}>
                Requested by {request.guest?.username || 'Unknown'}
              </Text>
              <Text style={styles.requestDate}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(request.id)}
              >
                <Check size={20} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleDecline(request.id)}
              >
                <XCircle size={20} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {handled.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Previous Requests</Text>
          {handled.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.movieTitle}>{request.movieTitle}</Text>
                <Text style={styles.requestFrom}>
                  From {request.guest?.username || 'Unknown'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  request.status === 'ACCEPTED'
                    ? styles.acceptedBadge
                    : styles.declinedBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>{request.status}</Text>
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
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  requestCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  requestFrom: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textLight,
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
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptedBadge: {
    backgroundColor: '#E5FFF5',
  },
  declinedBadge: {
    backgroundColor: '#FFE8E3',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
