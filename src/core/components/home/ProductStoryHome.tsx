// components/ProductStories.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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

// Theme Context Import
import { useTheme } from '../../contexts/theme/ThemeContext';

// Import Lottie animations
const nofoundAnimation = require('../../components/animations/lotties/shop cart kdp.json');

// Helper function to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

interface Story {
  id: string;
  video?: string;
  productId: string;
  title: string;
  price: number;
  description: string;
  duration?: number;
  isViewed?: boolean;
  category: string;
  _id: string;
  createdAt: Date;
}

interface ApiStory {
  _id?: string;
  id?: string;
  video?: string;
  product?: {
    _id?: string;
    id?: string;
    image?: string;
    images?: string[];
    video?: string;
    title?: string;
    price?: number;
    description?: string;
    category?: string;
  };
  title?: string;
  price?: number;
  description?: string;
  category?: string;
  duration?: number;
  isViewed?: boolean;
  createdAt?: string;
}

interface ProductStoriesProps {
  onStoryEnd?: () => void;
  onStoryChange?: (storyId: string) => void;
  onRefresh?: () => Promise<void>;
}

// Define navigation param types
type RootStackParamList = {
  [key: string]: any;
};

const VIEWED_STORIES_KEY = 'viewedStories';

// Local theme colors function
const getLocalThemeColors = (isDark: boolean) => {
  return {
    background: isDark ? '#00000000' : '#00000000',
    text: isDark ? '#F8FAFC' : '#0F172A',
    primary: isDark ? '#3B82F6' : '#2563EB',
    secondary: isDark ? '#1E293B' : '#F1F5F9',
    card: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
  };
};

// ✅ FIXED: Proper type for timeout
type TimeoutId = ReturnType<typeof setTimeout>;

const ProductStories: React.FC<ProductStoriesProps> = ({
  onStoryEnd,
  onStoryChange,
  onRefresh,
}) => {
  // Theme Context
  const { isDark, resolvedTheme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Create themeColors locally
  const themeColors = getLocalThemeColors(isDark);

  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>(
    {},
  );

  // ✅ FIXED: Correct VideoRef type
  const videoRef = useRef<VideoRef>(null);
  // ✅ FIXED: Proper timeout type
  const progressInterval = useRef<TimeoutId | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const currentStory = stories[currentStoryIndex];
  const duration = currentStory?.duration || 5000;

  const BASE_URL = 'http://172.20.10.12:5000';

  const contentOptions = [
    {
      heading: 'Product Stories',
      subheading:
        'Engage your customers with interactive product stories instead of boring banners',
    },
    {
      heading: 'Discover Our Products',
      subheading:
        'Dive into captivating stories showcasing our latest offerings',
    },
    {
      heading: 'Explore New Arrivals',
      subheading:
        'Experience products like never before with immersive stories',
    },
  ];

  const getCurrentContent = (): { heading: string; subheading: string } => {
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const index = dayOfYear % contentOptions.length;
    return contentOptions[index];
  };

  const currentContent = getCurrentContent();

  // Fetch stories function
  const fetchStories = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/api/stories`);

      if (!response.ok) {
        throw new Error(
          `Network error: Unable to load stories (Status: ${response.status})`,
        );
      }

      const data:
        | { stories?: ApiStory[]; data?: ApiStory[]; products?: ApiStory[] }
        | ApiStory[] = await response.json();

      let storyArray: ApiStory[] = [];
      if (Array.isArray(data)) {
        storyArray = data;
      } else if (data.stories && Array.isArray(data.stories)) {
        storyArray = data.stories;
      } else if (data.data && Array.isArray(data.data)) {
        storyArray = data.data;
      } else if (data.products && Array.isArray(data.products)) {
        storyArray = data.products;
      } else {
        throw new Error('Invalid data format received from server');
      }

      if (storyArray.length === 0) {
        setStories([]);
        return;
      }

      // Load viewed state using AsyncStorage instead of localStorage
      let viewedState: Record<string, boolean> = {};
      try {
        // Note: For React Native, you should use AsyncStorage
        // This is a placeholder - you'll need to implement AsyncStorage
        const storedViewed = null; // await AsyncStorage.getItem(VIEWED_STORIES_KEY);
        if (storedViewed) {
          viewedState = JSON.parse(storedViewed);
        }
      } catch (e) {
        console.error('Error loading viewed state:', e);
      }

      // Map and filter stories
      const today = new Date();
      const mappedStories: Story[] = storyArray
        .map((story: ApiStory) => {
          const productData = story.product || story;
          const storyId =
            story._id || story.id || Math.random().toString(36).substring(2);

          let videoUrl = productData.video || story.video;
          if (videoUrl && !videoUrl.startsWith('http')) {
            videoUrl = `${BASE_URL}/${videoUrl}`;
          }

          const storyCreationDate = story.createdAt
            ? new Date(story.createdAt)
            : today;

          return {
            id: storyId,
            video: videoUrl,
            productId: productData._id || productData.id || '',
            title: productData.title || story.title || 'Untitled Story',
            price: productData.price || story.price || 0,
            description:
              productData.description ||
              story.description ||
              'No description available',
            duration: story.duration || 5000,
            isViewed: viewedState[storyId] || false,
            category: productData.category || story.category || 'default',
            _id: story._id || story.id || 'default_user',
            createdAt: storyCreationDate,
          };
        })
        .filter(story => story.video)
        .filter(story => isToday(story.createdAt));

      // Group by user ID
      const userGroups: Record<string, Story[]> = mappedStories.reduce(
        (acc, story) => {
          if (!acc[story._id]) {
            acc[story._id] = [];
          }
          acc[story._id].push(story);
          return acc;
        },
        {} as Record<string, Story[]>,
      );

      let finalStories: Story[] = [];
      for (const userId in userGroups) {
        const sortedGroup = userGroups[userId].sort((a, b) => {
          if (a.isViewed === b.isViewed) return 0;
          return a.isViewed ? 1 : -1;
        });
        finalStories.push(...sortedGroup.slice(0, 3));
      }

      // Sort and limit stories
      const unviewed = finalStories
        .filter(s => !s.isViewed)
        .sort(() => Math.random() - 0.5);
      const viewed = finalStories
        .filter(s => s.isViewed)
        .sort(() => Math.random() - 0.5);
      const sortedAndShuffledStories = [...unviewed, ...viewed];
      const limitedStories = sortedAndShuffledStories.slice(0, 21);

      setStories(limitedStories);

      if (currentStoryIndex >= limitedStories.length) {
        setCurrentStoryIndex(0);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load stories. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStories();
  }, [BASE_URL]);

  const markStoryAsViewed = (storyId: string): void => {
    setStories(prevStories => {
      let newStories = prevStories.map(story =>
        story.id === storyId ? { ...story, isViewed: true } : story,
      );

      const newViewedState = newStories.reduce((acc, story) => {
        acc[story.id] = story.isViewed || false;
        return acc;
      }, {} as Record<string, boolean>);

      try {
        // Note: For React Native, use AsyncStorage
        // AsyncStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(newViewedState));
      } catch (e) {
        console.error('Error saving viewed state:', e);
      }

      const unviewed = newStories.filter(s => !s.isViewed);
      const viewed = newStories.filter(s => s.isViewed);

      return [...unviewed, ...viewed];
    });
  };

  // Progress animation
  useEffect(() => {
    if (!isPlaying || !currentStory || isPreview) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          markStoryAsViewed(currentStory.id);
          goToNextStory();
          return 0;
        }
        return prev + 1;
      });
    }, duration / 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStoryIndex, isPlaying, duration, isPreview, currentStory]);

  const goToNextStory = (): void => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
      if (onStoryChange && stories[currentStoryIndex + 1]) {
        onStoryChange(stories[currentStoryIndex + 1].id);
      }
    } else {
      if (onStoryEnd) onStoryEnd();
      setIsPreview(true);
      setCurrentStoryIndex(0);
    }
  };

  const goToPrevStory = (): void => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
      if (onStoryChange && stories[currentStoryIndex - 1]) {
        onStoryChange(stories[currentStoryIndex - 1].id);
      }
    }
  };

  const handlePausePlay = (): void => {
    setIsPlaying(prev => !prev);
  };

  const handleMuteUnmute = async (): Promise<void> => {
    setIsMuted(prev => !prev);
  };

  const navigateToProduct = async (): Promise<void> => {
    if (currentStory && currentStory.productId) {
      navigation.navigate(
        `/products/${currentStory.category}/${currentStory.productId}`,
      );
    }
  };

  const handleStoryClick = (index: number): void => {
    const storyToOpen = featuredStories[index];
    const trueIndex = stories.findIndex(s => s.id === storyToOpen.id);

    if (trueIndex !== -1) {
      setCurrentStoryIndex(trueIndex);
      setIsPreview(false);
      setProgress(0);
      if (onStoryChange && stories[trueIndex]) {
        onStoryChange(stories[trueIndex].id);
      }
    }
  };

  const handleImageError = (storyId: string): void => {
    setImageErrors(prev => ({ ...prev, [storyId]: true }));
  };

  const handlePlaybackStatusUpdate = (status: any): void => {
    if (status.didJustFinish) {
      goToNextStory();
    }
  };

  const featuredStories = useMemo(() => {
    return showAll ? stories : stories.slice(0, 10);
  }, [stories, showAll]);

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      marginTop: Platform.OS === 'ios' ? 45 : 30,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background,
      padding: 20,
      marginTop: Platform.OS === 'ios' ? 45 : 30,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: themeColors.text,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background,
      padding: 20,
      marginTop: Platform.OS === 'ios' ? 45 : 30,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#cbd5e1' : '#6b7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: 14,
      color: isDark ? '#94a3b8' : '#9ca3af',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    previewContainer: {
      flex: 1,
      marginTop: 0,
      backgroundColor: themeColors.background,
    },
    headerSection: {
      marginBottom: 20,
      padding: 16,
      paddingTop: 10,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
    },
    subheading: {
      fontSize: 16,
      color: isDark ? '#cbd5e1' : '#6b7280',
      lineHeight: 22,
    },
    storiesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    storiesCount: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    lastUpdated: {
      fontSize: 12,
      color: isDark ? '#94a3b8' : '#94a3b8',
      fontStyle: 'italic',
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
      marginHorizontal: 16,
      marginBottom: 16,
      marginTop: 5,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#bae6fd',
    },
    viewAllButtonText: {
      color: isDark ? '#60a5fa' : '#0369a1',
      fontSize: 14,
      fontWeight: '600',
    },
    storyTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    storyPrice: {
      fontSize: 12,
      color: isDark ? '#34d399' : '#059669',
      fontWeight: '600',
    },
    storyInnerCircle: {
      width: '100%',
      height: '100%',
      borderRadius: 34,
      backgroundColor: isDark ? '#1e293b' : 'white',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      width: '100%',
      height: '100%',
    },
    userNoImage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : 'white',
      width: '100%',
      height: '100%',
    },
  });

  if (isLoading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={dynamicStyles.loadingText}>
          Loading today's stories...
        </Text>
      </View>
    );
  }

  if (error || !stories || stories.length === 0) {
    return (
      <View style={dynamicStyles.errorContainer}>
        <LottieView
          source={nofoundAnimation}
          autoPlay
          loop
          style={styles.errorAnimation}
        />
        <Text style={dynamicStyles.errorTitle}>
          {error ? 'Oops! Something went wrong' : 'No Stories Available Today'}
        </Text>
        <Text style={dynamicStyles.errorText}>
          {error || 'There are no new product stories available for today.'}
        </Text>
        {!error && (
          <Text style={dynamicStyles.errorSubtext}>Check back tomorrow!</Text>
        )}
        {error && (
          <TouchableOpacity
            style={dynamicStyles.retryButton}
            onPress={() => fetchStories()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {isPreview ? (
        <ScrollView
          style={dynamicStyles.previewContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header Section */}
          <View style={dynamicStyles.headerSection}>
            <Text style={dynamicStyles.heading}>{currentContent.heading}</Text>
            <Text style={dynamicStyles.subheading}>
              {currentContent.subheading}
            </Text>
          </View>

          {/* Stories Count and View All */}
          <View style={dynamicStyles.storiesHeader}>
            <Text style={dynamicStyles.storiesCount}>
              Today's Stories ({stories.length})
            </Text>
            <Text style={dynamicStyles.lastUpdated}>
              Last updated:{' '}
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {/* View All Toggle */}
          {stories.length > 10 && (
            <TouchableOpacity
              style={dynamicStyles.viewAllButton}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={dynamicStyles.viewAllButtonText}>
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
                    <View style={dynamicStyles.storyInnerCircle}>
                      {story.video && !imageErrors[story.id] ? (
                        <Video
                          source={{ uri: story.video }}
                          style={styles.storyVideo}
                          resizeMode="cover"
                          muted={true}
                          paused={true}
                        />
                      ) : (
                        <View style={dynamicStyles.noImageContainer}>
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
                <Text style={dynamicStyles.storyTitle} numberOfLines={1}>
                  {story.title}
                </Text>
                <Text style={dynamicStyles.storyPrice}>
                  ₹{story.price.toLocaleString()}
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
      ) : (
        currentStory && (
          <View style={styles.fullScreenContainer}>
            {/* Background Gradient */}
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
                  onEnd={() => goToNextStory()}
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
              <TouchableOpacity
                style={styles.navLeft}
                onPress={goToPrevStory}
              />
              <TouchableOpacity
                style={styles.navRight}
                onPress={goToNextStory}
              />
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
                      <View style={dynamicStyles.storyInnerCircle}>
                        {currentStory.video && !imageErrors[currentStory.id] ? (
                          <Video
                            source={{ uri: currentStory.video }}
                            style={styles.userVideo}
                            resizeMode="cover"
                            muted={true}
                            paused={true}
                          />
                        ) : (
                          <View style={dynamicStyles.userNoImage}>
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
                      ₹{currentStory.price.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsPreview(true)}
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
                      ₹{currentStory.price.toLocaleString()}
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
                      <Text style={styles.viewProductButtonText}>
                        View Product
                      </Text>
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
        )
      )}
    </View>
  );
};

// Static styles remain the same...
const styles = StyleSheet.create({
  errorAnimation: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllIcon: {
    marginLeft: 6,
  },
  storiesScrollView: {
    marginBottom: 16,
  },
  storiesContentContainer: {
    paddingRight: 16,
    paddingLeft: 16,
    paddingTop: 5,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 88,
    position: 'relative',
  },
  storyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  viewedStoryCircle: {
    opacity: 0.8,
  },
  storyGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    padding: 2,
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  viewedBadge: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    marginTop: 0,
  },
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
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    marginTop: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noMediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  noMediaText: {
    color: 'white',
    fontSize: 18,
    marginTop: 12,
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navLeft: {
    flex: 1,
  },
  navRight: {
    flex: 1,
  },
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 2,
  },
  userVideo: {
    width: '100%',
    height: '100%',
  },
  userTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userPrice: {
    color: 'white',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 16,
  },
  bottomInfoContent: {
    gap: 12,
  },
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
  productDescription: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
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
  viewProductButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  muteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ProductStories;
