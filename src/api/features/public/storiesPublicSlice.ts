import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// TYPES
// ================================

export interface ApiStory {
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

export interface ViewedStoryResponse {
  success: boolean;
  message?: string;
}

// ================================
// STORIES API CLASS
// ================================

class StoriesApi {
  // ================================
  // TOKEN HEADERS
  // ================================

  private getHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();

      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  // ================================
  // FETCH STORIES
  // ================================

  fetchStories = async (): Promise<ApiStory[]> => {
    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.FETCH_STORIES}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      let storyArray: ApiStory[] = [];

      if (Array.isArray(data)) {
        storyArray = data;
      } else if (data?.stories && Array.isArray(data.stories)) {
        storyArray = data.stories;
      } else if (data?.data && Array.isArray(data.data)) {
        storyArray = data.data;
      } else if (data?.products && Array.isArray(data.products)) {
        storyArray = data.products;
      }

      return storyArray;
    } catch (error) {
      console.error('❌ Fetch stories API error:', error);
      return [];
    }
  };

  // ================================
  // MARK STORY AS VIEWED
  // ================================

  markStoryAsViewed = async (storyId: string): Promise<ViewedStoryResponse> => {
    if (!storyId) {
      return {
        success: false,
        message: 'Story ID is required',
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.MARK_STORY_VIEWED}`,
        {
          method: 'POST',
          headers: await this.getHeaders(),
          body: JSON.stringify({
            storyId,
          }),
        },
      );

      return {
        success: true,
        message: data?.message || 'Story marked as viewed successfully',
      };
    } catch (error) {
      console.error('❌ Mark story viewed API error:', error);

      return {
        success: false,
        message: 'Failed to mark story as viewed',
      };
    }
  };

  // ================================
  // FETCH VIEWED STORIES
  // ================================

  fetchViewedStories = async (): Promise<string[]> => {
    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.FETCH_VIEWED_STORIES}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      const viewedStories = data?.viewedStories || data?.data || data;
      
      return Array.isArray(viewedStories) ? viewedStories : [];
    } catch (error) {
      console.error('❌ Fetch viewed stories API error:', error);
      return [];
    }
  };
}

// Export singleton instance
export const storiesApi = new StoriesApi();
