'use client';

import { RiskLevel } from '@/lib/types';

const RISK_OPTIONS: { value: RiskLevel; label: string; emoji: string }[] = [
  { value: 'conservative', label: '保守型', emoji: '🦷' },
  { value: 'balanced', label: '平衡型', emoji: '👁' },
  { value: 'aggressive', label: '積極型', emoji: '💀' },
];

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
  const selectedOption = RISK_OPTIONS.find(o => o.value === riskLevel);

  return (
    <div className="card-fuggler p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8b00ff] to-[#e91e8c] flex items-center justify-center shadow-[0_0_20px_rgba(139,0,255,0.5)] animate-float-wobble">
            <span className="text-2xl">🔮</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI 投資建議</h3>
            <p className="text-xs text-[#ff6bb3]">讓 AI 幫你分析投資組合</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 風險偏好下拉選單 */}
          <div className="relative">
            <select
              value={riskLevel}
              onChange={(e) => onRiskLevelChange(e.target.value as RiskLevel)}
              disabled={isLoading}
              className="appearance-none pl-10 pr-8 py-2.5 text-sm rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
              {selectedOption?.emoji}
            </span>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff6bb3] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button
            onClick={onGetAdvice}
            disabled={disabled || isLoading}
            className="btn-fuggler flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>分析中...</span>
              </>
            ) : (
              <>
                <span className="text-lg">👁</span>
                <span>取得建議</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading 狀態 */}
      {isLoading && (
        <div className="space-y-4">
          <div className="shimmer h-4 rounded-lg w-full"></div>
          <div className="shimmer h-4 rounded-lg w-5/6"></div>
          <div className="shimmer h-4 rounded-lg w-4/6"></div>
          <div className="shimmer h-4 rounded-lg w-full"></div>
          <div className="shimmer h-4 rounded-lg w-3/4"></div>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && !isLoading && (
        <div className="bg-rose-500/10 border-2 border-rose-500 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💀</span>
            </div>
            <div>
              <p className="text-rose-400 font-bold">哎呀，出了點問題...</p>
              <p className="text-rose-300 text-sm mt-1">{error}</p>
              <button
                onClick={onGetAdvice}
                className="text-rose-400 text-sm font-semibold mt-3 hover:underline flex items-center gap-1"
              >
                <span>🔄</span> 再試一次
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 建議內容 */}
      {advice && !isLoading && !error && (
        <div className="bg-[#1a0a1f]/80 rounded-lg p-5 border-2 border-[#39ff14]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🦷</span>
            <span className="text-sm font-bold text-[#39ff14]">AI 分析結果</span>
          </div>
          <div className="whitespace-pre-wrap text-white/90 leading-relaxed font-medium">
            {advice}
          </div>
        </div>
      )}

      {/* 預設狀態 */}
      {!advice && !isLoading && !error && (
        <div className="text-center py-10">
          <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-gradient-to-br from-[#8b00ff] to-[#e91e8c] flex items-center justify-center animate-float-wobble shadow-neon-pink">
            <span className="text-5xl">🔮</span>
          </div>
          <p className="text-[#ff6bb3] font-semibold text-lg">點擊上方按鈕，讓 AI 分析您的投資組合</p>
          <p className="text-sm text-[#ff6bb3]/70 mt-2">請確保已更新報價後再取得建議喔～ 👁</p>
        </div>
      )}
    </div>
  );
}
