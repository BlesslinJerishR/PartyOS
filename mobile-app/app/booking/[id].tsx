import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Show, Seat, Ticket } from '../../types';
import { SEAT_TYPE_LABELS, SEAT_CAPACITIES } from '../../types';
import { Check, X } from 'lucide-react-native';

const SEAT_COLORS: Record<string, string> = {
  CHAIR: '#FF004F',
  SINGLE_SOFA: '#FF004F',
  RECLINER: '#FF004F',
  THREE_SEATER_SOFA: '#FF004F',
  BED_SINGLE: '#FF004F',
  BED_DOUBLE: '#FF004F',
  BED_TRIPLE: '#FF004F',
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookedSeatIds, setBookedSeatIds] = useState<Set<string>>(new Set());
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { colors } = useTheme();

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const showData = (await api.shows.getOne(id)) as Show;
      setShow(showData);

      const [seatData, ticketData] = await Promise.all([
        api.seats.getByVenue(showData.venueId) as Promise<Seat[]>,
        api.tickets.getByShow(id) as Promise<Ticket[]>,
      ]);

      setSeats(seatData);
      const booked = new Set<string>();
      ticketData.forEach((t: Ticket) => {
        if (t.status !== 'CANCELLED') {
          booked.add(t.seatId);
        }
      });
      setBookedSeatIds(booked);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBook = async () => {
    if (!selectedSeatId || !id) return;

    setBooking(true);
    try {
      await api.tickets.book(id, selectedSeatId);
      Alert.alert('Success', 'Ticket booked successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading || !show) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const maxRow = Math.max(...seats.map((s) => s.row), 0);
  const maxCol = Math.max(...seats.map((s) => s.col), 0);
  const seatMap = new Map<string, Seat>();
  seats.forEach((s) => seatMap.set(`${s.row},${s.col}`, s));

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.hero }]}>{show.movieTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Select a seat to book</Text>
      </View>

      <View style={[styles.screen, { backgroundColor: colors.text }]}>
        <Text style={[styles.screenText, { color: colors.white, fontFamily: Fonts.semiBold }]}>SCREEN</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {Array.from({ length: maxRow + 1 }).map((_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: maxCol + 1 }).map((_, col) => {
                const seat = seatMap.get(`${row},${col}`);
                if (!seat) {
                  return <View key={col} style={styles.emptyCell} />;
                }
                const isBooked = bookedSeatIds.has(seat.id);
                const isSelected = selectedSeatId === seat.id;
                const color = SEAT_COLORS[seat.type] || colors.textLight;

                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.seatCell,
                      {
                        backgroundColor: isBooked
                          ? colors.surfaceAlt
                          : isSelected
                          ? color
                          : color + '30',
                        borderColor: isBooked
                          ? colors.border
                          : color,
                      },
                    ]}
                    disabled={isBooked}
                    onPress={() => setSelectedSeatId(seat.id)}
                  >
                    {isBooked ? (
                      <X size={12} color={colors.textLight} strokeWidth={2} />
                    ) : isSelected ? (
                      <Check size={12} color={colors.white} strokeWidth={2} />
                    ) : (
                      <Text style={[styles.seatLabel, { color }]}>
                        {seat.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textLight }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary + '30', borderWidth: 1, borderColor: colors.primary },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Available</Text>
        </View>
      </View>

      {selectedSeat && (
        <View style={[styles.selectionCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.selectionLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Selected Seat</Text>
          <Text style={[styles.selectionValue, { color: colors.text, fontFamily: Fonts.bold }]}>
            {selectedSeat.label} ({SEAT_TYPE_LABELS[selectedSeat.type]})
          </Text>
          <Text style={[styles.selectionCapacity, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Fits {SEAT_CAPACITIES[selectedSeat.type]} person(s)
          </Text>
          <Text style={[styles.selectionPrice, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
            {show.isFree ? 'Free Entry' : `Price: ${show.price}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bookButton,
          { backgroundColor: colors.primary },
          (!selectedSeatId || booking) && styles.bookButtonDisabled,
        ]}
        onPress={handleBook}
        disabled={!selectedSeatId || booking}
      >
        <Text style={[styles.bookButtonText, { color: colors.white, fontFamily: Fonts.bold }]}>
          {booking ? 'Booking...' : 'Confirm Booking'}
        </Text>
      </TouchableOpacity>

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
  header: {
    padding: 20,
  },
  title: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  screen: {
    marginHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  screenText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  grid: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  emptyCell: {
    width: 36,
    height: 36,
    margin: 3,
  },
  seatCell: {
    width: 36,
    height: 36,
    margin: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatLabel: {
    fontSize: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
  },
  selectionCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  selectionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 18,
  },
  selectionCapacity: {
    fontSize: 13,
    marginTop: 4,
  },
  selectionPrice: {
    fontSize: 16,
    marginTop: 8,
  },
  bookButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    fontSize: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
