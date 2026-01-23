/**
 * PieChart Component
 * Wrapper around Recharts PieChart
 */

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PieChartProps {
  data: Record<string, any>[];
  dataKey: string;
  nameKey: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6', // primary-600
  '#10b981', // accent-600
  '#f59e0b', // gold-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
  colors = DEFAULT_COLORS,
  showTooltip = true,
  showLegend = true,
}) => {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (innerRadius > 0) return null; // Don't show labels for donut chart

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [value, 'Count']}
          />
        )}
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            fontSize={12}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
