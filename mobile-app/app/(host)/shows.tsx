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
} from 'react-native';
import { api } from '../../services/api';
import Colors from '../../constants/Colors';
import { Show, Venue, TMDBMovie, TMDBResponse } from '../../types';
import { Plus, Search, X, Calendar, Clock } from 'lucide-react-native';

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
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');

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
    try {
      const data = (await api.movies.search(searchQuery)) as TMDBResponse;
      setMovieResults(data.results || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateShow = async () => {
    if (!selectedMovie || !selectedVenueId || !startDate || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${startDate}T${endTime}:00`;

      await api.shows.create({
        venueId: selectedVenueId,
        tmdbMovieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.poster_path
          ? `${TMDB_IMAGE_BASE}${selectedMovie.poster_path}`
          : null,
        startTime: startDateTime,
        endTime: endDateTime,
        isFree,
        price: isFree ? 0 : parseFloat(price) || 0,
      });

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
    setStartDate('');
    setStartTime('');
    setEndTime('');
    setIsFree(true);
    setPrice('');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreate(true)}
      >
        <Plus size={20} color={Colors.white} strokeWidth={2} />
        <Text style={styles.createButtonText}>Schedule New Show</Text>
      </TouchableOpacity>

      {shows.map((show) => (
        <View key={show.id} style={styles.showCard}>
          <View style={styles.showCardRow}>
            {show.moviePoster && (
              <Image
                source={{ uri: show.moviePoster }}
                style={styles.posterThumb}
              />
            )}
            <View style={styles.showInfo}>
              <Text style={styles.showTitle}>{show.movieTitle}</Text>
              <View style={styles.showMeta}>
                <Calendar size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.showMetaText}>
                  {new Date(show.startTime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.showMeta}>
                <Clock size={14} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.showMetaText}>
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
              <Text style={styles.showPriceInfo}>
                {show.isFree ? 'Free Entry' : `Price: ${show.price}`}
              </Text>
            </View>
            <View style={styles.showStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      show.status === 'NOW_PLAYING'
                        ? Colors.nowPlaying
                        : show.status === 'SCHEDULED'
                        ? Colors.upcoming
                        : show.status === 'COMPLETED'
                        ? Colors.success
                        : Colors.error,
                  },
                ]}
              />
              <Text style={styles.statusLabel}>{show.status.replace('_', ' ')}</Text>
            </View>
          </View>
          {(show.status === 'SCHEDULED' || show.status === 'NOW_PLAYING') && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelShow(show.id)}
            >
              <Text style={styles.cancelBtnText}>Cancel Show</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {shows.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Shows Scheduled</Text>
          <Text style={styles.emptyText}>
            Tap the button above to schedule your first movie show
          </Text>
        </View>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Show</Text>
              <TouchableOpacity onPress={() => { setShowCreate(false); resetForm(); }}>
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
                <Search size={20} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedMovie && (
              <View style={styles.selectedMovieCard}>
                <Text style={styles.selectedMovieTitle}>
                  Selected: {selectedMovie.title}
                </Text>
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
                    <Text style={styles.movieOptionTitle} numberOfLines={2}>
                      {movie.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.fieldLabel}>Select Venue</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueList}>
              {venues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueOption,
                    selectedVenueId === venue.id && styles.venueOptionActive,
                  ]}
                  onPress={() => setSelectedVenueId(venue.id)}
                >
                  <Text
                    style={[
                      styles.venueOptionText,
                      selectedVenueId === venue.id && styles.venueOptionTextActive,
                    ]}
                  >
                    {venue.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Date (YYYY MM DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2026 04 15"
              placeholderTextColor={Colors.textLight}
              value={startDate}
              onChangeText={setStartDate}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Start Time</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="18:00"
                  placeholderTextColor={Colors.textLight}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>End Time</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="20:30"
                  placeholderTextColor={Colors.textLight}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Pricing</Text>
            <View style={styles.pricingRow}>
              <TouchableOpacity
                style={[styles.pricingOption, isFree && styles.pricingActive]}
                onPress={() => setIsFree(true)}
              >
                <Text style={[styles.pricingText, isFree && styles.pricingTextActive]}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pricingOption, !isFree && styles.pricingActive]}
                onPress={() => setIsFree(false)}
              >
                <Text style={[styles.pricingText, !isFree && styles.pricingTextActive]}>Paid</Text>
              </TouchableOpacity>
            </View>

            {!isFree && (
              <TextInput
                style={styles.modalInput}
                placeholder="Price per ticket"
                placeholderTextColor={Colors.textLight}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            )}

            <TouchableOpacity style={styles.modalButton} onPress={handleCreateShow}>
              <Text style={styles.modalButtonText}>Schedule Show</Text>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  showCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  showPriceInfo: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
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
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
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
    fontWeight: '700',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  selectedMovieCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedMovieTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
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
    color: Colors.text,
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
    backgroundColor: Colors.surfaceAlt,
    marginRight: 8,
  },
  venueOptionActive: {
    backgroundColor: Colors.primary,
  },
  venueOptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  venueOptionTextActive: {
    color: Colors.white,
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
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pricingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pricingActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pricingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  pricingTextActive: {
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
