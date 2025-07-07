import React, { useState } from 'react';
import { User, Mail, Phone, FileText } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { AvailabilitySelector } from './AvailabilitySelector';
import { ListenerRegistrationRequest, RegistrationPrefilledData } from '@/api/listener/registration/types';
import { DAYS_OF_WEEK, GENDERS } from '@/constants/listener';

interface RegistrationFormProps {
  prefilledData: RegistrationPrefilledData;
  onSubmit: (data: ListenerRegistrationRequest) => Promise<void>;
  isSubmitting: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  prefilledData,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<Partial<ListenerRegistrationRequest>>({
    token: prefilledData.token,
    password: '',
    description: '',
    gender: 'male',
    phoneNumber: '',
    availability: DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day,
      times: []
    }))
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    const hasNoAvailability = formData.availability?.every(
      day => day.times.length === 0
    );

    if (hasNoAvailability) {
      newErrors.availability = 'Please set at least one time slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData as ListenerRegistrationRequest);
    } catch (error) {
      // Error handling is managed by the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Pre-filled Information */}
      <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-100">
        <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-4">Your Information</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <User className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            <div>
              <p className="text-sm md:text-base font-medium text-gray-500">Name</p>
              <p className="text-base md:text-lg font-medium text-gray-900">{prefilledData.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Mail className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            <div>
              <p className="text-sm md:text-base font-medium text-gray-500">Email</p>
              <p className="text-base md:text-lg font-medium text-gray-900">{prefilledData.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div>
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Set Your Password
        </label>
        <PasswordInput
          value={formData.password || ''}
          onChange={(value) => setFormData({ ...formData, password: value })}
          error={errors.password}
        />
      </div>

      {/* Description Section */}
      <div>
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Professional Description
        </label>
        <div className="relative">
          <div className="absolute left-3 top-3 md:top-4">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full pl-10 pr-4 py-3 text-base md:text-lg rounded-lg border-2 min-h-[120px]
              transition-all duration-200 bg-white text-gray-900 placeholder-gray-500
              ${errors.description ? 'border-red-400' : 'border-purple-200'}
              focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500
              hover:border-purple-300`}
            placeholder="Describe your experience and expertise..."
          />
          {errors.description && (
            <p className="mt-1 text-sm md:text-base text-red-600 font-medium">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Gender Selection */}
      <div>
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Gender
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
          className="w-full px-4 py-3 text-base md:text-lg rounded-lg border-2 border-purple-200
            bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-200 
            focus:border-purple-500 hover:border-purple-300"
        >
          {GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Phone className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
          </div>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className={`w-full pl-10 pr-4 py-3 text-base md:text-lg rounded-lg border-2
              transition-all duration-200 bg-white text-gray-900 placeholder-gray-500
              ${errors.phoneNumber ? 'border-red-400' : 'border-purple-200'}
              focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500
              hover:border-purple-300`}
            placeholder="+1234567890"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm md:text-base text-red-600 font-medium">{errors.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Availability Section */}
      <div>
        <AvailabilitySelector
          availability={formData.availability || []}
          onChange={(availability) => setFormData({ ...formData, availability })}
          error={errors.availability}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 md:px-8 md:py-4 bg-purple-600 text-white rounded-lg 
            font-medium text-base md:text-lg hover:bg-purple-700 focus:outline-none 
            focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-all duration-200 transform hover:scale-[1.02] w-full md:w-auto"
        >
          {isSubmitting ? 'Creating your account...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
};