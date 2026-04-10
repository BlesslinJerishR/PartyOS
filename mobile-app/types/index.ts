export type UserRole = 'HOST' | 'GUEST';

export type ScreenType = 'TV_4K' | 'PROJECTOR';

export type SeatType =
  | 'CHAIR'
  | 'SINGLE_SOFA'
  | 'RECLINER'
  | 'THREE_SEATER_SOFA'
  | 'BED_SINGLE'
  | 'BED_DOUBLE'
  | 'BED_TRIPLE';

export type ShowStatus = 'SCHEDULED' | 'NOW_PLAYING' | 'COMPLETED' | 'CANCELLED';

export type TicketStatus = 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export type MovieRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface User {
  id: string;
  username: string;
  role: UserRole | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: UserRole | null;
  };
  accessToken: string;
}

export interface Venue {
  id: string;
  hostId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  screenType: ScreenType;
  seats: Seat[];
  snacks?: Snack[];
  host?: { id: string; username: string };
}

export interface Seat {
  id: string;
  venueId: string;
  type: SeatType;
  label: string;
  row: number;
  col: number;
  capacity: number;
}

export interface Show {
  id: string;
  venueId: string;
  tmdbMovieId: number;
  movieTitle: string;
  moviePoster: string | null;
  startTime: string;
  endTime: string;
  isFree: boolean;
  isPrivate: boolean;
  price: number;
  status: ShowStatus;
  venue: Venue;
  tickets?: { seatId: string; status: TicketStatus }[];
  reviews?: Review[];
}

export interface Ticket {
  id: string;
  showId: string;
  seatId: string;
  guestId: string;
  status: TicketStatus;
  price: number;
  createdAt: string;
  show: Show;
  seat: Seat;
}

export interface Review {
  id: string;
  showId: string;
  hostId: string;
  guestId: string;
  ticketId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  guest?: { id: string; username: string };
  show?: { movieTitle: string };
}

export interface MovieRequest {
  id: string;
  guestId: string;
  hostId: string;
  tmdbMovieId: number;
  movieTitle: string;
  status: MovieRequestStatus;
  createdAt: string;
  guest?: { id: string; username: string };
  host?: { id: string; username: string };
}

export interface Snack {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface MapMarker {
  id: string;
  movieTitle: string;
  moviePoster: string | null;
  startTime: string;
  endTime: string;
  isFree: boolean;
  isPrivate: boolean;
  price: number;
  venue: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    host: { id: string; username: string };
  };
}

export interface MapData {
  nowPlaying: MapMarker[];
  upcoming: MapMarker[];
}

export const SEAT_TYPE_LABELS: Record<SeatType, string> = {
  CHAIR: 'Chair',
  SINGLE_SOFA: 'Single Sofa',
  RECLINER: 'Recliner',
  THREE_SEATER_SOFA: 'Three Seater Sofa',
  BED_SINGLE: 'Single Bed',
  BED_DOUBLE: 'Double Bed',
  BED_TRIPLE: 'Triple Bed',
};

export const SEAT_CAPACITIES: Record<SeatType, number> = {
  CHAIR: 1,
  SINGLE_SOFA: 1,
  RECLINER: 1,
  THREE_SEATER_SOFA: 3,
  BED_SINGLE: 1,
  BED_DOUBLE: 2,
  BED_TRIPLE: 3,
};

export const SEAT_COLORS: Record<SeatType, string> = {
  CHAIR: '#FF004F',
  SINGLE_SOFA: '#8B5CF6',
  RECLINER: '#F59E0B',
  THREE_SEATER_SOFA: '#3B82F6',
  BED_SINGLE: '#10B981',
  BED_DOUBLE: '#EC4899',
  BED_TRIPLE: '#06B6D4',
};

export const SEAT_DIMENSIONS: Record<SeatType, { cols: number; rows: number }> = {
  CHAIR: { cols: 1, rows: 1 },
  SINGLE_SOFA: { cols: 1, rows: 1 },
  RECLINER: { cols: 1, rows: 1 },
  THREE_SEATER_SOFA: { cols: 3, rows: 1 },
  BED_SINGLE: { cols: 1, rows: 3 },
  BED_DOUBLE: { cols: 2, rows: 3 },
  BED_TRIPLE: { cols: 3, rows: 3 },
};
