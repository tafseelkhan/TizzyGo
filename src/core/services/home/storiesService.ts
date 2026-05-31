// services/storiesService.ts
import {
  storiesApi,
  ApiStory,
} from '../../../api/features/public/storiesPublicSlice';
import { STORY_CONTENT_OPTIONS } from '../../../api/constants/storyConstants';
import Config from 'react-native-config';

export interface Story {
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

interface ApiStoryWithProduct extends ApiStory {
  product?: {
    _id?: string;
    id?: string;
    title?: string;
    price?: number;
    description?: string;
    video?: string;
    category?: string;
  };
}

class StoriesService {
  private BASE_URL = Config.API_AXIOS_BASE_URL || '';

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  normalizeVideoUrl(videoUrl?: string): string | undefined {
    if (!videoUrl) return undefined;
    if (videoUrl.startsWith('http')) return videoUrl;
    return `${this.BASE_URL}/${videoUrl.replace(/^\//, '')}`;
  }

  async fetchAndProcessStories(): Promise<Story[]> {
    try {
      const storyArray = await storiesApi.fetchStories();

      if (!storyArray || storyArray.length === 0) return [];

      // Fetch viewed stories from API
      const viewedStoryIds = await storiesApi.fetchViewedStories();
      const viewedState: Record<string, boolean> = {};
      viewedStoryIds.forEach((id: string) => {
        viewedState[id] = true;
      });

      const today = new Date();
      const mappedStories: Story[] = storyArray
        .map((story: ApiStoryWithProduct) => {
          const productData = story.product || story;
          const storyId =
            story._id || story.id || Math.random().toString(36).substring(2);
          const videoUrl = this.normalizeVideoUrl(
            productData.video || story.video,
          );
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
        .filter((story: Story): story is Story => !!story.video)
        .filter((story: Story) => this.isToday(story.createdAt));

      // Group by user ID
      const userGroups: Record<string, Story[]> = mappedStories.reduce(
        (acc: Record<string, Story[]>, story: Story) => {
          if (!acc[story._id]) acc[story._id] = [];
          acc[story._id].push(story);
          return acc;
        },
        {} as Record<string, Story[]>,
      );

      let finalStories: Story[] = [];
      for (const userId in userGroups) {
        const sortedGroup = userGroups[userId].sort((a: Story, b: Story) => {
          if (a.isViewed === b.isViewed) return 0;
          return a.isViewed ? 1 : -1;
        });
        finalStories.push(...sortedGroup.slice(0, 3));
      }

      // Sort and limit stories
      const unviewed = finalStories
        .filter((s: Story) => !s.isViewed)
        .sort(() => Math.random() - 0.5);
      const viewed = finalStories
        .filter((s: Story) => s.isViewed)
        .sort(() => Math.random() - 0.5);
      const sortedAndShuffledStories = [...unviewed, ...viewed];

      return sortedAndShuffledStories.slice(0, 21);
    } catch (error) {
      console.error('Error fetching and processing stories:', error);
      return [];
    }
  }

  async markStoryAsViewed(storyId: string): Promise<boolean> {
    try {
      const result = await storiesApi.markStoryAsViewed(storyId);
      return result.success;
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      return false;
    }
  }

  getCurrentContent(): { heading: string; subheading: string } {
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const index = dayOfYear % STORY_CONTENT_OPTIONS.length;
    return STORY_CONTENT_OPTIONS[index];
  }
}

export const storiesService = new StoriesService();
