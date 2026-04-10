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
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Ticket } from '../../types';
import { Calendar, Clock, MapPin, XCircle, TicketCheck } from 'lucide-react-native';

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  }, [loadTickets]);

  const handleCancel = useCallback(async (ticketId: string) => {
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
  }, [loadTickets]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'BOOKED':
        return colors.upcoming;
      case 'CHECKED_IN':
        return colors.nowPlaying;
      case 'COMPLETED':
        return colors.success;
      case 'CANCELLED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const active = useMemo(() => tickets.filter(
    (t) => t.status === 'BOOKED' || t.status === 'CHECKED_IN',
  ), [tickets]);
  const past = useMemo(() => tickets.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'CANCELLED',
  ), [tickets]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.heading, { color: colors.text, fontFamily: Fonts.hero }]}>My Tickets</Text>

      {active.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Active</Text>
      )}
      {active.map((ticket) => (
        <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.ticketTop}>
            {ticket.show?.moviePoster && (
              <Image source={{ uri: ticket.show.moviePoster }} style={styles.posterThumb} />
            )}
            <View style={styles.ticketInfo}>
              <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                {ticket.show?.movieTitle || 'Show'}
              </Text>
              {ticket.show && (
                <>
                  <View style={styles.metaRow}>
                    <Calendar size={14} color={colors.textSecondary} strokeWidth={1.8} />
                    <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                      {new Date(ticket.show.startTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
                    <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                      {new Date(ticket.show.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}
              {ticket.seat && (
                <Text style={[styles.seatLabel, { color: colors.primary, fontFamily: Fonts.medium }]}>
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
            <View style={[styles.ticketActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.cancelTicketBtn}
                onPress={() => handleCancel(ticket.id)}
              >
                <XCircle size={16} color={colors.error} strokeWidth={1.8} />
                <Text style={[styles.cancelTicketText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          {ticket.status === 'COMPLETED' && !ticket.show?.isFree && (
            <TouchableOpacity
              style={[styles.reviewBtn, { borderTopColor: colors.border }]}
              onPress={() => router.push(`/review/${ticket.id}`)}
            >
              <Text style={[styles.reviewBtnText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {past.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>History</Text>
          {past.map((ticket) => (
            <View key={ticket.id} style={[styles.ticketCard, styles.pastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.ticketTop}>
                {ticket.show?.moviePoster && (
                  <Image source={{ uri: ticket.show.moviePoster }} style={styles.posterThumb} />
                )}
                <View style={styles.ticketInfo}>
                  <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                    {ticket.show?.movieTitle || 'Show'}
                  </Text>
                  {ticket.show && (
                    <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
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
                  style={[styles.reviewBtn, { borderTopColor: colors.border }]}
                  onPress={() => router.push(`/review/${ticket.id}`)}
                >
                  <Text style={[styles.reviewBtnText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>Write Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </>
      )}

      {tickets.length === 0 && (
        <View style={styles.emptyState}>
          <TicketCheck size={40} color={colors.textLight} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Tickets Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
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
  },
  heading: {
    fontSize: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ticketCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  pastCard: {
    opacity: 0.7,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posterThumb: {
    width: 50,
    height: 75,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
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
  },
  seatLabel: {
    fontSize: 13,
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
  },
  ticketActions: {
    borderTopWidth: 1,
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
  },
  reviewBtn: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
