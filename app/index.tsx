import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { FIT_EDGE_PADDING, WORLD_REGION } from '@/constants/map';
import { useLocations } from '@/hooks/useLocations';
import { colors, radii, spacing, typography } from '@/theme';
import type { Location } from '@/types/location';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { data, isLoading, error, reload } = useLocations();

  const handlePinPress = useCallback(
    (location: Location) => {
      router.push({
        pathname: '/location/[id]',
        params: { id: location.id },
      });
    },
    [router],
  );

  const fitToMarkers = useCallback(() => {
    if (!mapRef.current || !data || data.length === 0) return;
    mapRef.current.fitToCoordinates(
      data.map((l) => l.coordinates),
      { edgePadding: FIT_EDGE_PADDING, animated: true },
    );
  }, [data]);

  const subtitle = useMemo(() => {
    if (!data) return '';
    return `${data.length} capitals loaded from REST Countries`;
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading capitals…" />;
  }

  if (error || !data) {
    return (
      <ErrorState
        message={error?.message ?? 'Unable to load capitals.'}
        onRetry={reload}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={WORLD_REGION}
        onMapReady={fitToMarkers}
        showsCompass={Platform.OS === 'ios'}
        showsScale={Platform.OS === 'ios'}
      >
        {data.map((location) => (
          <Marker
            key={location.id}
            identifier={location.id}
            coordinate={location.coordinates}
            title={location.title}
            description={location.description}
            pinColor={colors.pin}
            tracksViewChanges={false}
            onCalloutPress={() => handlePinPress(location)}
          />
        ))}
      </MapView>

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerTitle}>World Capitals</Text>
          <Text style={styles.bannerSubtitle}>{subtitle}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recenter on all capitals"
          onPress={fitToMarkers}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Text style={styles.fabLabel}>Recenter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  banner: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bannerTitle: {
    ...typography.subtitle,
  },
  bannerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  fab: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabLabel: {
    ...typography.subtitle,
    color: colors.textInverse,
  },
});
