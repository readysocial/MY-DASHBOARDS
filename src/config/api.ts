export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  sessions: {
    all: `${API_URL}/sessions/all`,
    create: `${API_URL}/sessions`,
    update: (id: string) => `${API_URL}/sessions/${id}`,
    delete: (id: string) => `${API_URL}/sessions/${id}`,
    topics: `${API_URL}/sessions/topics`,
    listenerSessions: `${API_URL}/sessions/listener/sessions`,
    getListenerSessions: `${API_URL}/sessions/listener/sessions`,
    getRelatedSessions: (sessionId: string) =>
      `${API_URL}/sessions/listener/sessions/${sessionId}/related`,
    addComment: (sessionId: string) => `${API_URL}/sessions/${sessionId}/comment`,
    recommendRepeat: (sessionId: string) =>
      `${API_URL}/sessions/${sessionId}/recommend-repeat`,
    fullTree: (sessionId: string) => `${API_URL}/sessions/${sessionId}/full-tree`, // 👈 new
  },

  admin: {
    sessions: {
      updateStatus: (sessionId: string) =>
        `${API_URL}/sessions/${sessionId}/update-status`,
      addMeetingLink: (sessionId: string) =>
        `${API_URL}/sessions/${sessionId}/add-link`,
      refund: (sessionId: string) =>
        `${API_URL}/sessions/${sessionId}/refund`,
    },
    sparks: {
      stats: `${API_URL}/admin/dashboard/spark-stats`,
      wallets: `${API_URL}/admin/dashboard/wallets`,
      walletDetails: (userId: string) =>
        `${API_URL}/admin/dashboard/wallets/${userId}`,
      walletStatus: (userId: string) =>
        `${API_URL}/admin/dashboard/wallets/${userId}/status`,
      adjustSparks: `${API_URL}/admin/dashboard/adjust-sparks`,
      transactions: `${API_URL}/admin/dashboard/transactions`,
    },
    payments: {
      list: `${API_URL}/admin/dashboard/payments`,
      details: (id: string) => `${API_URL}/admin/dashboard/payments/${id}`,
      verify: (reference: string) =>
        `${API_URL}/admin/dashboard/payments/${encodeURIComponent(reference)}/verify`,
    },
    pricing: `${API_URL}/admin/pricing-config`,
    analytics: `${API_URL}/admin/dashboard/analytics`,
    supportLookup: `${API_URL}/admin/support/lookup`,
    listenersPerformance: `${API_URL}/admin/listeners/performance`,
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
    sendOtp: `${API_URL}/listeners/password-reset/send-otp`,
    confirmOtp: `${API_URL}/listeners/password-reset/confirm-otp`,
    resetPassword: `${API_URL}/listeners/password-reset`,
  },
};