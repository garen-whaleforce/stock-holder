'use client';

import { PortfolioSummary, Currency, MarketBreakdown } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

interface SummaryCardsProps {
  summary: PortfolioSummary | null;
  isLoading: boolean;
  baseCurrency?: Currency;
  exchangeRate?: number;
  isMixed?: boolean;
}

export default function SummaryCards({ summary, isLoading, baseCurrency = 'USD', exchangeRate, isMixed = false }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">總市值</div>
          <div className="text-2xl font-bold text-gray-900">$0.00</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">未實現損益</div>
          <div className="text-2xl font-bold text-gray-400">--</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">前三大持股集中度</div>
          <div className="text-2xl font-bold text-gray-400">--</div>
        </div>
      </div>
    );
  }

  const isProfit = summary.totalUnrealizedPnL >= 0;
  const pnlColor = isProfit ? 'text-green-600' : 'text-red-600';
  const pnlBgColor = isProfit ? 'bg-green-50' : 'bg-red-50';

  // 集中度警示顏色
  const getConcentrationColor = (concentration: number) => {
    if (concentration > 0.7) return 'text-red-600';
    if (concentration > 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 總市值 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm text-gray-500">總市值</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(summary.totalMarketValue, baseCurrency)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          成本: {formatCurrency(summary.totalCost, baseCurrency)}
        </div>
        {/* 混合帳戶顯示市場分類 */}
        {isMixed && (summary.usBreakdown || summary.twBreakdown) && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {summary.usBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">美股</span>
                <span className="text-gray-700 font-medium">{formatCurrency(summary.usBreakdown.marketValue, 'USD')}</span>
              </div>
            )}
            {summary.twBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-green-600">台股</span>
                <span className="text-gray-700 font-medium">{formatCurrency(summary.twBreakdown.marketValue, 'TWD')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 未實現損益 */}
      <div className={`rounded-xl shadow-sm border border-gray-100 p-5 ${pnlBgColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg ${isProfit ? 'bg-green-200' : 'bg-red-200'} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${pnlColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isProfit ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              )}
            </svg>
          </div>
          <span className="text-sm text-gray-600">未實現損益</span>
        </div>
        <div className={`text-2xl font-bold ${pnlColor}`}>
          {isProfit ? '+' : ''}{formatCurrency(summary.totalUnrealizedPnL, baseCurrency)}
        </div>
        <div className={`text-sm ${pnlColor} mt-1`}>
          {formatPercent(summary.totalUnrealizedPnLPercent)}
        </div>
        {/* 混合帳戶顯示市場分類損益 */}
        {isMixed && (summary.usBreakdown || summary.twBreakdown) && (
          <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-1">
            {summary.usBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">美股</span>
                <span className={summary.usBreakdown.unrealizedPnL >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {summary.usBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.usBreakdown.unrealizedPnL, 'USD')}
                </span>
              </div>
            )}
            {summary.twBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-green-600">台股</span>
                <span className={summary.twBreakdown.unrealizedPnL >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {summary.twBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.twBreakdown.unrealizedPnL, 'TWD')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 集中度 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <span className="text-sm text-gray-500">前三大持股集中度</span>
        </div>
        <div className={`text-2xl font-bold ${getConcentrationColor(summary.concentration)}`}>
          {(summary.concentration * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {summary.concentration > 0.5 ? '建議分散投資' : '分散度良好'}
        </div>
      </div>

      {/* 匯率資訊（混合帳戶） */}
      {isMixed && exchangeRate && (
        <div className="sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">混合帳戶匯率</div>
                <div className="text-xs text-gray-500">所有市值已轉換為 {baseCurrency}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-700">
                1 USD = {exchangeRate.toFixed(2)} TWD
              </div>
              <div className="text-xs text-gray-500">即時匯率</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
