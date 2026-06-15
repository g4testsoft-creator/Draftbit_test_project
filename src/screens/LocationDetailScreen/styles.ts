import { StyleSheet } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
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
