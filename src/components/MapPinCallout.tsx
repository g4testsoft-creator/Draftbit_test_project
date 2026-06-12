import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

import { colors, spacing, typography } from '@/theme';
import type { Location } from '@/types/location';

type Props = {
  location: Location;
  onPress: (location: Location) => void;
};

/**
 * One marker + callout for the world map.
 *
 * Wrapped in `React.memo` because we render ~250 of these. Without
 * memoization, every state change in the parent (e.g. a reload counter
 * bump) re-creates every marker. The callback is stabilized at the
 * parent level so this component's props only change when the
 * underlying `Location` changes.
 */
export const MapPinCallout = memo(function MapPinCallout({ location, onPress }: Props) {
  const handlePress = useCallback(() => onPress(location), [location, onPress]);

  return (
    <Marker
      identifier={location.id}
      coordinate={location.coordinates}
      pinColor={colors.pin}
      tracksViewChanges={false}
    >
      <Callout tooltip={false} onPress={handlePress}>
        <View style={styles.callout}>
          <Text style={styles.title} numberOfLines={1}>
            {location.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {location.description}
          </Text>
          <Text style={styles.link}>View details ›</Text>
        </View>
      </Callout>
    </Marker>
  );
});

const styles = StyleSheet.create({
  callout: {
    width: 260,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
