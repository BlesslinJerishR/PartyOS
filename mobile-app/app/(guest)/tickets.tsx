import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Colors from '../../constants/Colors';
import { Ticket } from '../../types';
import { Calendar, Clock, MapPin, XCircle, TicketCheck } from 'lucide-react-native';

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadTickets = useCallback(async () => {
    try {
      const data = (await api.tickets.getMy()) as Ticket[];
      setTickets(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleCancel = async (ticketId: string) => {
    Alert.alert('Cancel Ticket', 'Are you sure you want to cancel this ticket?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.tickets.cancel(ticketId);
            await loadTickets();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return Colors.upcoming;
      case 'CHECKED_IN':
        return Colors.nowPlaying;
      case 'COMPLETED':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const active = tickets.filter(
    (t) => t.status === 'BOOKED' || t.status === 'CHECKED_IN',
  );
  const past = tickets.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'CANCELLED',
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>My Tickets</Text>

      {active.length > 0 && (
        <Text style={styles.sectionTitle}>Active</Text>
      )}
      {active.map((ticket) => (
        <View key={ticket.id} style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <View style={styles.ticketInfo}>
              <Text style={styles.movieTitle}>
                {ticket.show?.movieTitle || 'Show'}
              </Text>
              {ticket.show && (
                <>
                  <View style={styles.metaRow}>
                    <Calendar size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                    <Text style={styles.metaText}>
                      {new Date(ticket.show.startTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Clock size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                    <Text style={styles.metaText}>
                      {new Date(ticket.show.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}
              {ticket.seat && (
                <Text style={styles.seatLabel}>
                  Seat: {ticket.seat.label}
                </Text>
              )}
            </View>
            <View style={styles.statusColumn}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(ticket.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(ticket.status) },
                  ]}
                >
                  {ticket.status}
                </Text>
              </View>
            </View>
          </View>
          {ticket.status === 'BOOKED' && (
            <View style={styles.ticketActions}>
              <TouchableOpacity
                style={styles.cancelTicketBtn}
                onPress={() => handleCancel(ticket.id)}
              >
                <XCircle size={16} color={Colors.error} strokeWidth={1.8} />
                <Text style={styles.cancelTicketText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          {ticket.status === 'COMPLETED' && !ticket.show?.isFree && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push(`/review/${ticket.id}`)}
            >
              <Text style={styles.reviewBtnText}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {past.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>History</Text>
          {past.map((ticket) => (
            <View key={ticket.id} style={[styles.ticketCard, styles.pastCard]}>
              <View style={styles.ticketTop}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.movieTitle}>
                    {ticket.show?.movieTitle || 'Show'}
                  </Text>
                  {ticket.show && (
                    <Text style={styles.metaText}>
                      {new Date(ticket.show.startTime).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(ticket.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(ticket.status) },
                    ]}
                  >
                    {ticket.status}
                  </Text>
                </View>
              </View>
              {ticket.status === 'COMPLETED' && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => router.push(`/review/${ticket.id}`)}
                >
                  <Text style={styles.reviewBtnText}>Write Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </>
      )}

      {tickets.length === 0 && (
        <View style={styles.emptyState}>
          <TicketCheck size={40} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Tickets Yet</Text>
          <Text style={styles.emptyText}>
            Book a show to see your tickets here
          </Text>
        </View>
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
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pastCard: {
    opacity: 0.7,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
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
  seatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: 4,
  },
  statusColumn: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelTicketText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  reviewBtn: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 12,
    paddingTop: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
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
