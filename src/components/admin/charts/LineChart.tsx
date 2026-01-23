/**
 * LineChart Component
 * Wrapper around Recharts LineChart
 */

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: Record<string, any>[];
  lines: {
    dataKey: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }[];
  xAxisKey: string;
  height?: number;
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

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
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
            iconType="circle"
            fontSize={12}
          />
        )}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || COLORS[index % COLORS.length]}
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
