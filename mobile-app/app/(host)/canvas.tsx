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
import Colors from '../../constants/Colors';
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
  CHAIR: '#74B9FF',
  SINGLE_SOFA: '#A29BFE',
  RECLINER: '#6C5CE7',
  THREE_SEATER_SOFA: '#FDCB6E',
  BED_SINGLE: '#55EFC4',
  BED_DOUBLE: '#00B894',
  BED_TRIPLE: '#00CEC9',
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
                <Text style={styles.seatCellLabel}>{seat.label}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyCell} />
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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.venueSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={[
                styles.venueChip,
                selectedVenue?.id === venue.id && styles.venueChipActive,
              ]}
              onPress={() => {
                setSelectedVenue(venue);
                setSeats(venue.seats || []);
              }}
            >
              <Text
                style={[
                  styles.venueChipText,
                  selectedVenue?.id === venue.id && styles.venueChipTextActive,
                ]}
              >
                {venue.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addVenueChip}
            onPress={() => setShowCreateVenue(true)}
          >
            <Plus size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.addVenueText}>Add Venue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {selectedVenue && (
        <>
          <View style={styles.screenIndicator}>
            <View style={styles.screenBar}>
              {selectedVenue.screenType === 'TV_4K' ? (
                <Monitor size={20} color={Colors.white} strokeWidth={1.8} />
              ) : (
                <Projector size={20} color={Colors.white} strokeWidth={1.8} />
              )}
              <Text style={styles.screenText}>
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
            <Text style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendGrid}>
              {(Object.keys(SEAT_COLORS) as SeatType[]).map((type) => (
                <View key={type} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: SEAT_COLORS[type] },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{SEAT_TYPE_LABELS[type]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.legendHint}>Long press a seat to remove it</Text>
          </View>

          <TouchableOpacity
            style={styles.addSeatButton}
            onPress={() => setShowAddSeat(true)}
          >
            <Plus size={20} color={Colors.white} strokeWidth={2} />
            <Text style={styles.addSeatText}>Add Seat</Text>
          </TouchableOpacity>
        </>
      )}

      {!selectedVenue && venues.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Venues</Text>
          <Text style={styles.emptySubtext}>
            Create your first venue to start configuring your seating
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowCreateVenue(true)}
          >
            <Text style={styles.createFirstText}>Create Venue</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCreateVenue} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Venue</Text>
              <TouchableOpacity onPress={() => setShowCreateVenue(false)}>
                <X size={24} color={Colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Venue Name"
              placeholderTextColor={Colors.textLight}
              value={venueName}
              onChangeText={setVenueName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Address"
              placeholderTextColor={Colors.textLight}
              value={venueAddress}
              onChangeText={setVenueAddress}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Latitude"
                placeholderTextColor={Colors.textLight}
                value={venueLat}
                onChangeText={setVenueLat}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Longitude"
                placeholderTextColor={Colors.textLight}
                value={venueLng}
                onChangeText={setVenueLng}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.fieldLabel}>Screen Type</Text>
            <View style={styles.screenTypeRow}>
              <TouchableOpacity
                style={[
                  styles.screenTypeOption,
                  screenType === 'TV_4K' && styles.screenTypeActive,
                ]}
                onPress={() => setScreenType('TV_4K')}
              >
                <Monitor size={20} color={screenType === 'TV_4K' ? Colors.white : Colors.text} strokeWidth={1.8} />
                <Text style={[styles.screenTypeText, screenType === 'TV_4K' && styles.screenTypeTextActive]}>
                  4K TV
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.screenTypeOption,
                  screenType === 'PROJECTOR' && styles.screenTypeActive,
                ]}
                onPress={() => setScreenType('PROJECTOR')}
              >
                <Projector size={20} color={screenType === 'PROJECTOR' ? Colors.white : Colors.text} strokeWidth={1.8} />
                <Text style={[styles.screenTypeText, screenType === 'PROJECTOR' && styles.screenTypeTextActive]}>
                  Projector
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateVenue}>
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddSeat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Seat</Text>
              <TouchableOpacity onPress={() => setShowAddSeat(false)}>
                <X size={24} color={Colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Seat Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatTypeScroll}>
              {(Object.keys(SEAT_TYPE_LABELS) as SeatType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.seatTypeChip,
                    seatType === type && { backgroundColor: SEAT_COLORS[type] },
                  ]}
                  onPress={() => setSeatType(type)}
                >
                  <Text
                    style={[
                      styles.seatTypeChipText,
                      seatType === type && styles.seatTypeChipTextActive,
                    ]}
                  >
                    {SEAT_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Seat Label (e.g. A1)"
              placeholderTextColor={Colors.textLight}
              value={seatLabel}
              onChangeText={setSeatLabel}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Row"
                placeholderTextColor={Colors.textLight}
                value={seatRow}
                onChangeText={setSeatRow}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Column"
                placeholderTextColor={Colors.textLight}
                value={seatCol}
                onChangeText={setSeatCol}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleAddSeat}>
              <Text style={styles.modalButtonText}>Add Seat</Text>
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
    backgroundColor: Colors.surface,
  },
  venueSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  venueChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  venueChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  venueChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  venueChipTextActive: {
    color: Colors.white,
  },
  addVenueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 4,
  },
  addVenueText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  screenIndicator: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  screenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  screenText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
    color: Colors.white,
  },
  emptyCell: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  legend: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  legendHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  addSeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addSeatText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
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
    fontWeight: '700',
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontWeight: '600',
    color: Colors.text,
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
    borderColor: Colors.border,
    gap: 8,
  },
  screenTypeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  screenTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  screenTypeTextActive: {
    color: Colors.white,
  },
  seatTypeScroll: {
    marginBottom: 12,
  },
  seatTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    marginRight: 8,
  },
  seatTypeChipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  seatTypeChipTextActive: {
    color: Colors.white,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
