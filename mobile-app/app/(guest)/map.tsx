import { useState, useEffect, useCallback } from 'react';
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
import Colors from '../../constants/Colors';
import { MapMarker } from '../../types';

export default function MapScreen() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

      const data = (await api.shows.getMarkers()) as MapMarker[];
      setMarkers(data);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const markersJson = JSON.stringify(markers);

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-tile-pane { filter: grayscale(100%) invert(100%) contrast(1.2) brightness(0.96); }
    .leaflet-control-zoom a {
      background: #1a1a2e !important;
      color: #fff !important;
      border: 1px solid #333 !important;
    }
    .leaflet-control-attribution { display: none !important; }
    .marker-popup {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .marker-popup h3 {
      font-size: 14px;
      font-weight: 600;
      color: #2D3436;
      margin-bottom: 4px;
    }
    .marker-popup p {
      font-size: 12px;
      color: #636E72;
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
    .badge-live {
      background: #FFE8E3;
      color: #E17055;
    }
    .badge-upcoming {
      background: #E3F2FD;
      color: #0984E3;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${userLat}, ${userLng}],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    var userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="width:14px;height:14px;background:#6C5CE7;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(108,92,231,0.6);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([${userLat}, ${userLng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="marker-popup"><h3>You are here</h3></div>');

    var markers = ${markersJson};

    function createIcon(status) {
      var color = status === 'NOW_PLAYING' ? '#E17055' : '#0984E3';
      return L.divIcon({
        className: 'show-marker',
        html: '<div style="width:12px;height:12px;background:' + color + ';border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }

    markers.forEach(function(m) {
      var badgeClass = m.status === 'NOW_PLAYING' ? 'badge-live' : 'badge-upcoming';
      var statusText = m.status === 'NOW_PLAYING' ? 'LIVE' : 'UPCOMING';
      var startTime = new Date(m.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      var popup = '<div class="marker-popup">' +
        '<h3>' + m.movieTitle + '</h3>' +
        '<p>' + (m.venueName || '') + '</p>' +
        '<p>' + startTime + '</p>' +
        '<span class="badge ' + badgeClass + '">' + statusText + '</span>' +
        '</div>';

      L.marker([m.latitude, m.longitude], { icon: createIcon(m.status) })
        .addTo(map)
        .bindPopup(popup);
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
