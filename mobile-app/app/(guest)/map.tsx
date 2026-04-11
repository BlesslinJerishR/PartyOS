import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { api } from '../../services/api';
import { useTheme } from '../../context/AuthContext';
import { Fonts } from '../../constants/Fonts';
import { MapData, Venue } from '../../types';

export default function MapScreen() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useTheme();

  const loadMapData = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 12.9716;
      let lng = 77.5946;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      setUserLat(lat);
      setUserLng(lng);

      const [markersResult, venueResult] = await Promise.all([
        api.shows.getMarkers() as Promise<MapData>,
        api.venues.getNearby(lat, lng) as Promise<Venue[]>,
      ]);

      setMapData(markersResult);
      setVenues(venueResult);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  if (loading || userLat === null || userLng === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>Loading map...</Text>
      </View>
    );
  }

  const nowPlayingJson = useMemo(() => JSON.stringify(mapData?.nowPlaying || []), [mapData?.nowPlaying]);
  const upcomingJson = useMemo(() => JSON.stringify(mapData?.upcoming || []), [mapData?.upcoming]);
  const venuesJson = useMemo(() => JSON.stringify(venues), [venues]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png';

  const mapHtml = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-tile-pane {
      filter: grayscale(100%) ${isDark ? 'brightness(0.7) contrast(1.3)' : 'brightness(1.1) contrast(1.1)'};
    }
    .leaflet-control-zoom a {
      background: ${isDark ? '#1d1e21' : '#FFFFFF'} !important;
      color: ${isDark ? '#fff' : '#1d1e21'} !important;
      border: 1px solid ${isDark ? '#333' : '#ccc'} !important;
    }
    .leaflet-control-attribution { display: none !important; }
    .marker-popup {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      min-width: 160px;
    }
    .marker-popup h3 {
      font-size: 13px;
      font-weight: 600;
      color: ${isDark ? '#fff' : '#1d1e21'};
      margin-bottom: 4px;
    }
    .marker-popup p {
      font-size: 11px;
      color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(29,30,33,0.6)'};
      margin: 2px 0;
    }
    .marker-popup .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      margin-top: 4px;
    }
    .badge-live { background: rgba(255,0,79,0.15); color: #FF004F; }
    .badge-upcoming { background: rgba(255,0,79,0.1); color: #FF004F; }
    .badge-venue { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; color: ${isDark ? '#ccc' : '#555'}; }
    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#27282c' : '#FFFFFF'} !important;
      border-radius: 10px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
    }
    .leaflet-popup-tip { background: ${isDark ? '#27282c' : '#FFFFFF'} !important; }
    .legend-box {
      background: ${isDark ? '#27282c' : '#FFFFFF'};
      border-radius: 8px;
      padding: 8px 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .legend-item { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { font-size: 10px; color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}; font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${userLat}, ${userLng}],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      tileSize: 256,
      detectRetina: true,
    }).addTo(map);

    // User location marker
    var userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="width:16px;height:16px;background:#FF004F;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(255,0,79,0.6);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="marker-popup"><h3>You are here</h3></div>');

    // Venue icon (white/gray)
    function venueIcon() {
      return L.divIcon({
        className: 'venue-marker',
        html: '<div style="width:12px;height:12px;background:${isDark ? '#FFFFFF' : '#1d1e21'};border-radius:50%;border:2px solid ${isDark ? '#666' : '#aaa'};box-shadow:0 0 6px rgba(0,0,0,0.2);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }

    // Now playing icon (pulsing red)
    function nowPlayingIcon() {
      return L.divIcon({
        className: 'live-marker',
        html: '<div style="width:14px;height:14px;background:#FF004F;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px rgba(255,0,79,0.5);animation:pulse 1.5s infinite;"></div><style>@keyframes pulse{0%,100%{box-shadow:0 0 4px rgba(255,0,79,0.4)}50%{box-shadow:0 0 12px rgba(255,0,79,0.8)}}</style>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
    }

    // Upcoming icon (outlined red)
    function upcomingIcon() {
      return L.divIcon({
        className: 'upcoming-marker',
        html: '<div style="width:12px;height:12px;background:transparent;border-radius:50%;border:2.5px solid #FF004F;box-shadow:0 0 6px rgba(255,0,79,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }

    // Render venue markers
    var venueData = ${venuesJson};
    var showVenueIds = new Set();

    var nowPlaying = ${nowPlayingJson};
    var upcoming = ${upcomingJson};

    // Collect venue IDs that have active shows
    nowPlaying.forEach(function(s) { if (s.venue) showVenueIds.add(s.venue.id); });
    upcoming.forEach(function(s) { if (s.venue) showVenueIds.add(s.venue.id); });

    // Render venues without active shows
    venueData.forEach(function(v) {
      if (showVenueIds.has(v.id)) return;
      var popup = '<div class="marker-popup">' +
        '<h3>' + v.name + '</h3>' +
        '<p>' + (v.address || '') + '</p>' +
        '<span class="badge badge-venue">Venue</span>' +
        '</div>';
      L.marker([v.latitude, v.longitude], { icon: venueIcon() })
        .addTo(map)
        .bindPopup(popup);
    });

    // Render now playing markers
    nowPlaying.forEach(function(s) {
      if (!s.venue) return;
      var startTime = new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      var endTime = new Date(s.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      var popup = '<div class="marker-popup">' +
        '<h3>' + s.movieTitle + '</h3>' +
        '<p>' + (s.venue.name || '') + '</p>' +
        '<p>' + startTime + ' - ' + endTime + '</p>' +
        '<p>' + (s.isFree ? 'Free Entry' : s.price) + '</p>' +
        '<span class="badge badge-live">LIVE NOW</span>' +
        '</div>';
      L.marker([s.venue.latitude, s.venue.longitude], { icon: nowPlayingIcon() })
        .addTo(map)
        .bindPopup(popup);
    });

    // Render upcoming markers
    upcoming.forEach(function(s) {
      if (!s.venue) return;
      var date = new Date(s.startTime).toLocaleDateString();
      var startTime = new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      var popup = '<div class="marker-popup">' +
        '<h3>' + s.movieTitle + '</h3>' +
        '<p>' + (s.venue.name || '') + '</p>' +
        '<p>' + date + ' at ' + startTime + '</p>' +
        '<p>' + (s.isFree ? 'Free Entry' : s.price) + '</p>' +
        '<span class="badge badge-upcoming">UPCOMING</span>' +
        '</div>';
      L.marker([s.venue.latitude, s.venue.longitude], { icon: upcomingIcon() })
        .addTo(map)
        .bindPopup(popup);
    });

    // Legend
    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function() {
      var div = L.DomUtil.create('div', 'legend-box');
      div.innerHTML = '<div class="legend-item"><div class="legend-dot" style="background:#FF004F;box-shadow:0 0 4px rgba(255,0,79,0.5);"></div><span class="legend-label">Now Playing</span></div>' +
        '<div class="legend-item"><div class="legend-dot" style="background:transparent;border:2.5px solid #FF004F;"></div><span class="legend-label">Upcoming</span></div>' +
        '<div class="legend-item"><div class="legend-dot" style="background:${isDark ? '#FFFFFF' : '#1d1e21'};border:2px solid ${isDark ? '#666' : '#aaa'};"></div><span class="legend-label">Venues</span></div>' +
        '<div class="legend-item"><div class="legend-dot" style="background:#FF004F;border:3px solid #fff;"></div><span class="legend-label">You</span></div>';
      return div;
    };
    legend.addTo(map);
  </script>
</body>
</html>`, [userLat, userLng, isDark, colors, tileUrl, nowPlayingJson, upcomingJson, venuesJson]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});
