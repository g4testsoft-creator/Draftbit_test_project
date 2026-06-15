import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MapView, Marker, type MapHandle } from '@/components/Map';
import { FIT_EDGE_PADDING, WORLD_REGION } from '@/constants/map';
import { useLocations } from '@/hooks/useLocations';
import { colors } from '@/theme';
import type { Location } from '@/types/location';

import { styles } from './styles';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const state = useLocations();
  const { reload } = state;

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
    if (!mapRef.current || !state.data || state.data.length === 0) return;
    mapRef.current.fitToCoordinates(
      state.data.map((l) => l.coordinates),
      { edgePadding: FIT_EDGE_PADDING, animated: true },
    );
  }, [state.data]);

  const subtitle = useMemo(() => {
    if (!state.data) return '';
    return `${state.data.length} capitals loaded from REST Countries`;
  }, [state.data]);

  if (state.status === 'loading') {
    return <LoadingState label="Loading capitals…" />;
  }

  if (state.status === 'error' && !state.data) {
    return <ErrorState message={state.error.message} onRetry={reload} />;
  }

  const locations = state.data;

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
        {locations?.map((location) => (
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
