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
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Colors from '../../constants/Colors';
import { MovieRequest } from '../../types';
import { User, LogOut, Send, X, Search } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [hostId, setHostId] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const data = (await api.movieRequests.getMy()) as MovieRequest[];
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = (await api.movies.search(searchQuery)) as any;
      setSearchResults(data.results || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMovie || !hostId.trim()) {
      Alert.alert('Error', 'Please select a movie and enter a host ID');
      return;
    }
    try {
      await api.movieRequests.create({
        hostId,
        tmdbMovieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        message: message || undefined,
      });
      setShowRequestModal(false);
      resetForm();
      await loadRequests();
      Alert.alert('Success', 'Movie request sent');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMovie(null);
    setHostId('');
    setMessage('');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={32} color={Colors.white} strokeWidth={1.8} />
        </View>
        <Text style={styles.username}>{user?.username || 'Guest'}</Text>
        <Text style={styles.role}>{user?.role || 'No role set'}</Text>
      </View>

      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => setShowRequestModal(true)}
      >
        <Send size={20} color={Colors.white} strokeWidth={2} />
        <Text style={styles.requestButtonText}>Request a Movie</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Requests</Text>
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No movie requests yet</Text>
        </View>
      ) : (
        requests.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>{req.movieTitle}</Text>
              <Text style={styles.requestDate}>
                {new Date(req.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    req.status === 'PENDING'
                      ? Colors.warning + '30'
                      : req.status === 'ACCEPTED'
                      ? Colors.success + '30'
                      : Colors.error + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      req.status === 'PENDING'
                        ? '#9B7E00'
                        : req.status === 'ACCEPTED'
                        ? Colors.success
                        : Colors.error,
                  },
                ]}
              >
                {req.status}
              </Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color={Colors.error} strokeWidth={1.8} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={showRequestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request a Movie</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={24} color={Colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Search Movie</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a movie"
                placeholderTextColor={Colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchMovies}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={searchMovies}>
                <Search size={18} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedMovie && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>
                  Selected: {selectedMovie.title}
                </Text>
              </View>
            )}

            {searchResults.length > 0 && !selectedMovie && (
              <View style={styles.resultsList}>
                {searchResults.slice(0, 8).map((movie: any) => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.resultItem}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={styles.resultTitle}>{movie.title}</Text>
                    <Text style={styles.resultYear}>
                      {movie.release_date?.split('-')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Host ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter the host user ID"
              placeholderTextColor={Colors.textLight}
              value={hostId}
              onChangeText={setHostId}
            />

            <Text style={styles.fieldLabel}>Message (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Why you want this movie screened"
              placeholderTextColor={Colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendRequest}>
              <Text style={styles.sendBtnText}>Send Request</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  requestCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 80,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  selectedBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultsList: {
    marginBottom: 16,
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  resultYear: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
