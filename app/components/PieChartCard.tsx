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

// Fuggler 風格的鮮豔詭異色調
const COLORS = [
  '#e91e8c', // fuggler pink
  '#39ff14', // neon green
  '#fff01f', // neon yellow
  '#8b00ff', // purple
  '#ff6bb3', // pink light
  '#00ffff', // cyan
  '#ff4444', // red
  '#ff8800', // orange
  '#00ff88', // mint
  '#ff00ff', // magenta
];

export default function PieChartCard({ holdings, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <div className="card-fuggler p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b00ff] to-[#e91e8c] flex items-center justify-center shadow-[0_0_20px_rgba(139,0,255,0.5)]">
            <span className="text-xl">👁</span>
          </div>
          <h3 className="text-lg font-bold text-white">持股佔比</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#e91e8c] to-[#8b00ff] flex items-center justify-center animate-float-wobble shadow-neon-pink">
            <span className="text-2xl">👁</span>
          </div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0 || holdings.every((h) => h.marketValue === 0)) {
    return (
      <div className="card-fuggler p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b00ff] to-[#e91e8c] flex items-center justify-center shadow-[0_0_20px_rgba(139,0,255,0.5)]">
            <span className="text-xl">👁</span>
          </div>
          <h3 className="text-lg font-bold text-white">持股佔比</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#e91e8c] to-[#8b00ff] flex items-center justify-center mb-4 shadow-neon-pink animate-float-wobble">
            <span className="text-4xl">📊</span>
          </div>
          <p className="text-[#ff6bb3] font-medium">請先新增持股並更新報價</p>
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
        <div className="bg-[#0d0510]/95 backdrop-blur-sm shadow-neon-pink rounded-lg px-4 py-3 border-2 border-[#e91e8c]">
          <p className="font-bold text-white">{data.name}</p>
          <p className="text-sm text-[#39ff14] font-medium">
            市值: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-[#fff01f] font-medium">
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
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.slice(0, 6).map((entry: { value: string; color?: string; payload?: ChartDataItem }, index: number) => (
          <div key={index} className="flex items-center text-sm bg-[#1a0a1f]/50 border border-[#e91e8c]/30 rounded-lg px-3 py-1">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color || '#ccc', boxShadow: `0 0 8px ${entry.color || '#ccc'}` }}
            />
            <span className="text-white font-medium">
              {entry.value} <span className="text-[#ff6bb3]">({entry.payload ? (entry.payload.weight * 100).toFixed(1) : 0}%)</span>
            </span>
          </div>
        ))}
        {payload.length > 6 && (
          <span className="text-sm text-[#ff6bb3] font-medium">+{payload.length - 6} 其他</span>
        )}
      </div>
    );
  };

  return (
    <div className="card-fuggler p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b00ff] to-[#e91e8c] flex items-center justify-center shadow-[0_0_20px_rgba(139,0,255,0.5)]">
          <span className="text-xl">👁</span>
        </div>
        <h3 className="text-lg font-bold text-white">持股佔比</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
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
