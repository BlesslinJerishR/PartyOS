import Constants from 'expo-constants';
import { storage } from './storage';

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) || 'http://localhost:3000/api';

async function getHeaders(): Promise<Record<string, string>> {
  const token = await storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
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
    book(showId: string, seatId: string) {
      return request('/tickets', {
        method: 'POST',
        body: JSON.stringify({ showId, seatId }),
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
