import type { Region } from 'react-native-maps';

export const WORLD_REGION: Region = {
  latitude: 20,
  longitude: 10,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

// Google Maps-style zoom (0 = world, 20 ≈ buildings). `delta = 360 / 2^zoom`.
export const DETAIL_ZOOM = 14;
export const DETAIL_ZOOM_DELTA = 360 / Math.pow(2, DETAIL_ZOOM);

export const FIT_EDGE_PADDING = {
  top: 80,
  right: 60,
  bottom: 160,
  left: 60,
} as const;
