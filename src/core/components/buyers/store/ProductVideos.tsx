// components/ProductVideo.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
// ✅ REPLACED: Using react-native-video instead of expo-av
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../contexts/theme/ThemeContext';

// ✅ Import Video component type
import type { VideoRef } from 'react-native-video';

const { width } = Dimensions.get('window');

interface ProductVideoProps {
  videoUrl?: string;
  title?: string;
  isLoading?: boolean;
  isDark?: boolean;
}

// ✅ Video status types for react-native-video
interface VideoStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  didJustFinish: boolean;
}

const ProductVideo: React.FC<ProductVideoProps> = ({ 
  videoUrl, 
  title,
  isLoading = false,
  isDark: propIsDark
}) => {
  // ✅ Use VideoRef type instead of Video
  const videoRef = useRef<VideoRef>(null);
  const [status, setStatus] = useState<VideoStatus>({
    isLoaded: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    didJustFinish: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // ✅ Theme context
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  
  // ✅ Theme based dynamic styles
  const dynamicStyles = getDynamicStyles(isDark);

  useEffect(() => {
    // Reset states when videoUrl changes
    setIsVideoLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setShowControls(false);
    setShouldPlay(false);
    setStatus({
      isLoaded: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      didJustFinish: false,
    });
  }, [videoUrl]);

  // ✅ Handle video load
  const handleVideoLoad = (data: OnLoadData) => {
    setIsVideoLoading(false);
    setHasError(false);
    setStatus(prev => ({
      ...prev,
      isLoaded: true,
      duration: data.duration,
    }));
  };

  // ✅ Handle video progress
  const handleVideoProgress = (data: OnProgressData) => {
    setStatus(prev => ({
      ...prev,
      currentTime: data.currentTime,
    }));
  };

  // ✅ Handle video end
  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    setStatus(prev => ({
      ...prev,
      isPlaying: false,
      didJustFinish: true,
    }));
  };

  // ✅ Handle video error
  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    setIsVideoLoading(false);
    setHasError(true);
    setStatus(prev => ({
      ...prev,
      isLoaded: false,
    }));
  };

  const handlePlayPause = async () => {
    try {
      if (!videoRef.current) return;
      
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setStatus(prev => ({ ...prev, isPlaying: false }));
      } else {
        // ✅ If video finished, restart
        if (status.didJustFinish) {
          videoRef.current.seek(0);
          setStatus(prev => ({ ...prev, currentTime: 0, didJustFinish: false }));
        }
        videoRef.current.resume();
        setIsPlaying(true);
        setShouldPlay(true);
        setStatus(prev => ({ ...prev, isPlaying: true, didJustFinish: false }));
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleReplay = async () => {
    try {
      if (videoRef.current) {
        videoRef.current.seek(0);
        videoRef.current.resume();
        setIsPlaying(true);
        setShouldPlay(true);
        setStatus(prev => ({
          ...prev,
          currentTime: 0,
          isPlaying: true,
          didJustFinish: false,
        }));
      }
    } catch (error) {
      console.error('Replay error:', error);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ✅ Helper function to get progress percentage
  const getProgressPercentage = (): number => {
    if (status.duration > 0 && status.currentTime > 0) {
      return (status.currentTime / status.duration) * 100;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading video...</Text>
      </View>
    );
  }

  if (!videoUrl) {
    return (
      <View style={[styles.noVideoContainer, dynamicStyles.noVideoContainer]}>
        <Icon name="videocam-off" size={50} color="#9CA3AF" />
        <Text style={[styles.noVideoText, dynamicStyles.noVideoText]}>Video not available for this variant</Text>
      </View>
    );
  }

  const didJustFinish = status.didJustFinish;
  const isVideoPlaying = status.isPlaying;
  const progressPercentage = getProgressPercentage();
  const duration = status.duration;
  const position = status.currentTime;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {title && (
        <Text style={[styles.videoTitle, dynamicStyles.videoTitle]}>{title}</Text>
      )}
      
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleControls}
        style={styles.videoContainer}
        disabled={isVideoLoading}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          resizeMode="contain"
          paused={!shouldPlay}
          repeat={false}
          onLoad={handleVideoLoad}
          onProgress={handleVideoProgress}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
        />
        
        {isVideoLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingOverlayText}>Loading video...</Text>
          </View>
        )}
        
        {hasError && (
          <View style={styles.errorOverlay}>
            <Icon name="alert-circle" size={50} color="#FFFFFF" />
            <Text style={styles.errorText}>Failed to load video</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setHasError(false);
                setIsVideoLoading(true);
                setStatus({
                  isLoaded: false,
                  isPlaying: false,
                  duration: 0,
                  currentTime: 0,
                  didJustFinish: false,
                });
                setShouldPlay(false);
                setIsPlaying(false);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isVideoLoading && !hasError && showControls && (
          <View style={styles.controlsOverlay}>
            {/* ✅ VIDEO ENDED STATE - Replay button show करें */}
            {didJustFinish ? (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleReplay}
              >
                <View style={styles.replayContainer}>
                  <Icon
                    name="refresh-circle"
                    size={70}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <Text style={styles.replayText}>Replay</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handlePlayPause}
              >
                <Icon
                  name={isVideoPlaying ? "pause-circle" : "play-circle"}
                  size={60}
                  color="rgba(255, 255, 255, 0.9)"
                />
              </TouchableOpacity>
            )}
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </View>
          </View>
        )}
        
        {!isVideoLoading && !hasError && !showControls && (
          <TouchableOpacity
            style={styles.playButtonOverlay}
            onPress={() => {
              setShowControls(true);
              if (!isVideoPlaying && !didJustFinish) {
                handlePlayPause();
              }
            }}
          >
            {/* ✅ अगर video खत्म हो गया है तो replay icon दिखाएं */}
            {didJustFinish ? (
              <View style={styles.replayIconContainer}>
                <Icon name="refresh-circle" size={70} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.replayIconText}>Tap to replay</Text>
              </View>
            ) : !isVideoPlaying ? (
              <Icon name="play-circle" size={70} color="rgba(255, 255, 255, 0.9)" />
            ) : null}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {!isVideoLoading && !hasError && (
        <View style={styles.videoInfo}>
          <Text style={[styles.durationText, dynamicStyles.durationText]}>
            Duration: {formatTime(duration)}
          </Text>
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => {
              // Implement fullscreen if needed
            }}
          >
            <Icon name="expand" size={20} color={isDark ? "#94A3B8" : "#6B7280"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ✅ Theme based dynamic styles function
const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    loadingContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    loadingText: {
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    noVideoContainer: {
      backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    noVideoText: {
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    videoTitle: {
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    durationText: {
      color: isDark ? '#94A3B8' : '#6B7280',
    },
  });
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  noVideoContainer: {
    padding: 40,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noVideoText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  controlButton: {
    marginBottom: 20,
  },
  replayContainer: {
    alignItems: 'center',
  },
  replayText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  replayIconContainer: {
    alignItems: 'center',
  },
  replayIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  durationText: {
    fontSize: 14,
  },
  fullscreenButton: {
    padding: 4,
  },
});

export default ProductVideo;