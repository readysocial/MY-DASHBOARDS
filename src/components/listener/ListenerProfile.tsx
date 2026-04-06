import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getListenerProfile } from '@/api/listener/listenerprofile/api';
import { updateListenerProfile } from '@/api/listener/listenerupdate/api';
import type { ListenerProfile as ListenerProfileType } from '@/api/listener/listenerprofile/types';
import type { UpdateListenerRequest } from '@/api/listener/listenerupdate/types';
import { UserCircle, Phone, Mail, Clock, Pencil, Save, X, User } from 'lucide-react';
import { useRouter } from 'next/router';

interface ProfileFormData {
  name: string;
  phoneNumber: string;
  description: string;
  gender: string;
}

interface ProfileFormErrors {
  name?: string;
  phoneNumber?: string;
  description?: string;
  gender?: string;
}

export const ListenerProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ListenerProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phoneNumber: '',
    description: '',
    gender: '',
  });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const enterEditMode = () => {
    if (!profile) return;
    setFormData({
      name: profile.name ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      description: profile.description ?? '',
      gender: profile.gender ?? '',
    });
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFormErrors({});
    setError(null);
    setIsEditing(false);
  };

  const validateForm = (): boolean => {
    const errors: ProfileFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const listenerData = localStorage.getItem('listenerData');
      if (!listenerData) throw new Error('No listener data found');
      const parsedListenerData = JSON.parse(listenerData);
      const { _id } = parsedListenerData;

      const updateData: UpdateListenerRequest = {
        email: profile.email,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        description: formData.description.trim(),
        gender: formData.gender,
        availability: profile.availability.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          times: day.times.map((time) => ({
            startTime: time.startTime,
            endTime: time.endTime,
            isAvailable: time.isAvailable,
          })),
        })),
      };

      await updateListenerProfile(_id, updateData);

      // Update local profile state with new values
      setProfile({
        ...profile,
        name: updateData.name,
        phoneNumber: updateData.phoneNumber,
        description: updateData.description,
        gender: updateData.gender,
      });

      // Keep listenerData in localStorage in sync (used by layout header)
      localStorage.setItem(
        'listenerData',
        JSON.stringify({ ...parsedListenerData, name: updateData.name })
      );

      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">My Profile</h1>

      {successMessage && (
        <div className="p-3 sm:p-4 rounded-md mb-4 sm:mb-6 text-xs sm:text-sm bg-green-50 text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4 rounded-md mb-4 sm:mb-6 text-xs sm:text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h2>
            {!isEditing ? (
              <Button
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs sm:text-sm py-1.5 sm:py-2"
                onClick={enterEditMode}
              >
                <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="border-gray-300 text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Name */}
            <div className="flex items-start">
              <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2 sm:mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500">Name</div>
                {isEditing ? (
                  <>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1 focus-visible:ring-purple-500"
                      placeholder="Enter your name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.name}</p>
                    )}
                  </>
                ) : (
                  <div className="text-sm sm:text-base text-gray-900">{profile.name}</div>
                )}
              </div>
            </div>

            {/* Email (always read-only) */}
            <div className="flex items-start">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2 sm:mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500">
                  Email
                  {isEditing && (
                    <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
                  )}
                </div>
                <div className="text-sm sm:text-base text-gray-900">{profile.email}</div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2 sm:mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500">Phone</div>
                {isEditing ? (
                  <>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                      }
                      className="mt-1 focus-visible:ring-purple-500"
                      placeholder="Enter your phone number"
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-600 font-medium">
                        {formErrors.phoneNumber}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-sm sm:text-base text-gray-900">{profile.phoneNumber}</div>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2 sm:mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500">Gender</div>
                {isEditing ? (
                  <>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, gender: e.target.value }))
                      }
                      className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {formErrors.gender && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.gender}</p>
                    )}
                  </>
                ) : (
                  <div className="text-sm sm:text-base text-gray-900 capitalize">
                    {profile.gender || '—'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">About Me</h2>
          {isEditing ? (
            <>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="min-h-[120px] focus-visible:ring-purple-500"
                placeholder="Tell us about yourself"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.description}</p>
              )}
            </>
          ) : (
            <p className="text-sm sm:text-base text-gray-700">{profile.description}</p>
          )}
        </Card>

        {/* Availability Schedule */}
        <Card className="p-4 sm:p-6 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Availability Schedule</h2>
            <Button
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs sm:text-sm py-1.5 sm:py-2"
              onClick={() => router.push('/listener/schedule')}
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Edit Schedule
            </Button>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {profile.availability.map((day) => (
              <div key={day._id} className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 capitalize mb-2">
                  {day.dayOfWeek}
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  {day.times.map((time) => (
                    <div
                      key={time._id}
                      className={`text-xs sm:text-sm ${
                        time.isAvailable
                          ? 'text-green-600'
                          : 'text-gray-500 line-through'
                      }`}
                    >
                      {formatTime(time.startTime)} - {formatTime(time.endTime)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
