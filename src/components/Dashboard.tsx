import React, { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  User,
  Headphones,
  Video,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { colors } from "@/styles/tokens";
import { cn } from "@/lib/utils";

const chartData = [
  { name: "Jan", totalSessions: 150, activeUsers: 800, activeListeners: 50 },
  { name: "Feb", totalSessions: 170, activeUsers: 1600, activeListeners: 55 },
  { name: "Mar", totalSessions: 140, activeUsers: 1500, activeListeners: 45 },
  { name: "Apr", totalSessions: 160, activeUsers: 1550, activeListeners: 60 },
  { name: "May", totalSessions: 140, activeUsers: 1700, activeListeners: 52 },
  { name: "Jun", totalSessions: 120, activeUsers: 1400, activeListeners: 48 },
];

interface ActiveUserItemProps {
  label: string;
  value: string;
  change: number;
}

interface SessionRowProps {
  id: string;
  date: string;
  user: string;
  listener: string;
  duration: string;
  status: string;
}

interface ListenerStatsProps {
  name: string;
  specialties: string;
  rating: number;
  sessionsCompleted: number;
}

const ActiveUserItem: React.FC<ActiveUserItemProps> = ({ label, value, change }) => (
  <div className="flex items-center justify-between border-b border-rs-border py-3 last:border-0 last:pb-0 first:pt-0">
    <span className="text-sm text-rs-text">{label}</span>
    <div className="text-right">
      <p className="text-sm font-medium text-rs-text tabular-nums">{value}</p>
      <p
        className={cn(
          "mt-0.5 flex items-center justify-end text-xs",
          change >= 0 ? "text-rs-success" : "text-rs-text-muted"
        )}
      >
        {change >= 0 ? (
          <ArrowUp className="mr-0.5 h-3 w-3" strokeWidth={1.75} />
        ) : (
          <ArrowDown className="mr-0.5 h-3 w-3" strokeWidth={1.75} />
        )}
        {Math.abs(change)}%
      </p>
    </div>
  </div>
);

const SessionRow: React.FC<SessionRowProps> = ({
  id,
  date,
  user,
  listener,
  duration,
  status,
}) => (
  <TableRow>
    <TableCell className="font-medium text-rs-text">{id}</TableCell>
    <TableCell>{date}</TableCell>
    <TableCell>{user}</TableCell>
    <TableCell>{listener}</TableCell>
    <TableCell>{duration}</TableCell>
    <TableCell>
      <StatusBadge tone={statusToneFrom(status)}>{status}</StatusBadge>
    </TableCell>
  </TableRow>
);

const ListenerStats: React.FC<ListenerStatsProps> = ({
  name,
  specialties,
  rating,
  sessionsCompleted,
}) => (
  <div className="flex items-center justify-between border-b border-rs-border py-3 last:border-0 last:pb-0 first:pt-0">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-rs-text">{name}</p>
      <p className="truncate text-xs text-rs-text-muted">{specialties}</p>
    </div>
    <div className="shrink-0 pl-4 text-right">
      <p className="text-sm font-medium text-rs-text tabular-nums">{rating.toFixed(1)}</p>
      <p className="text-xs text-rs-text-muted">{sessionsCompleted} sessions</p>
    </div>
  </div>
);

const Notification: React.FC<{
  text: string;
  time: string;
  type: "user" | "listener" | "session";
}> = ({ text, time, type }) => {
  const icons = {
    user: <User className="h-4 w-4 text-rs-text-muted" strokeWidth={1.75} />,
    listener: <Headphones className="h-4 w-4 text-rs-text-muted" strokeWidth={1.75} />,
    session: <Video className="h-4 w-4 text-rs-text-muted" strokeWidth={1.75} />,
  };

  return (
    <div className="flex items-start gap-3 border-b border-rs-border py-3 last:border-0 last:pb-0 first:pt-0">
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-rs-text">{text}</p>
        <p className="mt-0.5 text-xs text-rs-text-muted">{time}</p>
      </div>
    </div>
  );
};

const chartTooltipStyle = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 12,
  color: colors.text,
  boxShadow: "none",
};

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");

  return (
    <div className="space-y-8">
      <PageHeader
        description="Overview of users, listeners, and sessions across the platform."
        actions={
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px] border-rs-border bg-rs-surface shadow-none">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {["2021", "2022", "2023", "2024"].map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Stat cards — label + value only, no colored icons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value="25,431"
          trend={{ value: 12, label: "this week" }}
          hint="All registered users"
        />
        <StatCard
          label="Active Listeners"
          value="142"
          trend={{ value: 8, label: "this week" }}
          hint="Listeners available in the last 7 days"
        />
        <StatCard
          label="Total Sessions"
          value="1,893"
          trend={{ value: 15, label: "this week" }}
        />
        <StatCard
          label="Completion Rate"
          value="89%"
          trend={{ value: 5, label: "this week" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>
              Users, listeners, and sessions by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="listeners">Listeners</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4} barCategoryGap="28%">
                      <CartesianGrid
                        stroke={colors.chart.grid}
                        strokeDasharray="0"
                        vertical={false}
                        strokeOpacity={0.8}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.chart.axis, fontSize: 12 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.chart.axis, fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: colors.page }}
                        contentStyle={chartTooltipStyle}
                      />
                      <Bar
                        dataKey="totalSessions"
                        fill={colors.chart.primary}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={16}
                      />
                      <Bar
                        dataKey="activeUsers"
                        fill={colors.chart.tertiary}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={16}
                      />
                      <Bar
                        dataKey="activeListeners"
                        fill={colors.chart.secondary}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-rs-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: colors.chart.primary }}
                    />
                    Sessions
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: colors.chart.tertiary }}
                    />
                    Users
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: colors.chart.secondary }}
                    />
                    Listeners
                  </span>
                </div>
              </TabsContent>
              <TabsContent value="users">
                <p className="py-12 text-center text-sm text-rs-text-muted">
                  User analytics for {selectedPeriod} will appear here.
                </p>
              </TabsContent>
              <TabsContent value="listeners">
                <p className="py-12 text-center text-sm text-rs-text-muted">
                  Listener analytics for {selectedPeriod} will appear here.
                </p>
              </TabsContent>
              <TabsContent value="sessions">
                <p className="py-12 text-center text-sm text-rs-text-muted">
                  Session analytics for {selectedPeriod} will appear here.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveUserItem label="New Users" value="1,245" change={20} />
            <ActiveUserItem label="Active Users" value="18,556" change={12} />
            <ActiveUserItem label="Returning Users" value="8,126" change={5} />
            <ActiveUserItem label="Premium Users" value="2,854" change={15} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <TableCard title="Recent Sessions" className="lg:col-span-2">
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Listener</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SessionRow
                id="S-1234"
                date="Mar 15, 2024"
                user="John Doe"
                listener="Sarah Smith"
                duration="45 mins"
                status="Completed"
              />
              <SessionRow
                id="S-1235"
                date="Mar 15, 2024"
                user="Alice Johnson"
                listener="Mike Brown"
                duration="30 mins"
                status="In Progress"
              />
              <SessionRow
                id="S-1236"
                date="Mar 14, 2024"
                user="Emma Wilson"
                listener="David Lee"
                duration="60 mins"
                status="Completed"
              />
            </TableBody>
          </Table>
        </TableCard>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Listeners</CardTitle>
            </CardHeader>
            <CardContent>
              <ListenerStats
                name="Sarah Smith"
                specialties="Anxiety, Depression"
                rating={4.9}
                sessionsCompleted={156}
              />
              <ListenerStats
                name="Mike Brown"
                specialties="Stress Management"
                rating={4.8}
                sessionsCompleted={142}
              />
              <ListenerStats
                name="David Lee"
                specialties="Relationship Counseling"
                rating={4.7}
                sessionsCompleted={128}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <Notification
                text="New user registration: Emma Wilson"
                time="2 hours ago"
                type="user"
              />
              <Notification
                text="Session completed with Sarah Smith"
                time="3 hours ago"
                type="session"
              />
              <Notification
                text="New listener approved: James Chen"
                time="5 hours ago"
                type="listener"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
