import React, { useState, useEffect } from 'react';
import { Download, Eye, MessageCircle } from 'lucide-react';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { confirm } from '@/lib/confirm';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageError } from '@/components/ui/page-error';
import { InlineAlert } from '@/components/ui/inline-alert';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
} from '@/components/ui/table';
import { TableCard } from '@/components/ui/table-card';
import { TablePagination } from '@/components/ui/table-pagination';
import { TableCardSearch } from '@/components/ui/table-search';
import { StatusBadge, statusToneFrom } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';

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
  } | null; // <-- FIXED: Allow listener to be null
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

interface NotificationChannelOptions {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  channels: NotificationChannelOptions;
}

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  userId,
  onClose,
}) => {
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
          headers: getAuthHeaders(),
        });
        console.log(
          `[UserDetailsModal] User details response status: ${response.status}`,
        );
        if (response.status === 401) {
          console.log("[UserDetailsModal] Handling 401 Unauthorized");
          return handleUnauthorized(response);
        }
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[UserDetailsModal] Failed to fetch user details. Status: ${response.status}, Body:`,
            errorText,
          );
          throw new Error(
            `Failed to fetch user details: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }
        const data = await response.json();
        console.log("[UserDetailsModal] User details fetched:", data);
        setUser(data.user);
      } catch (err) {
        console.error("[UserDetailsModal] Error fetching user details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user details",
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserSessions = async () => {
      if (!validateToken()) {
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/sessions/user/${userId}/sessions`,
          {
            headers: getAuthHeaders(),
          },
        );
        if (response.status === 401) {
          return handleUnauthorized(response);
        }
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch user sessions: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }
        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError((prevError) =>
          prevError
            ? `${prevError}; Failed to fetch user sessions`
            : "Failed to fetch user sessions",
        );
      }
    };

    fetchUserDetails();
    fetchUserSessions();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
        <div className="w-full max-w-lg space-y-3 rounded-xl border border-rs-border bg-rs-surface p-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg space-y-4 rounded-xl border border-rs-border bg-rs-surface p-6">
          <InlineAlert variant="error">{error || "User not found"}</InlineAlert>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose}>
            Close
          </Button>
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
                  <label className="text-sm font-semibold text-gray-700">
                    Name
                  </label>
                  {/* --- HANDLE EDGE CASE: anonymousName null/undefined --- */}
                  <p className="text-black font-medium text-base">
                    {user.anonymousName || "Anonymous User"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                      user.verified
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.verified ? "Verified" : "Unverified"}
                  </span>
                </div>
                {/* --- HANDLE EDGE CASE: contact null/undefined --- */}
                {user.contact && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Phone
                    </label>
                    <p className="text-black font-medium text-base">
                      {user.contact}
                    </p>
                  </div>
                )}
                {/* --- HANDLE EDGE CASE: createdAt null/undefined --- */}
                {user.createdAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Joined
                    </label>
                    <p className="text-black font-medium text-base">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
                {user.updatedAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Last Updated
                    </label>
                    <p className="text-black font-medium text-base">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  User Sessions
                </h3>
                {sessions.length > 0 ? (
                  <ul className="mt-2 space-y-3">
                    {sessions.map((session) => (
                      <li
                        key={session._id}
                        className="border p-4 rounded-lg bg-gray-50 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">
                              Listener:
                            </span>
                            {/* --- FIXED: Check if listener exists before accessing name --- */}
                            <span className="text-black font-medium">
                              {session.listener
                                ? session.listener.name
                                : "Unknown Listener"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">
                              Status:
                            </span>
                            <span
                              className={`font-medium px-2 py-1 rounded-full text-sm ${
                                session.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : session.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : session.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {session.status.charAt(0).toUpperCase() +
                                session.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 font-semibold w-20">
                              Time:
                            </span>
                            <span className="text-black font-medium">
                              {new Date(session.time).toLocaleString()}
                            </span>
                          </div>
                          {session.meetingLink && (
                            <div className="flex items-center">
                              <span className="text-gray-700 font-semibold w-20">
                                Meeting:
                              </span>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // --- CHANGED DEFAULT SORTING ---
  const [sortBy, setSortBy] = useState("createdAt"); // Default to createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // Default to descending (newest first)
  const [isSearching, setIsSearching] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannelOptions>({
    inApp: true,
    push: false,
    email: false
  });

  const fetchUsers = async () => {
    console.log(
      `[Users] Fetching users - Page: ${currentPage}, Sort: ${sortBy} ${sortOrder}`,
    );
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
          headers: getAuthHeaders(),
        },
      );
      console.log(`[Users] Users fetch response status: ${response.status}`);
      if (response.status === 401) {
        console.log("[Users] Handling 401 Unauthorized for users list");
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Users] Failed to fetch users. Status: ${response.status}, Body:`,
          errorText,
        );
        throw new Error(
          `Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      const data: PaginatedResponse = await response.json();
      console.log("[Users] Users fetched (raw):", data);
      // --- FIX: Map backend `id` to frontend `id` ---
      // --- CHANGED: Simplified fallback logic, no firstName/lastName ---
      const mappedUsers: User[] = data.users.map((user) => ({
        id: user.id, // Map API 'id' to frontend 'id'
        anonymousName: user.anonymousName || "Anonymous User", // Direct fallback
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        contact: user.contact,
      }));
      console.log("[Users] Users mapped:", mappedUsers);
      setUsers(mappedUsers);
      setTotalUsers(data.total);
    } catch (err) {
      console.error("[Users] Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
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
          headers: getAuthHeaders(),
        },
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
        console.error(
          `[Users] Failed to search users. Status: ${response.status}, Body:`,
          errorText,
        );
        throw new Error(
          `Failed to search users: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      const data = await response.json();
      console.log("[Users] Search results:", data);
      // Handle response - backend returns {users: [...]} not {user: [...]}
      const userData = data.users
        ? Array.isArray(data.users)
          ? data.users
          : [data.users]
        : [];
      // Map the search results to match User interface
      // --- CHANGED: Simplified fallback logic in search results mapping ---
      const mappedUsers: User[] = userData.map((user: any) => ({
        id: user.id, // API returns 'id'
        anonymousName: user.anonymousName || "Anonymous User", // Direct fallback
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        contact: user.contact,
      }));
      console.log("[Users] Search results mapped:", mappedUsers);
      setUsers(mappedUsers);
      setTotalUsers(mappedUsers.length);
    } catch (err) {
      console.error("[Users] Error searching users:", err);
      setError(err instanceof Error ? err.message : "Failed to search users");
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

    const confirmed = await confirm({
      title: 'Send Notification',
      description: 'Are you sure you want to send this notification to the user?',
      confirmText: 'Send',
      variant: 'default',
    });
    if (!confirmed) return;

    try {
      const notificationData: NotificationRequest = {
        userId,
        title: notificationTitle,
        message: notificationMessage,
        channels: notificationChannels
      };
      const response = await fetch(`${API_URL}/notifications/send`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });
      console.log(
        `[Users] Notification send response status: ${response.status}`,
      );
      if (response.status === 401) {
        console.log(
          "[Users] Handling 401 Unauthorized for sending notification",
        );
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Users] Failed to send notification. Status: ${response.status}, Body:`,
          errorText,
        );
        throw new Error(
          `Failed to send notification: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      const result = await response.json();
      console.log("[Users] Notification sent successfully:", result);
      toast.success("Notification sent successfully!");
      setShowNotificationModal(false);
      resetNotificationForm();
    } catch (error) {
      console.error("[Users] Error sending notification:", error);
      toast.error("Failed to send notification. Please try again.");
    }
  };

  const resetNotificationForm = () => {
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationChannels({
      inApp: true,
      push: false,
      email: false,
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
      console.error(
        "[Users] Attempted to open notification modal with undefined/empty ID",
      );
      return; // Prevent action if ID is invalid
    }
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
        method: "GET",
        headers: getAuthHeaders(),
      });
      console.log(`[Users] Export users response status: ${response.status}`);
      if (response.status === 401) {
        console.log("[Users] Handling 401 Unauthorized for exporting users");
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Users] Failed to export users. Status: ${response.status}, Body:`,
          errorText,
        );
        throw new Error(
          `Failed to export users: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log("[Users] Users exported successfully");
    } catch (error) {
      console.error("[Users] Error exporting users:", error);
      toast.error("Failed to export users. Please try again.");
    }
  };

  // --- FIXED renderUserCard function usage ---
  // The function itself is fine, but we need to use it correctly in the map.
  // Note: This function is not used in the final render, but kept for reference.
  const renderUserCard = (user: User) => (
    <div
      key={user.id}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">
            {user.anonymousName || "Anonymous User"}
          </h3>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            user.verified
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.verified ? "Verified" : "Unverified"}
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
            <span className="font-medium">Registered:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        )}
        {/* --- HANDLE EDGE CASE: updatedAt null/undefined --- */}
        {user.updatedAt && (
          <div>
            <span className="font-medium">Last Updated:</span>{" "}
            {new Date(user.updatedAt).toLocaleDateString()}
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
          aria-label={`View details for ${user.anonymousName || "Anonymous User"}`}
        >
          <Eye className="h-5 w-5" />
        </button>
        <button
          className="text-purple-500 hover:text-purple-700"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenNotificationModal(user.id); // Now uses the mapped `id`
          }}
          aria-label={`Send notification to ${user.anonymousName || "Anonymous User"}`}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Browse and manage registered platform users."
        actions={
          <Button variant="outline" size="sm" onClick={exportUsers}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Export
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error ? (
        <PageError message={error} onRetry={() => void fetchUsers()} />
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-rs-border bg-rs-surface p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium text-rs-text">
                      {user.anonymousName || "Anonymous User"}
                    </h3>
                    <StatusBadge
                      tone={statusToneFrom(
                        user.verified ? "verified" : "unverified"
                      )}
                    >
                      {user.verified ? "Verified" : "Unverified"}
                    </StatusBadge>
                  </div>
                  <div className="space-y-1 text-xs text-rs-text-muted">
                    {user.contact ? <p>{user.contact}</p> : null}
                    {user.createdAt ? (
                      <p>
                        Registered{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex justify-end gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rs-text-muted"
                      onClick={() => handleViewUser(user.id)}
                      aria-label={`View details for ${user.anonymousName || "Anonymous User"}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rs-text-muted"
                      onClick={() => handleOpenNotificationModal(user.id)}
                      aria-label={`Send notification to ${user.anonymousName || "Anonymous User"}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-rs-text-muted">
                {isSearching
                  ? `No users found matching "${searchTerm}"`
                  : "No users available"}
              </p>
            )}
          </div>

          <div className="hidden sm:block">
            <TableCard
              title="All users"
              description={`${totalUsers} user${totalUsers === 1 ? "" : "s"}`}
              actions={
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2"
                >
                  <TableCardSearch
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name…"
                    aria-label="Search users"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Search
                  </Button>
                </form>
              }
              footer={
                !isSearching ? (
                  <TablePagination
                    page={currentPage}
                    totalPages={Math.ceil(totalUsers / usersPerPage)}
                    total={totalUsers}
                    itemLabel="users"
                    onPageChange={setCurrentPage}
                  />
                ) : undefined
              }
            >
              <Table variant="plain">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <SortableTableHead
                      column="createdAt"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      className="hidden lg:table-cell"
                    >
                      Registration
                    </SortableTableHead>
                    <TableHead className="hidden md:table-cell">
                      Last Updated
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-rs-text">
                          {user.anonymousName || "Anonymous User"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.contact || "N/A"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-rs-text-muted lg:table-cell">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-rs-text-muted md:table-cell">
                          {user.updatedAt
                            ? new Date(user.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone={statusToneFrom(
                              user.verified ? "verified" : "unverified"
                            )}
                          >
                            {user.verified ? "Verified" : "Unverified"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rs-text-muted"
                              onClick={() => handleViewUser(user.id)}
                              aria-label={`View details for ${user.anonymousName || "Anonymous User"}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rs-text-muted"
                              onClick={() =>
                                handleOpenNotificationModal(user.id)
                              }
                              aria-label={`Send notification to ${user.anonymousName || "Anonymous User"}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : isSearching ? (
                    <TableEmpty colSpan={6}>
                      No users found matching &quot;{searchTerm}&quot;
                    </TableEmpty>
                  ) : (
                    <TableEmpty colSpan={6}>No users available</TableEmpty>
                  )}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        </>
      )}

      {selectedUserId && !showNotificationModal && (
        <UserDetailsModal
          key={`user-details-${selectedUserId}`}
          userId={selectedUserId}
          onClose={handleCloseUserDetailsModal}
        />
      )}

      {showNotificationModal && selectedUserId ? (
        <Modal
          open
          onClose={handleCloseNotificationModal}
          title="Send notification"
          description="Deliver to this user through one or more channels."
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseNotificationModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => sendNotification(selectedUserId)}
              >
                Send
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-rs-text-muted">
                Title
              </span>
              <Input
                id="notification-title"
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Notification title"
                className="h-9 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-rs-text-muted">
                Message
              </span>
              <textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
                placeholder="Notification message"
                className="w-full rounded-md border border-rs-border bg-rs-surface px-3 py-2 text-sm text-rs-text placeholder:text-rs-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-medium text-rs-text-muted">
                Channels
              </legend>
              {(
                [
                  ["inApp", "In-app"],
                  ["push", "Push"],
                  ["email", "Email"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-rs-page"
                >
                  <input
                    type="checkbox"
                    checked={notificationChannels[key]}
                    onChange={(e) =>
                      setNotificationChannels((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="h-3.5 w-3.5 rounded border-rs-border text-rs-primary focus:ring-rs-primary"
                  />
                  <span className="text-sm text-rs-text">{label}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default Users;
