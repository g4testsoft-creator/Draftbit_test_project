import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import {
  MapContainer,
  Marker as LeafletMarker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

import { colors } from '@/theme';

import { mapContainerStyle, popupDescriptionStyle, popupLinkStyle } from './styles.web';
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

function makePinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5.5" fill="white"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -34],
  });
}

type ImperativeBridgeProps = {
  handleRef: React.MutableRefObject<MapHandle | null>;
  onReady?: () => void;
};

// `useMap` only resolves inside a <MapContainer>, so we expose the
// imperative API via a child component that the parent's ref points at.
function ImperativeBridge({ handleRef, onReady }: ImperativeBridgeProps) {
  const map = useMap();
  useEffect(() => {
    handleRef.current = {
      fitToCoordinates: (coords, options) => {
        if (coords.length === 0) return;
        const bounds = L.latLngBounds(
          coords.map((c) => [c.latitude, c.longitude] as L.LatLngTuple),
        );
        const padding = options?.edgePadding;
        map.fitBounds(
          bounds,
          padding
            ? {
                paddingTopLeft: L.point(padding.left, padding.top),
                paddingBottomRight: L.point(padding.right, padding.bottom),
                animate: options?.animated ?? false,
              }
            : { animate: options?.animated ?? false },
        );
      },
    };
    onReady?.();
    return () => {
      handleRef.current = null;
    };
  }, [map, handleRef, onReady]);
  return null;
}

export const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  { initialRegion, onMapReady, children, style, zoomEnabled, scrollEnabled },
  ref,
) {
  const handleRef = useRef<MapHandle | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      fitToCoordinates: (coords, options) =>
        handleRef.current?.fitToCoordinates(coords, options),
    }),
    [],
  );

  // delta = 360 / 2^zoom  →  zoom = log2(360 / delta)
  const zoom = useMemo(() => {
    const delta = Math.max(initialRegion.latitudeDelta, initialRegion.longitudeDelta);
    return Math.max(1, Math.min(20, Math.round(Math.log2(360 / delta))));
  }, [initialRegion.latitudeDelta, initialRegion.longitudeDelta]);

  return (
    <View style={style}>
      <MapContainer
        center={[initialRegion.latitude, initialRegion.longitude]}
        zoom={zoom}
        style={mapContainerStyle}
        zoomControl
        scrollWheelZoom={zoomEnabled ?? true}
        dragging={scrollEnabled ?? true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ImperativeBridge handleRef={handleRef} onReady={onMapReady} />
        {children}
      </MapContainer>
    </View>
  );
});

export function Marker({
  coordinate,
  title,
  description,
  pinColor = colors.pin,
  onCalloutPress,
  onPress,
}: MarkerProps) {
  const icon = useMemo(() => makePinIcon(pinColor), [pinColor]);
  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      icon={icon}
      eventHandlers={onPress ? { click: onPress } : undefined}
    >
      {title || description ? (
        <Popup>
          {title ? <strong>{title}</strong> : null}
          {description ? <div style={popupDescriptionStyle}>{description}</div> : null}
          {onCalloutPress ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCalloutPress();
              }}
              style={popupLinkStyle}
            >
              View details ›
            </a>
          ) : null}
        </Popup>
      ) : null}
    </LeafletMarker>
  );
}
