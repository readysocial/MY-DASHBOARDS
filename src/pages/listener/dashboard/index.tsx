import React, { useEffect, useState } from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { Card } from '@/components/ui/card';
import {
  Users,
  Clock,
  Star,
  Calendar,
  TrendingUp,
  MessageSquare,
  Tag
} from 'lucide-react';
import { ListenerTopicsSelector } from '@/components/listener/ListenerTopicsSelector';
import { getTopics } from '@/api/listener/generaltopics/api';
import { Topic } from '@/api/listener/generaltopics/types';

const ListenerDashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listenerId, setListenerId] = useState<string>('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        setTopics(response.topics);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();

    // Get listener ID from localStorage or context
    const id = localStorage.getItem('listenerId');
    if (id) {
      setListenerId(id);
    }
  }, []);

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
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Topics Selector */}
        {listenerId && (
          <ListenerTopicsSelector 
            listenerId={listenerId}
            onUpdateSuccess={() => {
              // Optionally refresh dashboard data
              console.log('Topics updated successfully');
            }}
          />
        )}

        {/* Topics Overview */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Available Topics</h2>
            <Tag className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p className="text-gray-500">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-gray-500">No topics available</p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic._id}
                  className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 capitalize">{topic.topic}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {topic.count} sessions
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Upcoming Sessions */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">{session.userName}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {session.date} at {session.time} • {session.duration}
                      </p>
                    </div>
                  </div>
                  <button className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Overview */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Performance Overview</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Session Completion Rate</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">98%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Response Rate</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">95%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Satisfaction Score</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">4.8/5.0</span>
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