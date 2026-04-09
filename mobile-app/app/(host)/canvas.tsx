import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Venue, Seat, SeatType, ScreenType, SEAT_TYPE_LABELS } from '../../types';
import {
  Plus,
  Trash2,
  Monitor,
  Projector,
  Save,
  X,
} from 'lucide-react-native';

const SEAT_COLORS: Record<SeatType, string> = {
  CHAIR: '#FF004F',
  SINGLE_SOFA: '#FF004F',
  RECLINER: '#FF004F',
  THREE_SEATER_SOFA: '#FF004F',
  BED_SINGLE: '#FF004F',
  BED_DOUBLE: '#FF004F',
  BED_TRIPLE: '#FF004F',
};

const GRID_CELL_SIZE = 52;

export default function CanvasScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showCreateVenue, setShowCreateVenue] = useState(false);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleAddSeat = async () => {
    if (!selectedVenue || !seatLabel.trim() || !seatRow || !seatCol) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const seat = (await api.seats.create({
        venueId: selectedVenue.id,
        type: seatType,
        label: seatLabel,
        row: parseInt(seatRow, 10),
        col: parseInt(seatCol, 10),
      })) as Seat;
      setSeats((prev) => [...prev, seat]);
      setShowAddSeat(false);
      resetSeatForm();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveSeat = async (seatId: string) => {
    try {
      await api.seats.delete(seatId);
      setSeats((prev) => prev.filter((s) => s.id !== seatId));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetSeatForm = () => {
    setSeatType('CHAIR');
    setSeatLabel('');
    setSeatRow('');
    setSeatCol('');
  };

  const maxRow = Math.max(...seats.map((s) => s.row), 3);
  const maxCol = Math.max(...seats.map((s) => s.col), 5);

  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r <= maxRow; r++) {
      const cols = [];
      for (let c = 0; c <= maxCol; c++) {
        const seat = seats.find((s) => s.row === r && s.col === c);
        cols.push(
          <View key={`${r}-${c}`} style={styles.gridCell}>
            {seat ? (
              <TouchableOpacity
                style={[
                  styles.seatCell,
                  { backgroundColor: SEAT_COLORS[seat.type] },
                ]}
                onLongPress={() => handleRemoveSeat(seat.id)}
              >
                <Text style={[styles.seatCellLabel, { color: colors.white, fontFamily: Fonts.bold }]}>{seat.label}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.emptyCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} />
            )}
          </View>,
        );
      }
      rows.push(
        <View key={r} style={styles.gridRow}>
          {cols}
        </View>,
      );
    }
    return rows;
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
              <View>{renderGrid()}</View>
            </ScrollView>
          </View>

          <View style={styles.legend}>
            <Text style={[styles.legendTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>Legend</Text>
            <View style={styles.legendGrid}>
              {(Object.keys(SEAT_COLORS) as SeatType[]).map((type) => (
                <View key={type} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: SEAT_COLORS[type] },
                    ]}
                  />
                  <Text style={[styles.legendLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{SEAT_TYPE_LABELS[type]}</Text>
                </View>
              ))}
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
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Address"
              placeholderTextColor={colors.textLight}
              value={venueAddress}
              onChangeText={setVenueAddress}
            />
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
              {(Object.keys(SEAT_TYPE_LABELS) as SeatType[]).map((type) => (
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
                </TouchableOpacity>
              ))}
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
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: GRID_CELL_SIZE,
    height: GRID_CELL_SIZE,
    padding: 2,
  },
  seatCell: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCellLabel: {
    fontSize: 10,
  },
  emptyCell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
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
    maxHeight: '80%',
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
  },
  seatTypeChipText: {
    fontSize: 13,
  },
  seatTypeChipTextActive: {},
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
