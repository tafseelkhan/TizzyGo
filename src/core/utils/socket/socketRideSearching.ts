// utils/socket/socketRideSearching.ts

import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../api/connections/snippet/apiBaseUrl';
import { getToken } from '../../../api/connections/token/tokenSlice';

let socket: Socket | null = null;
let isConnecting = false;
let isConnected = false;

// ✅ Store event listeners for reconnection
const eventListeners: Map<string, Set<(data: any) => void>> = new Map();

// =====================================================
// 📡 SOCKET CONNECTION
// =====================================================

export const connectSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    console.log('✅ [SOCKET] Already connected:', socket.id);
    return socket;
  }

  if (isConnecting) {
    console.log('⏳ [SOCKET] Connection in progress...');
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
  console.log('🔌 [SOCKET] Connecting to:', API_BASE_URL);

  const token = await getToken();
  console.log('🔑 [SOCKET] Token:', token ? '✅ Available' : '❌ Missing');

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
    console.log('✅ [SOCKET] Connected! ID:', socket?.id);
    isConnecting = false;
    isConnected = true;

    // ✅ Re-register all events on reconnect
    if (eventListeners.size > 0) {
      console.log(
        `🔄 [SOCKET] Re-registering ${eventListeners.size} events...`,
      );
      eventListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket?.on(event, callback);
          console.log(`✅ [SOCKET] Re-registered: ${event}`);
        });
      });
    }
  });

  socket.on('disconnect', reason => {
    console.log('❌ [SOCKET] Disconnected:', reason);
    isConnecting = false;
    isConnected = false;
  });

  socket.on('connect_error', error => {
    console.error('❌ [SOCKET] Connection error:', error.message);
    isConnecting = false;
  });

  // ✅ ✅ ✅ Log ALL incoming events for debugging
  socket.onAny((event, data) => {
    console.log(`📡 [SOCKET] 📩 EVENT: ${event}`);
    console.log(`📡 [SOCKET] Data:`, JSON.stringify(data, null, 2));
    console.log(`📡 [SOCKET] ========================================`);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    isConnected = false;
    eventListeners.clear();
    console.log('🔌 [SOCKET] Disconnected');
  }
};

// =====================================================
// 📡 EMIT EVENTS
// =====================================================

export const emitEvent = (event: string, data: any): void => {
  if (!socket || !socket.connected) {
    console.warn(`⚠️ [SOCKET] Cannot emit ${event}: Not connected`);
    // ✅ Try to connect and emit
    connectSocket().then(() => {
      if (socket && socket.connected) {
        console.log(`📤 [SOCKET] Emitting (delayed): ${event}`, data);
        socket.emit(event, data);
      }
    });
    return;
  }
  console.log(`📤 [SOCKET] Emitting: ${event}`, JSON.stringify(data, null, 2));
  socket.emit(event, data);
};

// =====================================================
// 📡 ON EVENTS (With persistence)
// =====================================================

export const onEvent = (event: string, callback: (data: any) => void): void => {
  console.log(`📡 [SOCKET] Registering: ${event}`);

  // ✅ Store callback for reconnection
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)?.add(callback);

  // ✅ Register on socket if available
  if (socket && socket.connected) {
    socket.on(event, callback);
    console.log(`✅ [SOCKET] Listener registered: ${event}`);
  } else {
    console.warn(`⚠️ [SOCKET] Socket not ready, event queued: ${event}`);
    // ✅ Try to connect and register
    connectSocket().then(() => {
      if (socket && socket.connected) {
        socket.on(event, callback);
        console.log(`✅ [SOCKET] Listener registered (delayed): ${event}`);
      }
    });
  }
};

export const offEvent = (
  event: string,
  callback?: (data: any) => void,
): void => {
  console.log(`📡 [SOCKET] Unregistering: ${event}`);

  // ✅ Remove from stored listeners
  if (callback) {
    eventListeners.get(event)?.delete(callback);
  } else {
    eventListeners.delete(event);
  }

  // ✅ Remove from socket
  if (socket) {
    socket.off(event, callback);
    console.log(`✅ [SOCKET] Listener removed: ${event}`);
  }
};

// =====================================================
// 📡 RIDE SEARCH EVENTS (Customer)
// =====================================================

export const onRideSearchStarted = (callback: (data: any) => void) => {
  onEvent('ride-search-started', callback);
};

export const onBatchCompleted = (callback: (data: any) => void) => {
  onEvent('batch-completed', callback);
};

export const onNoDriverFound = (callback: (data: any) => void) => {
  console.log('📡 [SOCKET] 🔴 Registering no-driver-found');
  onEvent('no-driver-found', callback);
};

export const onRetryStarted = (callback: (data: any) => void) => {
  console.log('📡 [SOCKET] 🔄 Registering retry-started');
  onEvent('retry-started', callback);
};

export const onFareUpdated = (callback: (data: any) => void) => {
  console.log('📡 [SOCKET] 💰 Registering fare-updated');
  onEvent('fare-updated', callback);
};

export const onDriverAccepted = (callback: (data: any) => void) => {
  onEvent('driver-accepted', callback);
};

export const onDriverTimeout = (callback: (data: any) => void) => {
  onEvent('driver-timeout', callback);
};

export const onRideStatusChange = (callback: (data: any) => void) => {
  onEvent('ride-status-change', callback);
};

// =====================================================
// 📡 AUTH EVENTS
// =====================================================

export const onAuthSuccess = (callback: (data: any) => void) => {
  onEvent('auth-success', callback);
};

export const onAuthError = (callback: (data: any) => void) => {
  onEvent('auth-error', callback);
};

export const onSocketError = (callback: (data: any) => void) => {
  onEvent('error', callback);
};

// =====================================================
// 📡 UTILITY
// =====================================================

export const offAllEvents = (): void => {
  eventListeners.clear();
  if (socket) {
    socket.removeAllListeners();
    console.log('🧹 [SOCKET] All listeners removed');
  }
};

export const getEventListeners = (): Map<string, Set<(data: any) => void>> => {
  return eventListeners;
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};
