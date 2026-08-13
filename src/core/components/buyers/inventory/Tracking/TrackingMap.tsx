// src/components/tracking/TrackingMap.tsx

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#22C55E',
  accent: '#16A34A',
  text: '#111827',
  secondary: '#6B7280',
};

interface AddressInfo {
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
}

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface TrackingMapProps {
  sellerLocation?: AddressInfo;
  buyerLocation?: AddressInfo;
  riderLocation?: Location;
  isRiderActive: boolean;
  distance?: number;
  eta?: number;
}

export const TrackingMap = forwardRef((props: TrackingMapProps, ref) => {
  const {
    sellerLocation,
    buyerLocation,
    riderLocation,
    isRiderActive,
    distance,
    eta,
  } = props;

  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {
      fitAllMarkers();
    },
  }));

  const fitAllMarkers = () => {
    const coordinates: any[] = [];

    if (sellerLocation && sellerLocation.latitude && sellerLocation.longitude) {
      coordinates.push({
        latitude: sellerLocation.latitude,
        longitude: sellerLocation.longitude,
      });
    }

    if (buyerLocation && buyerLocation.latitude && buyerLocation.longitude) {
      coordinates.push({
        latitude: buyerLocation.latitude,
        longitude: buyerLocation.longitude,
      });
    }

    if (isRiderActive && riderLocation) {
      coordinates.push({
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
      });
    }

    if (coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    fitAllMarkers();
  }, [sellerLocation, buyerLocation, riderLocation, isRiderActive]);

  const getPolyline = () => {
    const points = [];

    if (isRiderActive && riderLocation && buyerLocation) {
      if (
        riderLocation.latitude &&
        riderLocation.longitude &&
        buyerLocation.latitude &&
        buyerLocation.longitude
      ) {
        points.push({
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
        });
        points.push({
          latitude: buyerLocation.latitude,
          longitude: buyerLocation.longitude,
        });
      }
    } else if (sellerLocation && buyerLocation) {
      if (
        sellerLocation.latitude &&
        sellerLocation.longitude &&
        buyerLocation.latitude &&
        buyerLocation.longitude
      ) {
        points.push({
          latitude: sellerLocation.latitude,
          longitude: sellerLocation.longitude,
        });
        points.push({
          latitude: buyerLocation.latitude,
          longitude: buyerLocation.longitude,
        });
      }
    }

    return points;
  };

  const initialLat =
    sellerLocation?.latitude || buyerLocation?.latitude || 28.6139;
  const initialLng =
    sellerLocation?.longitude || buyerLocation?.longitude || 77.209;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={false}
        showsIndoors={false}
        zoomEnabled
        scrollEnabled
        rotateEnabled
      >
        {sellerLocation &&
          sellerLocation.latitude &&
          sellerLocation.longitude && (
            <Marker
              coordinate={{
                latitude: sellerLocation.latitude,
                longitude: sellerLocation.longitude,
              }}
              title="Seller"
              pinColor={COLORS.primary}
            />
          )}

        {buyerLocation && buyerLocation.latitude && buyerLocation.longitude && (
          <Marker
            coordinate={{
              latitude: buyerLocation.latitude,
              longitude: buyerLocation.longitude,
            }}
            title="Your Location"
            pinColor={COLORS.text}
          />
        )}

        {isRiderActive && riderLocation && (
          <Marker
            coordinate={{
              latitude: riderLocation.latitude,
              longitude: riderLocation.longitude,
            }}
            title="Rider"
            pinColor={COLORS.accent}
          />
        )}

        {getPolyline().length > 0 && (
          <Polyline
            coordinates={getPolyline()}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {(distance || eta) && (
        <View style={styles.infoOverlay}>
          {distance && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{distance.toFixed(1)} km</Text>
            </View>
          )}
          {eta && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.infoValue}>{eta} min</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

TrackingMap.displayName = 'TrackingMap';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  map: {
    width: '100%',
    height: 250,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
});

export default TrackingMap;
