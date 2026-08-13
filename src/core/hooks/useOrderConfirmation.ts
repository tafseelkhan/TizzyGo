// ============================================================
// hooks/useOrderConfirmation.ts - FIXED
// ============================================================
// ✅ REMOVED: Countdown timer
// ✅ REMOVED: Auto-redirect logic
// ✅ KEPT: Polling for ONLINE only

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrderConfirmation,
  OrderConfirmationResponse,
  ConfirmationStatus,
  PaymentMethod,
} from '../../api/features/private/orderConfirmationPrivateSlice';

export interface UseOrderConfirmationResult {
  loading: boolean;
  refreshing: boolean;
  confirmation: OrderConfirmationResponse | null;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  stopPolling: () => void;
  startPolling: () => void;
}

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

export const useOrderConfirmation = (
  checkoutSessionId: string,
  options: {
    pollInterval?: number;
    autoPoll?: boolean;
  } = {},
): UseOrderConfirmationResult => {
  const { pollInterval = DEFAULT_POLL_INTERVAL, autoPoll = true } = options;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [confirmation, setConfirmation] =
    useState<OrderConfirmationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isPollingRef = useRef<boolean>(false);

  const fetchConfirmation = useCallback(
    async (showLoading: boolean = true): Promise<void> => {
      if (!checkoutSessionId) {
        setError('Checkout session ID is required');
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        console.log('📋 Fetching order confirmation...');
        const data = await getOrderConfirmation(checkoutSessionId);

        if (!isMountedRef.current) return;

        setConfirmation(data);
        setError(null);

        // ✅ Handle polling based on status AND payment method
        const status = data.confirmationStatus;
        const paymentMethod = data.paymentMethod;

        // ✅ COD: Never poll
        if (paymentMethod === 'COD') {
          console.log('💰 COD: No polling needed');
          stopPolling();
          return;
        }

        // ✅ ONLINE: Poll only if PENDING
        if (
          autoPoll &&
          status === ConfirmationStatus.PENDING &&
          !isPollingRef.current
        ) {
          startPolling();
        } else if (
          status !== ConfirmationStatus.PENDING &&
          isPollingRef.current
        ) {
          stopPolling();
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err.message || 'Failed to fetch confirmation');
        stopPolling();
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [checkoutSessionId, autoPoll],
  );

  const startPolling = useCallback((): void => {
    if (isPollingRef.current || !autoPoll) return;

    console.log('🔄 Starting polling...');
    isPollingRef.current = true;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    pollingRef.current = setInterval(() => {
      if (isMountedRef.current && isPollingRef.current) {
        fetchConfirmation(false);
      }
    }, pollInterval);
  }, [fetchConfirmation, pollInterval, autoPoll]);

  const stopPolling = useCallback((): void => {
    console.log('⏹️ Stopping polling...');
    isPollingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchConfirmation(false);
  }, [fetchConfirmation]);

  const retry = useCallback(async (): Promise<void> => {
    stopPolling();
    await fetchConfirmation(true);
  }, [fetchConfirmation, stopPolling]);

  // ✅ Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    if (checkoutSessionId) {
      fetchConfirmation(true);
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [checkoutSessionId, fetchConfirmation, stopPolling]);

  return {
    loading,
    refreshing,
    confirmation,
    error,
    refresh,
    retry,
    stopPolling,
    startPolling,
  };
};
