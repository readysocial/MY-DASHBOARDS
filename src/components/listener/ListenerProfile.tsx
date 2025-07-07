import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getListenerProfile } from '@/api/listener/listenerprofile/api';
import type { ListenerProfile as ListenerProfileType } from '@/api/listener/listenerprofile/types';
import { UserCircle, Phone, Mail, Clock } from 'lucide-react';
import { useRouter } from 'next/router';

export const ListenerProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ListenerProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-gray-900">{profile.name}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-gray-900">{profile.email}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-gray-900">{profile.phoneNumber}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
          <p className="text-gray-700">{profile.description}</p>
        </Card>

        {/* Availability Schedule */}
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Availability Schedule</h2>
            <Button 
              variant="outline" 
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
              onClick={() => router.push('/listener/schedule')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Edit Schedule
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.availability.map((day) => (
              <div key={day._id} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 capitalize mb-2">
                  {day.dayOfWeek}
                </h3>
                <div className="space-y-2">
                  {day.times.map((time) => (
                    <div
                      key={time._id}
                      className={`text-sm ${
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