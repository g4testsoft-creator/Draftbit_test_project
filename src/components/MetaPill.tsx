import { Text, View } from 'react-native';

import { styles } from './MetaPill.styles';

type Props = {
  label: string;
  value: string;
};

export function MetaPill({ label, value }: Props) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
