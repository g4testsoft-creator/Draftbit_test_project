import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/theme';

import { styles } from './LoadingState.styles';

type Props = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: Props) {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
