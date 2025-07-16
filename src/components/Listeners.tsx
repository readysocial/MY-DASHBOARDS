'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Eye, Edit2, XCircle, X, RefreshCw, MessageCircle, CheckCircle, PowerOff, Trash2, Mail, User, ArrowRight } from 'lucide-react';
import { Listener, FormErrors, Message, TimeSlot } from '../types/listener';
import { DAYS_OF_WEEK, DEFAULT_TIME_SLOTS, GENDERS } from '../constants/listener';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { 
  activateDeactivateListener, 
  getListener, 
  updateListener, 
  createListener, 
  deleteListener,
  inviteListener,
  updateListenerAvailability
} from '../api/listener/api';

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
  const [showInviteModal, setShowInviteModal] = useState(false);
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

  // Add new state for unavailable slot modal
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableSlotInfo, setUnavailableSlotInfo] = useState<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Add invite form state
  const [inviteForm, setInviteForm] = useState({ email: '' });

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
      // setShowDetailsModal(true); // Removed as per edit hint
    } catch (error) {
      console.error('Error fetching listener details:', error);
      alert('Failed to fetch listener details. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (!validateForm() || !selectedListener?._id) {
      return;
    }
  
    setIsSubmitting(true);
    try {
      await updateListenerAvailability(selectedListener._id, newListener.availability);
      await fetchListeners();
      setShowModal(false);
      resetForm();
      alert('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewListener(prev => ({
      ...prev,
      availability: DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        times: []  // Start with empty times for each day
      }))
    }));
    setAvailableDays(new Set(DAYS_OF_WEEK));
    setFormErrors({});
    setSelectedListener(null);
  };

  // Add this new function after the existing state declarations
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
  const handleTimeSlotChange = async (
    dayOfWeek: string, 
    index: number, 
    field: keyof TimeSlot, 
    value: string
  ) => {
    if (!selectedListener?._id) return;

    try {
      const updatedAvailability = newListener.availability.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const newTimes = [...day.times];
          // Check if the time slot is unavailable
          if (newTimes[index].isAvailable === false) {
            setUnavailableSlotInfo({
              dayOfWeek,
              startTime: newTimes[index].startTime,
              endTime: newTimes[index].endTime
            });
            setShowUnavailableModal(true);
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
      });

      // Update local state
      setNewListener(prev => ({
        ...prev,
        availability: updatedAvailability
      }));

      // Call the API to update availability
      await updateListenerAvailability(selectedListener._id, updatedAvailability);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  // Update the removeTimeSlot function
  const removeTimeSlot = (dayOfWeek: string, index: number) => {
    setNewListener(prev => ({
      ...prev,
      availability: prev.availability.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          // Check if the time slot is unavailable
          if (day.times[index].isAvailable === false) {
            setUnavailableSlotInfo({
              dayOfWeek,
              startTime: day.times[index].startTime,
              endTime: day.times[index].endTime
            });
            setShowUnavailableModal(true);
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

  // Add invite handler
  const handleInvite = async () => {
    if (!validateToken()) return;

    try {
      setIsSubmitting(true);
      await inviteListener(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ email: '' });
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-lg 
            hover:bg-purple-700 transition-colors"
            onClick={() => setShowInviteModal(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span>Invite Listener</span>
          </button>
          <button 
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg 
            hover:bg-blue-700 transition-colors"
            onClick={exportListeners}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Export Listeners</span>
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


        {/* Add/Edit Modal */}
        {showModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Availability</h3>
                {/* Availability Section */}
                <div>
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
                            <h4 className="text-lg font-extrabold capitalize text-gray-900">{day.dayOfWeek}</h4>
                          </div>
                          {availableDays.has(day.dayOfWeek) && (
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day.dayOfWeek)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                            >
                              + Add Time Slot
                            </button>
                          )}
                        </div>
                        {availableDays.has(day.dayOfWeek) && (
                          <div className="space-y-2">
                            {day.times.map((time, timeIndex) => (
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
                                  disabled={!time.isAvailable}
                                  className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-bold
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                    ${!time.isAvailable ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                />
                                <span className="text-gray-900 font-bold">to</span>
                                <input
                                  type="time"
                                  value={time.endTime}
                                  onChange={(e) => handleTimeSlotChange(
                                    day.dayOfWeek,
                                    timeIndex,
                                    'endTime',
                                    e.target.value
                                  )}
                                  disabled={!time.isAvailable}
                                  className={`rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-900 font-bold
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                    ${!time.isAvailable ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                />
                                {day.times.length > 1 && time.isAvailable && (
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(day.dayOfWeek, timeIndex)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                                {!time.isAvailable && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-orange-600 ml-2 font-bold">
                                      (Booked)
                                    </span>
                                    <div className="relative group">
                                      <span className="text-gray-400 cursor-help">ⓘ</span>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        This time slot is booked and cannot be modified
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
            {isSubmitting ? 'Processing...' : 'Update Availability'}
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

      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
        <div className="bg-white px-6 pt-6 pb-6">
              <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-purple-600" />
                  Send Message to {selectedListener.name}
                </h3>
            </div>

                {/* Subject Input */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-800">Subject</label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Enter message subject"
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm px-4 py-3 text-gray-900 text-lg
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                  hover:border-purple-400 transition duration-150 ease-in-out"
                  />
                </div>

                {/* Message Content */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-800">Message</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm px-4 py-3 text-gray-900 text-lg
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                  hover:border-purple-400 transition duration-150 ease-in-out"
                  />
                </div>

                {/* Priority Select */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-800">Priority</label>
                  <select
                    value={messagePriority}
                    onChange={(e) => setMessagePriority(e.target.value as 'normal' | 'urgent')}
                className="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm px-4 py-3 text-gray-900 text-lg
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                  hover:border-purple-400 transition duration-150 ease-in-out"
                  >
                <option value="normal" className="text-lg">Normal</option>
                <option value="urgent" className="text-lg">Urgent</option>
                  </select>
                </div>

            {/* Previous Messages Section */}
                {messages.length > 0 && (
              <div className="mt-8 space-y-4">
                <h4 className="text-xl font-semibold text-gray-800 border-b pb-2">Previous Messages</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {messages.map((message: Message) => (
                    <div key={message._id} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-lg font-semibold text-gray-900">{message.subject}</h5>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          message.priority === 'urgent' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                            }`}>
                              {message.priority}
                            </span>
                          </div>
                      <p className="text-base text-gray-700 whitespace-pre-wrap">{message.content}</p>
                      <div className="text-sm text-gray-500 mt-2">
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
        <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={sendMessageToListener}
            disabled={!messageSubject.trim() || !messageContent.trim()}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent px-6 py-3 
              bg-purple-600 text-lg font-medium text-white shadow-sm hover:bg-purple-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
              sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 ease-in-out transform hover:scale-[1.02]"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
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
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 
              px-6 py-3 bg-white text-lg font-medium text-gray-700 shadow-sm 
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-purple-500 sm:mt-0 sm:w-auto
              transition-all duration-150 ease-in-out"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Unavailable Slot Modal */}
    {showUnavailableModal && unavailableSlotInfo && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Time Slot Unavailable
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      This time slot ({unavailableSlotInfo.startTime} - {unavailableSlotInfo.endTime} on {unavailableSlotInfo.dayOfWeek}) 
                      is currently booked and cannot be modified. The slot is marked as unavailable to prevent conflicts with existing sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowUnavailableModal(false);
                  setUnavailableSlotInfo(null);
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 
                  bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Invite Modal */}
    {showInviteModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header with Icon */}
              <div className="sm:flex sm:items-start mb-6">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900">
                    Invite New Listener
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Send an invitation to join as a listener. They'll receive an email with instructions to complete their registration.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6 mt-6">
                {/* Email Input Group */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="block w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 
                        rounded-lg shadow-sm hover:border-purple-400 
                        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                        transition duration-150 ease-in-out text-gray-900
                        placeholder:text-gray-400"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleInvite}
                disabled={isSubmitting || !inviteForm.email}
                className="w-full inline-flex justify-center items-center rounded-lg border border-transparent px-6 py-3 
                  bg-purple-600 text-base font-medium text-white shadow-sm hover:bg-purple-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
                  sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 ease-in-out transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ email: '' });
                }}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 
                  px-6 py-3 bg-white text-base font-medium text-gray-700 shadow-sm 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm
                  transition-all duration-150 ease-in-out"
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

export default Listeners;