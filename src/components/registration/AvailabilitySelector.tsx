import React from 'react';
import { Plus, X, Clock } from 'lucide-react';
import { DayAvailability, TimeSlot } from '@/api/listener/registration/types';
import { DAYS_OF_WEEK } from '@/constants/listener';

interface AvailabilitySelectorProps {
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
  error?: string;
}

export const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({
  availability,
  onChange,
  error,
}) => {
  const addTimeSlot = (dayOfWeek: string) => {
    const newAvailability = availability.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          times: [
            ...day.times,
            { startTime: '09:00', endTime: '17:00', isAvailable: true }
          ]
        };
      }
      return day;
    });
    onChange(newAvailability);
  };

  const removeTimeSlot = (dayOfWeek: string, timeIndex: number) => {
    const newAvailability = availability.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          times: day.times.filter((_, index) => index !== timeIndex)
        };
      }
      return day;
    });
    onChange(newAvailability);
  };

  const updateTimeSlot = (
    dayOfWeek: string,
    timeIndex: number,
    field: keyof TimeSlot,
    value: string | boolean
  ) => {
    const newAvailability = availability.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          times: day.times.map((time, index) => {
            if (index === timeIndex) {
              return { ...time, [field]: value };
            }
            return time;
          })
        };
      }
      return day;
    });
    onChange(newAvailability);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg md:text-xl font-medium text-gray-900">
          Availability Schedule
        </h3>
        {error && <p className="text-sm md:text-base text-red-600 font-medium">{error}</p>}
      </div>

      <div className="space-y-6">
        {availability.map((day) => (
          <div
            key={day.dayOfWeek}
            className="border-2 border-purple-100 rounded-lg p-4 md:p-6 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h4 className="text-base md:text-lg font-medium capitalize text-gray-900">
                {day.dayOfWeek}
              </h4>
              <button
                type="button"
                onClick={() => addTimeSlot(day.dayOfWeek)}
                className="flex items-center text-sm md:text-base text-purple-600 
                  hover:text-purple-700 font-medium transition-colors"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1" />
                Add Time Slot
              </button>
            </div>

            <div className="space-y-4">
              {day.times.map((time, timeIndex) => (
                <div
                  key={timeIndex}
                  className="flex items-center space-x-4 bg-purple-50 p-4 rounded-lg
                    flex-wrap md:flex-nowrap gap-4"
                >
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={time.startTime}
                        onChange={(e) =>
                          updateTimeSlot(day.dayOfWeek, timeIndex, 'startTime', e.target.value)
                        }
                        className="block w-full px-3 py-2 md:py-3 rounded-md 
                          border-2 border-purple-200 bg-white text-gray-900
                          focus:ring-4 focus:ring-purple-200 focus:border-purple-500
                          transition duration-150 ease-in-out text-base md:text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={time.endTime}
                        onChange={(e) =>
                          updateTimeSlot(day.dayOfWeek, timeIndex, 'endTime', e.target.value)
                        }
                        className="block w-full px-3 py-2 md:py-3 rounded-md 
                          border-2 border-purple-200 bg-white text-gray-900
                          focus:ring-4 focus:ring-purple-200 focus:border-purple-500
                          transition duration-150 ease-in-out text-base md:text-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(day.dayOfWeek, timeIndex)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <X className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>
              ))}

              {day.times.length === 0 && (
                <div className="text-center py-6 text-gray-500 bg-purple-50 rounded-lg">
                  <p className="text-sm md:text-base">
                    No time slots added. Click "Add Time Slot" to set availability.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 