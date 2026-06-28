// components/CustomMediaViewer.tsx
import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/theme/ThemeContext';
import {
  cleanImageUrl,
  FALLBACK_IMAGE,
} from '../../../../utils/home/productCardUtils';

interface CustomMediaViewerProps {
  media: string[];
  currentIndex: number;
}

const CustomMediaViewer: React.FC<CustomMediaViewerProps> = ({
  media,
  currentIndex,
}) => {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMedia = media[currentIndex] || '';

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const imageUrl =
    imageError || !currentMedia || currentMedia.includes('...')
      ? FALLBACK_IMAGE
      : cleanImageUrl(currentMedia);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      )}
      <Image
        source={{ uri: imageUrl, cache: 'force-cache' }}
        style={styles.image}
        resizeMode="contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
});

export default CustomMediaViewer;
