// screens/cabs/FWSAirportRide/AnimatedRoute.tsx

import React, { memo, useRef, useEffect } from 'react';
import { MapViewController } from '@googlemaps/react-native-navigation-sdk';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface AnimatedRouteProps {
  coordinates: RouteCoordinate[];
  strokeWidth?: number;
  color?: string;
  visible?: boolean;
  mapViewController?: MapViewController | null;
}

/**
 * Simple Route Component - No animation, just green polyline
 * Uses @googlemaps/react-native-navigation-sdk instead of react-native-maps
 */
const AnimatedRoute: React.FC<AnimatedRouteProps> = memo(
  ({ coordinates, strokeWidth = 5, color = '#16C47F', visible = true, mapViewController }) => {
    const polylineIdRef = useRef<string>('animated-route-polyline');

    useEffect(() => {
      if (!mapViewController) return;
      if (!visible || !coordinates || coordinates.length < 2) {
        // Remove polyline if not visible
        mapViewController.removePolyline(polylineIdRef.current);
        return;
      }

      // Convert coordinates to SDK format
      const points = coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));

      // Add or update polyline
      mapViewController.addPolyline({
        id: polylineIdRef.current,
        points: points,
        color: color,
        width: strokeWidth,
      });

      // Cleanup on unmount
      return () => {
        if (mapViewController) {
          mapViewController.removePolyline(polylineIdRef.current);
        }
      };
    }, [coordinates, strokeWidth, color, visible, mapViewController]);

    // This component no longer renders JSX directly since polyline is controller-based
    return null;
  },
);

AnimatedRoute.displayName = 'AnimatedRoute';

export default AnimatedRoute;