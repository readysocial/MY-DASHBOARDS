import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/api';
import { 
  ActivateDeactivateListenerRequest, 
  ActivateDeactivateListenerResponse,
  Listener,
  ListenerErrorResponse,
  InviteListenerRequest,
  InviteListenerResponse
} from './types';

export const activateDeactivateListener = async (
  listenerId: string,
  data: ActivateDeactivateListenerRequest
): Promise<ActivateDeactivateListenerResponse> => {
  try {
    const response = await fetch(`${API_URL}/listeners/${listenerId}/status`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to update listener status');
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const getListener = async (listenerId: string): Promise<Listener> => {
  try {
    const response = await fetch(`${API_URL}/listeners/${listenerId}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch listener');
    }

    return data.listener;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const updateListener = async (
  listenerId: string,
  data: Partial<Listener>
): Promise<Listener> => {
  try {
    const response = await fetch(`${API_URL}/listeners/${listenerId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to update listener');
    }

    return responseData.listener;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const createListener = async (data: Omit<Listener, '_id'>): Promise<Listener> => {
  try {
    const response = await fetch(`${API_URL}/listeners`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to create listener');
    }

    return responseData.listener;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const deleteListener = async (listenerId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/listeners/${listenerId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete listener');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
};

export const inviteListener = async (data: InviteListenerRequest): Promise<InviteListenerResponse> => {
  try {
    const response = await fetch(`${API_URL}/listeners/invite`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to send listener invitation');
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}; 

export const updateListenerAvailability = async (
  listenerId: string,
  availability: Array<{
    dayOfWeek: string;
    times: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  }>
): Promise<Listener> => {
  try {
    const response = await fetch(`${API_URL}/listeners/${listenerId}/availability`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ availability }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to update listener availability');
    }

    return responseData.listener;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}; 