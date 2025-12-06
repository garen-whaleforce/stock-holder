'use client';

import { RiskLevel } from '@/lib/types';

const RISK_OPTIONS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'conservative', label: '保守型', color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  { value: 'balanced', label: '平衡型', color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
  { value: 'aggressive', label: '積極型', color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
];

const RISK_ACTIVE_COLORS: Record<RiskLevel, string> = {
  conservative: 'bg-green-500 text-white border-green-500',
  balanced: 'bg-blue-500 text-white border-blue-500',
  aggressive: 'bg-red-500 text-white border-red-500',
};

interface AdvicePanelProps {
  advice: string | null;
  isLoading: boolean;
  error: string | null;
  onGetAdvice: () => void;
  disabled: boolean;
  riskLevel: RiskLevel;
  onRiskLevelChange: (level: RiskLevel) => void;
}

export default function AdvicePanel({
  advice,
  isLoading,
  error,
  onGetAdvice,
  disabled,
  riskLevel,
  onRiskLevelChange,
}: AdvicePanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI 投資建議</h3>
        <div className="flex items-center gap-3">
          {/* 風險偏好選擇 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {RISK_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onRiskLevelChange(option.value)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-medium transition-all border-r last:border-r-0 disabled:opacity-50 ${
                  riskLevel === option.value
                    ? RISK_ACTIVE_COLORS[option.value]
                    : option.color
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={onGetAdvice}
            disabled={disabled || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>分析中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>取得建議</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading 狀態 */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-700 font-medium">無法取得建議</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={onGetAdvice}
                className="text-red-700 text-sm font-medium mt-2 hover:underline"
              >
                重新嘗試
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 建議內容 */}
      {advice && !isLoading && !error && (
        <div className="prose prose-sm max-w-none">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {advice}
            </div>
          </div>
        </div>
      )}

      {/* Debug: 顯示當前狀態 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          狀態: loading={String(isLoading)}, error={error || 'null'}, advice={advice ? `${advice.substring(0, 50)}...` : 'null'}
        </div>
      )}

      {/* 預設狀態 */}
      {!advice && !isLoading && !error && (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>點擊上方按鈕，讓 AI 分析您的投資組合</p>
          <p className="text-sm mt-1">請確保已更新報價後再取得建議</p>
        </div>
      )}
    </div>
  );
}
