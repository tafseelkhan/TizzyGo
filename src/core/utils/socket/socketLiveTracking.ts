// utils/socket/socketLiveTracking.ts

import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../../../api/connections/snippet/apiBaseUrl';
import { getToken } from '../../../api/connections/token/tokenSlice';
import { decode as base64Decode } from 'base-64';

class SocketLiveTracking {
  private static instance: SocketLiveTracking;
  private socket: Socket | null = null;
  private socketConnected: boolean = false;
  private userId: string | null = null;

  // Tracking state
  private isTracking: boolean = false;
  private currentRideId: string | null = null;
  private currentDriverId: string | null = null;

  // Callbacks
  private locationCallbacks: ((data: any) => void)[] = [];
  private statusCallbacks: ((data: any) => void)[] = [];

  private constructor() {}

  static getInstance(): SocketLiveTracking {
    if (!SocketLiveTracking.instance) {
      SocketLiveTracking.instance = new SocketLiveTracking();
    }
    return SocketLiveTracking.instance;
  }

  // ============================================================
  // EXTRACT USER ID FROM TOKEN
  // ============================================================
  private extractUserIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ [LiveTracking] Invalid token format');
        return null;
      }

      const payload = parts[1];
      const decoded = base64Decode(payload);
      const parsed = JSON.parse(decoded);

      const userId =
        parsed.userId || parsed.id || parsed.sub || parsed.user_id || null;
      if (userId) {
        console.log('✅ [LiveTracking] UserId extracted:', userId);
        return userId;
      }
      return null;
    } catch (error) {
      console.error('❌ [LiveTracking] Failed to extract userId:', error);
      return null;
    }
  }

  // ============================================================
  // CONNECT: Connect to socket server
  // ============================================================
  async connect(): Promise<boolean> {
    console.log('🔌 [LiveTracking] Connecting...');

    if (this.socket && this.socketConnected) {
      console.log('✅ [LiveTracking] Already connected');
      return true;
    }

    try {
      const token = await getToken();
      console.log('🔑 [LiveTracking] Token available:', !!token);

      if (!token) {
        throw new Error('No authentication token found');
      }

      this.userId = this.extractUserIdFromToken(token);
      if (!this.userId) {
        throw new Error('Failed to extract userId from token');
      }

      let baseUrl = API_BASE_URL || 'http://10.206.8.121:5000';
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }

      console.log('🌐 [LiveTracking] Connecting to:', baseUrl);
      console.log('👤 [LiveTracking] UserId:', this.userId);

      this.socket = io(baseUrl, {
        transports: ['websocket'],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true,
        auth: {
          token: token,
          userId: this.userId,
        },
        query: {
          platform: Platform.OS,
          userId: this.userId,
        },
      });

      this.setupSocketListeners();

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket?.on('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket?.on('connect_error', error => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      console.log('✅ [LiveTracking] Socket connected successfully');
      return true;
    } catch (error) {
      console.error('❌ [LiveTracking] Failed to connect:', error);
      return false;
    }
  }

  // ============================================================
  // SETUP SOCKET LISTENERS
  // ============================================================
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.socketConnected = true;
      console.log('✅ [LiveTracking] CONNECTED! ID:', this.socket?.id);
    });

    this.socket.on('connect_error', error => {
      console.error('❌ [LiveTracking] Connection error:', error.message);
      this.socketConnected = false;
    });

    this.socket.on('disconnect', reason => {
      console.log('🔌 [LiveTracking] Disconnected:', reason);
      this.socketConnected = false;
    });

    this.socket.on('error', error => {
      console.error('❌ [LiveTracking] Socket error:', error);
    });

    // ✅ Listen for live location updates from driver
    this.socket.on('driver:live:location', (data: any) => {
      console.log('📍 [LiveTracking] Live location received:', data);
      this.locationCallbacks.forEach(cb => cb(data));
    });

    // ✅ Listen for driver stopped
    this.socket.on('driver:live:stopped', (data: any) => {
      console.log('🛑 [LiveTracking] Driver stopped:', data);
      this.statusCallbacks.forEach(cb => cb({ type: 'stopped', data }));
      this.isTracking = false;
    });

    // ✅ Listen for track success
    this.socket.on('customer:track:success', (data: any) => {
      console.log('✅ [LiveTracking] Track success:', data);
      this.statusCallbacks.forEach(cb => cb({ type: 'success', data }));
    });

    // ✅ Listen for track error
    this.socket.on('customer:track:error', (data: any) => {
      console.error('❌ [LiveTracking] Track error:', data);
      this.statusCallbacks.forEach(cb => cb({ type: 'error', data }));
    });
  }

  // ============================================================
  // START TRACKING: Customer starts tracking a driver
  // ============================================================
  startTracking(customerId: string, driverId: string, rideId: string): void {
    console.log(
      `📍 [LiveTracking] Starting tracking: ride ${rideId}, driver ${driverId}`,
    );

    this.currentRideId = rideId;
    this.currentDriverId = driverId;
    this.isTracking = true;

    if (!this.socket || !this.socketConnected) {
      console.error('❌ [LiveTracking] Socket not connected');
      // Try to connect first
      this.connect().then(connected => {
        if (connected && this.socket) {
          this.socket.emit('customer:track:start', {
            customerId,
            driverId,
            rideId,
          });
        }
      });
      return;
    }

    this.socket.emit('customer:track:start', {
      customerId,
      driverId,
      rideId,
    });
  }

  // ============================================================
  // STOP TRACKING: Customer stops tracking
  // ============================================================
  stopTracking(): void {
    if (!this.isTracking || !this.currentRideId) {
      return;
    }

    console.log(
      `📍 [LiveTracking] Stopping tracking: ride ${this.currentRideId}`,
    );

    if (this.socket && this.socketConnected) {
      this.socket.emit('customer:track:stop', {
        customerId: this.userId,
        rideId: this.currentRideId,
      });
    }

    this.isTracking = false;
    this.currentRideId = null;
    this.currentDriverId = null;
    this.locationCallbacks = [];
    this.statusCallbacks = [];
  }

  // ============================================================
  // DRIVER: Start sending live location
  // ============================================================
  driverStartLive(
    driverId: string,
    rideId: string,
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    },
  ): void {
    console.log(
      `🚗 [LiveTracking] Driver ${driverId} starting live for ride ${rideId}`,
    );

    if (!this.socket || !this.socketConnected) {
      console.error('❌ [LiveTracking] Socket not connected');
      return;
    }

    this.socket.emit('driver:live:start', {
      driverId,
      rideId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading || 0,
      speed: location.speed || 0,
    });
  }

  // ============================================================
  // DRIVER: Update live location (call every 2-3 seconds)
  // ============================================================
  driverUpdateLocation(
    driverId: string,
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    },
  ): void {
    if (!this.socket || !this.socketConnected) {
      return;
    }

    this.socket.emit('driver:live:update', {
      driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading || 0,
      speed: location.speed || 0,
      accuracy: location.accuracy || 0,
    });
  }

  // ============================================================
  // DRIVER: Stop live tracking
  // ============================================================
  driverStopLive(driverId: string, rideId?: string): void {
    console.log(`🚗 [LiveTracking] Driver ${driverId} stopping live`);

    if (!this.socket || !this.socketConnected) {
      return;
    }

    this.socket.emit('driver:live:stop', {
      driverId,
      rideId,
    });
  }

  // ============================================================
  // CALLBACKS: Register/remove callbacks
  // ============================================================
  onLocation(callback: (data: any) => void): void {
    this.locationCallbacks.push(callback);
  }

  onStatus(callback: (data: any) => void): void {
    this.statusCallbacks.push(callback);
  }

  removeCallbacks(): void {
    this.locationCallbacks = [];
    this.statusCallbacks = [];
  }

  // ============================================================
  // UTILITY: Check if tracking is active
  // ============================================================
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  getCurrentRideId(): string | null {
    return this.currentRideId;
  }

  getCurrentDriverId(): string | null {
    return this.currentDriverId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  isConnected(): boolean {
    return (this.socketConnected && this.socket?.connected) || false;
  }

  // ============================================================
  // DISCONNECT: Close socket connection
  // ============================================================
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
      this.isTracking = false;
      this.userId = null;
      this.currentRideId = null;
      this.currentDriverId = null;
      this.locationCallbacks = [];
      this.statusCallbacks = [];
      console.log('🔌 [LiveTracking] Disconnected');
    }
  }
}

export default SocketLiveTracking.getInstance();
