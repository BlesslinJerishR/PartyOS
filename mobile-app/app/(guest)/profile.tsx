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
import { useAuth, useTheme } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Fonts } from '../../constants/Fonts';
import { MovieRequest } from '../../types';
import { User, LogOut, Send, X, Search, Sun, Moon } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.profileHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <User size={32} color={colors.white} strokeWidth={1.8} />
        </View>
        <Text style={[styles.username, { color: colors.text, fontFamily: Fonts.bold }]}>{user?.username || 'Guest'}</Text>
        <Text style={[styles.role, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{user?.role || 'No role set'}</Text>
      </View>

      <View style={[styles.themeRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.themeLabel, { color: colors.text, fontFamily: Fonts.medium }]}>Appearance</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: colors.surfaceAlt }]}>
          {isDark ? (
            <Moon size={20} color={colors.primary} strokeWidth={2} />
          ) : (
            <Sun size={20} color={colors.primary} strokeWidth={2} />
          )}
          <Text style={[styles.themeToggleText, { color: colors.text, fontFamily: Fonts.regular }]}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.requestButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowRequestModal(true)}
      >
        <Send size={20} color={colors.white} strokeWidth={2} />
        <Text style={[styles.requestButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Request a Movie</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.bold }]}>My Requests</Text>
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>No movie requests yet</Text>
        </View>
      ) : (
        requests.map((req) => (
          <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.requestInfo}>
              <Text style={[styles.requestTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>{req.movieTitle}</Text>
              <Text style={[styles.requestDate, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                {new Date(req.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    req.status === 'PENDING'
                      ? colors.warning + '30'
                      : req.status === 'ACCEPTED'
                      ? colors.success + '30'
                      : colors.error + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      req.status === 'PENDING'
                        ? colors.primary
                        : req.status === 'ACCEPTED'
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                {req.status}
              </Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={handleLogout}>
        <LogOut size={20} color={colors.error} strokeWidth={1.8} />
        <Text style={[styles.logoutText, { color: colors.error, fontFamily: Fonts.medium }]}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={showRequestModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Request a Movie</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={24} color={colors.text} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Search Movie</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Search for a movie"
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchMovies}
              />
              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={searchMovies}>
                <Search size={18} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedMovie && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Text style={[styles.selectedText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                  Selected: {selectedMovie.title}
                </Text>
              </View>
            )}

            {searchResults.length > 0 && !selectedMovie && (
              <View style={styles.resultsList}>
                {searchResults.slice(0, 8).map((movie: any) => (
                  <TouchableOpacity
                    key={movie.id}
                    style={[styles.resultItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={[styles.resultTitle, { color: colors.text, fontFamily: Fonts.regular }]}>{movie.title}</Text>
                    <Text style={[styles.resultYear, { color: colors.textSecondary }]}>
                      {movie.release_date?.split('-')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Host ID</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Enter the host user ID"
              placeholderTextColor={colors.textLight}
              value={hostId}
              onChangeText={setHostId}
            />

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Message (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
              placeholder="Why you want this movie screened"
              placeholderTextColor={colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSendRequest}>
              <Text style={[styles.sendBtnText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Send Request</Text>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
  },
  role: {
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 15,
  },
  requestDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
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
  },
  logoutText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
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
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  searchBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  selectedBadge: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  selectedText: {
    fontSize: 14,
  },
  resultsList: {
    marginBottom: 16,
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 15,
    flex: 1,
  },
  resultYear: {
    fontSize: 13,
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
  sendBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnText: {
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  themeLabel: {
    fontSize: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  themeToggleText: {
    fontSize: 14,
  },
});
