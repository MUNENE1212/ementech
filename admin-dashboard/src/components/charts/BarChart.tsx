/**
 * BarChart Component
 * Wrapper around Recharts BarChart
 */

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: Record<string, any>[];
  bars: {
    dataKey: string;
    name?: string;
    color?: string;
  }[];
  xAxisKey: string;
  height?: number;
  horizontal?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

const COLORS = [
  '#3b82f6', // primary-600
  '#10b981', // accent-600
  '#f59e0b', // gold-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 300,
  horizontal = false,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={horizontal ? undefined : xAxisKey}
          type={horizontal ? 'number' : 'category'}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type={horizontal ? 'category' : 'number'}
          dataKey={horizontal ? xAxisKey : undefined}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
          }
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
            iconType="rect"
            fontSize={12}
          />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
