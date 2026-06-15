import { Stack } from 'expo-router';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MapView, Marker } from '@/components/Map';
import { MetaPill } from '@/components/MetaPill';
import { DETAIL_ZOOM_DELTA } from '@/constants/map';
import { useIdParam } from '@/hooks/useIdParam';
import { useLocation } from '@/hooks/useLocations';
import { colors } from '@/theme';
import { formatCurrencies, formatPopulation } from '@/utils/format';

import { styles } from './styles';

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
