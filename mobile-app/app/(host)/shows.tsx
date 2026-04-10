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
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { Show, Venue, TMDBMovie, TMDBResponse } from '../../types';
import { Plus, Search, X, Calendar, Clock, Lock } from 'lucide-react-native';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

export default function ShowsScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movieResults, setMovieResults] = useState<TMDBMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [selectedStartTime, setSelectedStartTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [selectedEndTime, setSelectedEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(20, 30, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showType, setShowType] = useState<'FREE' | 'PAID' | 'PRIVATE'>('FREE');
  const [price, setPrice] = useState('');
  const [privatePassword, setPrivatePassword] = useState('');
  const [searching, setSearching] = useState(false);
  const { colors } = useTheme();

  const loadData = useCallback(async () => {
    try {
      const [showData, venueData] = await Promise.all([
        api.shows.getMy() as Promise<Show[]>,
        api.venues.getMy() as Promise<Venue[]>,
      ]);
      setShows(showData);
      setVenues(venueData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = (await api.movies.search(searchQuery)) as TMDBResponse;
      setMovieResults(data.results || []);
      if (!data.results?.length) {
        Alert.alert('No Results', 'No movies found for your search. Try a different query.');
      }
    } catch (error: any) {
      Alert.alert(
        'Search Failed',
        error.message || 'Could not search movies. Please try again.',
      );
    } finally {
      setSearching(false);
    }
  };

  const handleCreateShow = async () => {
    if (!selectedMovie || !selectedVenueId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (showType === 'PRIVATE' && !privatePassword.trim()) {
      Alert.alert('Error', 'Please set a password for private show');
      return;
    }

    // Validate date is not in the past
    const now = new Date();
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(selectedStartTime.getHours(), selectedStartTime.getMinutes(), 0, 0);
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(selectedEndTime.getHours(), selectedEndTime.getMinutes(), 0, 0);

    if (startDateTime <= now) {
      Alert.alert('Error', 'Start time cannot be in the past');
      return;
    }
    if (endDateTime <= startDateTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      const payload: any = {
        venueId: selectedVenueId,
        tmdbMovieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.poster_path
          ? `${TMDB_IMAGE_BASE}${selectedMovie.poster_path}`
          : null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isFree: showType === 'FREE',
        price: showType === 'PAID' || showType === 'PRIVATE' ? parseFloat(price) || 0 : 0,
        isPrivate: showType === 'PRIVATE',
      };

      if (showType === 'PRIVATE') {
        payload.password = privatePassword;
      }

      await api.shows.create(payload);

      setShowCreate(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancelShow = async (showId: string) => {
    Alert.alert('Cancel Show', 'Are you sure you want to cancel this show?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.shows.cancel(showId);
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setSearchQuery('');
    setMovieResults([]);
    setSelectedMovie(null);
    setSelectedVenueId('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    setSelectedDate(tomorrow);
    const defaultStart = new Date();
    defaultStart.setHours(18, 0, 0, 0);
    setSelectedStartTime(defaultStart);
    const defaultEnd = new Date();
    defaultEnd.setHours(20, 30, 0, 0);
    setSelectedEndTime(defaultEnd);
    setShowType('FREE');
    setPrice('');
    setPrivatePassword('');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreate(true)}
      >
        <Plus size={20} color={colors.white} strokeWidth={2} />
        <Text style={[styles.createButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Schedule New Show</Text>
      </TouchableOpacity>

      {shows.map((show) => (
        <View key={show.id} style={[styles.showCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.showCardRow}>
            {show.moviePoster && (
              <Image
                source={{ uri: show.moviePoster }}
                style={styles.posterThumb}
              />
            )}
            <View style={styles.showInfo}>
              <Text style={[styles.showTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>{show.movieTitle}</Text>
              <View style={styles.showMeta}>
                <Calendar size={14} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[styles.showMetaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                  {new Date(show.startTime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.showMeta}>
                <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[styles.showMetaText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                  {new Date(show.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {new Date(show.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[styles.showPriceInfo, { color: colors.primary, fontFamily: Fonts.medium }]}>
                {show.isPrivate ? '🔒 Private' : ''}{show.isPrivate && !show.isFree ? ' · ' : ''}{show.isFree && !show.isPrivate ? 'Free Entry' : !show.isFree ? `₹${show.price}` : show.isPrivate && show.isFree ? ' Free Entry' : ''}
              </Text>
            </View>
            <View style={styles.showStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      show.status === 'NOW_PLAYING'
                        ? colors.nowPlaying
                        : show.status === 'SCHEDULED'
                        ? colors.upcoming
                        : show.status === 'COMPLETED'
                        ? colors.success
                        : colors.error,
                  },
                ]}
              />
              <Text style={[styles.statusLabel, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{show.status.replace('_', ' ')}</Text>
            </View>
          </View>
          {(show.status === 'SCHEDULED' || show.status === 'NOW_PLAYING') && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderTopColor: colors.border }]}
              onPress={() => handleCancelShow(show.id)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.error, fontFamily: Fonts.medium }]}>Cancel Show</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {shows.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>No Shows Scheduled</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Tap the button above to schedule your first movie show
          </Text>
        </View>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bold }]}>Schedule Show</Text>
              <TouchableOpacity onPress={() => { setShowCreate(false); resetForm(); }}>
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
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                onPress={searchMovies}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Search size={20} color={colors.white} strokeWidth={2} />
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
                    setMovieResults([]);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.changeMovieBtnText, { color: colors.primary, fontFamily: Fonts.medium }]}>Change Movie</Text>
                </TouchableOpacity>
              </View>
            )}

            {movieResults.length > 0 && !selectedMovie && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
                {movieResults.slice(0, 10).map((movie) => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.movieOption}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setMovieResults([]);
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

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Select Venue</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueList}>
              {venues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueOption,
                    { backgroundColor: colors.surfaceAlt },
                    selectedVenueId === venue.id && styles.venueOptionActive,
                    selectedVenueId === venue.id && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedVenueId(venue.id)}
                >
                  <Text
                    style={[
                      styles.venueOptionText,
                      { color: colors.text, fontFamily: Fonts.medium },
                      selectedVenueId === venue.id && styles.venueOptionTextActive,
                      selectedVenueId === venue.id && { color: colors.white },
                    ]}
                  >
                    {venue.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Date</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={18} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.pickerButtonText, { color: colors.text, fontFamily: Fonts.regular }]}>
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (event.type === 'dismissed') { setShowDatePicker(false); return; }
                  if (date) setSelectedDate(date);
                }}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity
                style={[styles.pickerDoneBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.pickerDoneBtnText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Done</Text>
              </TouchableOpacity>
            )}

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Start Time</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Clock size={18} color={colors.primary} strokeWidth={1.8} />
                  <Text style={[styles.pickerButtonText, { color: colors.text, fontFamily: Fonts.regular }]}>
                    {selectedStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={selectedStartTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      if (Platform.OS === 'android') setShowStartTimePicker(false);
                      if (event.type === 'dismissed') { setShowStartTimePicker(false); return; }
                      if (date) {
                        const now = new Date();
                        const isToday = selectedDate.toDateString() === now.toDateString();
                        if (isToday && date.getHours() * 60 + date.getMinutes() < now.getHours() * 60 + now.getMinutes()) {
                          Alert.alert('Invalid Time', 'Start time cannot be in the past');
                          return;
                        }
                        setSelectedStartTime(date);
                      }
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showStartTimePicker && (
                  <TouchableOpacity
                    style={[styles.pickerDoneBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowStartTimePicker(false)}
                  >
                    <Text style={[styles.pickerDoneBtnText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>End Time</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Clock size={18} color={colors.primary} strokeWidth={1.8} />
                  <Text style={[styles.pickerButtonText, { color: colors.text, fontFamily: Fonts.regular }]}>
                    {selectedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={selectedEndTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      if (Platform.OS === 'android') setShowEndTimePicker(false);
                      if (event.type === 'dismissed') { setShowEndTimePicker(false); return; }
                      if (date) setSelectedEndTime(date);
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showEndTimePicker && (
                  <TouchableOpacity
                    style={[styles.pickerDoneBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowEndTimePicker(false)}
                  >
                    <Text style={[styles.pickerDoneBtnText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Show Type</Text>
            <View style={styles.pricingRow}>
              <TouchableOpacity
                style={[styles.pricingOption, { borderColor: colors.border }, showType === 'FREE' && styles.pricingActive, showType === 'FREE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setShowType('FREE')}
              >
                <Text style={[styles.pricingText, { color: colors.text, fontFamily: Fonts.semiBold }, showType === 'FREE' && styles.pricingTextActive, showType === 'FREE' && { color: colors.white }]}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pricingOption, { borderColor: colors.border }, showType === 'PAID' && styles.pricingActive, showType === 'PAID' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setShowType('PAID')}
              >
                <Text style={[styles.pricingText, { color: colors.text, fontFamily: Fonts.semiBold }, showType === 'PAID' && styles.pricingTextActive, showType === 'PAID' && { color: colors.white }]}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pricingOption, { borderColor: colors.border }, showType === 'PRIVATE' && styles.pricingActive, showType === 'PRIVATE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setShowType('PRIVATE')}
              >
                <Lock size={14} color={showType === 'PRIVATE' ? colors.white : colors.text} strokeWidth={2} style={{ marginRight: 4 }} />
                <Text style={[styles.pricingText, { color: colors.text, fontFamily: Fonts.semiBold }, showType === 'PRIVATE' && styles.pricingTextActive, showType === 'PRIVATE' && { color: colors.white }]}>Private</Text>
              </TouchableOpacity>
            </View>

            {(showType === 'PAID' || showType === 'PRIVATE') && (
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                placeholder="Price per ticket (0 for free)"
                placeholderTextColor={colors.textLight}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            )}

            {showType === 'PRIVATE' && (
              <View>
                <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>Show Password</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, fontFamily: Fonts.regular }]}
                  placeholder="Set password for guests to enter"
                  placeholderTextColor={colors.textLight}
                  value={privatePassword}
                  onChangeText={setPrivatePassword}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleCreateShow}>
              <Text style={[styles.modalButtonText, { color: colors.white, fontFamily: Fonts.semiBold }]}>Schedule Show</Text>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
  },
  showCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  showCardRow: {
    flexDirection: 'row',
  },
  posterThumb: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  showInfo: {
    flex: 1,
  },
  showTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  showMetaText: {
    fontSize: 13,
  },
  showPriceInfo: {
    fontSize: 13,
    marginTop: 4,
  },
  showStatus: {
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: 60,
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
    marginTop: 4,
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
    paddingHorizontal: 16,
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
  venueList: {
    marginBottom: 16,
  },
  venueOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  venueOptionActive: {
  },
  venueOptionText: {
    fontSize: 14,
  },
  venueOptionTextActive: {
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
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pricingOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingActive: {
  },
  pricingText: {
    fontSize: 13,
  },
  pricingTextActive: {
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  pickerButtonText: {
    fontSize: 15,
  },
  pickerDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  pickerDoneBtnText: {
    fontSize: 14,
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
