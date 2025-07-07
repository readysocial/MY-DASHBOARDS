import React from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { Card } from '@/components/ui/card';
import {
  Users,
  Clock,
  Star,
  Calendar,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

const ListenerDashboard = () => {
  // Mock data - replace with real data from API
  const stats = [
    {
      label: 'Total Sessions',
      value: '156',
      icon: Users,
      trend: '+12% from last month'
    },
    {
      label: 'Hours Listened',
      value: '483',
      icon: Clock,
      trend: '+8% from last month'
    },
    {
      label: 'Average Rating',
      value: '4.8',
      icon: Star,
      trend: 'Based on 142 reviews'
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      userName: 'Sarah Johnson',
      time: '2:00 PM',
      date: 'Today',
      duration: '45 min'
    },
    {
      id: 2,
      userName: 'Michael Chen',
      time: '4:30 PM',
      date: 'Today',
      duration: '30 min'
    },
    {
      id: 3,
      userName: 'Emma Wilson',
      time: '10:00 AM',
      date: 'Tomorrow',
      duration: '60 min'
    }
  ];

  return (
    <ListenerLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{session.userName}</h3>
                      <p className="text-sm text-gray-500">
                        {session.date} at {session.time} • {session.duration}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Session Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">98%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Response Rate</span>
                  <span className="text-sm font-medium text-gray-900">95%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Satisfaction Score</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ListenerLayout>
  );
};

export default ListenerDashboard; 