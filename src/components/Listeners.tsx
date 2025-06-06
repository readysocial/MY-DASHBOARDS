import React, { useEffect, useState } from 'react';
import { Search, Plus, Eye, Edit2, XCircle, X, RefreshCw, MessageCircle, CheckCircle, PowerOff, Trash2 } from 'lucide-react';
import { Listener, FormErrors, Message, TimeSlot } from '../types/listener';
import { DAYS_OF_WEEK, DEFAULT_TIME_SLOTS, GENDERS } from '../constants/listener';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { 
  activateDeactivateListener, 
  getListener, 
  updateListener, 
  createListener, 
  deleteListener 
} from '../api/listener/api';

// Add this new interface after the existing interfaces
interface Session {
  _id: string;
  time: string;
  status: 'pending' | 'successful' | 'cancelled';
  topic: string;
}

const Listeners: React.FC = (): JSX.Element => {


  useEffect(() => {
    const checkAuth = () => {
      if (!validateToken()) {
        return;
      }
      fetchListeners();
    };
    checkAuth();
  }, []);

  // State Management
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredListeners, setFilteredListeners] = useState<Listener[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [listenersPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListener, setSelectedListener] = useState<Listener | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'urgent'>('normal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [listenerSessions, setListenerSessions] = useState<Session[]>([]);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set(DAYS_OF_WEEK));

  

  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Initialize new listener state
  const [newListener, setNewListener] = useState<Listener>({
    name: '',
    description: '',
    gender: 'male',
    email: '',
    phoneNumber: '',
    availability: DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day,
      times: day === 'saturday' || day === 'sunday'
        ? DEFAULT_TIME_SLOTS.weekend.map(slot => ({
            ...slot,
            isAvailable: true
          }))
        : DEFAULT_TIME_SLOTS.weekday.map(slot => ({
            ...slot,
            isAvailable: true
          }))
    }))
  });

  // Add new state for activation status
  const [isActivating, setIsActivating] = useState(false);

  // Add new state for the notification modal
  const [showSessionNotification, setShowSessionNotification] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{day: string, time: string} | null>(null);

  // Fetch Listeners
  const fetchListeners = async () => {
    if (!validateToken()) return;
  
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/listeners?sortBy=${sortBy}&sortOrder=${sortOrder}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        handleUnauthorized(response);
        return;
      }
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch listeners');
      }

      const listenersArray = Array.isArray(data) ? data : data.listeners || [];
      setListeners(listenersArray);
      setFilteredListeners(listenersArray);
      setError(null);
    } catch (error) {
      console.error('Error fetching listeners:', error);
      setError('Failed to fetch listeners');
      setListeners([]);
      setFilteredListeners([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Listener Details
  const fetchListenerDetails = async (listenerId: string) => {
    if (!validateToken()) return;
  
    try {
      setIsLoading(true);
      const listener = await getListener(listenerId);
      setSelectedListener(listener);
      setShowDetailsModal(true);
      await fetchListenerSessions(listenerId);
    } catch (error) {
      console.error('Error fetching listener details:', error);
      alert('Failed to fetch listener details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Listener Sessions
  const fetchListenerSessions = async (listenerId: string) => {
    if (!validateToken()) return;
  
    try {
      const response = await fetch(`${API_URL}/sessions/listener/${listenerId}/sessions`, {
        headers: getAuthHeaders()
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch listener sessions');
      }

      setListenerSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching listener sessions:', error);
      alert('Failed to fetch listener sessions. Please try again.');
    }
  };

  // Fetch Messages for Listener
  const fetchMessagesForListener = async (listenerId?: string) => {
    if (!validateToken() || !listenerId) return;
  
    try {
      const response = await fetch(`${API_URL}/listeners/${listenerId}/messages`, {
        headers: getAuthHeaders()
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }
      

      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Failed to fetch messages. Please try again.');
    }
  };

  // Send Message to Listener
  const sendMessageToListener = async () => {
    if (!validateToken() || !selectedListener) return;
  
    try {
      const response = await fetch(`${API_URL}/listeners/${selectedListener._id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subject: messageSubject,
          content: messageContent,
          priority: messagePriority,
        }),
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      alert('Message sent successfully!');
      setMessageSubject('');
      setMessageContent('');
      setMessagePriority('normal');
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Export Listeners
  const exportListeners = async () => {
    if (!validateToken()) return;
  
    try {
      const response = await fetch(`${API_URL}/listeners/export`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
  
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
  
      if (!response.ok) {
        throw new Error('Failed to export listeners');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'listeners_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting listeners:', error);
      alert('Failed to export listeners. Please try again.');
    }
  };

  // Effect Hooks
  useEffect(() => {
    fetchListeners();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!Array.isArray(listeners)) {
      setFilteredListeners([]);
      return;
    }

    const filtered = listeners.filter(listener => {
      if (!listener) return false;
      const searchTermLower = searchTerm.toLowerCase();
      return listener.name?.toLowerCase()?.includes(searchTermLower) || false;
    });

    setFilteredListeners(filtered);
    setCurrentPage(1);
  }, [searchTerm, listeners]);



  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!newListener.name?.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!newListener.description?.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }

    if (!newListener.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }

    if (!newListener.email?.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newListener.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!newListener.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(newListener.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 10 digits';
      isValid = false;
    }

    const hasInvalidTimes = newListener.availability.some(day => 
      day.times.some(time => !time.startTime || !time.endTime)
    );

    if (hasInvalidTimes) {
      errors.availability = 'All time slots must have start and end times';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmitListener = async () => {
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    try {
      const listenerData: Partial<Listener> = {
        name: newListener.name,
        description: newListener.description,
        gender: newListener.gender,
        email: newListener.email,
        phoneNumber: newListener.phoneNumber,
        availability: newListener.availability.map(day => ({
          dayOfWeek: day.dayOfWeek,
          times: day.times.map(time => ({
            startTime: time.startTime,
            endTime: time.endTime,
            isAvailable: time.isAvailable
          }))
        }))
      };
  
      if (selectedListener?._id) {
        await updateListener(selectedListener._id, listenerData);
      } else {
        await createListener(listenerData as Omit<Listener, '_id'>);
      }
  
      await fetchListeners();
      setShowModal(false);
      resetForm();
      alert(`Listener ${selectedListener ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error submitting listener:', error);
      alert(`Failed to ${selectedListener ? 'update' : 'create'} listener. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewListener({
      name: '',
      description: '',
      gender: 'male',
      email: '',
      phoneNumber: '',
      availability: DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        times: []  // Start with empty times for each day
      }))
    });
    setAvailableDays(new Set(DAYS_OF_WEEK));
    setFormErrors({});
    setSelectedListener(null);
  };


  // Add this new function after the existing state declarations
  const hasActiveSession = (dayOfWeek: string, timeSlot: TimeSlot): boolean => {
    if (!listenerSessions) return false;
    
    const slotDate = new Date(timeSlot.startTime);
    const slotDay = slotDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    return listenerSessions.some(session => {
      const sessionDate = new Date(session.time);
      const sessionDay = sessionDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const sessionTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      return sessionDay === dayOfWeek && 
             sessionTime === timeSlot.startTime && 
             session.status === 'pending';
    });
  };

  // Add this new function to handle day availability toggle
const toggleDayAvailability = (dayOfWeek: string) => {
  const newAvailableDays = new Set(availableDays);
  if (newAvailableDays.has(dayOfWeek)) {
    newAvailableDays.delete(dayOfWeek);
  } else {
    newAvailableDays.add(dayOfWeek);
  }
  setAvailableDays(newAvailableDays);

  // Update the newListener state to reflect the change
  setNewListener(prev => ({
    ...prev,
    availability: prev.availability.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          times: newAvailableDays.has(dayOfWeek) ? [{ startTime: '09:00', endTime: '17:00', isAvailable: true }] : []
        };
      }
      return day;
    })
  }));
};





  // Handle form input changes
  const handleInputChange = (field: keyof Listener, value: any) => {
    setNewListener(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update the handleTimeSlotChange function
  const handleTimeSlotChange = (
    dayOfWeek: string, 
    index: number, 
    field: keyof TimeSlot, 
    value: string
  ) => {
    setNewListener(prev => ({
      ...prev,
      availability: prev.availability.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const newTimes = [...day.times];
          // Check if the time slot has an active session
          if (hasActiveSession(dayOfWeek, newTimes[index])) {
            setSelectedTimeSlot({
              day: dayOfWeek,
              time: `${newTimes[index].startTime} - ${newTimes[index].endTime}`
            });
            setShowSessionNotification(true);
            return day;
          }
          newTimes[index] = {
            ...newTimes[index],
            [field]: value,
            isAvailable: true
          };
          return { ...day, times: newTimes };
        }
        return day;
      })
    }));
  };

  // Update the removeTimeSlot function
  const removeTimeSlot = (dayOfWeek: string, index: number) => {
    setNewListener(prev => ({
      ...prev,
      availability: prev.availability.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          // Check if the time slot has an active session
          if (hasActiveSession(dayOfWeek, day.times[index])) {
            setSelectedTimeSlot({
              day: dayOfWeek,
              time: `${day.times[index].startTime} - ${day.times[index].endTime}`
            });
            setShowSessionNotification(true);
            return day;
          }
          const newTimes = day.times.filter((_, i) => i !== index);
          return { ...day, times: newTimes };
        }
        return day;
      })
    }));
  };

  // Add new time slot
const addTimeSlot = (dayOfWeek: string) => {
  setNewListener(prev => ({
    ...prev,
    availability: prev.availability.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          times: [...day.times, { 
            startTime: '09:00', 
            endTime: '17:00', 
            isAvailable: true 
          }]
        };
      }
      return day;
    })
  }));
};

  // Handle edit click
  const handleEditClick = (listener: Listener) => {
    const availableDaysSet = new Set(
      listener.availability
        .filter(day => day.times.length > 0)
        .map(day => day.dayOfWeek)
    );
    
    setAvailableDays(availableDaysSet);
    setNewListener({
      _id: listener._id,
      name: listener.name || '',
      description: listener.description || '',
      gender: listener.gender || 'male',
      email: listener.email || '',
      phoneNumber: listener.phoneNumber || '',
      availability: DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        times: listener.availability.find(d => d.dayOfWeek === day)?.times || []
      }))
    });
    
    setSelectedListener(listener);
    setShowModal(true);
  };

  

  // Pagination
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const indexOfLastListener = currentPage * listenersPerPage;
  const indexOfFirstListener = indexOfLastListener - listenersPerPage;
  const currentListeners = Array.isArray(filteredListeners) 
    ? filteredListeners.slice(indexOfFirstListener, indexOfLastListener)
    : [];

  // Refresh function
  const refreshListeners = () => {
    if (!validateToken()) return;
    fetchListeners();
  };

  // Add new function to handle activation/deactivation
  const handleActivationToggle = async (listenerId: string, currentStatus: boolean) => {
    if (!validateToken()) return;

    // Show confirmation dialog for both activation and deactivation
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      currentStatus 
        ? 'Are you sure you want to deactivate this listener? This will prevent them from receiving new sessions.'
        : 'Are you sure you want to activate this listener? This will allow them to receive new sessions.'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setIsActivating(true);
      await activateDeactivateListener(listenerId, { active: !currentStatus });
      await fetchListeners(); // Refresh the list
      alert(`Listener ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling listener status:', error);
      alert('Failed to update listener status. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  // Add delete handler
  const handleDeleteListener = async (listenerId: string) => {
    if (!validateToken()) return;

    if (!window.confirm('Are you sure you want to delete this listener?')) {
      return;
    }

    try {
      await deleteListener(listenerId);
      await fetchListeners();
      alert('Listener deleted successfully!');
    } catch (error) {
      console.error('Error deleting listener:', error);
      alert('Failed to delete listener. Please try again.');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Listeners</h2>
        <div className="flex space-x-2">
          <button 
            className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg 
            hover:bg-gray-200 transition-colors"
            onClick={refreshListeners}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg 
            hover:bg-blue-700 transition-colors"
            onClick={exportListeners}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Export Listeners</span>
          </button>
          <button 
            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg 
            hover:bg-green-700 transition-colors"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Add New Listener</span>
          </button>
        </div>
      </div>
  
      {/* Sorting Section */}
      <div className="mb-6 flex space-x-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg p-2 bg-white text-gray-800"
        >
          <option value="name">Name</option>
          <option value="gender">Gender</option>
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
            fetchListeners();
          }}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sort
        </button>
      </div>
  
      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
  


    {/* Loading and Error States */}
    {isLoading ? (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
      <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
    </div>
  </div>
) : error ? (
      <div className="text-center text-red-500 py-8">{error}</div>
    ) : (
      <>
        {/* Listeners Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentListeners.length > 0 ? (
                currentListeners.map((listener) => (
                  <tr key={listener._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{listener.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{listener.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">{listener.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          listener.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {listener.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {/* View Details Button */}
                        <button 
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={() => {
                            if (listener._id) {
                              fetchListenerDetails(listener._id);
                              fetchMessagesForListener(listener._id);
                            }
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Edit Button */}
                        <button 
                          className="text-green-600 hover:text-green-800 transition-colors"
                          onClick={() => handleEditClick(listener)}
                          title="Edit Listener"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {/* Activation Toggle Button */}
                        <button 
                          className={`${
                            listener.active 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          } transition-colors`}
                          onClick={() => handleActivationToggle(listener._id!, listener.active || false)}
                          disabled={isActivating}
                          title={listener.active ? 'Deactivate Listener' : 'Activate Listener'}
                        >
                          {listener.active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        {/* Delete Button */}
                        <button 
                          className="text-red-600 hover:text-red-800 transition-colors"
                          onClick={() => handleDeleteListener(listener._id!)}
                          title="Delete Listener"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {/* Message Button */}
                        <button 
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                          onClick={() => {
                            setSelectedListener(listener);
                            setShowMessageModal(true);
                          }}
                          title="Send Message"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No listeners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {currentListeners.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {Array.from({ length: Math.ceil(filteredListeners.length / listenersPerPage) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === index + 1
                      ? 'z-10 bg-red-50 border-red-500 text-red-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </>
    )}


        {/* Details Modal */}
        {selectedListener && showDetailsModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Listener Details</h3>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="font-medium text-gray-800">Name:</label>
                  <p className="text-gray-900">{selectedListener.name}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-800">Description:</label>
                  <p className="text-gray-900">{selectedListener.description}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-800">Gender:</label>
                  <p className="text-gray-900 capitalize">{selectedListener.gender}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-800">Email:</label>
                  <p className="text-gray-900">{selectedListener.email}</p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-800">Phone:</label>
                  <p className="text-gray-900">{selectedListener.phoneNumber}</p>
                </div>

                {/* Availability Section */}
                <div>
                  <label className="font-medium text-gray-800">Availability:</label>
                  <div className="mt-2 space-y-2">
                    {selectedListener.availability.map((day) => (
                      <div key={day.dayOfWeek} className="border rounded p-2 bg-gray-50">
                        <p className="font-medium capitalize text-gray-800">{day.dayOfWeek}</p>
                        <div className="space-y-1 mt-1">
                          {day.times.map((time, index) => {
                            const hasSession = hasActiveSession(day.dayOfWeek, time);
                            return (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={time.startTime}
                                  onChange={(e) => handleTimeSlotChange(
                                    day.dayOfWeek,
                                    index,
                                    'startTime',
                                    e.target.value
                                  )}
                                  disabled={hasSession}
                                  className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                    ${hasSession ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                />
                                <span className="text-gray-900 font-medium">to</span>
                                <input
                                  type="time"
                                  value={time.endTime}
                                  onChange={(e) => handleTimeSlotChange(
                                    day.dayOfWeek,
                                    index,
                                    'endTime',
                                    e.target.value
                                  )}
                                  disabled={hasSession}
                                  className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                    ${hasSession ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                />
                                {day.times.length > 1 && !hasSession && (
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(day.dayOfWeek, index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                                {hasSession && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-orange-600 ml-2">
                                      (Booked - Active Session)
                                    </span>
                                    <div className="relative group">
                                      <span className="text-gray-400 cursor-help">ⓘ</span>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        This time slot has an active session and cannot be modified
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sessions Section */}
                <div>
                  <label className="font-medium text-gray-800">Sessions:</label>
                  <div className="mt-2 space-y-2">
                    {listenerSessions.length > 0 ? (
                      listenerSessions.map((session) => (
                        <div key={session._id} className="border rounded p-2 bg-gray-50">
                          <p className="font-medium text-gray-800">Topic: {session.topic}</p>
                          <p className="text-sm text-gray-700">Status: {session.status}</p>
                          <p className="text-sm text-gray-700">
                            Time: {new Date(session.time).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No sessions found for this listener.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  setSelectedListener(null);
                  setShowDetailsModal(false);
                }}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 
                  bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}


        {/* Add/Edit Modal */}
        {showModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name*</label>
                  <input
                    type="text"
                    value={newListener.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 text-gray-900 font-medium
                      ${formErrors.name ? 'border-red-300' : 'border-gray-300'}
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description*</label>
                  <textarea
                    value={newListener.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 text-gray-900 font-medium
                      ${formErrors.description ? 'border-red-300' : 'border-gray-300'}
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
                  )}
                </div>

                {/* Gender Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender*</label>
                  <select
                    value={newListener.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender} className="font-medium">
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email*</label>
                  <input
                    type="email"
                    value={newListener.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 text-gray-900 font-medium
                      ${formErrors.email ? 'border-red-300' : 'border-gray-300'}
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
                  <input
                    type="text"
                    value={newListener.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 text-gray-900 font-medium
                      ${formErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'}
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Availability Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability*</label>
                  <div className="space-y-4">
                    {newListener.availability.map((day) => (
                      <div key={day.dayOfWeek} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={availableDays.has(day.dayOfWeek)}
                              onChange={() => toggleDayAvailability(day.dayOfWeek)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <h4 className="font-medium capitalize">{day.dayOfWeek}</h4>
                          </div>
                          {availableDays.has(day.dayOfWeek) && (
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day.dayOfWeek)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              + Add Time Slot
                            </button>
                          )}
                        </div>
                        {availableDays.has(day.dayOfWeek) && (
                          <div className="space-y-2">
                            {day.times.map((time, timeIndex) => {
                              const hasSession = hasActiveSession(day.dayOfWeek, time);
                              return (
                                <div key={timeIndex} className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    value={time.startTime}
                                    onChange={(e) => handleTimeSlotChange(
                                      day.dayOfWeek,
                                      timeIndex,
                                      'startTime',
                                      e.target.value
                                    )}
                                    disabled={hasSession}
                                    className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium
                                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                      ${hasSession ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  />
                                  <span className="text-gray-900 font-medium">to</span>
                                  <input
                                    type="time"
                                    value={time.endTime}
                                    onChange={(e) => handleTimeSlotChange(
                                      day.dayOfWeek,
                                      timeIndex,
                                      'endTime',
                                      e.target.value
                                    )}
                                    disabled={hasSession}
                                    className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium
                                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                      ${hasSession ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  />
                                  {day.times.length > 1 && !hasSession && (
                                    <button
                                      type="button"
                                      onClick={() => removeTimeSlot(day.dayOfWeek, timeIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                  {hasSession && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-orange-600 ml-2">
                                        (Booked - Active Session)
                                      </span>
                                      <div className="relative group">
                                        <span className="text-gray-400 cursor-help">ⓘ</span>
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                          This time slot has an active session and cannot be modified
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {formErrors.availability && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.availability}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleSubmitListener}
                disabled={isSubmitting}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 
                  bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Processing...' : (selectedListener ? 'Update Listener' : 'Create Listener')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 
                  bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

        {/* Message Modal */}
        {selectedListener && showMessageModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Send Message to {selectedListener.name}
                </h3>

                {/* Subject Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Message Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Priority Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={messagePriority}
                    onChange={(e) => setMessagePriority(e.target.value as 'normal' | 'urgent')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-medium 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Messages List */}
                {messages.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Previous Messages</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {messages.map((message: Message) => (
                        <div key={message._id} className="border rounded p-3">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium">{message.subject}</h5>
                            <span className={`text-xs px-2 py-1 rounded ${
                              message.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {message.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(message.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={sendMessageToListener}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 
                  bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Send Message
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedListener(null);
                  setMessageSubject('');
                  setMessageContent('');
                  setMessagePriority('normal');
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 
                  bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Notification Modal */}
    {showSessionNotification && selectedTimeSlot && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cannot Modify Time Slot
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      This time slot ({selectedTimeSlot.day}, {selectedTimeSlot.time}) has an active session and cannot be modified.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please wait until the session is completed or cancelled before making any changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowSessionNotification(false);
                  setSelectedTimeSlot(null);
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
); 

}; 

export default Listeners;