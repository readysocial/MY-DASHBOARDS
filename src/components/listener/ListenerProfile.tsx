import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCard } from '@/components/ui/table-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { PageError } from '@/components/ui/page-error';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getListenerProfile } from '@/api/listener/listenerprofile/api';
import { updateListenerProfile } from '@/api/listener/listenerupdate/api';
import type { ListenerProfile as ListenerProfileType } from '@/api/listener/listenerprofile/types';
import type { UpdateListenerRequest } from '@/api/listener/listenerupdate/types';
import { UserCircle, Phone, Mail, Clock, Pencil, Save, X, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { requireListenerAuth } from '@/utils/listenerAuth';

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
      const auth = requireListenerAuth();
      if (!auth) return; // redirect already triggered
      try {
        const response = await getListenerProfile(auth.listenerData._id);
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
      const auth = requireListenerAuth();
      if (!auth) return; // redirect already triggered
      const parsedListenerData = auth.listenerData;
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
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !profile) {
    return <PageError message={error} onRetry={() => window.location.reload()} />;
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
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your public listener details and availability."
        actions={
          !isEditing ? (
            <Button variant="outline" size="sm" onClick={enterEditMode}>
              <Pencil size={14} strokeWidth={1.75} className="mr-1.5" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                <X size={14} strokeWidth={1.75} className="mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save size={14} strokeWidth={1.75} className="mr-1.5" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )
        }
      />

      {successMessage && (
        <InlineAlert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </InlineAlert>
      )}

      {error && (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      )}

      <div className="grid items-stretch gap-4 lg:grid-cols-5">
        {/* Basic Information */}
        <Card className="flex h-full flex-col lg:col-span-3">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Shown to users when booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            <ProfileRow icon={<UserCircle size={16} strokeWidth={1.75} />} label="Name">
              {isEditing ? (
                <div className="w-full">
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs font-medium text-rs-primary">{formErrors.name}</p>
                  )}
                </div>
              ) : (
                <span className="font-medium text-rs-text">{profile.name}</span>
              )}
            </ProfileRow>

            <ProfileRow icon={<Mail size={16} strokeWidth={1.75} />} label="Email">
              <span className="break-all font-medium text-rs-text">
                {profile.email}
                {isEditing && (
                  <span className="ml-2 text-[11px] font-normal text-rs-text-muted">(cannot be changed)</span>
                )}
              </span>
            </ProfileRow>

            <ProfileRow icon={<Phone size={16} strokeWidth={1.75} />} label="Phone">
              {isEditing ? (
                <div className="w-full">
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    placeholder="Enter your phone number"
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-xs font-medium text-rs-primary">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>
              ) : (
                <span className="font-medium tabular-nums text-rs-text">{profile.phoneNumber}</span>
              )}
            </ProfileRow>

            <ProfileRow icon={<User size={16} strokeWidth={1.75} />} label="Gender" last>
              {isEditing ? (
                <div className="w-full">
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, gender: e.target.value }))
                    }
                    className="w-full rounded-md border border-rs-border bg-rs-surface px-3 py-2 text-sm text-rs-text outline-none rs-focus-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {formErrors.gender && (
                    <p className="mt-1 text-xs font-medium text-rs-primary">{formErrors.gender}</p>
                  )}
                </div>
              ) : (
                <span className="font-medium capitalize text-rs-text">{profile.gender || '—'}</span>
              )}
            </ProfileRow>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="flex h-full flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Short bio users see</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="min-h-[120px]"
                  placeholder="Tell us about yourself"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs font-medium text-rs-primary">{formErrors.description}</p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-rs-text-secondary">{profile.description}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Availability Schedule */}
      <TableCard
        title="Availability Schedule"
        description="Weekly slots available for booking"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/listener/schedule')}>
            <Clock size={14} strokeWidth={1.75} className="mr-1.5" />
            Edit Schedule
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.availability.map((day) => (
            <div key={day._id} className="rounded-lg border border-rs-border bg-rs-surface p-3">
              <h3 className="text-sm font-medium capitalize text-rs-text">
                {day.dayOfWeek}
              </h3>
              <div className="mt-1.5 space-y-1">
                {day.times.length === 0 ? (
                  <p className="text-xs text-rs-text-muted">No slots</p>
                ) : (
                  day.times.map((time) => (
                    <div
                      key={time._id}
                      className={`text-xs tabular-nums ${
                        time.isAvailable
                          ? 'text-rs-success'
                          : 'text-rs-text-muted line-through'
                      }`}
                    >
                      {formatTime(time.startTime)} - {formatTime(time.endTime)}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </TableCard>
    </div>
  );
};

const ProfileRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ icon, label, children, last }) => (
  <div
    className={`flex items-center justify-between gap-3 py-2.5 ${
      last ? '' : 'border-b border-rs-border'
    }`}
  >
    <div className="flex min-w-0 shrink-0 items-center gap-2 text-rs-text-secondary">
      <span className="shrink-0 text-rs-text-muted">{icon}</span>
      <span className="text-[13px]">{label}</span>
    </div>
    <div className="flex min-w-0 flex-1 justify-end text-right">{children}</div>
  </div>
);
