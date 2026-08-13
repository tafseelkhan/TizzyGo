// ============================================================
// hooks/useOrderTracking.ts
// ============================================================
// UPDATED TO HANDLE trackingCreated = false WITH FULL ORDER

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrderTrackingData,
  getCachedTrackingData,
  updateTrackingCache,
  OrderTrackingData,
} from '../../api/features/private/orderTrackingPrivateSlice';
import {
  connectOrderTrackingSocket,
  joinOrderTracking,
  leaveOrderTracking,
  onTrackingUpdate,
  onTrackingError,
  onTrackingCompleted,
  offAllOrderTrackingEvents,
  cleanupOrderTracking,
  isOrderTrackingSocketConnected,
} from '../utils/socket/socketOrderTracking';

interface UseOrderTrackingReturn {
  isLoading: boolean;
  error: string | null;
  trackingData: OrderTrackingData | null;
  isConnected: boolean;
  isCompleted: boolean;
  isTrackingCreated: boolean;
  order: OrderTrackingData['order'] | null; // ✅ FULL ORDER OBJECT
  reconnect: () => void;
  reconnectAttempts: number;
}

export const useOrderTracking = (orderId: string): UseOrderTrackingReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTrackingCreated, setIsTrackingCreated] = useState(false);
  const [order, setOrder] = useState<OrderTrackingData['order'] | null>(null);

  const isMounted = useRef(true);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cached = getCachedTrackingData();
      if (cached) {
        setTrackingData(cached);
        setOrder(cached.order || null);
        setIsTrackingCreated(cached.trackingCreated);
        if (cached.isDelivered) {
          setIsCompleted(true);
        }
        setIsLoading(false);
        return;
      }

      const response = await getOrderTrackingData(orderId);

      if (response.success && response.data) {
        setTrackingData(response.data);
        setOrder(response.data.order || null);
        updateTrackingCache(response.data);
        setIsTrackingCreated(response.data.trackingCreated);

        if (response.data.isDelivered) {
          setIsCompleted(true);
        }

        // ✅ If tracking is created, setup socket
        if (response.data.trackingCreated) {
          setupSocket();
        }
      } else {
        setError(response.error || 'Failed to fetch tracking data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [orderId]);

  const setupSocket = useCallback(async () => {
    try {
      await connectOrderTrackingSocket();
      joinOrderTracking(orderId);

      onTrackingUpdate((data: OrderTrackingData) => {
        if (isMounted.current) {
          setTrackingData(data);
          setOrder(data.order || null);
          updateTrackingCache(data);
          setIsTrackingCreated(data.trackingCreated);

          if (data.isDelivered) {
            setIsCompleted(true);
          }
        }
      });

      onTrackingCompleted(() => {
        if (isMounted.current) {
          setIsCompleted(true);
        }
      });

      onTrackingError((data: { message: string }) => {
        if (isMounted.current) {
          setError(data.message);
        }
      });

      setIsConnected(true);
    } catch (err) {
      console.error('❌ Socket setup failed:', err);
      setError('Failed to connect to live tracking');
    }
  }, [orderId]);

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setError('Maximum reconnect attempts reached');
      return;
    }

    reconnectAttempts.current += 1;
    cleanupOrderTracking();
    setupSocket();
  }, [setupSocket]);

  useEffect(() => {
    if (!orderId) return;

    fetchInitialData();

    return () => {
      isMounted.current = false;
      cleanupOrderTracking();
    };
  }, [orderId, fetchInitialData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const connected = isOrderTrackingSocketConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isLoading,
    error,
    trackingData,
    isConnected,
    isCompleted,
    isTrackingCreated,
    order, // ✅ FULL ORDER OBJECT AVAILABLE
    reconnect,
    reconnectAttempts: reconnectAttempts.current,
  };
};

export default useOrderTracking;
