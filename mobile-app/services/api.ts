import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

// ── In-memory response cache ──────────────────────────────────────
interface CacheEntry<T = unknown> {
  data: T;
  expiry: number;
}

const responseCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
  responseCache.set(key, { data, expiry: Date.now() + ttl });
  // Evict stale entries when cache grows large
  if (responseCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (now > v.expiry) responseCache.delete(k);
    }
  }
}

function invalidateCache(pattern: string): void {
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) responseCache.delete(key);
  }
}

function clearCache(): void {
  responseCache.clear();
}

// ── API URL resolution ────────────────────────────────────────────
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
  clearCache,

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
      const key = '/users/me';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    setRole(role: string) {
      invalidateCache('/users/');
      return request('/users/role', {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    updateLocation(latitude: number, longitude: number) {
      invalidateCache('/users/');
      invalidateCache('/location/');
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
      const key = `/movies/now-playing?page=${page}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 120_000); return data; });
    },
    getUpcoming(page = 1) {
      const key = `/movies/upcoming?page=${page}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 120_000); return data; });
    },
    getPopular(page = 1) {
      const key = `/movies/popular?page=${page}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 120_000); return data; });
    },
    search(query: string, page = 1) {
      return request(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
    },
    getDetails(movieId: number) {
      const key = `/movies/${movieId}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 300_000); return data; });
    },
  },

  venues: {
    create(data: any) {
      invalidateCache('/venues/');
      return request('/venues', { method: 'POST', body: JSON.stringify(data) });
    },
    getMy() {
      const key = '/venues/my';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getOne(id: string) {
      const key = `/venues/${id}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    update(id: string, data: any) {
      invalidateCache('/venues/');
      return request(`/venues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    delete(id: string) {
      invalidateCache('/venues/');
      return request(`/venues/${id}`, { method: 'DELETE' });
    },
    getNearby(lat: number, lng: number, radius?: number) {
      const params = `latitude=${lat}&longitude=${lng}${radius ? `&radius=${radius}` : ''}`;
      const key = `/venues/nearby?${params}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
  },

  seats: {
    create(data: any) {
      invalidateCache('/seats/');
      invalidateCache('/venues/');
      return request('/seats', { method: 'POST', body: JSON.stringify(data) });
    },
    batchCreate(data: any) {
      invalidateCache('/seats/');
      invalidateCache('/venues/');
      return request('/seats/batch', { method: 'POST', body: JSON.stringify(data) });
    },
    getByVenue(venueId: string) {
      const key = `/seats/venue/${venueId}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    delete(id: string) {
      invalidateCache('/seats/');
      invalidateCache('/venues/');
      return request(`/seats/${id}`, { method: 'DELETE' });
    },
  },

  shows: {
    create(data: any) {
      invalidateCache('/shows/');
      return request('/shows', { method: 'POST', body: JSON.stringify(data) });
    },
    getNowPlaying(lat?: number, lng?: number) {
      const params = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
      const key = `/shows/now-playing${params}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getUpcoming(lat?: number, lng?: number) {
      const params = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
      const key = `/shows/upcoming${params}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getMy() {
      const key = '/shows/my';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getOne(id: string) {
      const key = `/shows/${id}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    getMarkers() {
      const key = '/shows/markers';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    update(id: string, data: any) {
      invalidateCache('/shows/');
      return request(`/shows/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    cancel(id: string) {
      invalidateCache('/shows/');
      return request(`/shows/${id}/cancel`, { method: 'PATCH' });
    },
  },

  tickets: {
    book(showId: string, seatId: string, password?: string) {
      const body: any = { showId, seatId };
      if (password) body.password = password;
      invalidateCache('/tickets/');
      invalidateCache('/shows/');
      return request('/tickets', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    getMy() {
      const key = '/tickets/my';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getByShow(showId: string) {
      return request(`/tickets/show/${showId}`);
    },
    cancel(id: string) {
      invalidateCache('/tickets/');
      return request(`/tickets/${id}/cancel`, { method: 'PATCH' });
    },
    checkIn(id: string) {
      invalidateCache('/tickets/');
      return request(`/tickets/${id}/check-in`, { method: 'PATCH' });
    },
  },

  reviews: {
    create(data: any) {
      invalidateCache('/reviews/');
      return request('/reviews', { method: 'POST', body: JSON.stringify(data) });
    },
    getByHost(hostId: string) {
      const key = `/reviews/host/${hostId}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    getHostRating(hostId: string) {
      const key = `/reviews/host/${hostId}/rating`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    getByShow(showId: string) {
      const key = `/reviews/show/${showId}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
  },

  movieRequests: {
    create(data: any) {
      invalidateCache('/movie-requests');
      return request('/movie-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getByHost() {
      const key = '/movie-requests/host';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    getMy() {
      const key = '/movie-requests/my';
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
    accept(id: string) {
      invalidateCache('/movie-requests');
      return request(`/movie-requests/${id}/accept`, { method: 'PATCH' });
    },
    decline(id: string) {
      invalidateCache('/movie-requests');
      return request(`/movie-requests/${id}/decline`, { method: 'PATCH' });
    },
  },

  snacks: {
    create(data: any) {
      invalidateCache('/snacks/');
      return request('/snacks', { method: 'POST', body: JSON.stringify(data) });
    },
    getByVenue(venueId: string) {
      const key = `/snacks/venue/${venueId}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data, 60_000); return data; });
    },
    update(id: string, data: any) {
      invalidateCache('/snacks/');
      return request(`/snacks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    delete(id: string) {
      invalidateCache('/snacks/');
      return request(`/snacks/${id}`, { method: 'DELETE' });
    },
  },

  location: {
    getMap(lat: number, lng: number, radius?: number) {
      const params = `latitude=${lat}&longitude=${lng}${radius ? `&radius=${radius}` : ''}`;
      const key = `/location/map?${params}`;
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);
      return request(key).then((data) => { setCache(key, data); return data; });
    },
  },
};
