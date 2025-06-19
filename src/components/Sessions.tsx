import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  X, 
  Eye, 
  Edit2, 
  Video,
  Clock,
  Headphones,
  RefreshCw,
  Tag,
  Hash
} from 'lucide-react';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { addSessionTopic, getSessionTopics } from '../api/sessions/api';

interface User {
  _id: string;
  firstName?: string;  // Add these fields based on your actual user model
  lastName?: string;
  name?: string;
  email: string;
}

interface Listener {
  _id: string;
  name: string;
  description: string;
}

interface SessionTopic {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  _id: string;
  user: User;
  listener: Listener;
  topic: string;
  time: string;
  meetingLink?: string;
  status: SessionStatus; 
  createdAt: string;
  updatedAt: string;
  comment?: string; // Add comment property
}

type SessionProgress = 'scheduled' | 'ongoing' | 'completed';


type SessionStatus = 'successful' | 'unsuccessful' | 'cancelled' | 'pending';

const getSessionProgress = (sessionTime: string): SessionProgress => {
  const sessionDate = new Date(sessionTime);
  const now = new Date();
  
  // Session duration in milliseconds (1 hour)
  const sessionDuration = 60 * 60 * 1000;
  
  // Calculate session end time
  const sessionEndTime = new Date(sessionDate.getTime() + sessionDuration);
  
  if (now < sessionDate) {
    return 'scheduled';
  } else if (now >= sessionDate && now <= sessionEndTime) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

const ProgressBadge: React.FC<{ progress: SessionProgress }> = ({ progress }) => {
  const progressClasses = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'ongoing': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${progressClasses[progress]}`}>
      {progress}
    </span>
  );
};


const rotateAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const RefreshButton: React.FC<{ onClick: () => void; isLoading: boolean }> = ({ onClick, isLoading }) => {
  return (
    <>
      <style>{rotateAnimation}</style>
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors
          flex items-center justify-center ${isLoading ? 'cursor-not-allowed' : ''}`}
        title="Refresh"
      >
        <RefreshCw 
          className={`h-5 w-5 text-gray-600 
            ${isLoading ? 'animate-spin' : 'transform transition-transform hover:rotate-180'}`}
        />
      </button>
    </>
  );
};


// Helper component for status badges
const StatusBadge: React.FC<{ status: Session['status'] }> = ({ status }) => {
  const statusClasses = {
    'successful': 'bg-green-100 text-green-800',
    'unsuccessful': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'pending': 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status]}`}>
      {status}
    </span>
  );
};




const Sessions: React.FC = () => {

  useEffect(() => {
    validateToken();
  }, []);

  // State Management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [comment, setComment] = useState(''); // State for comment
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('time'); // Default sorting field
  const [sortOrder, setSortOrder] = useState('desc'); // Changed default to descending
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, boolean>>({});
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [topics, setTopics] = useState<SessionTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showTopicsPanel, setShowTopicsPanel] = useState(false);

  // Modify fetchSessions to handle all sessions
  const fetchSessions = async () => {
    if (!validateToken()) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/sessions/platform/all?limit=1000`, // Set high limit to get all sessions
        {
          headers: getAuthHeaders()
        }
      );

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sessions');
      }

      if (data && Array.isArray(data.sessions)) {
        const validSessions = data.sessions.filter((session: Session) => 
          session && 
          session._id && 
          session.status
        );

        // Sort all sessions
        const sortedSessions = [...validSessions].sort((a, b) => {
          let compareA, compareB;

          switch (sortBy) {
            case 'user':
              compareA = a.user?.firstName || a.user?.name || '';
              compareB = b.user?.firstName || b.user?.name || '';
              break;
            case 'listener':
              compareA = a.listener?.name || '';
              compareB = b.listener?.name || '';
              break;
            case 'time':
              compareA = new Date(a.time).getTime();
              compareB = new Date(b.time).getTime();
              break;
            case 'topic':
              compareA = a.topic || '';
              compareB = b.topic || '';
              break;
            case 'status':
              compareA = a.status || '';
              compareB = b.status || '';
              break;
            default:
              compareA = new Date(a.time).getTime();
              compareB = new Date(b.time).getTime();
          }

          if (typeof compareA === 'string' && typeof compareB === 'string') {
            return sortOrder === 'asc' 
              ? compareA.localeCompare(compareB)
              : compareB.localeCompare(compareA);
          }

          return sortOrder === 'asc'
            ? (compareA < compareB ? -1 : 1)
            : (compareA > compareB ? -1 : 1);
        });

        setSessions(sortedSessions);
        setTotalSessions(sortedSessions.length);

        // Calculate pagination slice
        const startIndex = (currentPage - 1) * sessionsPerPage;
        const endIndex = startIndex + sessionsPerPage;
        
        // Set filtered sessions with paginated data
        setFilteredSessions(sortedSessions.slice(startIndex, endIndex));
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect for search filtering
  useEffect(() => {
    if (!Array.isArray(sessions)) return;

    const filtered = sessions.filter((session: Session) => {
      if (!session || !session.user || !session.listener) return false;
      
      const searchTermLower = searchTerm.toLowerCase();
      const userName = session.user?.name || '';
      const listenerName = session.listener?.name || '';
      const sessionDate = session.time ? new Date(session.time).toLocaleDateString() : '';

      return (
        userName.toLowerCase().includes(searchTermLower) ||
        listenerName.toLowerCase().includes(searchTermLower) ||
        sessionDate.includes(searchTerm)
      );
    });

    setTotalSessions(filtered.length);

    // Apply pagination to filtered results
    const startIndex = (currentPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    setFilteredSessions(filtered.slice(startIndex, endIndex));

  }, [searchTerm, sessions, currentPage, sessionsPerPage]);

  // Add useEffect for sorting
  useEffect(() => {
    fetchSessions();
  }, [sortBy, sortOrder]);

  // Pagination handler
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Sorting handler
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page on sort change
  };

  // FOR ADMINS TO UPDATE
  const handleUpdateStatus = async (sessionId: string, newStatus: SessionStatus) => {
    if (!validateToken()) return;
    
    // Get the current session
    const session = sessions.find(s => s._id === sessionId);
    if (!session) return;

    // Show confirmation dialog for ALL status changes
    const confirmMessage = `⚠️ Warning: Are you sure you want to mark this session as "${newStatus}"?\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      // Reset the select element to its previous value
      const selectElement = document.querySelector(`select[data-session-id="${sessionId}"]`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = session.status;
      }
      return;
    }

    // Proceed with the status update after confirmation
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/update-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      if (!response.ok) {
        throw new Error('Failed to update session status');
      }

      const data = await response.json();

      // Update the sessions state with the new status
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session._id === sessionId
            ? { ...session, status: newStatus }
            : session
        )
      );

      // Show success message
      alert(data.message || 'Status updated successfully');
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status. Please try again.');
    }
  };
  
  const StatusSelect = ({ session }: { session: Session }) => {
    const isPending = session.status === 'pending';
  
    return (
      <select
        value={isPending ? '' : session.status}
        data-session-id={session._id}
        onChange={(e) => {
          const newStatus = e.target.value as SessionStatus;
          handleUpdateStatus(session._id, newStatus);
        }}
        className="block w-32 rounded-md border-gray-300 bg-gray-100 
          text-gray-900 font-medium shadow-sm focus:border-blue-500 
          focus:ring-blue-500 text-sm py-1.5"
      >
        {isPending && (
          <option value="" disabled>Select status</option>
        )}
        <option value="successful" className="bg-gray-100 text-gray-900">Successful</option>
        <option value="unsuccessful" className="bg-gray-100 text-gray-900">Unsuccessful</option>
        <option value="cancelled" className="bg-gray-100 text-gray-900">Cancelled</option>
      </select>
    );
  };
  
  // Update meeting link handler
  const handleUpdateMeetingLink = async (sessionId: string, link: string) => {
    if (!validateToken()) return;
    try {
      console.log('Updating meeting link for session:', sessionId, 'with link:', link);
  
      const response = await fetch(`${API_URL}/sessions/${sessionId}/add-link`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ meetingLink: link }),
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
  
      console.log('Response status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error('Failed to update meeting link');
      }
  
      setSessions(prevSessions =>
        prevSessions.map((session: Session) =>
          session._id === sessionId
            ? { ...session, meetingLink: link }
            : session
        )
      );
  
      setShowLinkModal(false);
      setSelectedSessionId(null);
      setMeetingLink('');
    } catch (error) {
      console.error('Error updating meeting link:', error);
      alert('Failed to update meeting link. Please try again.');
    }
  };

  // Add comment handler
  const handleAddComment = async (sessionId: string, comment: string) => {
    if (!validateToken()) return;
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/comment`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment }),
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();

      // Update the sessions state with the new comment
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session._id === sessionId
            ? { ...session, comment } // Update the comment
            : session
        )
      );

      alert(data.message || 'Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Export Sessions function
  const exportSessions = async () => {
    if (!validateToken()) return;
    try {
      const response = await fetch(`${API_URL}/sessions/export`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      if (!response.ok) {
        throw new Error('Failed to export sessions');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sessions_export.csv'; // Set the filename for the download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      console.error('Error exporting sessions:', error);
      alert('Failed to export sessions. Please try again.');
    }
  };

  // Mobile card renderer
  const renderMobileCard = (session: Session) => (
    <div key={session._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">
            {session.user?.name || 
             `${session.user?.firstName || ''} ${session.user?.lastName || ''}` ||
             session.user?.email ||
             'Unknown User'}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(session.time).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <ProgressBadge progress={getSessionProgress(session.time)} />
          <StatusBadge status={session.status} />
        </div>
      </div>
        
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Headphones className="h-4 w-4 mr-2" />
          <span>{session.listener.name}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>{new Date(session.time).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{session.topic}</span>
        </div>
        {session.comment && (
          <div className="flex items-start">
            <Edit2 className="h-4 w-4 mr-2 mt-1" />
            <span className="text-gray-500 italic">{session.comment}</span>
          </div>
        )}
      </div>
  
      <div className="mt-4 space-y-3">
        {/* Meeting Link Section */}
        <div className="flex justify-between items-center">
          {session.meetingLink && (
            <a 
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <Video className="h-4 w-4 mr-1" />
              <span>Join Meet</span>
            </a>
          )}
          <button 
            className="text-yellow-500 hover:text-yellow-700 p-2 rounded-full hover:bg-yellow-50"
            onClick={() => {
              setSelectedSessionId(session._id);
              setMeetingLink(session.meetingLink || '');
              setShowLinkModal(true);
            }}
            title="Edit Meeting Link"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>
  
        {/* Status Selection Section */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-500">Update Status:</span>
          <StatusSelect 
            session={session} 
          />
        </div>
      </div>
    </div>
  );


  // Table renderer
const renderTable = () => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('user')}>User</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('listener')}>Listener</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('time')}>Time</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('topic')}>Topic</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredSessions.map((session: Session) => (
          <tr key={session._id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {/* Add fallback options for different name fields */}
              {session.user?.name || 
               `${session.user?.firstName || ''} ${session.user?.lastName || ''}` ||
               session.user?.email ||
               'Unknown User'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.listener.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(session.time).toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.topic}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <ProgressBadge progress={getSessionProgress(session.time)} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge status={session.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2 items-center">
                {session.meetingLink && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Video className="h-5 w-5" />
                  </a>
                )}
                <button
                  onClick={() => {
                    setSelectedSessionId(session._id);
                    setMeetingLink(session.meetingLink || '');
                    setShowLinkModal(true);
                  }}
                  className="text-yellow-600 hover:text-yellow-900"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <StatusSelect session={session} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

  // Dark themed modal renderer
  const renderLinkModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                  Update Meeting Link
                </h3>
                <div className="mt-2">
                  <input
                    type="url"
                    className="shadow-sm focus:ring-blue-500 focus:border-red-500 block w-full sm:text-sm 
                      border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400"
                    placeholder="Enter meeting link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    className="shadow-sm focus:ring-blue-500 focus:border-red-500 block w-full sm:text-sm 
                      border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400"
                    placeholder="Enter comment (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent 
                shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 
                sm:w-auto sm:text-sm"
              onClick={() => {
                if (selectedSessionId) {
                  handleUpdateMeetingLink(selectedSessionId, meetingLink);
                  handleAddComment(selectedSessionId, comment); // Add comment when updating link
                }
              }}
            >
              Update
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 
        shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 
        hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                setShowLinkModal(false);
                setSelectedSessionId(null);
                setMeetingLink('');
                setComment(''); // Reset comment
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add this helper function near the top of the file
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate range around current page
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      pageNumbers.push('...');
    }
    
    // Add pages around current page
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Add new function to handle topic addition
  const handleAddTopic = async () => {
    if (!validateToken() || !newTopic.trim()) return;

    try {
      setIsAddingTopic(true);
      await addSessionTopic(newTopic.trim());
      setShowTopicModal(false);
      setNewTopic('');
      await handleAddTopicSuccess();
      alert('Topic added successfully!');
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Failed to add topic. Please try again.');
    } finally {
      setIsAddingTopic(false);
    }
  };

  // Update the renderTopicModal function
  const renderTopicModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>

        <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700">
          <div className="bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Add New Topic
                </h3>
                <div className="mt-2">
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
                    Topic Name
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="shadow-sm bg-gray-800 focus:ring-red-500 focus:border-red-500 block w-full 
                      text-gray-100 sm:text-sm border-gray-600 rounded-md px-3 py-2 
                      placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter topic name"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Add a new topic for session categorization
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={isAddingTopic || !newTopic.trim()}
              className={`w-full inline-flex justify-center rounded-md border border-transparent 
                shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                transition-colors duration-200 sm:ml-3 sm:w-auto sm:text-sm
                ${isAddingTopic || !newTopic.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAddingTopic ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Topic'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTopicModal(false);
                setNewTopic('');
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 
                shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 
                hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-red-500 transition-colors duration-200 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add fetchTopics function
  const fetchTopics = async () => {
    if (!validateToken()) return;

    try {
      setIsLoadingTopics(true);
      const response = await getSessionTopics();
      setTopics(response.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      alert('Failed to fetch topics. Please try again.');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Update useEffect to fetch topics
  useEffect(() => {
    if (!validateToken()) return;
    fetchTopics();
  }, []);

  // Add success callback for topic addition
  const handleAddTopicSuccess = async () => {
    await fetchTopics();
  };

  // Add Topics Panel component
  const renderTopicsPanel = () => (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out"
         style={{ transform: showTopicsPanel ? 'translateX(0)' : 'translateX(100%)' }}>
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 bg-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-100 flex items-center">
            <Hash className="h-5 w-5 mr-2" />
            Session Topics
          </h3>
          <button
            onClick={() => setShowTopicsPanel(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingTopics ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : topics.length > 0 ? (
            <div className="space-y-2">
              {topics.map((topic) => (
                <div
                  key={topic._id}
                  className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 font-medium">{topic.topic}</span>
                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                      {topic.count} sessions
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Added {new Date(topic.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              No topics available
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <button
            onClick={() => setShowTopicModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent 
              rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
              transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Topic
          </button>
        </div>
      </div>
    </div>
  );

  // Main return
return (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header section */}
    <div className="sm:flex sm:items-center justify-between mb-6">
      <div className="sm:flex-auto">
        <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
      </div>

      <div className="mt-4 sm:mt-0 sm:flex items-center space-x-4">
        {/* Topics Button */}
        <button 
          className="flex items-center justify-center bg-gray-900 text-white px-4 py-2 rounded-lg 
            hover:bg-gray-800 transition-colors relative"
          onClick={() => setShowTopicsPanel(true)}
        >
          <Hash className="h-4 w-4 mr-2" />
          <span>Topics</span>
          {topics.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {topics.length}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        <RefreshButton 
          onClick={() => {
            setCurrentPage(1);
            fetchSessions();
          }}
          isLoading={isLoading}
        />
        
        {/* Search Input */}
        <div className="relative w-64">
          <input
            type="text"
            className="w-full focus:ring-blue-500 focus:border-blue-500 block pr-10 
              sm:text-sm border-gray-300 rounded-lg"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Export Button */}
        <button 
          className="flex items-center justify-center bg-green-500 text-white 
            px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          onClick={exportSessions}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Export Sessions</span>
        </button>
      </div>
    </div>

    {/* Sorting Options */}
    <div className="mt-4 flex justify-between items-center">
      <div className="flex space-x-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg p-2 bg-white text-gray-800"
        >
          <option value="user">User</option>
          <option value="listener">Listener</option>
          <option value="time">Time</option>
          <option value="topic">Topic</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border rounded-lg p-2 bg-white text-gray-800"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button
          onClick={() => {
            setCurrentPage(1);
            fetchSessions();
          }}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sort
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="mt-8">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <>
          <div className="hidden sm:block">
            {renderTable()}
          </div>
          <div className="sm:hidden space-y-4">
            {filteredSessions.map(renderMobileCard)}
          </div>
          {showLinkModal && renderLinkModal()}
        </>
      )}

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        {/* Page numbers */}
        {generatePageNumbers(currentPage, Math.ceil(totalSessions / sessionsPerPage)).map((pageNum, index) => (
          <button
            key={index}
            onClick={() => typeof pageNum === 'number' ? setCurrentPage(pageNum) : null}
            disabled={pageNum === '...'}
            className={`px-3 py-1 rounded-md text-sm ${
              pageNum === currentPage
                ? 'bg-red-500 text-white'
                : pageNum === '...'
                ? 'bg-transparent cursor-default'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalSessions / sessionsPerPage), prev + 1))}
          disabled={currentPage === Math.ceil(totalSessions / sessionsPerPage)}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === Math.ceil(totalSessions / sessionsPerPage)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Next
        </button>
      </div>
    </div>

    {/* Add Topics Panel */}
    {renderTopicsPanel()}

    {/* Add Topic Modal */}
    {showTopicModal && renderTopicModal()}
  </div>
); 

}; 

export default Sessions;