import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { getDashboardStats } from '../services/dashboardService';
import { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Users, Send, TrendingUp, Clock, CheckCircle, Eye, MessageCircle } from 'lucide-react';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  change?: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, change, icon: Icon, color }) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </Layout>
    );
  }

  // Sample data for charts
  const weeklyMessagesData = [
    { day: 'Mon', sent: 120, received: 89 },
    { day: 'Tue', sent: 150, received: 95 },
    { day: 'Wed', sent: 180, received: 110 },
    { day: 'Thu', sent: 140, received: 87 },
    { day: 'Fri', sent: 200, received: 125 },
    { day: 'Sat', sent: 90, received: 65 },
    { day: 'Sun', sent: 75, received: 45 },
  ];

  const campaignPerformanceData = [
    { name: 'Delivered', value: stats.deliveryRate, color: '#10B981' },
    { name: 'Failed', value: 100 - stats.deliveryRate, color: '#EF4444' },
  ];

  return (
    <Layout>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's your marketing overview"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Contacts"
            value={stats.totalContacts.toLocaleString()}
            change="+12% from last month"
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Messages"
            value={stats.totalMessages.toLocaleString()}
            change="+8% from last month"
            icon={MessageSquare}
            color="bg-green-500"
          />
          <StatCard
            title="Active Campaigns"
            value={stats.totalCampaigns}
            change="+3 this month"
            icon={Send}
            color="bg-purple-500"
          />
          <StatCard
            title="Active Conversations"
            value={stats.activeConversations}
            icon={MessageCircle}
            color="bg-orange-500"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
              <p className="text-sm text-gray-600">Delivery Rate</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.openRate}%</p>
              <p className="text-sm text-gray-600">Open Rate</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              <p className="text-sm text-gray-600">Response Rate</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Messages Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Message Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyMessagesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
                <Bar dataKey="received" fill="#10B981" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Campaign Performance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {campaignPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {campaignPerformanceData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Today's Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Send className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-xl font-bold text-gray-900">{stats.messagesSentToday}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Messages Received</p>
                <p className="text-xl font-bold text-gray-900">{stats.messagesReceivedToday}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Campaigns This Month</p>
                <p className="text-xl font-bold text-gray-900">{stats.campaignsThisMonth}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};