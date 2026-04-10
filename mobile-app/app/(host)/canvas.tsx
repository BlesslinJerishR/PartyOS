import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Venue, Seat, SeatType, ScreenType, SEAT_TYPE_LABELS, SEAT_COLORS, SEAT_DIMENSIONS } from '../../types';
import {
  Plus,
  Trash2,
  Monitor,
  Projector,
  Save,
  X,
  MapPin,
} from 'lucide-react-native';

const GRID_CELL_SIZE = 52;

export default function CanvasScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showCreateVenue, setShowCreateVenue] = useState(false);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueLat, setVenueLat] = useState('');
  const [venueLng, setVenueLng] = useState('');
  const [screenType, setScreenType] = useState<ScreenType>('TV_4K');

  const [seatType, setSeatType] = useState<SeatType>('CHAIR');
  const [seatLabel, setSeatLabel] = useState('');
  const [seatRow, setSeatRow] = useState('');
  const [seatCol, setSeatCol] = useState('');

  const { colors } = useTheme();

  const loadVenues = useCallback(async () => {
    try {
      const data = (await api.venues.getMy()) as Venue[];
      setVenues(data);
      if (data.length > 0 && !selectedVenue) {
        setSelectedVenue(data[0]);
        setSeats(data[0].seats || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, [selectedVenue]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  };

  const fetchCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-fill venue address');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setVenueLat(lat.toString());
      setVenueLng(lng.toString());

      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (reverseGeocode) {
        const parts = [
          reverseGeocode.name,
          reverseGeocode.street,
          reverseGeocode.district,
          reverseGeocode.city,
          reverseGeocode.region,
          reverseGeocode.postalCode,
          reverseGeocode.country,
        ].filter(Boolean);
        const address = [...new Set(parts)].join(', ');
        setVenueAddress(address);
      }
    } catch (error: any) {
      Alert.alert('Location Error', error.message || 'Could not fetch location');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleCreateVenue = async () => {
    if (!venueName.trim() || !venueAddress.trim() || !venueLat || !venueLng) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const venue = (await api.venues.create({
        name: venueName,
        address: venueAddress,
        latitude: parseFloat(venueLat),
        longitude: parseFloat(venueLng),
        screenType,
      })) as Venue;
      setVenues((prev) => [...prev, venue]);
      setSelectedVenue(venue);
      setSeats(venue.seats || []);
      setShowCreateVenue(false);
      resetVenueForm();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetVenueForm = () => {
    setVenueName('');
    setVenueAddress('');
    setVenueLat('');
    setVenueLng('');
    setScreenType('TV_4K');
  };

  const getOccupiedCells = (currentSeats: Seat[], excludeSeatId?: string): Set<string> => {
    const occupied = new Set<string>();
    currentSeats.forEach((seat) => {
      if (excludeSeatId && seat.id === excludeSeatId) return;
      const dims = SEAT_DIMENSIONS[seat.type];
      for (let r = seat.row; r < seat.row + dims.rows; r++) {
        for (let c = seat.col; c < seat.col + dims.cols; c++) {
          occupied.add(`${r}-${c}`);
        }
      }
    });
    return occupied;
  };

  const canPlaceSeat = (type: SeatType, row: number, col: number): boolean => {
    const dims = SEAT_DIMENSIONS[type];
    const occupied = getOccupiedCells(seats);
    for (let r = row; r < row + dims.rows; r++) {
      for (let c = col; c < col + dims.cols; c++) {
        if (occupied.has(`${r}-${c}`)) return false;
      }
    }
    return true;
  };

  const handleAddSeat = async () => {
    if (!selectedVenue || !seatLabel.trim() || !seatRow || !seatCol) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const row = parseInt(seatRow, 10);
    const col = parseInt(seatCol, 10);
    const dims = SEAT_DIMENSIONS[seatType];

    if (!canPlaceSeat(seatType, row, col)) {
      Alert.alert(
        'Overlap',
        `Cannot place ${SEAT_TYPE_LABELS[seatType]} (${dims.cols}x${dims.rows}) at row ${row}, col ${col}. It overlaps with an existing seat.`,
      );
      return;
    }

    try {
      const seat = (await api.seats.create({
        venueId: selectedVenue.id,
        type: seatType,
        label: seatLabel,
        row,
        col,
      })) as Seat;
      setSeats((prev) => [...prev, seat]);
      setShowAddSeat(false);
      resetSeatForm();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveSeat = async (seatId: string) => {
    Alert.alert('Remove Seat', 'Are you sure you want to remove this seat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.seats.delete(seatId);
            setSeats((prev) => prev.filter((s) => s.id !== seatId));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const resetSeatForm = () => {
    setSeatType('CHAIR');
    setSeatLabel('');
    setSeatRow('');
    setSeatCol('');
  };

  const maxRow = seats.length > 0
    ? Math.max(...seats.map((s) => s.row + SEAT_DIMENSIONS[s.type].rows - 1), 3)
    : 3;
  const maxCol = seats.length > 0
    ? Math.max(...seats.map((s) => s.col + SEAT_DIMENSIONS[s.type].cols - 1), 5)
    : 5;

  const renderGrid = () => {
    const occupiedCells = getOccupiedCells(seats);
    const elements: React.ReactElement[] = [];

    for (let r = 0; r <= maxRow; r++) {
      for (let c = 0; c <= maxCol; c++) {
        if (!occupiedCells.has(`${r}-${c}`)) {
          elements.push(
            <View
              key={`empty-${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * GRID_CELL_SIZE + 2,
                top: r * GRID_CELL_SIZE + 2,
                width: GRID_CELL_SIZE - 4,
                height: GRID_CELL_SIZE - 4,
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: 'dashed',
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              }}
            />,
          );
        }
      }
    }

    seats.forEach((seat) => {
      const dims = SEAT_DIMENSIONS[seat.type];
      const seatWidth = dims.cols * GRID_CELL_SIZE - 4;
      const seatHeight = dims.rows * GRID_CELL_SIZE - 4;

      elements.push(
        <TouchableOpacity
          key={`seat-${seat.id}`}
          style={{
            position: 'absolute',
            left: seat.col * GRID_CELL_SIZE + 2,
            top: seat.row * GRID_CELL_SIZE + 2,
            width: seatWidth,
            height: seatHeight,
            borderRadius: 8,
            backgroundColor: SEAT_COLORS[seat.type],
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onLongPress={() => handleRemoveSeat(seat.id)}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: Fonts.bold,
              fontSize: dims.cols > 1 || dims.rows > 1 ? 13 : 10,
            }}
          >
            {seat.label}
          </Text>
          {(dims.cols > 1 || dims.rows > 1) && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontFamily: Fonts.regular,
                fontSize: 9,
                marginTop: 2,
              }}
            >
              {SEAT_TYPE_LABELS[seat.type]}
            </Text>
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.venueSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={[
                styles.venueChip,
                { backgroundColor: colors.background, borderColor: colors.border },
                selectedVenue?.id === venue.id && [styles.venueChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
              onPress={() => {
                setSelectedVenue(venue);
                setSeats(venue.seats || []);
              }}
            >
              <Text
                style={[
                  styles.venueChipText,
                  { color: colors.text, fontFamily: Fonts.regular },
                  selectedVenue?.id === venue.id && [styles.venueChipTextActive, { color: colors.white }],
                ]}
              >
                {venue.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.addVenueChip, { borderColor: colors.primary }]}
            onPress={() => setShowCreateVenue(true)}
          >
            <Plus size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.addVenueText, { color: colors.primary, fontFamily: Fonts.medium }]}>Add Venue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {selectedVenue && (
        <>
          <View style={styles.screenIndicator}>
            <View style={[styles.screenBar, { backgroundColor: colors.text }]}>
              {selectedVenue.screenType === 'TV_4K' ? (
                <Monitor size={20} color={colors.white} strokeWidth={1.8} />
              ) : (
                <Projector size={20} color={colors.white} strokeWidth={1.8} />
              )}
              <Text style={[styles.screenText, { color: colors.white, fontFamily: Fonts.semiBold }]}>
                {selectedVenue.screenType === 'TV_4K' ? '4K TV' : 'Projector'}
              </Text>
            </View>
          </View>

          <View style={styles.canvasContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderGrid()}
            </ScrollView>
          </View>

          <View style={styles.legend}>
            <Text style={[styles.legendTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>Legend</Text>
            <View style={styles.legendGrid}>
              {(Object.keys(SEAT_COLORS) as SeatType[]).map((type) => {
                const dims = SEAT_DIMENSIONS[type];
                return (
                  <View key={type} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: SEAT_COLORS[type] },
                      ]}
                    />
                    <Text style={[styles.legendLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                      {SEAT_TYPE_LABELS[type]} ({dims.cols}x{dims.rows})
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.legendHint, { color: colors.textLight, fontFamily: Fonts.regular }]}>Long press a seat to remove it</Text>
          </View>

          <TouchableOpacity
            style={[styles.addSeatButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddSeat(true)}
          >
            <Plus size={20} color={colors.white} strokeWidth={2} />
            <Text style={[styles.addSeatText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Add Seat</Text>
          </TouchableOpacity>
        </>
      )}

      {!selectedVenue && venues.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Venues</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Create your first venue to start configuring your seating
          </Text>
          <TouchableOpacity
            style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateVenue(true)}
          >
            <Text style={[styles.createFirstText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Create Venue</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCreateVenue} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Create Venue</Text>
              <TouchableOpacity onPress={() => setShowCreateVenue(false)}>
                <X size={24} color={colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Venue Name"
              placeholderTextColor={colors.textLight}
              value={venueName}
              onChangeText={setVenueName}
            />
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.modalInput, styles.addressInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Address"
                placeholderTextColor={colors.textLight}
                value={venueAddress}
                onChangeText={setVenueAddress}
              />
              <TouchableOpacity
                style={[styles.gpsButton, { backgroundColor: colors.primary }]}
                onPress={fetchCurrentLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Latitude"
                placeholderTextColor={colors.textLight}
                value={venueLat}
                onChangeText={setVenueLat}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Longitude"
                placeholderTextColor={colors.textLight}
                value={venueLng}
                onChangeText={setVenueLng}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Screen Type</Text>
            <View style={styles.screenTypeRow}>
              <TouchableOpacity
                style={[
                  styles.screenTypeOption,
                  { borderColor: colors.border },
                  screenType === 'TV_4K' && [styles.screenTypeActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setScreenType('TV_4K')}
              >
                <Monitor size={20} color={screenType === 'TV_4K' ? colors.white : colors.text} strokeWidth={1.8} />
                <Text style={[styles.screenTypeText, { color: colors.text, fontFamily: Fonts.medium }, screenType === 'TV_4K' && [styles.screenTypeTextActive, { color: colors.white }]]}>
                  4K TV
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.screenTypeOption,
                  { borderColor: colors.border },
                  screenType === 'PROJECTOR' && [styles.screenTypeActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setScreenType('PROJECTOR')}
              >
                <Projector size={20} color={screenType === 'PROJECTOR' ? colors.white : colors.text} strokeWidth={1.8} />
                <Text style={[styles.screenTypeText, { color: colors.text, fontFamily: Fonts.medium }, screenType === 'PROJECTOR' && [styles.screenTypeTextActive, { color: colors.white }]]}>
                  Projector
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleCreateVenue}>
              <Text style={[styles.modalButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddSeat} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Add Seat</Text>
              <TouchableOpacity onPress={() => setShowAddSeat(false)}>
                <X size={24} color={colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Seat Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatTypeScroll}>
              {(Object.keys(SEAT_TYPE_LABELS) as SeatType[]).map((type) => {
                const dims = SEAT_DIMENSIONS[type];
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.seatTypeChip,
                      { backgroundColor: colors.surfaceAlt },
                      seatType === type && { backgroundColor: SEAT_COLORS[type] },
                    ]}
                    onPress={() => setSeatType(type)}
                  >
                    <Text
                      style={[
                        styles.seatTypeChipText,
                        { color: colors.text, fontFamily: Fonts.medium },
                        seatType === type && [styles.seatTypeChipTextActive, { color: colors.white }],
                      ]}
                    >
                      {SEAT_TYPE_LABELS[type]}
                    </Text>
                    <Text
                      style={[
                        styles.seatTypeDims,
                        { color: colors.textLight },
                        seatType === type && { color: 'rgba(255,255,255,0.8)' },
                      ]}
                    >
                      {dims.cols}x{dims.rows}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Seat Label (e.g. A1)"
              placeholderTextColor={colors.textLight}
              value={seatLabel}
              onChangeText={setSeatLabel}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Row"
                placeholderTextColor={colors.textLight}
                value={seatRow}
                onChangeText={setSeatRow}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Column"
                placeholderTextColor={colors.textLight}
                value={seatCol}
                onChangeText={setSeatCol}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.seatPreview, { borderColor: colors.border }]}>
              <Text style={[styles.seatPreviewTitle, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                Preview: {SEAT_TYPE_LABELS[seatType]} — occupies {SEAT_DIMENSIONS[seatType].cols}x{SEAT_DIMENSIONS[seatType].rows} cells
              </Text>
              <View style={styles.seatPreviewGrid}>
                {Array.from({ length: SEAT_DIMENSIONS[seatType].rows }).map((_, r) => (
                  <View key={r} style={styles.seatPreviewRow}>
                    {Array.from({ length: SEAT_DIMENSIONS[seatType].cols }).map((_, c) => (
                      <View
                        key={c}
                        style={[
                          styles.seatPreviewCell,
                          { backgroundColor: SEAT_COLORS[seatType] },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleAddSeat}>
              <Text style={[styles.modalButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Add Seat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  venueSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  venueChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  venueChipActive: {},
  venueChipText: {
    fontSize: 14,
  },
  venueChipTextActive: {},
  addVenueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  addVenueText: {
    fontSize: 14,
  },
  screenIndicator: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  screenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  screenText: {
    fontSize: 14,
  },
  canvasContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legend: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 12,
  },
  legendHint: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  addSeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addSeatText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressInput: {
    flex: 1,
  },
  gpsButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  screenTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  screenTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  screenTypeActive: {},
  screenTypeText: {
    fontSize: 14,
  },
  screenTypeTextActive: {},
  seatTypeScroll: {
    marginBottom: 12,
  },
  seatTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  seatTypeChipText: {
    fontSize: 13,
  },
  seatTypeChipTextActive: {},
  seatTypeDims: {
    fontSize: 10,
    marginTop: 2,
  },
  seatPreview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  seatPreviewTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  seatPreviewGrid: {
    gap: 3,
  },
  seatPreviewRow: {
    flexDirection: 'row',
    gap: 3,
  },
  seatPreviewCell: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
