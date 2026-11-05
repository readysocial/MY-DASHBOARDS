import React, { useEffect, useState } from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { TableCard } from '@/components/ui/table-card';
import {
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
      hint: '+12% from last month',
    },
    {
      label: 'Hours Listened',
      value: '483',
      hint: '+8% from last month',
    },
    {
      label: 'Average Rating',
      value: '4.8',
      hint: 'Based on 142 reviews',
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
        <PageHeader
          title="Dashboard"
          description="Your listening activity at a glance."
        />

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
            />
          ))}
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
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <div className="min-w-0 space-y-1">
              <CardTitle>Available Topics</CardTitle>
              <CardDescription>Topics you listen to</CardDescription>
            </div>
            <Tag size={16} strokeWidth={1.75} className="shrink-0 text-rs-text-muted" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-rs-text-muted">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-sm text-rs-text-muted">No topics available</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <div
                    key={topic._id}
                    className="flex items-center gap-3 rounded-lg border border-rs-border bg-rs-surface p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rs-primary-tint">
                      <Tag size={16} strokeWidth={1.75} className="text-rs-primary" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium capitalize text-rs-text">{topic.topic}</h3>
                      <p className="text-xs tabular-nums text-rs-text-muted">
                        {topic.count} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <TableCard
            title="Upcoming Sessions"
            description="Your next scheduled sessions"
          >
            <div className="space-y-2 p-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-rs-border bg-rs-surface p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rs-primary-tint">
                      <MessageSquare size={16} strokeWidth={1.75} className="text-rs-primary" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-rs-text">{session.userName}</h3>
                      <p className="truncate text-xs text-rs-text-muted">
                        {session.date} at {session.time} • {session.duration}
                      </p>
                    </div>
                  </div>
                  <button className="shrink-0 text-xs font-medium text-rs-blue hover:underline">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </TableCard>

          {/* Performance Overview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div className="min-w-0 space-y-1">
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Completion and satisfaction</CardDescription>
              </div>
              <TrendingUp size={16} strokeWidth={1.75} className="shrink-0 text-rs-text-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Session Completion Rate', value: '98%', width: '98%' },
                { label: 'Response Rate', value: '95%', width: '95%' },
                { label: 'Satisfaction Score', value: '4.8/5.0', width: '96%' },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium text-rs-text-secondary">{row.label}</span>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-rs-text">{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-rs-border/60">
                    <div className="h-1.5 rounded-full bg-rs-primary" style={{ width: row.width }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-rs-border pt-3 text-xs text-rs-text-muted">
                <Calendar size={14} strokeWidth={1.75} />
                Updated after each session
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ListenerLayout>
  );
};

export default ListenerDashboard;
