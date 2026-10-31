// ProfileScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import IIcon from 'react-native-vector-icons/Ionicons';
import BottomNavigation from '../BottomNavigationHome';
import { useTheme } from '../../contexts/theme/ThemeContext';

// 👇 Direct API Import
import { me } from '../../../api/features/public/authPublicSlice';
import { ApiError } from '../../../core/utils/handler/apiClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Stuck detection — agar fetch 30s se zyada pending hai, force reset
const STUCK_THRESHOLD_MS = 30000;

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  connectAddress: string;
  displayName?: string;
  profilePhoto?: string;
  phone?: string;
  phoneVerified?: boolean;
  connectVerified?: boolean;
  role?: string;
  status?: string;
  apps?: Array<{ app: string; roles: string[] }>;
  createdAt?: string;
  updatedAt?: string;
  hasImage?: boolean;
}

const EMPTY_PROFILE: ProfileData = {
  id: '',
  firstName: '',
  lastName: '',
  username: '',
  connectAddress: '',
  displayName: '',
  profilePhoto: '',
  phone: '',
  phoneVerified: false,
  connectVerified: false,
  role: '',
  status: '',
  apps: [],
  createdAt: '',
  updatedAt: '',
  hasImage: false,
};

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(EMPTY_PROFILE);

  // Refs
  const hasLoadedOnceRef = useRef(false);
  const isFetchingRef = useRef(false);
  const fetchStartedAtRef = useRef<number | null>(null);

  // Dynamic colors
  const backgroundColor = isDark ? '#1E293B' : '#f9fafb';
  const textColor = isDark ? '#F1F5F9' : '#1a1a1a';
  const subtitleColor = isDark ? '#94A3B8' : '#6b7280';
  const cardBackground = isDark ? '#1E293B' : '#ffffff';
  const cardBorder = isDark ? '#374151' : '#e5e7eb';
  const contactBackground = isDark ? '#374151' : '#f3f4f6';
  const statusBackground = isDark ? '#374151' : '#f3f4f6';

  const gradientColors: string[] = isDark
    ? ['#1E293B', '#1E293B', '#1E293B']
    : ['#f9fafb', '#f9fafb', '#f9fafb'];

  const buttonGradient: string[] = isDark
    ? ['#7C3AED', '#6D28D9']
    : ['#8b5cf6', '#3b82f6'];

  // ============================================================
  // FETCH PROFILE — single-flight, stuck-safe
  // ============================================================
  const fetchProfile = useCallback(async (showSpinner: boolean) => {
    // Stuck detection — agar pehli fetch 30s se zyada pending hai, force reset
    if (isFetchingRef.current) {
      const startedAt = fetchStartedAtRef.current;
      const age = startedAt ? Date.now() - startedAt : 0;

      if (age > STUCK_THRESHOLD_MS) {
        console.warn(
          `⚠️ [Profile] Previous fetch stuck for ${age}ms — forcing reset`,
        );
        isFetchingRef.current = false;
        fetchStartedAtRef.current = null;
      } else {
        // Genuinely in-flight — skip duplicate
        console.log('⏭️ [Profile] Fetch skipped — already in flight');
        return;
      }
    }

    isFetchingRef.current = true;
    fetchStartedAtRef.current = Date.now();

    if (showSpinner) setLoading(true);
    setError(null);

    try {
      console.log('🟢 [Profile] Calling me()...');
      const t0 = Date.now();
      const response = await me();
      console.log(
        `🟢 [Profile] me() resolved in ${Date.now() - t0}ms, success=`,
        response?.success,
      );

      if (response?.success && response?.user) {
        const user = response.user;
        setProfileData({
          id: user.id || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username || '',
          connectAddress: user.connectAddress || '',
          displayName: user.displayName || '',
          profilePhoto: user.profilePhoto || '',
          phone: user.phone || '',
          phoneVerified: user.phoneVerified || false,
          connectVerified: user.connectVerified || false,
          role: user.role || '',
          status: user.status || '',
          apps: user.apps || [],
          createdAt: user.createdAt || '',
          updatedAt: user.updatedAt || '',
          hasImage: !!(user.profilePhoto && user.profilePhoto !== ''),
        });
        hasLoadedOnceRef.current = true;
        setError(null);
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      console.error('❌ [Profile] fetch failed:', (err as any)?.message);
      const message =
        err instanceof ApiError ? err.message : 'Unable to fetch profile.';
      setError(message);
    } finally {
      console.log('🟢 [Profile] fetch END');
      isFetchingRef.current = false;
      fetchStartedAtRef.current = null;
      setLoading(false);
    }
  }, []);

  // ============================================================
  // FETCH ON FOCUS — single request, no double
  // ============================================================
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) {
        fetchProfile(true);
      } else {
        fetchProfile(false);
      }
      return () => {};
    }, [fetchProfile]),
  );

  const handleRetry = () => {
    // Force reset if stuck
    isFetchingRef.current = false;
    fetchStartedAtRef.current = null;
    fetchProfile(true);
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as never);
  };

  const hasValidImage = (): boolean => {
    return !!(
      profileData.hasImage &&
      profileData.profilePhoto &&
      profileData.profilePhoto !== '' &&
      profileData.profilePhoto !== 'null' &&
      profileData.profilePhoto !== 'undefined'
    );
  };

  // Full-screen loader — only first load
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: cardBackground, borderColor: cardBorder },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={isDark ? '#A78BFA' : '#8b5cf6'}
          />
          <Text style={[styles.loadingText, { color: subtitleColor }]}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  // Error state — only when we have no data
  if (error && !hasLoadedOnceRef.current) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: cardBackground, borderColor: cardBorder },
          ]}
        >
          <Icon name="error-outline" size={40} color="#ef4444" />
          <Text
            style={[
              styles.loadingText,
              { color: textColor, textAlign: 'center' },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryButton}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName =
    profileData.displayName ||
    `${profileData.firstName} ${profileData.lastName}`.trim() ||
    profileData.username ||
    'Your Profile';

  const isVerified =
    profileData.phoneVerified || profileData.connectVerified;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={[styles.userName, { color: textColor }]}>
                {displayName}
              </Text>
              <TouchableOpacity
                style={[
                  styles.settingsButton,
                  { backgroundColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
                onPress={handleSettingsPress}
              >
                <IIcon
                  name="settings"
                  size={30}
                  color={isDark ? '#F1F5F9' : '#4b5563'}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
              Manage your personal information
            </Text>
          </View>

          {/* Main Profile Card */}
          <View
            style={[
              styles.profileCard,
              { backgroundColor: cardBackground, borderColor: cardBorder },
            ]}
          >
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                <View
                  style={[
                    styles.imageWrapper,
                    { borderColor: '#00000000', backgroundColor: '#00000000' },
                  ]}
                >
                  {hasValidImage() ? (
                    <Image
                      source={{ uri: profileData.profilePhoto }}
                      style={styles.profileImage}
                      resizeMode="cover"
                      onError={() => {
                        setProfileData(prev => ({ ...prev, hasImage: false }));
                      }}
                    />
                  ) : (
                    <LottieView
                      source={require('../../../core/components/animations/lotties/Login icon (1).json')}
                      style={styles.profileImage}
                      autoPlay={true}
                      loop={true}
                      resizeMode="cover"
                    />
                  )}
                </View>
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <FAIcon name="check" size={10} color="white" />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.contactSection}>
              {profileData.connectAddress && (
                <View
                  style={[
                    styles.contactItem,
                    { backgroundColor: contactBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(59, 130, 246, 0.1)',
                      },
                    ]}
                  >
                    <Icon name="alternate-email" size={16} color="#3b82f6" />
                  </View>
                  <View style={styles.contactContent}>
                    <Text
                      style={[styles.contactLabel, { color: subtitleColor }]}
                    >
                      Connect Address
                    </Text>
                    <Text style={[styles.contactValue, { color: textColor }]}>
                      {profileData.connectAddress}
                    </Text>
                  </View>
                </View>
              )}

              {profileData.phone && (
                <View
                  style={[
                    styles.contactItem,
                    { backgroundColor: contactBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(16, 185, 129, 0.1)',
                      },
                    ]}
                  >
                    <FA5Icon name="phone" size={12} color="#10b981" />
                  </View>
                  <View style={styles.contactContent}>
                    <Text
                      style={[styles.contactLabel, { color: subtitleColor }]}
                    >
                      Phone
                    </Text>
                    <Text style={[styles.contactValue, { color: textColor }]}>
                      {profileData.phone}
                    </Text>
                  </View>
                </View>
              )}

              {profileData.username && (
                <View
                  style={[
                    styles.contactItem,
                    { backgroundColor: contactBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(139, 92, 246, 0.2)'
                          : 'rgba(139, 92, 246, 0.1)',
                      },
                    ]}
                  >
                    <Icon name="person" size={16} color="#8b5cf6" />
                  </View>
                  <View style={styles.contactContent}>
                    <Text
                      style={[styles.contactLabel, { color: subtitleColor }]}
                    >
                      Username
                    </Text>
                    <Text style={[styles.contactValue, { color: textColor }]}>
                      @{profileData.username}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.accountStatus}>
              <View
                style={[
                  styles.statusItem,
                  { backgroundColor: statusBackground },
                ]}
              >
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: isDark ? '#D97706' : '#f59e0b' },
                  ]}
                >
                  <Icon name="security" size={16} color="white" />
                </View>
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, { color: subtitleColor }]}>
                    Account Status
                  </Text>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusValue, { color: textColor }]}>
                      {isVerified ? 'Verified' : 'Not Verified'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isVerified
                          ? styles.verifiedStatus
                          : styles.pendingStatus,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {isVerified ? 'Secure' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <LinearGradient
                colors={buttonGradient}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Icon name="edit" size={18} color="white" />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <View style={styles.bottomNavContainer}>
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    marginBottom: 60,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: screenHeight * 0.06,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: screenWidth * 0.09,
    fontWeight: 'bold',
    textAlign: 'left',
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerSubtitle: {
    fontSize: screenWidth * 0.038,
    textAlign: 'left',
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
    borderRadius: (screenWidth * 0.25) / 2,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#00000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#10b981',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  contactSection: {
    gap: 12,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: screenWidth * 0.032,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: screenWidth * 0.035,
    fontWeight: 'bold',
  },
  accountStatus: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: screenWidth * 0.038,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedStatus: {
    backgroundColor: '#dcfce7',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: screenWidth * 0.028,
    fontWeight: '600',
    color: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: screenWidth * 0.038,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomSpacer: {
    height: 20,
  },
});