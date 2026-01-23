/**
 * FunnelChart Component
 * Conversion funnel visualization
 */

import React from 'react';
import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface FunnelChartProps {
  data: Array<{
    name: string;
    value: number;
    fill?: string;
  }>;
  height?: number;
  showLabel?: boolean;
}

const FUNNEL_COLORS = [
  '#3b82f6', // primary-600
  '#60a5fa', // primary-400
  '#93c5fd', // primary-300
  '#bfdbfe', // primary-200
  '#dbeafe', // primary-100
];

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  height = 300,
  showLabel = true,
}) => {
  // Calculate conversion rates
  const total = data[0]?.value || 1;
  const enhancedData = data.map((item, index) => ({
    ...item,
    fill: item.fill || FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    conversionRate: index === 0 ? 100 : Math.round((item.value / total) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsFunnelChart margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => [
            name === 'value'
              ? value.toLocaleString()
              : name === 'conversionRate'
              ? `${value}%`
              : value,
            name === 'value' ? 'Count' : 'Conversion Rate',
          ]}
        />
        <Funnel
          data={enhancedData}
          dataKey="value"
          nameKey="name"
          isAnimationActive
          lastShapeType="rectangle"
        >
          {showLabel && (
            <LabelList
              dataKey="value"
              position="center"
              fill="white"
              fontSize={12}
              formatter={(value: number) => value.toLocaleString()}
            />
          )}
        </Funnel>
      </RechartsFunnelChart>
    </ResponsiveContainer>
  );
};

interface ConversionFunnelProps {
  data: Array<{
    stage: string;
    count: number;
    conversionRate?: number;
  }>;
  height?: number;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data, height = 400 }) => {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex flex-col gap-2 h-full justify-center">
        {data.map((item, index) => {
          const widthPercent = (item.count / maxCount) * 100;
          const prevCount = index > 0 ? data[index - 1].count : item.count;
          const dropOffPercent = index > 0 ? ((1 - item.count / prevCount) * 100).toFixed(1) : '0';

          return (
            <div key={item.stage} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700 text-right">
                {item.stage}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div
                    className="bg-primary-500 rounded-lg py-3 px-4 text-white text-sm font-medium transition-all"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.count.toLocaleString()}</span>
                      <span className="text-primary-200">{item.conversionRate || '-'}%</span>
                    </div>
                  </div>
                  {index > 0 && (
                    <div className="absolute -top-1 right-0 text-xs text-red-500 bg-white px-1 rounded shadow">
                      -{dropOffPercent}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
