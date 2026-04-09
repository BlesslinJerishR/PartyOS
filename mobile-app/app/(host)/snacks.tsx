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
  Switch,
} from 'react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Snack, Venue } from '../../types';
import { Plus, X, Trash2, Cookie } from 'lucide-react-native';

export default function SnacksScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [snackPrice, setSnackPrice] = useState('');
  const [available, setAvailable] = useState(true);

  const { colors } = useTheme();

  const loadVenues = useCallback(async () => {
    try {
      const data = (await api.venues.getMy()) as Venue[];
      setVenues(data);
      if (data.length > 0 && !selectedVenueId) {
        setSelectedVenueId(data[0].id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, [selectedVenueId]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  useEffect(() => {
    if (selectedVenueId) {
      loadSnacks();
    }
  }, [selectedVenueId]);

  const loadSnacks = async () => {
    try {
      const data = (await api.snacks.getByVenue(selectedVenueId)) as Snack[];
      setSnacks(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSnacks();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a snack name');
      return;
    }
    try {
      await api.snacks.create({
        venueId: selectedVenueId,
        name,
        description: description || undefined,
        price: parseFloat(snackPrice) || 0,
        available,
      });
      setShowCreate(false);
      resetForm();
      await loadSnacks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleToggleAvailable = async (snack: Snack) => {
    try {
      await api.snacks.update(snack.id, { available: !snack.available });
      await loadSnacks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async (snackId: string) => {
    Alert.alert('Delete Snack', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.snacks.delete(snackId);
            await loadSnacks();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSnackPrice('');
    setAvailable(true);
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
                selectedVenueId === venue.id && [styles.venueChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
              onPress={() => setSelectedVenueId(venue.id)}
            >
              <Text
                style={[
                  styles.venueChipText,
                  { color: colors.text, fontFamily: Fonts.regular },
                  selectedVenueId === venue.id && [styles.venueChipTextActive, { color: colors.white }],
                ]}
              >
                {venue.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreate(true)}
      >
        <Plus size={20} color={colors.white} strokeWidth={2} />
        <Text style={[styles.addButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Add Snack</Text>
      </TouchableOpacity>

      {snacks.map((snack) => (
        <View key={snack.id} style={[styles.snackCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.snackRow}>
            <View style={styles.snackInfo}>
              <Text style={[styles.snackName, { color: colors.text, fontFamily: Fonts.semiBold }]}>{snack.name}</Text>
              {snack.description && (
                <Text style={[styles.snackDesc, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{snack.description}</Text>
              )}
              <Text style={[styles.snackPrice, { color: colors.primary, fontFamily: Fonts.medium }]}>
                {snack.price === 0 ? 'Free' : `${snack.price}`}
              </Text>
            </View>
            <View style={styles.snackActions}>
              <Switch
                value={snack.available}
                onValueChange={() => handleToggleAvailable(snack)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={snack.available ? colors.primary : colors.textLight}
              />
              <TouchableOpacity onPress={() => handleDelete(snack.id)}>
                <Trash2 size={18} color={colors.error} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {snacks.length === 0 && selectedVenueId && (
        <View style={styles.emptyState}>
          <Cookie size={40} color={colors.textLight} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Snacks</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Add snacks that will be available at your venue
          </Text>
        </View>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Add Snack</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <X size={24} color={colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Snack Name"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.modalInput, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Price (0 for free)"
              placeholderTextColor={colors.textLight}
              value={snackPrice}
              onChangeText={setSnackPrice}
              keyboardType="numeric"
            />
            <View style={styles.availableRow}>
              <Text style={[styles.availableLabel, { color: colors.text, fontFamily: Fonts.medium }]}>Available</Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={available ? colors.primary : colors.textLight}
              />
            </View>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleCreate}>
              <Text style={[styles.modalButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Add Snack</Text>
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
  venueChipActive: {
  },
  venueChipText: {
    fontSize: 14,
  },
  venueChipTextActive: {
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
  },
  snackCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  snackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  snackInfo: {
    flex: 1,
  },
  snackName: {
    fontSize: 16,
  },
  snackDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  snackPrice: {
    fontSize: 13,
    marginTop: 6,
  },
  snackActions: {
    alignItems: 'center',
    gap: 12,
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  availableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  availableLabel: {
    fontSize: 16,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
