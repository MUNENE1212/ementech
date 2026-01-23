/**
 * Dashboard Page
 * Main dashboard with KPIs and charts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Mail,
  MessageSquare,
  Share2,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { useAnalytics } from '../hooks';
import { Card, CardStats } from '../components/ui/Card';
import { LineChart, BarChart, PieChart } from '../components/charts';
import { format } from 'date-fns';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const { overview, leads, email, sequences, social, revenue, isLoading } = useAnalytics(period);

  // Prepare chart data
  const leadTrendData = leads?.trend?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    leads: item.count,
  })) || [];

  const emailPerformanceData = email?.byDay?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    sent: item.sent,
    opened: item.opens,
    clicked: item.clicks,
  })) || [];

  const sourceData = Object.entries(leads?.bySource || {}).map(([source, count]) => ({
    name: source,
    value: count as number,
  }));

  const statusData = Object.entries(leads?.byStatus || {}).map(([status, count]) => ({
    name: status,
    value: count as number,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back! Here's what's happening with your marketing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Calendar className="text-gray-400" size={20} />
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardStats
            title="Total Leads"
            value={overview?.leads?.total || 0}
            change={overview?.leads?.growthRate}
            icon={<Users className="w-6 h-6 text-primary-500" />}
            suffix=""
          />
          <CardStats
            title="Emails Sent"
            value={overview?.email?.sent || 0}
            change={overview?.email?.growthRate}
            icon={<Mail className="w-6 h-6 text-accent-500" />}
            suffix=""
          />
          <CardStats
            title="Active Sequences"
            value={overview?.sequences?.active || 0}
            icon={<MessageSquare className="w-6 h-6 text-gold-500" />}
            suffix=""
          />
          <CardStats
            title="Total Revenue"
            value={overview?.revenue?.total || 0}
            change={overview?.revenue?.growthRate}
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            prefix="$"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Lead Trend"
            subtitle="New leads over time"
            action={
              <button
                onClick={() => navigate('/leads')}
                className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight size={16} />
              </button>
            }
          />
          <LineChart
            data={leadTrendData}
            lines={[{ dataKey: 'leads' }]}
            xAxisKey="date"
            height={250}
          />
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader title="Lead Sources" subtitle="Where leads come from" />
          <PieChart
            data={sourceData}
            dataKey="value"
            nameKey="name"
            height={250}
            innerRadius={40}
          />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Performance */}
        <Card>
          <CardHeader
            title="Email Performance"
            subtitle="Sent, opens, and clicks"
            action={
              <button
                onClick={() => navigate('/campaigns')}
                className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View Campaigns <ArrowUpRight size={16} />
              </button>
            }
          />
          <LineChart
            data={emailPerformanceData}
            lines={[
              { dataKey: 'sent', color: '#3b82f6' },
              { dataKey: 'opened', color: '#10b981' },
              { dataKey: 'clicked', color: '#f59e0b' },
            ]}
            xAxisKey="date"
            height={250}
          />
        </Card>

        {/* Pipeline Status */}
        <Card>
          <CardHeader
            title="Pipeline Status"
            subtitle="Current lead distribution"
            action={
              <button
                onClick={() => navigate('/leads')}
                className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View Pipeline <ArrowUpRight size={16} />
              </button>
            }
          />
          <PieChart
            data={statusData}
            dataKey="value"
            nameKey="name"
            height={250}
            colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']}
          />
        </Card>
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Campaigns"
            action={
              <button
                onClick={() => navigate('/campaigns')}
                className="text-primary-600 text-sm font-medium hover:underline"
              >
                View All
              </button>
            }
          />
          <div className="space-y-3">
            {email?.recentCampaigns?.slice(0, 4).map((campaign: any) => (
              <div
                key={campaign._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaign._id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.sent?.toLocaleString() || 0} sent · {campaign.openRate?.toFixed(1) || 0}% open
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                  {campaign.status}
                </span>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No recent campaigns
              </div>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader title="Quick Stats" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Open Rate</span>
              <span className="font-semibold text-gray-900">
                {overview?.email?.openRate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Click Rate</span>
              <span className="font-semibold text-gray-900">
                {overview?.email?.clickRate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sequence Completion</span>
              <span className="font-semibold text-gray-900">
                {overview?.sequences?.completionRate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ROI</span>
              <span className="font-semibold text-green-600">
                {overview?.revenue?.roi?.toFixed(1) || 0}x
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);
