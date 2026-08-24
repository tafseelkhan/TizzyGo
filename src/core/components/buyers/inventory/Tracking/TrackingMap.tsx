// src/components/tracking/TrackingMap.tsx

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import {
  MapView as GoogleMapView,
  MapViewController,
  MapViewType,
  LatLng,
} from '@googlemaps/react-native-navigation-sdk';

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

  const mapControllerRef = useRef<MapViewController | null>(null);
  const markerIdsRef = useRef<{ seller?: any; buyer?: any; rider?: any }>({});

  useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {
      fitAllMarkers();
    },
  }));

  const fitAllMarkers = () => {
    const coordinates: LatLng[] = [];

    if (sellerLocation && sellerLocation.latitude && sellerLocation.longitude) {
      coordinates.push({
        lat: sellerLocation.latitude,
        lng: sellerLocation.longitude,
      });
    }

    if (buyerLocation && buyerLocation.latitude && buyerLocation.longitude) {
      coordinates.push({
        lat: buyerLocation.latitude,
        lng: buyerLocation.longitude,
      });
    }

    if (isRiderActive && riderLocation) {
      coordinates.push({
        lat: riderLocation.latitude,
        lng: riderLocation.longitude,
      });
    }

    if (coordinates.length > 0 && mapControllerRef.current) {
      const avgLat =
        coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
      const avgLng =
        coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;

      mapControllerRef.current.moveCamera({
        target: { lat: avgLat, lng: avgLng },
        zoom: 13,
      });
    }
  };

  const updateMarkers = async () => {
    const mapController = mapControllerRef.current;
    if (!mapController) return;

    // Clear existing markers
    if (markerIdsRef.current.seller) {
      mapController.removeMarker(markerIdsRef.current.seller);
      markerIdsRef.current.seller = undefined;
    }
    if (markerIdsRef.current.buyer) {
      mapController.removeMarker(markerIdsRef.current.buyer);
      markerIdsRef.current.buyer = undefined;
    }
    if (markerIdsRef.current.rider) {
      mapController.removeMarker(markerIdsRef.current.rider);
      markerIdsRef.current.rider = undefined;
    }

    // Add seller marker
    if (sellerLocation && sellerLocation.latitude && sellerLocation.longitude) {
      const markerId = await mapController.addMarker({
        id: 'seller-marker',
        position: {
          lat: sellerLocation.latitude,
          lng: sellerLocation.longitude,
        },
        title: 'Seller',
        snippet: sellerLocation.address || 'Seller Location',
        alpha: 1,
      });
      markerIdsRef.current.seller = markerId;
    }

    // Add buyer marker
    if (buyerLocation && buyerLocation.latitude && buyerLocation.longitude) {
      const markerId = await mapController.addMarker({
        id: 'buyer-marker',
        position: { lat: buyerLocation.latitude, lng: buyerLocation.longitude },
        title: 'Your Location',
        snippet: buyerLocation.address || 'Buyer Location',
        alpha: 1,
      });
      markerIdsRef.current.buyer = markerId;
    }

    // Add rider marker
    if (isRiderActive && riderLocation) {
      const markerId = await mapController.addMarker({
        id: 'rider-marker',
        position: { lat: riderLocation.latitude, lng: riderLocation.longitude },
        title: 'Rider',
        snippet: 'Rider is on the way',
        alpha: 1,
      });
      markerIdsRef.current.rider = markerId;
    }
  };

  const updatePolyline = async () => {
    const mapController = mapControllerRef.current;
    if (!mapController) return;

    // Clear existing polylines (we'll use a fixed ID)
    mapController.removePolyline('tracking-polyline');

    const points = [];

    if (isRiderActive && riderLocation && buyerLocation) {
      if (
        riderLocation.latitude &&
        riderLocation.longitude &&
        buyerLocation.latitude &&
        buyerLocation.longitude
      ) {
        points.push({
          lat: riderLocation.latitude,
          lng: riderLocation.longitude,
        });
        points.push({
          lat: buyerLocation.latitude,
          lng: buyerLocation.longitude,
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
          lat: sellerLocation.latitude,
          lng: sellerLocation.longitude,
        });
        points.push({
          lat: buyerLocation.latitude,
          lng: buyerLocation.longitude,
        });
      }
    }

    if (points.length > 0) {
      await mapController.addPolyline({
        id: 'tracking-polyline',
        points: points,
        color: COLORS.primary,
        width: 3,
      });
    }
  };

  // Update markers and polyline when map is ready
  const onMapViewControllerCreated = (mapViewController: MapViewController) => {
    mapControllerRef.current = mapViewController;
    setTimeout(() => {
      updateMarkers();
      updatePolyline();
      setTimeout(() => fitAllMarkers(), 500);
    }, 100);
  };

  // Update when props change
  useEffect(() => {
    if (mapControllerRef.current) {
      updateMarkers();
      updatePolyline();
      fitAllMarkers();
    }
  }, [sellerLocation, buyerLocation, riderLocation, isRiderActive]);

  const initialLat =
    sellerLocation?.latitude || buyerLocation?.latitude || 28.6139;
  const initialLng =
    sellerLocation?.longitude || buyerLocation?.longitude || 77.209;

  return (
    <View style={styles.container}>
      <GoogleMapView
        style={styles.map}
        initialCameraPosition={{
          target: {
            lat: initialLat,
            lng: initialLng,
          },
          zoom: 13,
        }}
        mapType={MapViewType.MAP}
        scrollGesturesEnabled={true}
        zoomGesturesEnabled={true}
        rotateGesturesEnabled={true}
        tiltGesturesEnabled={true}
        myLocationEnabled={false}
        myLocationButtonEnabled={false}
        compassEnabled={false}
        trafficEnabled={false}
        indoorEnabled={false}
        buildingsEnabled={false}
        onMapViewControllerCreated={onMapViewControllerCreated}
      />

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