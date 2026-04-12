import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Show, Seat, Ticket, SeatType } from '../../types';
import { SEAT_TYPE_LABELS, SEAT_CAPACITIES, SEAT_COLORS, SEAT_DIMENSIONS } from '../../types';
import { Check, X, Lock } from 'lucide-react-native';

const GRID_CELL_SIZE = 42;

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookedSeatIds, setBookedSeatIds] = useState<Set<string>>(new Set());
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showPassword, setShowPassword] = useState('');
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

  const toggleSeat = useCallback((seatId: string) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
        next.add(seatId);
      }
      return next;
    });
  }, []);

  const handleBook = useCallback(async () => {
    if (selectedSeatIds.size === 0 || !id) return;

    if (show?.isPrivate && !showPassword.trim()) {
      Alert.alert('Password Required', 'Please enter the show password to book.');
      return;
    }

    setBooking(true);
    try {
      const seatIdsArray = [...selectedSeatIds];
      const password = show?.isPrivate ? showPassword : undefined;

      if (seatIdsArray.length === 1) {
        await api.tickets.book(id, seatIdsArray[0], password);
      } else {
        await api.tickets.bookMultiple(id, seatIdsArray, password);
      }

      const count = seatIdsArray.length;
      Alert.alert('Success', `${count} ticket${count > 1 ? 's' : ''} booked successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setBooking(false);
    }
  }, [selectedSeatIds, id, show?.isPrivate, showPassword, router]);

  const maxRow = useMemo(() => seats.length > 0
    ? Math.max(...seats.map((s) => s.row + SEAT_DIMENSIONS[s.type].rows - 1), 0)
    : 0, [seats]);
  const maxCol = useMemo(() => seats.length > 0
    ? Math.max(...seats.map((s) => s.col + SEAT_DIMENSIONS[s.type].cols - 1), 0)
    : 0, [seats]);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedSeatIds.has(s.id)),
    [seats, selectedSeatIds],
  );

  // Derive unique seat types present in the venue for the legend
  const seatTypesInVenue = useMemo(() => {
    const typeSet = new Set<SeatType>();
    seats.forEach((s) => typeSet.add(s.type));
    return [...typeSet];
  }, [seats]);

  const totalCapacity = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + SEAT_CAPACITIES[s.type], 0),
    [selectedSeats],
  );

  const totalPrice = useMemo(
    () => show ? (show.isFree ? 0 : show.price * selectedSeats.length) : 0,
    [show, selectedSeats],
  );

  if (loading || !show) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getOccupiedCells = (): Set<string> => {
    const occupied = new Set<string>();
    seats.forEach((seat) => {
      const dims = SEAT_DIMENSIONS[seat.type];
      for (let r = seat.row; r < seat.row + dims.rows; r++) {
        for (let c = seat.col; c < seat.col + dims.cols; c++) {
          occupied.add(`${r}-${c}`);
        }
      }
    });
    return occupied;
  };

  const renderGrid = () => {
    const occupiedCells = getOccupiedCells();
    const elements: React.ReactElement[] = [];

    for (let r = 0; r <= maxRow; r++) {
      for (let c = 0; c <= maxCol; c++) {
        if (!occupiedCells.has(`${r}-${c}`)) {
          elements.push(
            <View
              key={`empty-${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * GRID_CELL_SIZE,
                top: r * GRID_CELL_SIZE,
                width: GRID_CELL_SIZE,
                height: GRID_CELL_SIZE,
              }}
            />,
          );
        }
      }
    }

    seats.forEach((seat) => {
      const dims = SEAT_DIMENSIONS[seat.type];
      const seatWidth = dims.cols * GRID_CELL_SIZE - 6;
      const seatHeight = dims.rows * GRID_CELL_SIZE - 6;
      const isBooked = bookedSeatIds.has(seat.id);
      const isSelected = selectedSeatIds.has(seat.id);
      const color = SEAT_COLORS[seat.type] || colors.textLight;

      elements.push(
        <TouchableOpacity
          key={`seat-${seat.id}`}
          style={{
            position: 'absolute',
            left: seat.col * GRID_CELL_SIZE + 3,
            top: seat.row * GRID_CELL_SIZE + 3,
            width: seatWidth,
            height: seatHeight,
            borderRadius: 6,
            borderWidth: 1.5,
            backgroundColor: isBooked
              ? colors.surfaceAlt
              : isSelected
              ? color
              : color + '30',
            borderColor: isBooked ? colors.border : color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={isBooked}
          onPress={() => toggleSeat(seat.id)}
          activeOpacity={0.7}
        >
          {isBooked ? (
            <X size={12} color={colors.textLight} strokeWidth={2} />
          ) : isSelected ? (
            <>
              <Check size={12} color={colors.white} strokeWidth={2} />
              {(dims.cols > 1 || dims.rows > 1) && (
                <Text style={{ color: colors.white, fontSize: 8, fontFamily: Fonts.regular, marginTop: 1 }}>
                  {seat.label}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={{ color, fontSize: dims.cols > 1 || dims.rows > 1 ? 10 : 8, fontFamily: Fonts.medium }}>
                {seat.label}
              </Text>
              {(dims.cols > 1 || dims.rows > 1) && (
                <Text style={{ color: color + '99', fontSize: 7, fontFamily: Fonts.regular, marginTop: 1 }}>
                  {SEAT_TYPE_LABELS[seat.type]}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>,
      );
    });

    return (
      <View
        style={{
          width: (maxCol + 1) * GRID_CELL_SIZE,
          height: (maxRow + 1) * GRID_CELL_SIZE,
          position: 'relative',
        }}
      >
        {elements}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.hero }]}>{show.movieTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
          Tap to select seats · multiple allowed
        </Text>
      </View>

      <View style={styles.screenContainer}>
        <View style={[styles.curvedScreen, { backgroundColor: colors.text }]}>
          <Text style={[styles.screenWayText, { color: colors.background, fontFamily: Fonts.regular }]}>
            Screen this way
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
        {renderGrid()}
      </ScrollView>

      {/* Legend — seat type colors + booked + selected indicators */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }]}>
              <X size={7} color={colors.textLight} strokeWidth={2.5} />
            </View>
            <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.text }]}>
              <Check size={7} color={colors.background} strokeWidth={2.5} />
            </View>
            <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Selected</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          {seatTypesInVenue.map((type) => (
            <View key={type} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: SEAT_COLORS[type] + '30', borderWidth: 1, borderColor: SEAT_COLORS[type] },
                ]}
              />
              <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                {SEAT_TYPE_LABELS[type]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {selectedSeats.length > 0 && (
        <View style={[styles.selectionCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.selectionLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Selected — {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.selectedSeatsList}>
            {selectedSeats.map((seat) => (
              <View key={seat.id} style={[styles.seatChip, { backgroundColor: SEAT_COLORS[seat.type] + '20', borderColor: SEAT_COLORS[seat.type] }]}>
                <Text style={[styles.seatChipText, { color: SEAT_COLORS[seat.type], fontFamily: Fonts.semiBold }]}>
                  {seat.label}
                </Text>
                <TouchableOpacity onPress={() => toggleSeat(seat.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color={SEAT_COLORS[seat.type]} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <Text style={[styles.selectionCapacity, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Total capacity: {totalCapacity} person{totalCapacity !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.selectionPrice, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
            {show.isFree ? 'Free Entry' : `Total: \u20b9${totalPrice}`}
          </Text>
        </View>
      )}

      {show.isPrivate && (
        <View style={[styles.privateCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.privateLabelRow}>
            <Lock size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.privateLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>
              Private Show - Password Required
            </Text>
          </View>
          <TextInput
            style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
            placeholder="Enter show password"
            placeholderTextColor={colors.textLight}
            value={showPassword}
            onChangeText={setShowPassword}
            secureTextEntry
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bookButton,
          { backgroundColor: colors.primary },
          (selectedSeatIds.size === 0 || booking) && styles.bookButtonDisabled,
        ]}
        onPress={handleBook}
        disabled={selectedSeatIds.size === 0 || booking}
      >
        <Text style={[styles.bookButtonText, { color: colors.white, fontFamily: Fonts.bold }]}>
          {booking
            ? 'Booking...'
            : selectedSeatIds.size > 1
            ? `Confirm ${selectedSeatIds.size} Tickets`
            : 'Confirm Booking'}
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
  screenContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  curvedScreen: {
    width: '100%',
    height: 34,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenWayText: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  gridContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  legendContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 11,
  },
  selectionCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  selectionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  selectedSeatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  seatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  seatChipText: {
    fontSize: 13,
  },
  selectionCapacity: {
    fontSize: 13,
  },
  selectionPrice: {
    fontSize: 16,
    marginTop: 6,
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
  privateCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  privateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  privateLabel: {
    fontSize: 14,
  },
  passwordInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});
