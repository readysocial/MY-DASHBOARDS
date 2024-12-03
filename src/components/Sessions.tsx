import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  X, 
  Eye, 
  Edit2, 
  XCircle, 
  Video,
  Clock,
  Headphones 
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Listener {
  _id: string;
  name: string;
  description: string;
}

interface Session {
  _id: string;
  user: User;
  listener: Listener;
  topic: string;
  time: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const API_URL = 'https://ready-back-end.onrender.com';

// Helper component for status badges
const StatusBadge: React.FC<{ status: Session['status'] }> = ({ status }) => {
  const statusClasses = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

const Sessions: React.FC = () => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const skip = (currentPage - 1) * sessionsPerPage;
        const response = await fetch(
          `${API_URL}/sessions/platform/all?limit=${sessionsPerPage}&skip=${skip}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        console.log('Raw session data:', data);

        if (data && Array.isArray(data.sessions)) {
          const validSessions = data.sessions.filter((session: Session) => 
            session && 
            session._id && 
            session.status
          );
          console.log('Validated sessions:', validSessions);
          
          setSessions(validSessions);
          setTotalSessions(data.total || validSessions.length);
          setFilteredSessions(validSessions);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [currentPage, sessionsPerPage]);

  // Filter Sessions
  useEffect(() => {
    if (!Array.isArray(sessions)) {
      setFilteredSessions([]);
      return;
    }

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

    setFilteredSessions(filtered);
  }, [searchTerm, sessions]);


    // Pagination handler
    const paginate = (pageNumber: number) => {
      setCurrentPage(pageNumber);
    };
  
    // Update meeting link handler
    const handleUpdateMeetingLink = async (sessionId: string, link: string) => {
      try {
        console.log('Updating meeting link for session:', sessionId, 'with link:', link);
    
        const response = await fetch(`${API_URL}/sessions/${sessionId}/add-link`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meetingLink: link }),
        });
    
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
  
    // Mobile card renderer
    const renderMobileCard = (session: Session) => (
      <div key={session._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-gray-900">{session.user.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(session.time).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={session.status} />
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
        </div>
  
        <div className="mt-4 flex justify-between items-center">
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
          <div className="flex space-x-3">
            <button 
              className="text-yellow-500 hover:text-yellow-700"
              onClick={() => {
                setSelectedSessionId(session._id);
                setMeetingLink(session.meetingLink || '');
                setShowLinkModal(true);
              }}
            >
              <Video className="h-5 w-5" />
            </button>
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listener</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredSessions.map((session: Session) => (
            <tr key={session._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.listener.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(session.time).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.topic}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={session.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
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
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm 
                      border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400"
                    placeholder="Enter meeting link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent 
                shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 
                sm:w-auto sm:text-sm"
              onClick={() => selectedSessionId && handleUpdateMeetingLink(selectedSessionId, meetingLink)}
            >
              Update
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 
                shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 
                hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                setShowLinkModal(false);
                setSelectedSessionId(null);
                setMeetingLink('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main return
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="text-center">Loading...</div>
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
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          {Array.from({ length: Math.ceil(totalSessions / sessionsPerPage) }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === index + 1
                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sessions;