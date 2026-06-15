import { StyleSheet } from 'react-native';

import { spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
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
