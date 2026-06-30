// components/ProductStories.tsx - FINAL CLEAN VERSION
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Video, { VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useStories } from '../../../hooks/useStories';
import { storiesService } from '../../../services/buyers/home/storiesService';
import {
  getStoryDisplayDate,
  formatPrice,
} from '../../../utils/home/storiesUtils';

// Lottie animations
const nofoundAnimation = require('../../../components/animations/lotties/shop cart kdp.json');

type RootStackParamList = {
  [key: string]: any;
};

interface ProductStoriesProps {
  onStoryEnd?: () => void;
  onStoryChange?: (storyId: string) => void;
  onRefresh?: () => Promise<void>;
}

const getLocalThemeColors = (isDark: boolean) => ({
  background: isDark ? '#00000000' : '#00000000',
  text: isDark ? '#F8FAFC' : '#0F172A',
  primary: isDark ? '#3B82F6' : '#2563EB',
  secondary: isDark ? '#1E293B' : '#F1F5F9',
  card: isDark ? '#1E293B' : '#F8FAFC',
  border: isDark ? '#334155' : '#E2E8F0',
});

const ProductStories: React.FC<ProductStoriesProps> = ({
  onStoryEnd,
  onStoryChange,
}) => {
  const { isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const themeColors = getLocalThemeColors(isDark);
  const videoRef = useRef<VideoRef>(null);

  const {
    stories,
    isLoading,
    error,
    refreshing,
    currentStoryIndex,
    progress,
    isPlaying,
    isMuted,
    isPreview,
    showAll,
    imageErrors,
    setCurrentStoryIndex,
    setIsPlaying,
    setIsMuted,
    setIsPreview,
    setShowAll,
    goToNextStory,
    goToPrevStory,
    markStoryAsViewed,
    refreshStories,
    getCurrentStory,
    getFeaturedStories,
    handleImageError,
  } = useStories();

  const currentStory = getCurrentStory();
  const currentContent = storiesService.getCurrentContent();
  const featuredStories = getFeaturedStories();

  const handlePausePlay = () => setIsPlaying(!isPlaying);
  const handleMuteUnmute = () => setIsMuted(!isMuted);

  const navigateToProduct = async () => {
    if (currentStory?.productId) {
      navigation.navigate(
        `/products/${currentStory.category}/${currentStory.productId}`,
      );
    }
  };

  const handleStoryClick = (index: number) => {
    const storyToOpen = featuredStories[index];
    const trueIndex = stories.findIndex(s => s.id === storyToOpen.id);
    if (trueIndex !== -1) {
      setCurrentStoryIndex(trueIndex);
      setIsPreview(false);
      if (onStoryChange && stories[trueIndex])
        onStoryChange(stories[trueIndex].id);
    }
  };

  const handleCloseStory = () => {
    setIsPreview(true);
    if (currentStory) markStoryAsViewed(currentStory.id);
    if (onStoryEnd) onStoryEnd();
  };

  // Loading State
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Loading today's stories...
        </Text>
      </View>
    );
  }

  // Error or No Stories State
  if (error || stories.length === 0) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <LottieView
          source={nofoundAnimation}
          autoPlay
          loop
          style={styles.errorAnimation}
        />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          {error ? 'Oops! Something went wrong' : 'No Stories Available Today'}
        </Text>
        <Text
          style={[styles.errorText, { color: isDark ? '#cbd5e1' : '#6b7280' }]}
        >
          {error || 'There are no new product stories available for today.'}
        </Text>
        {!error && (
          <Text
            style={[
              styles.errorSubtext,
              { color: isDark ? '#94a3b8' : '#9ca3af' },
            ]}
          >
            Check back tomorrow!
          </Text>
        )}
        {error && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: themeColors.primary },
            ]}
            onPress={refreshStories}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Preview Mode - Stories Grid
  if (isPreview) {
    return (
      <View
        style={[
          styles.previewContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header Section */}
          <View
            style={[
              styles.headerSection,
              { paddingTop: Platform.OS === 'ios' ? 50 : 30 },
            ]}
          >
            <Text style={[styles.heading, { color: themeColors.text }]}>
              {currentContent.heading}
            </Text>
            <Text
              style={[
                styles.subheading,
                { color: isDark ? '#cbd5e1' : '#6b7280' },
              ]}
            >
              {currentContent.subheading}
            </Text>
          </View>

          {/* Stories Count */}
          <View style={styles.storiesHeader}>
            <Text
              style={[
                styles.storiesCount,
                { color: isDark ? '#e2e8f0' : '#1e293b' },
              ]}
            >
              Today's Stories ({stories.length})
            </Text>
            <Text
              style={[
                styles.lastUpdated,
                { color: isDark ? '#94a3b8' : '#94a3b8' },
              ]}
            >
              Last updated: {getStoryDisplayDate()}
            </Text>
          </View>

          {/* View All Toggle */}
          {stories.length > 10 && (
            <TouchableOpacity
              style={[
                styles.viewAllButton,
                {
                  backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
                  borderColor: isDark ? '#334155' : '#bae6fd',
                },
              ]}
              onPress={() => setShowAll(!showAll)}
            >
              <Text
                style={[
                  styles.viewAllButtonText,
                  { color: isDark ? '#60a5fa' : '#0369a1' },
                ]}
              >
                {showAll ? 'View Less' : `View All (${stories.length})`}
              </Text>
              <Icon
                name={showAll ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#60a5fa' : '#0369a1'}
                style={styles.viewAllIcon}
              />
            </TouchableOpacity>
          )}

          {/* Stories Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.storiesScrollView}
            contentContainerStyle={styles.storiesContentContainer}
          >
            {featuredStories.map((story, index) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={() => handleStoryClick(index)}
              >
                <View
                  style={[
                    styles.storyCircle,
                    story.isViewed && styles.viewedStoryCircle,
                  ]}
                >
                  <LinearGradient
                    colors={
                      story.isViewed
                        ? isDark
                          ? ['#475569', '#334155']
                          : ['#9ca3af', '#4b5563']
                        : ['#60a5fa', '#34d399', '#8b5cf6']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyGradient}
                  >
                    <View
                      style={[
                        styles.storyInnerCircle,
                        { backgroundColor: isDark ? '#1e293b' : 'white' },
                      ]}
                    >
                      {story.video && !imageErrors[story.id] ? (
                        <Video
                          source={{ uri: story.video }}
                          style={styles.storyVideo}
                          resizeMode="cover"
                          muted={true}
                          paused={true}
                        />
                      ) : (
                        <View
                          style={[
                            styles.noImageContainer,
                            { backgroundColor: isDark ? '#1e293b' : '#f8fafc' },
                          ]}
                        >
                          <MaterialIcon
                            name="broken-image"
                            size={24}
                            color={isDark ? '#475569' : '#9ca3af'}
                          />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
                <Text
                  style={[styles.storyTitle, { color: themeColors.text }]}
                  numberOfLines={1}
                >
                  {story.title}
                </Text>
                <Text
                  style={[
                    styles.storyPrice,
                    { color: isDark ? '#34d399' : '#059669' },
                  ]}
                >
                  {formatPrice(story.price)}
                </Text>
                {story.isViewed && (
                  <View
                    style={[
                      styles.viewedBadge,
                      { backgroundColor: isDark ? '#1e293b' : 'white' },
                    ]}
                  >
                    <Icon
                      name="checkmark-circle"
                      size={12}
                      color={isDark ? '#475569' : '#9ca3af'}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    );
  }

  // Full Screen Story Mode
  return currentStory ? (
    <View style={styles.fullScreenContainer}>
      <LinearGradient
        colors={['#3b82f6', '#10b981', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((story, index) => (
          <View key={story.id} style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${
                    index === currentStoryIndex
                      ? progress
                      : index < currentStoryIndex
                      ? 100
                      : 0
                  }%`,
                  backgroundColor:
                    index < currentStoryIndex ? '#ffffff' : '#6b7280',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Video Container */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handlePausePlay}
      >
        {currentStory.video ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.video }}
            style={styles.video}
            resizeMode="cover"
            muted={isMuted}
            paused={!isPlaying}
            repeat={false}
            onEnd={goToNextStory}
          />
        ) : (
          <View style={styles.noMediaContainer}>
            <MaterialIcon name="videocam-off" size={48} color="white" />
            <Text style={styles.noMediaText}>No Media Available</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Navigation Areas */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navLeft} onPress={goToPrevStory} />
        <TouchableOpacity style={styles.navRight} onPress={goToNextStory} />
      </View>

      {/* Top Info Bar */}
      <View style={styles.topInfoContainer}>
        <View style={styles.topInfoContent}>
          <View style={styles.userInfo}>
            <View style={styles.userImageContainer}>
              <LinearGradient
                colors={['#3b82f6', '#10b981', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userGradient}
              >
                <View
                  style={[
                    styles.userInnerCircle,
                    { backgroundColor: isDark ? '#1e293b' : 'white' },
                  ]}
                >
                  {currentStory.video && !imageErrors[currentStory.id] ? (
                    <Video
                      source={{ uri: currentStory.video }}
                      style={styles.userVideo}
                      resizeMode="cover"
                      muted={true}
                      paused={true}
                    />
                  ) : (
                    <View
                      style={[
                        styles.userNoImage,
                        { backgroundColor: isDark ? '#1e293b' : 'white' },
                      ]}
                    >
                      <MaterialIcon
                        name="person"
                        size={16}
                        color={isDark ? '#475569' : '#9ca3af'}
                      />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
            <View>
              <Text style={styles.userTitle}>{currentStory.title}</Text>
              <Text style={styles.userPrice}>
                {formatPrice(currentStory.price)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseStory}
          >
            <Icon name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomInfoContainer}>
        <View style={styles.bottomInfoCard}>
          <View style={styles.bottomInfoContent}>
            <View style={styles.productHeader}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {currentStory.title}
              </Text>
              <Text style={styles.productPrice}>
                {formatPrice(currentStory.price)}
              </Text>
            </View>
            <Text style={styles.productDescription} numberOfLines={2}>
              {currentStory.description}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.viewProductButton}
                onPress={navigateToProduct}
              >
                <Text style={styles.viewProductButtonText}>View Product</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.muteButton}
                onPress={handleMuteUnmute}
              >
                {isMuted ? (
                  <Icon name="volume-mute" size={24} color="white" />
                ) : (
                  <Icon name="volume-high" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  ) : null;
};

// Styles
const styles = StyleSheet.create({
  errorAnimation: { width: 150, height: 150, marginBottom: 20 },
  scrollViewContent: { flexGrow: 1, paddingBottom: 20, paddingTop: 15 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  viewAllIcon: { marginLeft: 6 },
  storiesScrollView: { marginBottom: 16 },
  storiesContentContainer: { paddingRight: 16, paddingLeft: 16, paddingTop: 5 },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 88,
    position: 'relative',
  },
  storyCircle: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  viewedStoryCircle: { opacity: 0.8 },
  storyGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    padding: 2,
  },
  storyVideo: { width: '100%', height: '100%' },
  storyInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  viewedBadge: {
    position: 'absolute',
    top: -4,
    right: 0,
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  errorSubtext: { fontSize: 14, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  previewContainer: { flex: 1, marginTop: 0 },
  headerSection: { marginBottom: 20, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subheading: { fontSize: 16, lineHeight: 22 },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  storiesCount: { fontSize: 18, fontWeight: '700' },
  lastUpdated: { fontSize: 12, fontStyle: 'italic' },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 5,
    borderWidth: 1,
  },
  viewAllButtonText: { fontSize: 14, fontWeight: '600' },
  storyTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  storyPrice: { fontSize: 12, fontWeight: '600' },
  fullScreenContainer: { flex: 1, backgroundColor: 'black', marginTop: 0 },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: '#6b7280',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },
  videoContainer: { flex: 1, backgroundColor: 'black' },
  video: { width: '100%', height: '100%' },
  noMediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  noMediaText: { color: 'white', fontSize: 18, marginTop: 12 },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navLeft: { flex: 1 },
  navRight: { flex: 1 },
  topInfoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  topInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userGradient: { width: '100%', height: '100%', borderRadius: 20, padding: 2 },
  userInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userVideo: { width: '100%', height: '100%' },
  userNoImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  userTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userPrice: {
    color: 'white',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(220,38,38,0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  bottomInfoCard: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: 16,
  },
  bottomInfoContent: { gap: 12 },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  productPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productDescription: { color: 'white', fontSize: 16, lineHeight: 22 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  viewProductButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  viewProductButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  muteButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default ProductStories;
