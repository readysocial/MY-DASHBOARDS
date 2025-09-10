import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, MessageCircle } from 'lucide-react';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';

// --- ADJUSTED INTERFACE: Removed firstName, lastName as they are not part of the User object used for display ---
interface User {
  id: string; // This will be mapped from backend `id`
  anonymousName?: string | null; // Allow null
  verified: boolean;
  createdAt?: string | null; // Allow null
  updatedAt?: string | null; // Allow null
  contact?: string | null; // Allow null
}

interface Session {
  _id: string;
  user: {
    _id: string;
    anonymousName: string;
  };
  listener: {
    _id: string;
    name: string;
    description: string;
    gender: string;
    active: boolean;
  };
  topic: string;
  time: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  meetingLink?: string;
  reflectData: {
    userReflectionData: any[];
  };
}

// --- ADJUSTED INTERFACE: Removed firstName, lastName from the raw API user structure as well ---
interface PaginatedResponse {
  users: Array<{
    id: string; // API returns 'id'
    anonymousName?: string | null; // Allow null
    verified: boolean;
    createdAt?: string | null; // Allow null
    updatedAt?: string | null; // Allow null
    email?: string | null; // Allow null
    contact?: string | null; // Allow null
    // Add other fields returned by your backend API
  }>;
  total: number;
  skip: number;
  limit: number;
  currentPage: number;
}

interface NotificationOptions {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  options: NotificationOptions;
}

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      console.log(`[UserDetailsModal] Fetching details for user ID: ${userId}`);
      if (!validateToken()) {
        console.log("[UserDetailsModal] Token validation failed.");
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers: getAuthHeaders()
        });
        console.log(`[UserDetailsModal] User details response status: ${response.status}`);
        if (response.status === 401) {
          console.log("[UserDetailsModal] Handling 401 Unauthorized");
          return handleUnauthorized(response);
        }
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[UserDetailsModal] Failed to fetch user details. Status: ${response.status}, Body:`, errorText);
          throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log("[UserDetailsModal] User details fetched:", data);
        setUser(data.user);
      } catch (err) {
        console.error('[UserDetailsModal] Error fetching user details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserSessions = async () => {
      console.log(`[UserDetailsModal] Fetching sessions for user ID: ${userId}`);
      if (!validateToken()) {
        console.log("[UserDetailsModal] Token validation failed for sessions.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/sessions/user/${userId}/sessions`, {
          headers: getAuthHeaders()
        });
        console.log(`[UserDetailsModal] User sessions response status: ${response.status}`);
        if (response.status === 401) {
          console.log("[UserDetailsModal] Handling 401 Unauthorized for sessions");
          return handleUnauthorized(response);
        }
        if (!response.ok) {
           const errorText = await response.text();
           console.error(`[UserDetailsModal] Failed to fetch user sessions. Status: ${response.status}, Body:`, errorText);
          throw new Error(`Failed to fetch user sessions: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log("[UserDetailsModal] User sessions fetched:", data);
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('[UserDetailsModal] Error fetching user sessions:', err);
        setError(prevError => prevError ? `${prevError}; Failed to fetch user sessions` : 'Failed to fetch user sessions');
      }
    };

    fetchUserDetails();
    fetchUserSessions();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="bg-white p-6 rounded-lg w-full max-w-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="bg-white p-6 rounded-lg w-full max-w-lg">
          <p className="text-red-500 text-center">{error || 'User not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[1000]">
      <div className="bg-white rounded-lg w-full max-w-lg my-8">
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 p-6 border-b">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <span className="h-6 w-6">✖</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Name</label>
                  {/* --- HANDLE EDGE CASE: anonymousName null/undefined --- */}
                  <p className="text-black font-medium text-base">
                    {user.anonymousName || 'Anonymous User'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                    user.verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {/* --- HANDLE EDGE CASE: contact null/undefined --- */}
                {user.contact && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <p className="text-black font-medium text-base">{user.contact}</p>
                  </div>
                )}
                {/* --- HANDLE EDGE CASE: createdAt null/undefined --- */}
                {user.createdAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Joined</label>
                    <p className="text-black font-medium text-base">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
                {user.updatedAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Last Updated</label>
                    <p className="text-black font-medium text-base">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">User Sessions</h3>
                {sessions.length > 0 ? (
                  <ul className="mt-2 space-y-3">
                    {sessions.map(session => (
                      <li key={session._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">Listener:</span>
                            <span className="text-black font-medium">{session.listener.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">Status:</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-sm ${
                              session.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : session.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">Time:</span>
                            <span className="text-black font-medium">
                              {new Date(session.time).toLocaleString()}
                            </span>
                          </div>
                          {session.meetingLink && (
                            <div className="flex items-center">
                              <span className="text-gray-700 font-semibold w-20">Meeting:</span>
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 p-4 rounded-lg bg-gray-50 border">
                    <p className="text-black font-medium text-base text-center">
                      No sessions found for this user.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Users: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // --- CHANGED DEFAULT SORTING ---
  const [sortBy, setSortBy] = useState('createdAt'); // Default to createdAt
  const [sortOrder, setSortOrder] = useState('desc'); // Default to descending (newest first)
  const [isSearching, setIsSearching] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationOptions, setNotificationOptions] = useState<NotificationOptions>({
    inApp: true,
    push: false,
    email: false
  });

  const fetchUsers = async () => {
    console.log(`[Users] Fetching users - Page: ${currentPage}, Sort: ${sortBy} ${sortOrder}`);
    if (!validateToken()) {
        console.log("[Users] Token validation failed for fetching users.");
        return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const skip = (currentPage - 1) * usersPerPage;
      const response = await fetch(
        `${API_URL}/users?skip=${skip}&limit=${usersPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: getAuthHeaders()
        }
      );
      console.log(`[Users] Users fetch response status: ${response.status}`);
      if (response.status === 401) {
         console.log("[Users] Handling 401 Unauthorized for users list");
         return handleUnauthorized(response);
      }
      if (!response.ok) {
         const errorText = await response.text();
         console.error(`[Users] Failed to fetch users. Status: ${response.status}, Body:`, errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data: PaginatedResponse = await response.json();
      console.log("[Users] Users fetched (raw):", data);
      // --- FIX: Map backend `id` to frontend `id` ---
      // --- CHANGED: Simplified fallback logic, no firstName/lastName ---
      const mappedUsers: User[] = data.users.map(user => ({
        id: user.id, // Map API 'id' to frontend 'id'
        anonymousName: user.anonymousName || 'Anonymous User', // Direct fallback
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        contact: user.contact,
      }));
      console.log("[Users] Users mapped:", mappedUsers);
      setUsers(mappedUsers);
      setTotalUsers(data.total);
    } catch (err) {
      console.error('[Users] Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (term: string) => {
    console.log(`[Users] Searching users for term: ${term}`);
    if (!validateToken()) {
        console.log("[Users] Token validation failed for searching users.");
        return;
    }
    if (!term.trim()) {
      // Reset to regular fetch if search term is empty
      setIsSearching(false);
      setCurrentPage(1);
      fetchUsers();
      return;
    }
    try {
      setIsLoading(true);
      setIsSearching(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/users/search/anonymous-name?anonymousName=${encodeURIComponent(term)}`,
        {
          headers: getAuthHeaders()
        }
      );
      console.log(`[Users] Search users response status: ${response.status}`);
      if (response.status === 401) {
         console.log("[Users] Handling 401 Unauthorized for searching users");
         return handleUnauthorized(response);
      }
      if (response.status === 404) {
        // No user found - this is not an error, just empty results
        console.log("[Users] No user found for search term");
        setUsers([]);
        setTotalUsers(0);
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
         const errorText = await response.text();
         console.error(`[Users] Failed to search users. Status: ${response.status}, Body:`, errorText);
        throw new Error(`Failed to search users: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      console.log("[Users] Search results:", data);
      // Handle response - backend returns {users: [...]} not {user: [...]}
      const userData = data.users ? (Array.isArray(data.users) ? data.users : [data.users]) : [];
      // Map the search results to match User interface
      // --- CHANGED: Simplified fallback logic in search results mapping ---
      const mappedUsers: User[] = userData.map((user: any) => ({
        id: user.id, // API returns 'id'
        anonymousName: user.anonymousName || 'Anonymous User', // Direct fallback
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        contact: user.contact,
      }));
      console.log("[Users] Search results mapped:", mappedUsers);
      setUsers(mappedUsers);
      setTotalUsers(mappedUsers.length);
    } catch (err) {
      console.error('[Users] Error searching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const sendNotification = async (userId: string) => {
    console.log(`[Users] Sending notification to user ID: ${userId}`);
    if (!validateToken()) {
        console.log("[Users] Token validation failed for sending notification.");
        return;
    }
    try {
      const notificationData: NotificationRequest = {
        userId,
        title: notificationTitle,
        message: notificationMessage,
        options: notificationOptions
      };
      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      console.log(`[Users] Notification send response status: ${response.status}`);
      if (response.status === 401) {
         console.log("[Users] Handling 401 Unauthorized for sending notification");
         return handleUnauthorized(response);
      }
      if (!response.ok) {
         const errorText = await response.text();
         console.error(`[Users] Failed to send notification. Status: ${response.status}, Body:`, errorText);
        throw new Error(`Failed to send notification: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const result = await response.json();
      console.log("[Users] Notification sent successfully:", result);
      alert('Notification sent successfully!');
      setShowNotificationModal(false);
      resetNotificationForm();
    } catch (error) {
      console.error('[Users] Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const resetNotificationForm = () => {
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationOptions({
      inApp: true,
      push: false,
      email: false
    });
  };

  useEffect(() => {
    if (!isSearching) {
      fetchUsers();
    }
  }, [currentPage, usersPerPage, sortBy, sortOrder]); // Removed isSearching from dependencies

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchUsers(searchTerm);
  };

  const handleViewUser = (userId: string) => {
    console.log(`[Users] View user clicked for ID: ${userId}`);
    if (!userId) {
        console.error("[Users] Attempted to view user with undefined/empty ID");
        return; // Prevent action if ID is invalid
    }
    setShowNotificationModal(false);
    setSelectedUserId(userId);
  };

  const handleCloseUserDetailsModal = () => {
    console.log("[Users] Closing user details modal");
    setSelectedUserId(null);
  };

  const handleOpenNotificationModal = (userId: string) => {
    console.log(`[Users] Open notification modal for user ID: ${userId}`);
    if (!userId) {
        console.error("[Users] Attempted to open notification modal with undefined/empty ID");
        return; // Prevent action if ID is invalid
    }
    // setSelectedUserId(null); // This line was causing the issue
    setSelectedUserId(userId);
    setShowNotificationModal(true);
  };

  const handleCloseNotificationModal = () => {
    console.log("[Users] Closing notification modal");
    setShowNotificationModal(false);
    setSelectedUserId(null);
    resetNotificationForm();
  };

  const exportUsers = async () => {
    console.log("[Users] Exporting users");
    if (!validateToken()) {
        console.log("[Users] Token validation failed for exporting users.");
        return;
    }
    try {
      const response = await fetch(`${API_URL}/users/export`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      console.log(`[Users] Export users response status: ${response.status}`);
      if (response.status === 401) {
         console.log("[Users] Handling 401 Unauthorized for exporting users");
         return handleUnauthorized(response);
      }
      if (!response.ok) {
         const errorText = await response.text();
         console.error(`[Users] Failed to export users. Status: ${response.status}, Body:`, errorText);
        throw new Error(`Failed to export users: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log("[Users] Users exported successfully");
    } catch (error) {
      console.error('[Users] Error exporting users:', error);
      alert('Failed to export users. Please try again.');
    }
  };

  // --- FIXED renderUserCard function usage ---
  // The function itself is fine, but we need to use it correctly in the map.
  // Note: This function is not used in the final render, but kept for reference.
  const renderUserCard = (user: User) => (
    <div key={user.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{user.anonymousName || 'Anonymous User'}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          user.verified
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {user.verified ? 'Verified' : 'Unverified'}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        {/* --- HANDLE EDGE CASE: contact null/undefined --- */}
        {user.contact && (
          <div>
            <span className="font-medium">Phone:</span> {user.contact}
          </div>
        )}
        {/* --- HANDLE EDGE CASE: createdAt null/undefined --- */}
        {user.createdAt && (
          <div>
            <span className="font-medium">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}
          </div>
        )}
        {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
        {user.updatedAt && (
          <div>
            <span className="font-medium">Last Updated:</span> {new Date(user.updatedAt).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          className="text-red-500 hover:text-red-700"
          onClick={(e) => {
              e.stopPropagation();
              handleViewUser(user.id); // Now uses the mapped `id`
          }}
          aria-label={`View details for ${user.anonymousName || 'Anonymous User'}`}
        >
          <Eye className="h-5 w-5" />
        </button>
        <button
          className="text-purple-500 hover:text-purple-700"
          onClick={(e) => {
              e.stopPropagation();
              handleOpenNotificationModal(user.id); // Now uses the mapped `id`
          }}
          aria-label={`Send notification to ${user.anonymousName || 'Anonymous User'}`}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Users</h2>
        <div className="flex space-x-2">
          <button
            className="flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            onClick={exportUsers}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Export Users</span>
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg p-2 bg-white text-gray-800"
            aria-label="Sort by"
          >
            {/* --- CHANGED SORT OPTIONS --- */}
            {/* <option value="anonymousName">Name</option> */}
            <option value="createdAt">Registration Date</option>
            {/* <option value="verified">Status</option> */}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded-lg p-2 bg-white text-gray-800"
            aria-label="Sort order"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchUsers();
            }}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Sort
          </button>
        </div>
      </div>
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by anonymous name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:border-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
          >
            Search
          </button>
        </form>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 text-center">
          Error: {error}
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-4">
            {users.length > 0 ? (
              // --- CORRECTED: Apply key via map, not inside the function ---
              users.map(user => (
                <div key={user.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {/* --- HANDLE EDGE CASE: anonymousName null/undefined --- */}
                      <h3 className="font-medium text-gray-900">{user.anonymousName || 'Anonymous User'}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                     {/* --- HANDLE EDGE CASE: contact null/undefined --- */}
                    {user.contact && (
                      <div>
                        <span className="font-medium">Phone:</span> {user.contact}
                      </div>
                    )}
                    {/* --- HANDLE EDGE CASE: createdAt null/undefined --- */}
                    {user.createdAt && (
                      <div>
                        <span className="font-medium">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
                    {user.updatedAt && (
                      <div>
                        <span className="font-medium">Last Updated:</span> {new Date(user.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleViewUser(user.id); // Now uses the mapped `id`
                      }}
                      aria-label={`View details for ${user.anonymousName || 'Anonymous User'}`}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      className="text-purple-500 hover:text-purple-700"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNotificationModal(user.id); // Now uses the mapped `id`
                      }}
                      aria-label={`Send notification to ${user.anonymousName || 'Anonymous User'}`}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : isSearching ? (
              <div className="text-center py-8 text-gray-500">
                No users found matching "{searchTerm}"
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users available
              </div>
            )}
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full border rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {/* --- HANDLE EDGE CASE: anonymousName null/undefined --- */}
                      <td className="px-4 py-3 text-sm text-gray-900">{user.anonymousName || 'Anonymous User'}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-500">
                        {/* --- HANDLE EDGE CASE: contact null/undefined --- */}
                        {user.contact || 'N/A'}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-500">
                        {/* --- HANDLE EDGE CASE: createdAt null/undefined --- */}
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                        {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewUser(user.id);
                            }}
                            aria-label={`View details for ${user.anonymousName || 'Anonymous User'}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-purple-500 hover:text-purple-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNotificationModal(user.id);
                            }}
                            aria-label={`Send notification to ${user.anonymousName || 'Anonymous User'}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : isSearching ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users found matching "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!isSearching && totalUsers > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from(
                { length: Math.ceil(totalUsers / usersPerPage) },
                (_, index: number) => (
                  // --- FIX: Added missing key prop for pagination buttons ---
                  <button
                    key={index} // <-- THIS WAS MISSING
                    onClick={() => {
                        console.log(`[Users] Pagination clicked - Page ${index + 1}`);
                        setCurrentPage(index + 1);
                    }}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === index + 1
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
      {selectedUserId && !showNotificationModal && (
        <UserDetailsModal
          key={`user-details-${selectedUserId}`}
          userId={selectedUserId}
          onClose={handleCloseUserDetailsModal}
        />
      )}
      {showNotificationModal && selectedUserId && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Notification</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="notification-title" className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input
                      id="notification-title"
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter notification title"
                    />
                  </div>
                  <div>
                    <label htmlFor="notification-message" className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      id="notification-message"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter notification message"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Options</label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={notificationOptions.inApp}
                          onChange={(e) => setNotificationOptions(prev => ({
                            ...prev,
                            inApp: e.target.checked
                          }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">In-App Notification</span>
                      </label>
                      <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={notificationOptions.push}
                          onChange={(e) => setNotificationOptions(prev => ({
                            ...prev,
                            push: e.target.checked
                          }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Push Notification</span>
                      </label>
                      <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={notificationOptions.email}
                          onChange={(e) => setNotificationOptions(prev => ({
                            ...prev,
                            email: e.target.checked
                          }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Email Notification</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => sendNotification(selectedUserId)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={handleCloseNotificationModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;