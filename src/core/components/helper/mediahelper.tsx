// ✅ Helper functions for media
// Pure React Native implementation - No Expo dependencies

/**
 * Check if a URL is a video file
 * Supports Firebase Storage URLs with video extensions or video paths
 */
const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;

  // For Firebase Storage URLs
  if (url.includes('firebasestorage.googleapis.com/v0/b/')) {
    const videoExtensions = [
      '.mp4',
      '.mov',
      '.webm',
      '.mkv',
      '.avi',
      '.wmv',
      '.flv',
      '.m4v',
    ];
    const hasVideoExtension = videoExtensions.some(ext =>
      url.toLowerCase().includes(ext),
    );

    const hasVideoInPath =
      url.toLowerCase().includes('/video/') ||
      url.toLowerCase().includes('video=true') ||
      url.toLowerCase().includes('media_type=video');

    return hasVideoExtension || hasVideoInPath;
  }

  // For regular URLs, check file extension
  return /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(url);
};

/**
 * Normalize media arrays into a unified structure
 * Combines images and optional video into a single array
 */
const normalizeMedia = (
  images: string[] = [],
  video?: string,
): Array<{ type: 'image' | 'video'; url: string }> => {
  const media: { type: 'image' | 'video'; url: string }[] = [];

  // Add images (if any)
  images.forEach(img => {
    if (img && img.trim() !== '') {
      media.push({ type: 'image', url: img });
    }
  });

  // Add video first if exists (so it appears first in the list)
  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }

  return media;
};

/**
 * Extract thumbnail URL from video URL (for Firebase Storage)
 * Useful for showing video preview thumbnails
 */
const getVideoThumbnailUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';

  // For Firebase Storage, you might have a thumbnail URL pattern
  // This is an example pattern - adjust based on your storage structure
  if (videoUrl.includes('firebasestorage.googleapis.com')) {
    // Replace video path with thumbnail path
    return videoUrl
      .replace('/video/', '/thumbnail/')
      .replace(/\.[^/.]+$/, '.jpg');
  }

  return videoUrl;
};

/**
 * Check if media array contains a video
 */
const hasVideo = (
  media: Array<{ type: 'image' | 'video'; url: string }>,
): boolean => {
  return media.some(item => item.type === 'video');
};

/**
 * Get all image URLs from media array
 */
const getImageUrls = (
  media: Array<{ type: 'image' | 'video'; url: string }>,
): string[] => {
  return media.filter(item => item.type === 'image').map(item => item.url);
};

/**
 * Get video URL from media array (returns first video found)
 */
const getVideoUrl = (
  media: Array<{ type: 'image' | 'video'; url: string }>,
): string | null => {
  const videoItem = media.find(item => item.type === 'video');
  return videoItem ? videoItem.url : null;
};

/**
 * Format media count for display
 * Example: "3 Images, 1 Video"
 */
const formatMediaCount = (
  media: Array<{ type: 'image' | 'video'; url: string }>,
): string => {
  const imageCount = media.filter(item => item.type === 'image').length;
  const videoCount = media.filter(item => item.type === 'video').length;

  const parts = [];
  if (imageCount > 0) {
    parts.push(`${imageCount} Image${imageCount !== 1 ? 's' : ''}`);
  }
  if (videoCount > 0) {
    parts.push(`${videoCount} Video${videoCount !== 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No Media';
};

/**
 * Extract filename from URL
 */
const getFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return decodeURIComponent(filename);
  } catch (error) {
    // If URL parsing fails, try to extract filename manually
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  }
};

/**
 * Check if URL is a valid media URL
 */
const isValidMediaUrl = (url?: string): boolean => {
  if (!url) return false;

  try {
    // Check if it's a valid URL
    new URL(url);

    // Check if it ends with a common media extension
    const mediaExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.bmp',
      '.mp4',
      '.mov',
      '.webm',
      '.mkv',
      '.avi',
      '.wmv',
    ];

    return mediaExtensions.some(ext => url.toLowerCase().endsWith(ext));
  } catch (error) {
    return false;
  }
};

/**
 * Sort media array (videos first, then images)
 */
const sortMedia = (
  media: Array<{ type: 'image' | 'video'; url: string }>,
): Array<{ type: 'image' | 'video'; url: string }> => {
  return [...media].sort((a, b) => {
    // Videos first
    if (a.type === 'video' && b.type === 'image') return -1;
    if (a.type === 'image' && b.type === 'video') return 1;
    // Same type, maintain original order
    return 0;
  });
};

// ✅ Export all helper functions
export {
  isVideoUrl,
  normalizeMedia,
  getVideoThumbnailUrl,
  hasVideo,
  getImageUrls,
  getVideoUrl,
  formatMediaCount,
  getFilenameFromUrl,
  isValidMediaUrl,
  sortMedia,
};
