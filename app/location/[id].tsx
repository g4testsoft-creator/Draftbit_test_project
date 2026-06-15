import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { DetailSection } from '@/components/DetailSection';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MetaPill } from '@/components/MetaPill';
import { DETAIL_ZOOM_DELTA } from '@/constants/map';
import { useLocation } from '@/hooks/useLocations';
import { colors, radii, spacing, typography } from '@/theme';
import { formatCurrencies, formatPopulation } from '@/utils/format';

/**
 * Narrow the value coming back from `useLocalSearchParams` (which is
 * typed as `string | string[]`) to a single id string.
 */
function useIdParam(): string | undefined {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  return useMemo(() => {
    const raw = params.id;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id]);
}

export default function LocationDetailScreen() {
  const id = useIdParam();
  const state = useLocation(id);
  const { reload } = state;

  if (state.status === 'loading') {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading…' }} />
        <LoadingState label="Loading details…" />
      </>
    );
  }

  // If we have no data to show (either pure error, or "Missing id" on cold
  // start), render the error state. Stale data + a failed background
  // refresh falls through to the normal UI below.
  if (state.data === null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Not found' }} />
        <ErrorState
          title="Couldn't load this location"
          message={state.error.message}
          onRetry={reload}
        />
      </>
    );
  }

  const data = state.data;
  const { details } = data;

  return (
    <>
      <Stack.Screen options={{ title: data.title }} />
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        {data.imageUrl ? (
          <Image
            source={{ uri: data.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={
              details.flagDescription ?? `Flag of ${details.countryName}`
            }
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>{details.countryName}</Text>
          </View>
        )}

        <View style={styles.body}>
          <View>
            <Text style={styles.capitalLabel}>Capital city</Text>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.description}>{data.description}</Text>
          </View>

          <View style={styles.metaRow}>
            <MetaPill label="Latitude" value={data.coordinates.latitude.toFixed(4)} />
            <MetaPill label="Longitude" value={data.coordinates.longitude.toFixed(4)} />
            {details.region ? <MetaPill label="Region" value={details.region} /> : null}
            {details.population != null ? (
              <MetaPill label="Population" value={formatPopulation(details.population)} />
            ) : null}
          </View>

          {details.languages.length > 0 ? (
            <DetailSection title="Languages" body={details.languages.join(', ')} />
          ) : null}

          {details.currencies.length > 0 ? (
            <DetailSection
              title="Currencies"
              body={formatCurrencies(details.currencies)}
            />
          ) : null}

          {details.timezones.length > 0 ? (
            <DetailSection title="Timezones" body={details.timezones.join(' · ')} />
          ) : null}

          {details.flagDescription ? (
            <DetailSection title="About the flag" body={details.flagDescription} />
          ) : null}

          <View style={styles.mapWrap}>
            <MapView
              style={styles.miniMap}
              initialRegion={{
                ...data.coordinates,
                latitudeDelta: DETAIL_ZOOM_DELTA,
                longitudeDelta: DETAIL_ZOOM_DELTA,
              }}
              showsCompass
              showsScale={Platform.OS === 'ios'}
              zoomEnabled
              scrollEnabled
              pitchEnabled
              rotateEnabled
              toolbarEnabled={Platform.OS === 'android'}
            >
              <Marker
                coordinate={data.coordinates}
                title={data.title}
                description={data.description}
                pinColor={colors.pin}
                tracksViewChanges={false}
              />
            </MapView>
          </View>

          {data.sourceUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open this capital in Google Maps"
              onPress={() => {
                if (data.sourceUrl) Linking.openURL(data.sourceUrl);
              }}
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.linkButtonPressed,
              ]}
            >
              <Text style={styles.linkButtonLabel}>Open in Google Maps</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  capitalLabel: {
    ...typography.caption,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...typography.title,
  },
  description: {
    ...typography.caption,
    fontSize: 14,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  mapWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniMap: {
    width: '100%',
    height: 320,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkButtonLabel: {
    ...typography.subtitle,
    color: colors.primary,
  },
});
