import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/theme';

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

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
  },
  body: {
    ...typography.body,
  },
});
