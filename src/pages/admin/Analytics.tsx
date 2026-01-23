/**
 * Analytics Page
 * Comprehensive analytics dashboard
 */

import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useAnalytics } from '../../hooks/admin';
import { Card, CardHeader, CardStats } from '../../components/admin/ui/Card';
import { LineChart, BarChart, PieChart, FunnelChart, ConversionFunnel } from '../../components/admin/charts';
import { Button } from '../../components/admin/ui/Button';
import { format, subDays } from 'date-fns';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '1y', label: 'Last year', days: 365 },
];

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const { overview, leads, email, sequences, social, revenue, funnel, pipeline, isLoading } = useAnalytics(period);

  const handleExport = async (type: 'csv' | 'json') => {
    // Export logic
    console.log(`Export as ${type}`);
  };

  // Prepare chart data
  const leadTrendData = leads?.trend?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    leads: item.count,
    converted: item.converted || 0,
  })) || [];

  const emailTrendData = email?.byDay?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    sent: item.sent || 0,
    opens: item.opens || 0,
    clicks: item.clicks || 0,
  })) || [];

  const sourceData = Object.entries(leads?.bySource || {}).map(([source, count]) => ({
    name: source,
    value: count as number,
  }));

  const funnelData = funnel?.stages?.map((stage: any) => ({
    name: stage.stage,
    value: stage.count,
  })) || [];

  const revenueData = revenue?.bySource?.map((item: any) => ({
    name: item.source,
    value: item.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Comprehensive marketing performance insights</p>
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
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            onClick={() => handleExport('csv')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <CardStats
          title="Total Leads"
          value={overview?.leads?.total || 0}
          change={overview?.leads?.growthRate}
        />
        <CardStats
          title="Conversion Rate"
          value={`${overview?.leads?.conversionRate || 0}%`}
          change={overview?.leads?.conversionRateChange}
        />
        <CardStats
          title="Email Open Rate"
          value={`${overview?.email?.openRate || 0}%`}
          change={overview?.email?.openRateChange}
        />
        <CardStats
          title="Active Sequences"
          value={overview?.sequences?.active || 0}
        />
        <CardStats
          title="Total Revenue"
          value={overview?.revenue?.total || 0}
          change={overview?.revenue?.growthRate}
          prefix="$"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trend */}
        <Card>
          <CardHeader title="Lead Trend" subtitle="New leads over time" />
          <LineChart
            data={leadTrendData}
            lines={[
              { dataKey: 'leads', color: '#3b82f6', name: 'Leads' },
              { dataKey: 'converted', color: '#10b981', name: 'Converted' },
            ]}
            xAxisKey="date"
            height={300}
          />
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader title="Lead Sources" subtitle="Where leads come from" />
          <PieChart
            data={sourceData}
            dataKey="value"
            nameKey="name"
            height={300}
            colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']}
          />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Performance */}
        <Card>
          <CardHeader title="Email Performance" subtitle="Sent, opens, and clicks" />
          <LineChart
            data={emailTrendData}
            lines={[
              { dataKey: 'sent', color: '#3b82f6', name: 'Sent' },
              { dataKey: 'opens', color: '#10b981', name: 'Opens' },
              { dataKey: 'clicks', color: '#f59e0b', name: 'Clicks' },
            ]}
            xAxisKey="date"
            height={300}
          />
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader title="Revenue by Source" subtitle="Revenue breakdown" />
          <BarChart
            data={revenueData}
            bars={[{ dataKey: 'value', color: '#10b981' }]}
            xAxisKey="name"
            height={300}
          />
        </Card>
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Conversion Funnel" subtitle="Lead pipeline breakdown" />
          <ConversionFunnel
            data={funnelData}
            height={350}
          />
        </Card>

        <Card>
          <CardHeader title="Funnel Drop-off" subtitle="Visual representation" />
          <FunnelChart
            data={funnelData}
            height={350}
          />
        </Card>
      </div>

      {/* Pipeline Snapshot */}
      <Card>
        <CardHeader title="Current Pipeline" subtitle="Leads by stage" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {pipeline?.stages?.map((stage: any) => (
            <div key={stage.stage} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                stage.count > 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
              } font-bold text-xl mb-2`}>
                {stage.count}
              </div>
              <p className="text-sm font-medium text-gray-700">{stage.stage}</p>
              <p className="text-xs text-gray-500">{stage.percentage}%</p>
            </div>
          )) || (
            <div className="col-span-full text-center text-gray-500 py-8">
              No pipeline data available
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader title="Detailed Metrics" subtitle="Key performance indicators" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Value</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-4">Total Emails Sent</td>
                <td className="py-3 px-4 text-right font-medium">{email?.totalSent?.toLocaleString() || 0}</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {email?.sentChange > 0 ? '+' : ''}{email?.sentChange || 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Overall Open Rate</td>
                <td className="py-3 px-4 text-right font-medium">{email?.openRate?.toFixed(1) || 0}%</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {email?.openRateChange > 0 ? '+' : ''}{email?.openRateChange || 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Click-through Rate</td>
                <td className="py-3 px-4 text-right font-medium">{email?.clickRate?.toFixed(1) || 0}%</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {email?.clickRateChange > 0 ? '+' : ''}{email?.clickRateChange || 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Sequence Completion Rate</td>
                <td className="py-3 px-4 text-right font-medium">{sequences?.completionRate?.toFixed(1) || 0}%</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {sequences?.completionRateChange > 0 ? '+' : ''}{sequences?.completionRateChange || 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Social Engagement Rate</td>
                <td className="py-3 px-4 text-right font-medium">{social?.engagementRate?.toFixed(1) || 0}%</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {social?.engagementRateChange > 0 ? '+' : ''}{social?.engagementRateChange || 0}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">ROI</td>
                <td className="py-3 px-4 text-right font-medium">{revenue?.roi?.toFixed(2) || 0}x</td>
                <td className="py-3 px-4 text-right text-green-600">
                  {revenue?.roiChange > 0 ? '+' : ''}{revenue?.roiChange || 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
