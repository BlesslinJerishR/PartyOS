import {
  User,
  Venue,
  Seat,
  Show,
  Ticket,
  Review,
  MovieRequest,
  Snack,
  TMDBMovie,
  TMDBResponse,
  MapData,
  AuthResponse,
} from '../types';

// ── Demo mode state ───────────────────────────────────────────────
let _isDemoMode = false;

export function isDemoMode(): boolean {
  return _isDemoMode;
}

export function setDemoMode(enabled: boolean): void {
  _isDemoMode = enabled;
}

export const DEMO_USERNAME = 'blessl.in';
export const DEMO_PASSWORD = 'blessl.in';

// ── Demo IDs ──────────────────────────────────────────────────────
const DEMO_USER_ID = 'demo-user-001';
const DEMO_HOST_ID = 'demo-host-001';
const DEMO_VENUE_1 = 'demo-venue-001';
const DEMO_VENUE_2 = 'demo-venue-002';

// ── Demo User ─────────────────────────────────────────────────────
const demoUser: User = {
  id: DEMO_USER_ID,
  username: 'blessl.in',
  role: null,
  latitude: 13.0827,
  longitude: 80.2707,
  createdAt: '2025-01-15T10:00:00.000Z',
};

const demoHost: User = {
  id: DEMO_HOST_ID,
  username: 'MovieNight_Chennai',
  role: 'HOST',
  latitude: 13.0569,
  longitude: 80.2425,
  createdAt: '2024-12-01T08:00:00.000Z',
};

// ── Demo Movies (TMDB-like) ───────────────────────────────────────
const demoMovies: TMDBMovie[] = [
  {
    id: 912649,
    title: 'Venom: The Last Dance',
    overview: 'Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie\'s last dance.',
    poster_path: '/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
    backdrop_path: '/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg',
    release_date: '2024-10-22',
    vote_average: 6.7,
    vote_count: 2450,
  },
  {
    id: 1184918,
    title: 'The Wild Robot',
    overview: 'After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island\'s animals and cares for an orphaned baby goose.',
    poster_path: '/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg',
    backdrop_path: '/4zlOPT9CrtIzs0f9bVEYzuSBsFk.jpg',
    release_date: '2024-09-12',
    vote_average: 8.5,
    vote_count: 3200,
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: inception.',
    poster_path: '/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    vote_count: 35000,
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit up again.',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    release_date: '2024-07-24',
    vote_average: 7.7,
    vote_count: 5600,
  },
  {
    id: 823464,
    title: 'Godzilla x Kong: The New Empire',
    overview: 'Following their fruit battle against Mechagodzilla, Godzilla and Kong are now in an uneasy coexistence. When a mysterious threat from the Hollow Earth puts both surface and subterranean worlds at risk, the Titans must unite.',
    poster_path: '/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    backdrop_path: '/xRd1eJIDe7JHO5u4gtEYwGn5wtf.jpg',
    release_date: '2024-03-27',
    vote_average: 7.2,
    vote_count: 4100,
  },
  {
    id: 1022789,
    title: 'Inside Out 2',
    overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust are joined by Anxiety, Envy, Ennui and Embarrassment.',
    poster_path: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop_path: '/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg',
    release_date: '2024-06-11',
    vote_average: 7.6,
    vote_count: 4800,
  },
  {
    id: 653346,
    title: 'Kingdom of the Planet of the Apes',
    overview: 'Several generations in the future following Caesar\'s reign, apes are the dominant species and live harmoniously while humans have been reduced to living in the shadows.',
    poster_path: '/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    backdrop_path: '/fqv8v6AycA5JMnnfDwTwtPq6dXr.jpg',
    release_date: '2024-05-08',
    vote_average: 7.1,
    vote_count: 2900,
  },
  {
    id: 1011985,
    title: 'Kung Fu Panda 4',
    overview: 'Po is gearing up to become the spiritual leader of his Valley of Peace but needs a worthy successor to take his place as Dragon Warrior. When a wicked sorceress plans a comeback, Po must team up with a quick-witted corsac fox.',
    poster_path: '/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    backdrop_path: '/oEHCHCMGTuz6pDUkqPGKHHdBwgM.jpg',
    release_date: '2024-03-02',
    vote_average: 7.1,
    vote_count: 2300,
  },
];

// ── Demo Venues ───────────────────────────────────────────────────
const demoVenues: Venue[] = [
  {
    id: DEMO_VENUE_1,
    hostId: DEMO_USER_ID,
    name: 'Bless Living Room Theatre',
    address: 'T. Nagar, Chennai, Tamil Nadu',
    latitude: 13.0418,
    longitude: 80.2341,
    screenType: 'PROJECTOR',
    seats: [],
    snacks: [],
    host: { id: DEMO_USER_ID, username: 'blessl.in' },
  },
  {
    id: DEMO_VENUE_2,
    hostId: DEMO_USER_ID,
    name: 'Rooftop Cinema Club',
    address: 'Anna Nagar, Chennai, Tamil Nadu',
    latitude: 13.0850,
    longitude: 80.2101,
    screenType: 'TV_4K',
    seats: [],
    snacks: [],
    host: { id: DEMO_USER_ID, username: 'blessl.in' },
  },
];

// ── TMDB image base URL ────────────────────────────────────────────
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

// ── Demo Seats ────────────────────────────────────────────────────
// Dimensions reference (cols x rows):
//   CHAIR 1x1, SINGLE_SOFA 1x1, RECLINER 1x1, THREE_SEATER_SOFA 3x1
//   BED_SINGLE 1x3, BED_DOUBLE 2x3, BED_TRIPLE 3x3
//
// Venue 1 layout (rows 0-7):
//   Row 0: R1(0,0) R2(0,1)
//   Row 1: S1(1,0) S2(1,1)
//   Row 2: TS1(2,0..2)  — 3 cols wide
//   Row 3-5: BD1(3,0..1) — 2 cols, 3 rows deep
//   Row 6: C1(6,0) C2(6,1) C3(6,2)
const demoSeats: Seat[] = [
  { id: 'demo-seat-001', venueId: DEMO_VENUE_1, type: 'RECLINER', label: 'R1', row: 0, col: 0, capacity: 1 },
  { id: 'demo-seat-002', venueId: DEMO_VENUE_1, type: 'RECLINER', label: 'R2', row: 0, col: 1, capacity: 1 },
  { id: 'demo-seat-003', venueId: DEMO_VENUE_1, type: 'SINGLE_SOFA', label: 'S1', row: 1, col: 0, capacity: 1 },
  { id: 'demo-seat-004', venueId: DEMO_VENUE_1, type: 'SINGLE_SOFA', label: 'S2', row: 1, col: 1, capacity: 1 },
  { id: 'demo-seat-005', venueId: DEMO_VENUE_1, type: 'THREE_SEATER_SOFA', label: 'TS1', row: 2, col: 0, capacity: 3 },
  { id: 'demo-seat-006', venueId: DEMO_VENUE_1, type: 'BED_DOUBLE', label: 'BD1', row: 3, col: 0, capacity: 2 },
  { id: 'demo-seat-007', venueId: DEMO_VENUE_1, type: 'CHAIR', label: 'C1', row: 6, col: 0, capacity: 1 },
  { id: 'demo-seat-008', venueId: DEMO_VENUE_1, type: 'CHAIR', label: 'C2', row: 6, col: 1, capacity: 1 },
  { id: 'demo-seat-009', venueId: DEMO_VENUE_1, type: 'CHAIR', label: 'C3', row: 6, col: 2, capacity: 1 },
  // Venue 2 layout (rows 0-5):
  //   Row 0-2: BS1(0,0) — 1 col, 3 rows deep
  //   Row 0-2: BS2(0,2) — 1 col, 3 rows deep (col 2, gap at col 1)
  //   Row 3: R1(3,0) R2(3,1) R3(3,2)
  //   Row 4: TS1(4,0..2)  — 3 cols wide
  { id: 'demo-seat-010', venueId: DEMO_VENUE_2, type: 'BED_SINGLE', label: 'BS1', row: 0, col: 0, capacity: 1 },
  { id: 'demo-seat-011', venueId: DEMO_VENUE_2, type: 'BED_SINGLE', label: 'BS2', row: 0, col: 2, capacity: 1 },
  { id: 'demo-seat-012', venueId: DEMO_VENUE_2, type: 'RECLINER', label: 'R1', row: 3, col: 0, capacity: 1 },
  { id: 'demo-seat-013', venueId: DEMO_VENUE_2, type: 'RECLINER', label: 'R2', row: 3, col: 1, capacity: 1 },
  { id: 'demo-seat-014', venueId: DEMO_VENUE_2, type: 'RECLINER', label: 'R3', row: 3, col: 2, capacity: 1 },
  { id: 'demo-seat-015', venueId: DEMO_VENUE_2, type: 'THREE_SEATER_SOFA', label: 'TS1', row: 4, col: 0, capacity: 3 },
];

// Attach seats to venues
demoVenues[0].seats = demoSeats.filter(s => s.venueId === DEMO_VENUE_1);
demoVenues[1].seats = demoSeats.filter(s => s.venueId === DEMO_VENUE_2);

// ── Helper: relative dates ────────────────────────────────────────
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

// ── Demo Shows ────────────────────────────────────────────────────
const demoShows: Show[] = [
  {
    id: 'demo-show-001',
    venueId: DEMO_VENUE_1,
    tmdbMovieId: 912649,
    movieTitle: 'Venom: The Last Dance',
    moviePoster: `${TMDB_IMG}/aosm8NMQ3UyoBVpSxyimorCQykC.jpg`,
    startTime: hoursAgo(1),
    endTime: hoursFromNow(1.5),
    isFree: false,
    isPrivate: false,
    price: 150,
    status: 'NOW_PLAYING',
    venue: demoVenues[0],
    tickets: [
      { seatId: 'demo-seat-001', status: 'CHECKED_IN' },
      { seatId: 'demo-seat-003', status: 'BOOKED' },
    ],
    reviews: [],
  },
  {
    id: 'demo-show-002',
    venueId: DEMO_VENUE_2,
    tmdbMovieId: 1184918,
    movieTitle: 'The Wild Robot',
    moviePoster: `${TMDB_IMG}/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg`,
    startTime: hoursAgo(0.5),
    endTime: hoursFromNow(2),
    isFree: true,
    isPrivate: false,
    price: 0,
    status: 'NOW_PLAYING',
    venue: demoVenues[1],
    tickets: [
      { seatId: 'demo-seat-010', status: 'CHECKED_IN' },
    ],
    reviews: [],
  },
  {
    id: 'demo-show-007',
    venueId: DEMO_VENUE_1,
    tmdbMovieId: 27205,
    movieTitle: 'Inception',
    moviePoster: `${TMDB_IMG}/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg`,
    startTime: hoursAgo(0.5),
    endTime: hoursFromNow(2),
    isFree: false,
    isPrivate: true,
    price: 100,
    status: 'NOW_PLAYING',
    venue: demoVenues[0],
    tickets: [
      { seatId: 'demo-seat-006', status: 'BOOKED' },
    ],
    reviews: [],
  },
  {
    id: 'demo-show-003',
    venueId: DEMO_VENUE_1,
    tmdbMovieId: 533535,
    movieTitle: 'Deadpool & Wolverine',
    moviePoster: `${TMDB_IMG}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg`,
    startTime: daysFromNow(1),
    endTime: daysFromNow(1.1),
    isFree: false,
    isPrivate: false,
    price: 200,
    status: 'SCHEDULED',
    venue: demoVenues[0],
    tickets: [],
    reviews: [],
  },
  {
    id: 'demo-show-004',
    venueId: DEMO_VENUE_2,
    tmdbMovieId: 823464,
    movieTitle: 'Godzilla x Kong: The New Empire',
    moviePoster: `${TMDB_IMG}/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg`,
    startTime: daysFromNow(2),
    endTime: daysFromNow(2.1),
    isFree: false,
    isPrivate: true,
    price: 100,
    status: 'SCHEDULED',
    venue: demoVenues[1],
    tickets: [],
    reviews: [],
  },
  {
    id: 'demo-show-005',
    venueId: DEMO_VENUE_1,
    tmdbMovieId: 1022789,
    movieTitle: 'Inside Out 2',
    moviePoster: `${TMDB_IMG}/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg`,
    startTime: daysFromNow(3),
    endTime: daysFromNow(3.1),
    isFree: true,
    isPrivate: false,
    price: 0,
    status: 'SCHEDULED',
    venue: demoVenues[0],
    tickets: [],
    reviews: [],
  },
  {
    id: 'demo-show-006',
    venueId: DEMO_VENUE_1,
    tmdbMovieId: 653346,
    movieTitle: 'Kingdom of the Planet of the Apes',
    moviePoster: `${TMDB_IMG}/gKkl37BQuKTanygYQG1pyYgLVgf.jpg`,
    startTime: daysAgo(5),
    endTime: daysAgo(4.9),
    isFree: false,
    isPrivate: false,
    price: 120,
    status: 'COMPLETED',
    venue: demoVenues[0],
    tickets: [
      { seatId: 'demo-seat-001', status: 'COMPLETED' },
      { seatId: 'demo-seat-002', status: 'COMPLETED' },
      { seatId: 'demo-seat-005', status: 'COMPLETED' },
    ],
    reviews: [],
  },
];

// ── Demo Tickets ──────────────────────────────────────────────────
const demoTickets: Ticket[] = [
  {
    id: 'demo-ticket-001',
    showId: 'demo-show-001',
    seatId: 'demo-seat-003',
    guestId: DEMO_USER_ID,
    status: 'BOOKED',
    price: 150,
    createdAt: hoursAgo(3),
    show: demoShows[0],
    seat: demoSeats[2],
  },
  {
    id: 'demo-ticket-002',
    showId: 'demo-show-006',
    seatId: 'demo-seat-001',
    guestId: DEMO_USER_ID,
    status: 'COMPLETED',
    price: 120,
    createdAt: daysAgo(6),
    show: demoShows[6],
    seat: demoSeats[0],
  },
  {
    id: 'demo-ticket-003',
    showId: 'demo-show-002',
    seatId: 'demo-seat-010',
    guestId: DEMO_USER_ID,
    status: 'CHECKED_IN',
    price: 0,
    createdAt: hoursAgo(2),
    show: demoShows[1],
    seat: demoSeats[9],
  },
];

// ── Demo Reviews ──────────────────────────────────────────────────
const demoReviews: Review[] = [
  {
    id: 'demo-review-001',
    showId: 'demo-show-006',
    hostId: DEMO_USER_ID,
    guestId: 'demo-guest-001',
    ticketId: 'demo-ticket-ext-001',
    rating: 5,
    comment: 'Amazing setup! The projector quality was fantastic and the seating was super comfortable. Will definitely come back!',
    createdAt: daysAgo(4),
    guest: { id: 'demo-guest-001', username: 'CinemaFan42' },
    show: { movieTitle: 'Kingdom of the Planet of the Apes' },
  },
  {
    id: 'demo-review-002',
    showId: 'demo-show-006',
    hostId: DEMO_USER_ID,
    guestId: 'demo-guest-002',
    ticketId: 'demo-ticket-ext-002',
    rating: 4,
    comment: 'Great movie night experience. Loved the snacks selection. Sound could be a bit louder though.',
    createdAt: daysAgo(4),
    guest: { id: 'demo-guest-002', username: 'NightOwlViewer' },
    show: { movieTitle: 'Kingdom of the Planet of the Apes' },
  },
  {
    id: 'demo-review-003',
    showId: 'demo-show-006',
    hostId: DEMO_USER_ID,
    guestId: 'demo-guest-003',
    ticketId: 'demo-ticket-ext-003',
    rating: 5,
    comment: 'Perfect host! Everything was well organized. The bed seating option is genius!',
    createdAt: daysAgo(3),
    guest: { id: 'demo-guest-003', username: 'PartyGoer99' },
    show: { movieTitle: 'Kingdom of the Planet of the Apes' },
  },
  {
    id: 'demo-review-004',
    showId: 'demo-show-001',
    hostId: DEMO_USER_ID,
    guestId: 'demo-guest-004',
    ticketId: 'demo-ticket-ext-004',
    rating: 4,
    comment: 'Venom on a big projector screen was epic! Great atmosphere.',
    createdAt: hoursAgo(1),
    guest: { id: 'demo-guest-004', username: 'MarvelManiac' },
    show: { movieTitle: 'Venom: The Last Dance' },
  },
];

// ── Demo Movie Requests ───────────────────────────────────────────
const demoMovieRequests: MovieRequest[] = [
  {
    id: 'demo-request-001',
    guestId: 'demo-guest-001',
    hostId: DEMO_USER_ID,
    tmdbMovieId: 653346,
    movieTitle: 'Kingdom of the Planet of the Apes',
    status: 'PENDING',
    createdAt: daysAgo(1),
    guest: { id: 'demo-guest-001', username: 'CinemaFan42' },
    host: { id: DEMO_USER_ID, username: 'blessl.in' },
  },
  {
    id: 'demo-request-002',
    guestId: 'demo-guest-002',
    hostId: DEMO_USER_ID,
    tmdbMovieId: 1011985,
    movieTitle: 'Kung Fu Panda 4',
    status: 'PENDING',
    createdAt: daysAgo(2),
    guest: { id: 'demo-guest-002', username: 'NightOwlViewer' },
    host: { id: DEMO_USER_ID, username: 'blessl.in' },
  },
  {
    id: 'demo-request-003',
    guestId: 'demo-guest-003',
    hostId: DEMO_USER_ID,
    tmdbMovieId: 533535,
    movieTitle: 'Deadpool & Wolverine',
    status: 'ACCEPTED',
    createdAt: daysAgo(5),
    guest: { id: 'demo-guest-003', username: 'PartyGoer99' },
    host: { id: DEMO_USER_ID, username: 'blessl.in' },
  },
  {
    id: 'demo-request-004',
    guestId: DEMO_USER_ID,
    hostId: DEMO_HOST_ID,
    tmdbMovieId: 912649,
    movieTitle: 'Venom: The Last Dance',
    status: 'ACCEPTED',
    createdAt: daysAgo(7),
    guest: { id: DEMO_USER_ID, username: 'blessl.in' },
    host: { id: DEMO_HOST_ID, username: 'MovieNight_Chennai' },
  },
  {
    id: 'demo-request-005',
    guestId: DEMO_USER_ID,
    hostId: DEMO_HOST_ID,
    tmdbMovieId: 1184918,
    movieTitle: 'The Wild Robot',
    status: 'PENDING',
    createdAt: daysAgo(1),
    guest: { id: DEMO_USER_ID, username: 'blessl.in' },
    host: { id: DEMO_HOST_ID, username: 'MovieNight_Chennai' },
  },
];

// ── Demo Snacks ───────────────────────────────────────────────────
const demoSnacks: Snack[] = [
  { id: 'demo-snack-001', venueId: DEMO_VENUE_1, name: 'Butter Popcorn', description: 'Classic buttery popcorn, freshly made', price: 80, available: true },
  { id: 'demo-snack-002', venueId: DEMO_VENUE_1, name: 'Nachos & Cheese', description: 'Crispy nachos with warm cheese dip', price: 120, available: true },
  { id: 'demo-snack-003', venueId: DEMO_VENUE_1, name: 'Cold Coffee', description: 'Iced coffee with cream', price: 60, available: true },
  { id: 'demo-snack-004', venueId: DEMO_VENUE_1, name: 'Masala Chai', description: 'Hot spiced Indian tea', price: 30, available: false },
  { id: 'demo-snack-005', venueId: DEMO_VENUE_2, name: 'Caramel Popcorn', description: 'Sweet caramel coated popcorn', price: 100, available: true },
  { id: 'demo-snack-006', venueId: DEMO_VENUE_2, name: 'Samosa (2 pcs)', description: 'Crispy potato samosas with chutney', price: 50, available: true },
  { id: 'demo-snack-007', venueId: DEMO_VENUE_2, name: 'Mango Lassi', description: 'Thick mango yogurt smoothie', price: 70, available: true },
];

demoVenues[0].snacks = demoSnacks.filter(s => s.venueId === DEMO_VENUE_1);
demoVenues[1].snacks = demoSnacks.filter(s => s.venueId === DEMO_VENUE_2);

// ── Demo read-only alert ──────────────────────────────────────────
const DEMO_ALERT_TITLE = 'Demo Mode';
const DEMO_ALERT_MSG = 'This action is disabled in demo mode. Sign up for a free account to use all features!';

export function showDemoAlert(): void {
  const { Alert } = require('react-native');
  Alert.alert(DEMO_ALERT_TITLE, DEMO_ALERT_MSG);
}

// ── Mock API ──────────────────────────────────────────────────────
// Mirrors the shape of the real `api` export in api.ts
// All "read" endpoints return demo data.
// All "write" endpoints call showDemoAlert() and reject.

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function demoReject(): Promise<never> {
  showDemoAlert();
  return Promise.reject(new Error('Demo mode'));
}

export const demoApi = {
  clearCache() {},

  auth: {
    signup(_u: string, _p: string) { return demoReject(); },
    login(username: string, password: string): Promise<AuthResponse> {
      if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
        return delay({
          user: { id: DEMO_USER_ID, username: DEMO_USERNAME, role: null },
          accessToken: 'demo-token-partyos',
        });
      }
      return Promise.reject(new Error('Invalid credentials'));
    },
  },

  users: {
    getProfile() {
      return delay(demoUser);
    },
    setRole(role: string) {
      // Allow role switching in demo to navigate between host/guest
      const updated = { id: DEMO_USER_ID, username: DEMO_USERNAME, role };
      return delay(updated);
    },
    updateLocation(_lat: number, _lng: number) {
      return delay(demoUser);
    },
    searchHosts(_query: string) {
      return delay([
        { id: DEMO_HOST_ID, username: 'MovieNight_Chennai' },
        { id: 'demo-host-002', username: 'HomeTheatre_Adyar' },
        { id: 'demo-host-003', username: 'CinemaClub_TNagar' },
      ]);
    },
  },

  movies: {
    getNowPlaying(page = 1): Promise<TMDBResponse> {
      return delay({
        page,
        results: demoMovies.slice(0, 4),
        total_pages: 1,
        total_results: 4,
      });
    },
    getUpcoming(page = 1): Promise<TMDBResponse> {
      return delay({
        page,
        results: demoMovies.slice(4, 8),
        total_pages: 1,
        total_results: 4,
      });
    },
    getPopular(page = 1): Promise<TMDBResponse> {
      return delay({
        page,
        results: demoMovies,
        total_pages: 1,
        total_results: demoMovies.length,
      });
    },
    search(query: string, page = 1): Promise<TMDBResponse> {
      const q = query.toLowerCase();
      const results = demoMovies.filter(m => m.title.toLowerCase().includes(q));
      return delay({
        page,
        results,
        total_pages: 1,
        total_results: results.length,
      });
    },
    getDetails(movieId: number) {
      const movie = demoMovies.find(m => m.id === movieId) || demoMovies[0];
      return delay({
        ...movie,
        runtime: 128,
        genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
        tagline: 'The adventure continues',
      });
    },
  },

  venues: {
    create(_data: any) { return demoReject(); },
    getMy() { return delay(demoVenues); },
    getOne(id: string) {
      const venue = demoVenues.find(v => v.id === id) || demoVenues[0];
      return delay(venue);
    },
    update(_id: string, _data: any) { return demoReject(); },
    delete(_id: string) { return demoReject(); },
    getNearby(_lat: number, _lng: number, _radius?: number) {
      return delay(demoVenues);
    },
  },

  seats: {
    create(_data: any) { return demoReject(); },
    batchCreate(_data: any) { return demoReject(); },
    getByVenue(venueId: string) {
      return delay(demoSeats.filter(s => s.venueId === venueId));
    },
    delete(_id: string) { return demoReject(); },
  },

  shows: {
    create(_data: any) { return demoReject(); },
    getNowPlaying(_lat?: number, _lng?: number) {
      return delay(demoShows.filter(s => s.status === 'NOW_PLAYING'));
    },
    getUpcoming(_lat?: number, _lng?: number) {
      return delay(demoShows.filter(s => s.status === 'SCHEDULED'));
    },
    getMy() {
      return delay(demoShows);
    },
    getOne(id: string) {
      const show = demoShows.find(s => s.id === id) || demoShows[0];
      return delay(show);
    },
    getMarkers() {
      const nowPlaying = demoShows.filter(s => s.status === 'NOW_PLAYING').map(s => ({
        id: s.id,
        movieTitle: s.movieTitle,
        moviePoster: s.moviePoster,
        startTime: s.startTime,
        endTime: s.endTime,
        isFree: s.isFree,
        isPrivate: s.isPrivate,
        price: s.price,
        venue: {
          id: s.venue.id,
          name: s.venue.name,
          address: s.venue.address,
          latitude: s.venue.latitude,
          longitude: s.venue.longitude,
          host: s.venue.host!,
        },
      }));
      const upcoming = demoShows.filter(s => s.status === 'SCHEDULED').map(s => ({
        id: s.id,
        movieTitle: s.movieTitle,
        moviePoster: s.moviePoster,
        startTime: s.startTime,
        endTime: s.endTime,
        isFree: s.isFree,
        isPrivate: s.isPrivate,
        price: s.price,
        venue: {
          id: s.venue.id,
          name: s.venue.name,
          address: s.venue.address,
          latitude: s.venue.latitude,
          longitude: s.venue.longitude,
          host: s.venue.host!,
        },
      }));
      return delay({ nowPlaying, upcoming } as MapData);
    },
    update(_id: string, _data: any) { return demoReject(); },
    cancel(_id: string) { return demoReject(); },
  },

  tickets: {
    book(_showId: string, _seatId: string, _password?: string) { return demoReject(); },
    getMy() { return delay(demoTickets); },
    getByShow(showId: string) {
      return delay(demoTickets.filter(t => t.showId === showId));
    },
    cancel(_id: string) { return demoReject(); },
    checkIn(_id: string) { return demoReject(); },
  },

  reviews: {
    create(_data: any) { return demoReject(); },
    getByHost(_hostId: string) { return delay(demoReviews); },
    getHostRating(_hostId: string) {
      const avg = demoReviews.reduce((sum, r) => sum + r.rating, 0) / demoReviews.length;
      return delay({ average: Math.round(avg * 10) / 10, count: demoReviews.length });
    },
    getByShow(showId: string) {
      return delay(demoReviews.filter(r => r.showId === showId));
    },
  },

  movieRequests: {
    create(_data: any) { return demoReject(); },
    getByHost() {
      return delay(demoMovieRequests.filter(r => r.hostId === DEMO_USER_ID));
    },
    getMy() {
      return delay(demoMovieRequests.filter(r => r.guestId === DEMO_USER_ID));
    },
    accept(_id: string) { return demoReject(); },
    decline(_id: string) { return demoReject(); },
  },

  snacks: {
    create(_data: any) { return demoReject(); },
    getByVenue(venueId: string) {
      return delay(demoSnacks.filter(s => s.venueId === venueId));
    },
    update(_id: string, _data: any) { return demoReject(); },
    delete(_id: string) { return demoReject(); },
  },

  location: {
    getMap(_lat: number, _lng: number, _radius?: number) {
      return delay({
        venues: demoVenues,
        nowPlaying: demoShows.filter(s => s.status === 'NOW_PLAYING'),
        upcoming: demoShows.filter(s => s.status === 'SCHEDULED'),
      });
    },
  },
};
