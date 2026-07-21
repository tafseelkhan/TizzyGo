// screens/cabs/FWSLocalRide/AnimatedRoute.tsx

import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface AnimatedRouteProps {
  coordinates: RouteCoordinate[];
  strokeWidth?: number;
  color?: string;
  visible?: boolean;
}

/**
 * Simple Route Component - No animation, just green polyline
 */
const AnimatedRoute: React.FC<AnimatedRouteProps> = memo(
  ({ coordinates, strokeWidth = 5, color = '#16C47F', visible = true }) => {
    if (!visible || !coordinates || coordinates.length < 2) {
      return null;
    }

    return (
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        tappable={false}
      />
    );
  },
);

AnimatedRoute.displayName = 'AnimatedRoute';

export default AnimatedRoute;
