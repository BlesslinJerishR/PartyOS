import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useTheme } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Fonts } from '../../constants/Fonts';
import { MovieRequest, TMDBMovie, TMDBResponse } from '../../types';
import { User, LogOut, Send, X, Search, Sun, Moon } from 'lucide-react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [hostQuery, setHostQuery] = useState('');
  const [hostSuggestions, setHostSuggestions] = useState<{ id: string; username: string }[]>([]);
  const [selectedHost, setSelectedHost] = useState<{ id: string; username: string } | null>(null);
  const [searching, setSearching] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const searchMovies = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = (await api.movies.search(searchQuery)) as TMDBResponse;
      setSearchResults(data.results || []);
      if (!data.results?.length) {
        Alert.alert('No Results', 'No movies found for your search.');
      }
    } catch (error: any) {
      Alert.alert('Search Failed', error.message);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const searchHosts = async (query: string) => {
    setHostQuery(query);
    if (!query.trim()) {
      setHostSuggestions([]);
      return;
    }
    try {
      const data = (await api.users.searchHosts(query)) as { id: string; username: string }[];
      setHostSuggestions(data);
    } catch {
      setHostSuggestions([]);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMovie || !selectedHost) {
      Alert.alert('Error', 'Please select a movie and a host');
      return;
    }
    try {
      await api.movieRequests.create({
        hostId: selectedHost.id,
        tmdbMovieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
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
    setHostQuery('');
    setHostSuggestions([]);
    setSelectedHost(null);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
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
              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={searchMovies} disabled={searching}>
                {searching ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Search size={18} color={colors.white} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            {selectedMovie && (
              <View style={[styles.selectedMovieCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                {selectedMovie.poster_path && (
                  <Image
                    source={{ uri: `${TMDB_IMAGE_BASE}${selectedMovie.poster_path}` }}
                    style={styles.selectedMoviePoster}
                  />
                )}
                <Text style={[styles.selectedMovieTitle, { color: colors.text, fontFamily: Fonts.semiBold }]} numberOfLines={2}>
                  {selectedMovie.title}
                </Text>
                <TouchableOpacity
                  style={[styles.changeMovieBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedMovie(null);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.changeMovieBtnText, { color: colors.primary, fontFamily: Fonts.medium }]}>Change Movie</Text>
                </TouchableOpacity>
              </View>
            )}

            {searchResults.length > 0 && !selectedMovie && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
                {searchResults.slice(0, 10).map((movie) => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.movieOption}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setSearchResults([]);
                    }}
                  >
                    {movie.poster_path && (
                      <Image
                        source={{ uri: `${TMDB_IMAGE_BASE}${movie.poster_path}` }}
                        style={styles.moviePoster}
                      />
                    )}
                    <Text style={[styles.movieOptionTitle, { color: colors.text, fontFamily: Fonts.regular }]} numberOfLines={2}>
                      {movie.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Search Host</Text>
            {selectedHost ? (
              <View style={[styles.selectedHostBadge, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Text style={[styles.selectedHostText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                  {selectedHost.username}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedHost(null); setHostQuery(''); }}>
                  <X size={16} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                  placeholder="Type host username to search"
                  placeholderTextColor={colors.textLight}
                  value={hostQuery}
                  onChangeText={searchHosts}
                />
                {hostSuggestions.length > 0 && (
                  <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {hostSuggestions.map((host) => (
                      <TouchableOpacity
                        key={host.id}
                        style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          setSelectedHost(host);
                          setHostSuggestions([]);
                          setHostQuery(host.username);
                        }}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text, fontFamily: Fonts.regular }]}>
                          {host.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

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
  selectedMovieCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedMoviePoster: {
    width: 100,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedMovieTitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  changeMovieBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeMovieBtnText: {
    fontSize: 13,
  },
  movieList: {
    marginBottom: 16,
  },
  movieOption: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  movieOptionTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedHostBadge: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedHostText: {
    fontSize: 14,
  },
  suggestionsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: -8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
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
