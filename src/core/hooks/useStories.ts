// hooks/useStories.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { storiesService, Story } from '../services/home/storiesService';
import { TimeoutId } from '../utils/home/storiesUtils';

interface UseStoriesReturn {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  refreshing: boolean;
  currentStoryIndex: number;
  progress: number;
  isPlaying: boolean;
  isMuted: boolean;
  isPreview: boolean;
  showAll: boolean;
  imageErrors: Record<string, boolean>;
  setCurrentStoryIndex: (index: number) => void;
  setProgress: (progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setIsPreview: (preview: boolean) => void;
  setShowAll: (show: boolean) => void;
  setImageErrors: (errors: Record<string, boolean>) => void;
  goToNextStory: () => void;
  goToPrevStory: () => void;
  markStoryAsViewed: (storyId: string) => Promise<void>;
  refreshStories: () => Promise<void>;
  getCurrentStory: () => Story | undefined;
  getFeaturedStories: () => Story[];
  handleImageError: (storyId: string) => void;
}

export const useStories = (): UseStoriesReturn => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPreview, setIsPreview] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const progressInterval = useRef<TimeoutId | null>(null);

  const currentStory = stories[currentStoryIndex];
  const duration = currentStory?.duration || 5000;

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedStories = await storiesService.fetchAndProcessStories();
      setStories(fetchedStories);
      setCurrentStoryIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
      setStories([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const markStoryAsViewed = async (storyId: string) => {
    await storiesService.markStoryAsViewed(storyId);

    setStories(prevStories => {
      let newStories = prevStories.map(story =>
        story.id === storyId ? { ...story, isViewed: true } : story,
      );
      const unviewed = newStories.filter(s => !s.isViewed);
      const viewed = newStories.filter(s => s.isViewed);
      return [...unviewed, ...viewed];
    });
  };

  const goToNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsPreview(true);
      setCurrentStoryIndex(0);
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const refreshStories = async () => {
    setRefreshing(true);
    await fetchStories();
  };

  const getCurrentStory = () => stories[currentStoryIndex];

  const getFeaturedStories = () => (showAll ? stories : stories.slice(0, 10));

  const handleImageError = (storyId: string) => {
    setImageErrors(prev => ({ ...prev, [storyId]: true }));
  };

  // Progress animation effect
  useEffect(() => {
    if (!isPlaying || !currentStory || isPreview) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (progressInterval.current) clearInterval(progressInterval.current);
          markStoryAsViewed(currentStory.id);
          goToNextStory();
          return 0;
        }
        return prev + 1;
      });
    }, duration / 100);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentStoryIndex, isPlaying, duration, isPreview, currentStory]);

  // Initial fetch
  useEffect(() => {
    fetchStories();
  }, []);

  return {
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
    setProgress,
    setIsPlaying,
    setIsMuted,
    setIsPreview,
    setShowAll,
    setImageErrors,
    goToNextStory,
    goToPrevStory,
    markStoryAsViewed,
    refreshStories,
    getCurrentStory,
    getFeaturedStories,
    handleImageError,
  };
};
