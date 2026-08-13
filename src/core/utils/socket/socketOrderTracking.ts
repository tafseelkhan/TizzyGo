// ============================================================
// utils/socket/socketOrderTracking.ts
// ============================================================
// SOCKET.IO - Live tracking updates

import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../api/connections/snippet/apiBaseUrl';
import { getToken } from '../../../api/connections/token/tokenSlice';

let socket: Socket | null = null;
let isConnecting = false;
let isConnected = false;

// Store event listeners for reconnection
const eventListeners: Map<string, Set<(data: any) => void>> = new Map();

// ============================================================
// CONNECTION
// ============================================================

export const connectOrderTrackingSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }

  if (isConnecting) {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (socket && socket.connected) {
          clearInterval(checkInterval);
          resolve(socket);
        }
      }, 300);
    });
  }

  isConnecting = true;
  const token = await getToken();

  socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    isConnecting = false;
    isConnected = true;

    // Re-register all events on reconnect
    if (eventListeners.size > 0) {
      eventListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket?.on(event, callback);
        });
      });
    }
  });

  socket.on('disconnect', () => {
    isConnecting = false;
    isConnected = false;
  });

  socket.on('connect_error', error => {
    console.error('❌ Socket error:', error.message);
    isConnecting = false;
  });

  return socket;
};

export const getOrderTrackingSocket = (): Socket | null => socket;

export const disconnectOrderTrackingSocket = (): void => {
  if (socket) {
    if (socket.connected) {
      socket.emit('tracking:leave');
    }
    socket.disconnect();
    socket = null;
    isConnecting = false;
    isConnected = false;
    eventListeners.clear();
  }
};

// ============================================================
// EMIT EVENTS
// ============================================================

export const emitOrderTrackingEvent = (event: string, data: any): void => {
  if (!socket || !socket.connected) {
    connectOrderTrackingSocket().then(() => {
      if (socket && socket.connected) {
        socket.emit(event, data);
      }
    });
    return;
  }
  socket.emit(event, data);
};

// ============================================================
// ON EVENTS (With persistence)
// ============================================================

export const onOrderTrackingEvent = (
  event: string,
  callback: (data: any) => void,
): void => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)?.add(callback);

  if (socket && socket.connected) {
    socket.on(event, callback);
  } else {
    connectOrderTrackingSocket().then(() => {
      if (socket && socket.connected) {
        socket.on(event, callback);
      }
    });
  }
};

export const offOrderTrackingEvent = (
  event: string,
  callback?: (data: any) => void,
): void => {
  if (callback) {
    eventListeners.get(event)?.delete(callback);
  } else {
    eventListeners.delete(event);
  }

  if (socket) {
    socket.off(event, callback);
  }
};

// ============================================================
// ORDER TRACKING EVENTS
// ============================================================

export const joinOrderTracking = (orderId: string): void => {
  emitOrderTrackingEvent('tracking:join', { orderId });
};

export const leaveOrderTracking = (): void => {
  emitOrderTrackingEvent('tracking:leave', {});
};

export const reconnectOrderTracking = (orderId: string): void => {
  emitOrderTrackingEvent('tracking:reconnect', { orderId });
};

// Server to Client Events
export const onTrackingConnected = (callback: (data: any) => void): void => {
  onOrderTrackingEvent('tracking:connected', callback);
};

export const onTrackingUpdate = (callback: (data: any) => void): void => {
  onOrderTrackingEvent('tracking:update', callback);
};

export const onTrackingStatusChanged = (
  callback: (data: any) => void,
): void => {
  onOrderTrackingEvent('tracking:statusChanged', callback);
};

export const onTrackingCompleted = (callback: (data: any) => void): void => {
  onOrderTrackingEvent('tracking:completed', callback);
};

export const onTrackingError = (callback: (data: any) => void): void => {
  onOrderTrackingEvent('tracking:error', callback);
};

// ============================================================
// UTILITY
// ============================================================

export const offAllOrderTrackingEvents = (): void => {
  const trackingEvents = [
    'tracking:connected',
    'tracking:update',
    'tracking:statusChanged',
    'tracking:completed',
    'tracking:error',
  ];

  trackingEvents.forEach(event => {
    offOrderTrackingEvent(event);
    eventListeners.delete(event);
  });
};

export const cleanupOrderTracking = (): void => {
  if (socket && socket.connected) {
    socket.emit('tracking:leave');
  }
  offAllOrderTrackingEvents();
};

export const isOrderTrackingSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export default {
  connectOrderTrackingSocket,
  disconnectOrderTrackingSocket,
  joinOrderTracking,
  leaveOrderTracking,
  reconnectOrderTracking,
  onTrackingConnected,
  onTrackingUpdate,
  onTrackingStatusChanged,
  onTrackingCompleted,
  onTrackingError,
  offAllOrderTrackingEvents,
  cleanupOrderTracking,
  isOrderTrackingSocketConnected,
};
