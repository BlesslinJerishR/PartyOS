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
import { Calendar, Clock, MapPin, XCircle, TicketCheck, ChevronRight } from 'lucide-react-native';

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
  }, [colors]);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'BOOKED': return 'Booked';
      case 'CHECKED_IN': return 'Checked In';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }, []);

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
        <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.ticketRow}>
            {ticket.show?.moviePoster ? (
              <Image source={{ uri: ticket.show.moviePoster, cache: 'force-cache' }} style={styles.posterThumb} />
            ) : (
              <View style={[styles.posterPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                <TicketCheck size={20} color={colors.textLight} strokeWidth={1.5} />
              </View>
            )}
            <View style={styles.ticketInfo}>
              <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]} numberOfLines={1}>
                {ticket.show?.movieTitle || 'Show'}
              </Text>
              {ticket.show && (
                <View style={styles.metaRow}>
                  <Calendar size={12} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                    {new Date(ticket.show.startTime).toLocaleDateString()} at{' '}
                    {new Date(ticket.show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
              {ticket.seat && (
                <Text style={[styles.seatLabel, { color: colors.primary, fontFamily: Fonts.medium }]}>
                  Seat {ticket.seat.label}
                </Text>
              )}
            </View>
            <View style={styles.statusColumn}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '18' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(ticket.status), fontFamily: Fonts.semiBold }]}>
                  {getStatusLabel(ticket.status)}
                </Text>
              </View>
            </View>
          </View>
          {ticket.status === 'BOOKED' && (
            <TouchableOpacity
              style={[styles.actionRow, { borderTopColor: colors.border }]}
              onPress={() => handleCancel(ticket.id)}
            >
              <XCircle size={14} color={colors.error} strokeWidth={1.8} />
              <Text style={[styles.actionText, { color: colors.error, fontFamily: Fonts.medium }]}>Cancel Ticket</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {past.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>History</Text>
          {past.map((ticket) => (
            <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.8 }]}>
              <View style={styles.ticketRow}>
                {ticket.show?.moviePoster ? (
                  <Image source={{ uri: ticket.show.moviePoster, cache: 'force-cache' }} style={styles.posterThumb} />
                ) : (
                  <View style={[styles.posterPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                    <TicketCheck size={20} color={colors.textLight} strokeWidth={1.5} />
                  </View>
                )}
                <View style={styles.ticketInfo}>
                  <Text style={[styles.movieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]} numberOfLines={1}>
                    {ticket.show?.movieTitle || 'Show'}
                  </Text>
                  {ticket.show && (
                    <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                      {new Date(ticket.show.startTime).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={styles.statusColumn}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '18' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status), fontFamily: Fonts.semiBold }]}>
                      {getStatusLabel(ticket.status)}
                    </Text>
                  </View>
                </View>
              </View>
              {ticket.status === 'COMPLETED' && (
                <TouchableOpacity
                  style={[styles.actionRow, { borderTopColor: colors.border }]}
                  onPress={() => router.push(`/review/${ticket.id}`)}
                >
                  <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.actionText, { color: colors.primary, fontFamily: Fonts.medium }]}>Write Review</Text>
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
    fontSize: 13,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  ticketCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  posterThumb: {
    width: 44,
    height: 64,
    borderRadius: 6,
  },
  posterPlaceholder: {
    width: 44,
    height: 64,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: {
    flex: 1,
    marginLeft: 12,
  },
  movieTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
  },
  seatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statusColumn: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 13,
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
