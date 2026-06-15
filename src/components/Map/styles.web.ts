import type { CSSProperties } from 'react';

import { colors } from '@/theme';

export const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
};

export const popupDescriptionStyle: CSSProperties = {
  marginTop: 4,
};

export const popupLinkStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  color: colors.primary,
  fontWeight: 600,
};
