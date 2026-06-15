import { forwardRef, useImperativeHandle, useRef } from 'react';
import RNMapView, { Marker as RNMarker } from 'react-native-maps';

import type { MapHandle, MapViewProps, MarkerProps } from './types';

export type {
  Coordinates,
  Region,
  EdgePadding,
  FitOptions,
  MapHandle,
  MapViewProps,
  MarkerProps,
} from './types';

export const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(props, ref) {
  const innerRef = useRef<RNMapView>(null);
  useImperativeHandle(
    ref,
    () => ({
      fitToCoordinates: (coords, options) => {
        if (coords.length === 0) return;
        innerRef.current?.fitToCoordinates(coords, {
          edgePadding: options?.edgePadding ?? {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
          animated: options?.animated ?? true,
        });
      },
    }),
    [],
  );
  return <RNMapView ref={innerRef} {...props} />;
});

export function Marker(props: MarkerProps) {
  return <RNMarker {...props} />;
}
