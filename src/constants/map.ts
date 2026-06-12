import type { Region } from 'react-native-maps';

/**
 * Map-related constants live in one place so screen files stay focused
 * on layout/UX. Edit here to retune the camera defaults.
 */

/** Region the world map opens to before pins arrive. */
export const WORLD_REGION: Region = {
  latitude: 20,
  longitude: 10,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

/** Google Maps-style zoom level (0 = world, 14 ≈ street grid, 20 ≈ buildings). */
export const DETAIL_ZOOM = 14;

/**
 * MapView consumes a `latitudeDelta` / `longitudeDelta`, not a zoom
 * level. The standard conversion is `delta = 360 / 2^zoom`.
 */
export const DETAIL_ZOOM_DELTA = 360 / Math.pow(2, DETAIL_ZOOM);

/** Edge padding used when calling `fitToCoordinates` on the world map. */
export const FIT_EDGE_PADDING = {
  top: 80,
  right: 60,
  bottom: 160,
  left: 60,
} as const;
