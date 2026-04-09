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
import Colors from '../../constants/Colors';
import { Show, Seat, Ticket } from '../../types';
import { SEAT_TYPE_LABELS, SEAT_CAPACITIES } from '../../types';
import { Check, X } from 'lucide-react-native';

const SEAT_COLORS: Record<string, string> = {
  CHAIR: '#0984E3',
  SINGLE_SOFA: '#00B894',
  RECLINER: '#6C5CE7',
  THREE_SEATER_SOFA: '#FDCB6E',
  BED_SINGLE: '#E17055',
  BED_DOUBLE: '#D63031',
  BED_TRIPLE: '#B71C1C',
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const maxRow = Math.max(...seats.map((s) => s.row), 0);
  const maxCol = Math.max(...seats.map((s) => s.col), 0);
  const seatMap = new Map<string, Seat>();
  seats.forEach((s) => seatMap.set(`${s.row},${s.col}`, s));

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{show.movieTitle}</Text>
        <Text style={styles.subtitle}>Select a seat to book</Text>
      </View>

      <View style={styles.screen}>
        <Text style={styles.screenText}>SCREEN</Text>
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
                const color = SEAT_COLORS[seat.type] || Colors.textLight;

                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.seatCell,
                      {
                        backgroundColor: isBooked
                          ? Colors.surfaceAlt
                          : isSelected
                          ? color
                          : color + '30',
                        borderColor: isBooked
                          ? Colors.border
                          : color,
                      },
                    ]}
                    disabled={isBooked}
                    onPress={() => setSelectedSeatId(seat.id)}
                  >
                    {isBooked ? (
                      <X size={12} color={Colors.textLight} strokeWidth={2} />
                    ) : isSelected ? (
                      <Check size={12} color={Colors.white} strokeWidth={2} />
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
          <View style={[styles.legendDot, { backgroundColor: Colors.textLight }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: Colors.primary + '30', borderWidth: 1, borderColor: Colors.primary },
            ]}
          />
          <Text style={styles.legendText}>Available</Text>
        </View>
      </View>

      {selectedSeat && (
        <View style={styles.selectionCard}>
          <Text style={styles.selectionLabel}>Selected Seat</Text>
          <Text style={styles.selectionValue}>
            {selectedSeat.label} ({SEAT_TYPE_LABELS[selectedSeat.type]})
          </Text>
          <Text style={styles.selectionCapacity}>
            Fits {SEAT_CAPACITIES[selectedSeat.type]} person(s)
          </Text>
          <Text style={styles.selectionPrice}>
            {show.isFree ? 'Free Entry' : `Price: ${show.price}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedSeatId || booking) && styles.bookButtonDisabled,
        ]}
        onPress={handleBook}
        disabled={!selectedSeatId || booking}
      >
        <Text style={styles.bookButtonText}>
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
    backgroundColor: Colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  screen: {
    marginHorizontal: 40,
    paddingVertical: 8,
    backgroundColor: Colors.text,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  screenText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
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
    fontWeight: '700',
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
    color: Colors.textSecondary,
  },
  selectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  selectionCapacity: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: Colors.primary,
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
    fontWeight: '700',
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
