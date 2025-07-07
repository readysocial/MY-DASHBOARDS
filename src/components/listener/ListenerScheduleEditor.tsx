import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { getListenerProfile } from '@/api/listener/listenerprofile/api';
import { updateListenerProfile } from '@/api/listener/listenerupdate/api';
import type { ListenerProfile, DayAvailability } from '@/api/listener/listenerprofile/types';
import type { UpdateListenerRequest } from '@/api/listener/listenerupdate/types';
import { Clock, Save, X, Check, X as XIcon, Plus } from 'lucide-react';

// Time slots for selection
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

const formatTimeForDisplay = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

const formatTimeFor24Hour = (hour: number, minute: string, period: string) => {
  let hours24 = hour;
  if (period === 'PM' && hour !== 12) hours24 += 12;
  if (period === 'AM' && hour === 12) hours24 = 0;
  return `${hours24.toString().padStart(2, '0')}:${minute}`;
};

export const ListenerScheduleEditor = () => {
  const [profile, setProfile] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [editingTime, setEditingTime] = useState<{
    dayIndex: number;
    timeIndex: number;
    type: 'start' | 'end' | null;
  } | null>(null);
  const [timeSelection, setTimeSelection] = useState({
    hour: 9,
    minute: '00',
    period: 'AM'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const listenerData = localStorage.getItem('listenerData');
        if (!listenerData) {
          throw new Error('No listener data found');
        }
        const { _id } = JSON.parse(listenerData);
        const response = await getListenerProfile(_id);
        setProfile(response.listener);
        setAvailability(response.listener.availability);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleTimeEdit = (dayIndex: number, timeIndex: number, type: 'start' | 'end') => {
    const time = type === 'start' 
      ? availability[dayIndex].times[timeIndex].startTime 
      : availability[dayIndex].times[timeIndex].endTime;
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    setTimeSelection({
      hour: hour12,
      minute: minutes,
      period
    });

    setEditingTime({ dayIndex, timeIndex, type });
  };

  const handleTimeSelect = () => {
    if (!editingTime) return;

    const { dayIndex, timeIndex, type } = editingTime;
    const newTime = formatTimeFor24Hour(timeSelection.hour, timeSelection.minute, timeSelection.period);

    setAvailability(prev => {
      const newAvailability = [...prev];
      const day = { ...newAvailability[dayIndex] };
      const time = { ...day.times[timeIndex] };

      if (type === 'start') {
        time.startTime = newTime;
      } else {
        time.endTime = newTime;
      }

      day.times = [...day.times];
      day.times[timeIndex] = time;
      newAvailability[dayIndex] = day;
      return newAvailability;
    });

    setEditingTime(null);
  };

  const handleAvailabilityToggle = (dayIndex: number, timeIndex: number) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      const day = { ...newAvailability[dayIndex] };
      const time = { ...day.times[timeIndex] };
      
      time.isAvailable = !time.isAvailable;
      day.times = [...day.times];
      day.times[timeIndex] = time;
      
      newAvailability[dayIndex] = day;
      return newAvailability;
    });
  };

  const addTimeSlot = (dayIndex: number) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      const day = { ...newAvailability[dayIndex] };
      
      day.times = [...day.times, {
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        _id: `new-${Date.now()}`
      }];
      
      newAvailability[dayIndex] = day;
      return newAvailability;
    });
  };

  const removeTimeSlot = (dayIndex: number, timeIndex: number) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      const day = { ...newAvailability[dayIndex] };
      
      day.times = day.times.filter((_, index) => index !== timeIndex);
      newAvailability[dayIndex] = day;
      return newAvailability;
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: UpdateListenerRequest = {
        email: profile.email,
        description: profile.description,
        phoneNumber: profile.phoneNumber,
        name: profile.name,
        gender: profile.gender,
        availability: availability.map(day => ({
          dayOfWeek: day.dayOfWeek,
          times: day.times.map(time => ({
            startTime: time.startTime,
            endTime: time.endTime,
            isAvailable: time.isAvailable
          }))
        }))
      };

      const listenerData = localStorage.getItem('listenerData');
      if (!listenerData) throw new Error('No listener data found');
      
      const { _id } = JSON.parse(listenerData);
      await updateListenerProfile(_id, updateData);
      setError('Schedule updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  if (!profile || !availability.length) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
          <p className="text-sm text-gray-600 mt-1">Click on a time slot to edit availability</p>
        </div>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-gray-300"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-md mb-6 ${
          error.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            // Set all current time slots to available
            setAvailability(prev => prev.map(day => ({
              ...day,
              times: day.times.map(time => ({
                ...time,
                isAvailable: true
              }))
            })))
          }}
          className="bg-purple-600 text-white hover:bg-purple-700 font-normal flex items-center"
        >
          <Check className="h-4 w-4 mr-1" /> Available
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            // Set all current time slots to unavailable
            setAvailability(prev => prev.map(day => ({
              ...day,
              times: day.times.map(time => ({
                ...time,
                isAvailable: false
              }))
            })))
          }}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 font-normal flex items-center"
        >
          <XIcon className="h-4 w-4 mr-1" /> Unavailable
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid gap-6">
          {availability.map((day, dayIndex) => (
            <div key={day._id} className="border-b last:border-b-0 pb-6 last:pb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 capitalize flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  {day.dayOfWeek}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => addTimeSlot(dayIndex)}
                  className="text-purple-600 border-purple-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Slot
                </Button>
              </div>
              <div className="space-y-4">
                {day.times.map((time, timeIndex) => (
                  <div key={time._id || timeIndex} className="flex items-center space-x-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => handleTimeEdit(dayIndex, timeIndex, 'start')}
                          className="w-full justify-between"
                          disabled={!time.isAvailable}
                        >
                          <span>Start: {formatTimeForDisplay(time.startTime)}</span>
                          <Clock className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => handleTimeEdit(dayIndex, timeIndex, 'end')}
                          className="w-full justify-between"
                          disabled={!time.isAvailable}
                        >
                          <span>End: {formatTimeForDisplay(time.endTime)}</span>
                          <Clock className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant={time.isAvailable ? "default" : "outline"}
                      onClick={() => handleAvailabilityToggle(dayIndex, timeIndex)}
                      className={time.isAvailable 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-gray-300 text-gray-700'
                      }
                    >
                      {time.isAvailable ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <XIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => removeTimeSlot(dayIndex, timeIndex)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Time Selection Modal */}
      {editingTime && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setEditingTime(null)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg text-gray-900 mb-4">
                Select {editingTime.type === 'start' ? 'Start' : 'End'} Time
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hour</label>
                  <select
                    value={timeSelection.hour}
                    onChange={(e) => setTimeSelection(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {HOURS.map(hour => (
                      <option key={hour} value={hour} className="text-gray-900">
                        {hour}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Minute</label>
                  <select
                    value={timeSelection.minute}
                    onChange={(e) => setTimeSelection(prev => ({ ...prev, minute: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {MINUTES.map(minute => (
                      <option key={minute} value={minute} className="text-gray-900">
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">AM/PM</label>
                  <select
                    value={timeSelection.period}
                    onChange={(e) => setTimeSelection(prev => ({ ...prev, period: e.target.value as 'AM' | 'PM' }))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {PERIODS.map(period => (
                      <option key={period} value={period} className="text-gray-900">
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingTime(null)} 
                  className="text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTimeSelect} 
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 