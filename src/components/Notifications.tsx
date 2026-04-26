import React, { useEffect, useState, useRef } from 'react';
import { Send, Search, X, Users, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { confirm } from '@/lib/confirm';

// Listener targets ("all" and "listeners") are intentionally omitted:
// the backend doesn't deliver to listeners yet — push/email lookups throw
// and in-app rows are orphaned. Re-add once listener notifications are
// supported end-to-end.
type Target = 'users' | 'active_users' | 'inactive_users' | 'selected';

interface SelectedUser {
  id: string;
  anonymousName: string;
}

interface NotificationChannelOptions {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

const isTargetSelected = (t: Target | ''): t is Target => t !== '';

const TARGET_LABELS: Record<Target, string> = {
  users: 'All Users',
  active_users: 'Active Users (sessions in last 30 days)',
  inactive_users: 'Inactive Users (no sessions in 30 days)',
  selected: 'Selected Users',
};

const Notifications: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [target, setTarget] = useState<Target | ''>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<NotificationChannelOptions>({
    inApp: true,
    push: false,
    email: false,
  });
  const [isSending, setIsSending] = useState(false);

  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  // User picker state
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial users when "selected" target is chosen
  useEffect(() => {
    if (target === 'selected') {
      fetchUsers();
    }
  }, [target]);

  const fetchUsers = async () => {
    if (!validateToken()) return;
    try {
      setIsSearching(true);
      const response = await fetch(`${API_URL}/users?skip=0&limit=20&sortBy=createdAt&sortOrder=desc`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) return handleUnauthorized(response);
      if (!response.ok) return;
      const data = await response.json();
      setSearchResults(
        (data.users || []).map((u: any) => ({
          id: u.id,
          anonymousName: u.anonymousName || 'Anonymous User',
        }))
      );
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (!validateToken()) return;
    if (!term.trim()) {
      fetchUsers();
      return;
    }
    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_URL}/users/search/anonymous-name?anonymousName=${encodeURIComponent(term)}`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 401) return handleUnauthorized(response);
      if (response.status === 404) {
        setSearchResults([]);
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const userData = data.users
        ? Array.isArray(data.users) ? data.users : [data.users]
        : [];
      setSearchResults(
        userData.map((u: any) => ({
          id: u.id,
          anonymousName: u.anonymousName || 'Anonymous User',
        }))
      );
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(value), 300);
  };

  const toggleUser = (user: SelectedUser) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const isFormValid =
    target !== '' &&
    title.trim() &&
    message.trim() &&
    (channels.inApp || channels.push || channels.email) &&
    (target !== 'selected' || selectedUsers.length > 0);

  const handleSend = async () => {
    if (!validateToken() || !isFormValid || !isTargetSelected(target)) return;

    const targetLabel = target === 'selected'
      ? `${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}`
      : TARGET_LABELS[target].toLowerCase();

    const confirmed = await confirm({
      title: 'Send Bulk Notification',
      description: `Send this notification to ${targetLabel}?`,
      confirmText: 'Send',
      variant: 'default',
    });
    if (!confirmed) return;

    setIsSending(true);
    try {
      const body: any = { title, message, channels, target };
      if (target === 'selected') {
        body.userIds = selectedUsers.map((u) => u.id);
      }

      const response = await fetch(`${API_URL}/notifications/send-bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401) return handleUnauthorized(response);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send notifications');
      }

      showAlert('success', 'Notifications sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-gray-700" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Send Notification</h2>
      </div>

      {alert.type && (
        <div
          className={`mb-6 p-4 rounded-md ${
            alert.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-400'
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Target audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-red-500 focus:border-red-500"
          >
            <option value="" disabled>
              Select target audience
            </option>
            {Object.entries(TARGET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* User picker — only when target is "selected" */}
        {target === 'selected' && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
            <label className="block text-sm font-medium text-gray-700">
              Select Users ({selectedUsers.length} selected)
            </label>

            {/* Selected users as badges */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {user.anonymousName}
                    <button
                      onClick={() => removeUser(user.id)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Results list */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No users found</div>
              ) : (
                searchResults.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.some((u) => u.id === user.id)}
                      onChange={() => toggleUser(user)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 text-sm text-gray-900">{user.anonymousName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your notification message..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Delivery channels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Channels
          </label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={channels.inApp}
                onChange={(e) => setChannels((prev) => ({ ...prev, inApp: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">In-App Notification</span>
            </label>
            <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={channels.push}
                onChange={(e) => setChannels((prev) => ({ ...prev, push: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">Push Notification</span>
            </label>
            <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) => setChannels((prev) => ({ ...prev, email: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">Email Notification</span>
            </label>
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={isSending || !isFormValid}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send Notification'}
        </Button>
      </div>
    </div>
  );
};

export default Notifications;
