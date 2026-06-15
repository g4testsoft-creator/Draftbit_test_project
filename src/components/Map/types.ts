import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Region = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type EdgePadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FitOptions = {
  edgePadding?: EdgePadding;
  animated?: boolean;
};

export interface MapHandle {
  fitToCoordinates: (coordinates: Coordinates[], options?: FitOptions) => void;
}

export type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: Region;
  onMapReady?: () => void;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsUserLocation?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  toolbarEnabled?: boolean;
  children?: ReactNode;
};

export type MarkerProps = {
  identifier?: string;
  coordinate: Coordinates;
  title?: string;
  description?: string;
  pinColor?: string;
  tracksViewChanges?: boolean;
  onPress?: () => void;
  onCalloutPress?: () => void;
};
