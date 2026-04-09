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
import Colors from '../../constants/Colors';
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
                selectedVenueId === venue.id && styles.venueChipActive,
              ]}
              onPress={() => setSelectedVenueId(venue.id)}
            >
              <Text
                style={[
                  styles.venueChipText,
                  selectedVenueId === venue.id && styles.venueChipTextActive,
                ]}
              >
                {venue.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCreate(true)}
      >
        <Plus size={20} color={Colors.white} strokeWidth={2} />
        <Text style={styles.addButtonText}>Add Snack</Text>
      </TouchableOpacity>

      {snacks.map((snack) => (
        <View key={snack.id} style={styles.snackCard}>
          <View style={styles.snackRow}>
            <View style={styles.snackInfo}>
              <Text style={styles.snackName}>{snack.name}</Text>
              {snack.description && (
                <Text style={styles.snackDesc}>{snack.description}</Text>
              )}
              <Text style={styles.snackPrice}>
                {snack.price === 0 ? 'Free' : `${snack.price}`}
              </Text>
            </View>
            <View style={styles.snackActions}>
              <Switch
                value={snack.available}
                onValueChange={() => handleToggleAvailable(snack)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={snack.available ? Colors.primary : Colors.textLight}
              />
              <TouchableOpacity onPress={() => handleDelete(snack.id)}>
                <Trash2 size={18} color={Colors.error} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {snacks.length === 0 && selectedVenueId && (
        <View style={styles.emptyState}>
          <Cookie size={40} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Snacks</Text>
          <Text style={styles.emptyText}>
            Add snacks that will be available at your venue
          </Text>
        </View>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Snack</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <X size={24} color={Colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Snack Name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Price (0 for free)"
              placeholderTextColor={Colors.textLight}
              value={snackPrice}
              onChangeText={setSnackPrice}
              keyboardType="numeric"
            />
            <View style={styles.availableRow}>
              <Text style={styles.availableLabel}>Available</Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={available ? Colors.primary : Colors.textLight}
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreate}>
              <Text style={styles.modalButtonText}>Add Snack</Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  snackCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontWeight: '600',
    color: Colors.text,
  },
  snackDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  snackPrice: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
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
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
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
    fontWeight: '500',
    color: Colors.text,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
