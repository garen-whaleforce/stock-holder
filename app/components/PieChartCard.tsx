'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { HoldingWithMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/portfolio';

interface PieChartCardProps {
  holdings: HoldingWithMetrics[];
  isLoading: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  weight: number;
  color: string;
}

// 顏色調色盤
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export default function PieChartCard({ holdings, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">持股佔比</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0 || holdings.every((h) => h.marketValue === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">持股佔比</h3>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p>請先新增持股並更新報價</p>
        </div>
      </div>
    );
  }

  // 準備圖表資料，依市值排序
  const chartData = holdings
    .filter((h) => h.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((h, index) => ({
      name: h.symbol,
      value: h.marketValue,
      weight: h.weight,
      color: COLORS[index % COLORS.length],
    }));

  // 自訂 Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; weight: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            市值: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            佔比: {(data.weight * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // 自訂 Legend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
        {payload.slice(0, 6).map((entry: { value: string; color?: string; payload?: ChartDataItem }, index: number) => (
          <div key={index} className="flex items-center text-sm">
            <div
              className="w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: entry.color || '#ccc' }}
            />
            <span className="text-gray-600">
              {entry.value} ({entry.payload ? (entry.payload.weight * 100).toFixed(1) : 0}%)
            </span>
          </div>
        ))}
        {payload.length > 6 && (
          <span className="text-sm text-gray-400">+{payload.length - 6} 其他</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">持股佔比</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
