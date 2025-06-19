import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/api';

interface AddTopicResponse {
  message: string;
}

interface SessionTopic {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface GetTopicsResponse {
  topics: SessionTopic[];
}

export const getSessionTopics = async (): Promise<GetTopicsResponse> => {
  try {
    const response = await fetch(`${API_URL}/sessions/topics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch topics');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const addSessionTopic = async (topic: string): Promise<AddTopicResponse> => {
  try {
    const response = await fetch(`${API_URL}/sessions/topics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add topic');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}; 