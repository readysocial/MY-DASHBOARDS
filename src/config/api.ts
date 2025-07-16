export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  sessions: {
    all: `${API_URL}/sessions/all`,
    create: `${API_URL}/sessions`,
    update: (id: string) => `${API_URL}/sessions/${id}`,
    delete: (id: string) => `${API_URL}/sessions/${id}`,
    topics: `${API_URL}/sessions/topics`,
    listenerSessions: `${API_URL}/sessions/listener/sessions`,
    getListenerSessions: (listenerId: string) => `${API_URL}/sessions/listener/${listenerId}/sessions`,
    getRelatedSessions: (sessionId: string) => `${API_URL}/sessions/listener/sessions/${sessionId}/related`,
    addMeetingLink: (sessionId: string) => `${API_URL}/sessions/${sessionId}/add-link`,
    updateStatus: (sessionId: string) => `${API_URL}/sessions/${sessionId}/update-status`,
    addComment: (sessionId: string) => `${API_URL}/sessions/${sessionId}/comment`,
    recommendRepeat: (sessionId: string) => `${API_URL}/sessions/${sessionId}/recommend-repeat`,
  },
  listeners: {
    all: `${API_URL}/listeners`,
    create: `${API_URL}/listeners`,
    update: (id: string) => `${API_URL}/listeners/${id}`,
    delete: (id: string) => `${API_URL}/listeners/${id}`,
    validateToken: `${API_URL}/listeners/validate-token`,
    register: `${API_URL}/listeners/register`,
    registrationData: `${API_URL}/listeners/registration-data`,
    login: `${API_URL}/listeners/login`,
    profile: (id: string) => `${API_URL}/listeners/${id}`,
    updateProfile: (id: string) => `${API_URL}/listeners/${id}`,
    updateTopics: (id: string) => `${API_URL}/listeners/${id}/topics`,
    getListenerTopics: (id: string) => `${API_URL}/listeners/${id}/topics`,
    deleteListenerTopics: (id: string) => `${API_URL}/listeners/${id}/topics`,
  }
};
