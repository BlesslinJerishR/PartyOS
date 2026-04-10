import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

function getApiUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (configured) return configured;

  // In development, derive the API host from Expo's dev server address
  // so the app can reach the backend on the same machine.
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Android emulator uses 10.0.2.2 to reach the host machine
  if (__DEV__ && Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

const API_URL = getApiUrl();

async function getHeaders(hasBody: boolean = true): Promise<Record<string, string>> {
  const token = await storage.getToken();
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const hasBody = !!options.body;
  const headers = await getHeaders(hasBody);
  let lastError: Error = new Error('Request failed');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...((options.headers as Record<string, string>) || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on 503 Service Unavailable (backend TMDB proxy errors)
      if (response.status === 503 && attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastError = new Error(
          'Request timed out. Please check your connection and try again.',
        );
      } else {
        lastError = error;
      }

      // Retry on network-level failures and timeouts
      const isRetryable =
        error.name === 'AbortError' ||
        error.message?.includes('Network request failed') ||
        error.message?.includes('fetch failed');

      if (isRetryable && attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

export const api = {
  auth: {
    signup(username: string, password: string) {
      return request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
    login(username: string, password: string) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
  },

  users: {
    getProfile() {
      return request('/users/me');
    },
    setRole(role: string) {
      return request('/users/role', {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    updateLocation(latitude: number, longitude: number) {
      return request('/users/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude }),
      });
    },
    searchHosts(query: string) {
      return request(`/users/search-hosts?q=${encodeURIComponent(query)}`);
    },
  },

  movies: {
    getNowPlaying(page = 1) {
      return request(`/movies/now-playing?page=${page}`);
    },
    getUpcoming(page = 1) {
      return request(`/movies/upcoming?page=${page}`);
    },
    getPopular(page = 1) {
      return request(`/movies/popular?page=${page}`);
    },
    search(query: string, page = 1) {
      return request(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
    },
    getDetails(movieId: number) {
      return request(`/movies/${movieId}`);
    },
  },

  venues: {
    create(data: any) {
      return request('/venues', { method: 'POST', body: JSON.stringify(data) });
    },
    getMy() {
      return request('/venues/my');
    },
    getOne(id: string) {
      return request(`/venues/${id}`);
    },
    update(id: string, data: any) {
      return request(`/venues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    delete(id: string) {
      return request(`/venues/${id}`, { method: 'DELETE' });
    },
    getNearby(lat: number, lng: number, radius?: number) {
      const params = `latitude=${lat}&longitude=${lng}${radius ? `&radius=${radius}` : ''}`;
      return request(`/venues/nearby?${params}`);
    },
  },

  seats: {
    create(data: any) {
      return request('/seats', { method: 'POST', body: JSON.stringify(data) });
    },
    batchCreate(data: any) {
      return request('/seats/batch', { method: 'POST', body: JSON.stringify(data) });
    },
    getByVenue(venueId: string) {
      return request(`/seats/venue/${venueId}`);
    },
    delete(id: string) {
      return request(`/seats/${id}`, { method: 'DELETE' });
    },
  },

  shows: {
    create(data: any) {
      return request('/shows', { method: 'POST', body: JSON.stringify(data) });
    },
    getNowPlaying(lat?: number, lng?: number) {
      const params = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
      return request(`/shows/now-playing${params}`);
    },
    getUpcoming(lat?: number, lng?: number) {
      const params = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
      return request(`/shows/upcoming${params}`);
    },
    getMy() {
      return request('/shows/my');
    },
    getOne(id: string) {
      return request(`/shows/${id}`);
    },
    getMarkers() {
      return request('/shows/markers');
    },
    update(id: string, data: any) {
      return request(`/shows/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    cancel(id: string) {
      return request(`/shows/${id}/cancel`, { method: 'PATCH' });
    },
  },

  tickets: {
    book(showId: string, seatId: string, password?: string) {
      const body: any = { showId, seatId };
      if (password) body.password = password;
      return request('/tickets', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    getMy() {
      return request('/tickets/my');
    },
    getByShow(showId: string) {
      return request(`/tickets/show/${showId}`);
    },
    cancel(id: string) {
      return request(`/tickets/${id}/cancel`, { method: 'PATCH' });
    },
    checkIn(id: string) {
      return request(`/tickets/${id}/check-in`, { method: 'PATCH' });
    },
  },

  reviews: {
    create(data: any) {
      return request('/reviews', { method: 'POST', body: JSON.stringify(data) });
    },
    getByHost(hostId: string) {
      return request(`/reviews/host/${hostId}`);
    },
    getHostRating(hostId: string) {
      return request(`/reviews/host/${hostId}/rating`);
    },
    getByShow(showId: string) {
      return request(`/reviews/show/${showId}`);
    },
  },

  movieRequests: {
    create(data: any) {
      return request('/movie-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getByHost() {
      return request('/movie-requests/host');
    },
    getMy() {
      return request('/movie-requests/my');
    },
    accept(id: string) {
      return request(`/movie-requests/${id}/accept`, { method: 'PATCH' });
    },
    decline(id: string) {
      return request(`/movie-requests/${id}/decline`, { method: 'PATCH' });
    },
  },

  snacks: {
    create(data: any) {
      return request('/snacks', { method: 'POST', body: JSON.stringify(data) });
    },
    getByVenue(venueId: string) {
      return request(`/snacks/venue/${venueId}`);
    },
    update(id: string, data: any) {
      return request(`/snacks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    delete(id: string) {
      return request(`/snacks/${id}`, { method: 'DELETE' });
    },
  },

  location: {
    getMap(lat: number, lng: number, radius?: number) {
      const params = `latitude=${lat}&longitude=${lng}${radius ? `&radius=${radius}` : ''}`;
      return request(`/location/map?${params}`);
    },
  },
};
