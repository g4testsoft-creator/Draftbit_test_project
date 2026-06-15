import { Text, View } from 'react-native';

import { styles } from './DetailSection.styles';

type Props = {
  title: string;
  body: string;
};

export function DetailSection({ title, body }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}
