'use client';

import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Profile, Holding, HoldingWithMetrics, PortfolioSummary, Quote, StoredData, HoldingMarket, RiskLevel } from '@/lib/types';
import { loadFromStorage, saveToStorage, updatePriceCache, getAllCachedPrices } from '@/lib/storage';
import {
  calculateAllHoldingsMetrics,
  calculatePortfolioSummary,
  buildPortfolioPayload,
  quotesToPriceMap,
  quotesToNameMap,
} from '@/lib/portfolio';

import ProfileSelector from './ProfileSelector';
import SummaryCards from './SummaryCards';
import AddHoldingForm from './AddHoldingForm';
import HoldingsTable from './HoldingsTable';
import PieChartCard from './PieChartCard';
import AdvicePanel from './AdvicePanel';
import Toast from './Toast';

export default function PortfolioPage() {
  // 狀態
  const [isClient, setIsClient] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [holdingsWithMetrics, setHoldingsWithMetrics] = useState<HoldingWithMetrics[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(32); // USD/TWD 預設匯率

  // 取得當前選中的 Profile
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isMixed = activeProfile?.market === 'MIXED';

  // 獲取 USD/TWD 匯率
  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data.rate);
      }
    } catch (error) {
      console.error('獲取匯率失敗:', error);
    }
  }, []);

  // 初始化：從 localStorage 讀取資料
  useEffect(() => {
    setIsClient(true);
    const data = loadFromStorage();
    setProfiles(data.profiles);
    setActiveProfileId(data.activeProfileId);

    // 讀取快取的價格
    const cached = getAllCachedPrices();
    setPriceMap(cached);
  }, []);

  // 混合帳戶時獲取匯率
  useEffect(() => {
    if (isMixed) {
      fetchExchangeRate();
    }
  }, [isMixed, fetchExchangeRate]);

  // 當 Profile 或價格變更時，重新計算指標
  useEffect(() => {
    if (!activeProfile) return;

    // 更新名稱
    const updatedHoldings = activeProfile.holdings.map((h) => ({
      ...h,
      name: nameMap[h.symbol] || h.name || h.symbol,
    }));

    const metrics = calculateAllHoldingsMetrics(
      updatedHoldings,
      priceMap,
      activeProfile.market || 'US',
      activeProfile.baseCurrency || 'USD',
      exchangeRate
    );
    setHoldingsWithMetrics(metrics);

    const portfolioSummary = calculatePortfolioSummary(metrics, isMixed ? exchangeRate : undefined);
    setSummary(portfolioSummary);
  }, [activeProfile, priceMap, nameMap, exchangeRate, isMixed]);

  // 儲存資料到 localStorage
  const saveData = useCallback((newProfiles: Profile[], newActiveId: string) => {
    const data: StoredData = {
      profiles: newProfiles,
      activeProfileId: newActiveId,
      priceCache: {},
    };
    saveToStorage(data);
    setProfiles(newProfiles);
    setActiveProfileId(newActiveId);
  }, []);

  // 顯示 Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // 切換 Profile
  const handleSelectProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    const data = loadFromStorage();
    data.activeProfileId = profileId;
    saveToStorage(data);
    setAdvice(null);
    setAdviceError(null);
  };

  // 建立新 Profile
  const handleCreateProfile = (profile: Profile) => {
    const newProfiles = [...profiles, profile];
    saveData(newProfiles, profile.id);
    showToast('已建立新組合');
  };

  // 刪除 Profile
  const handleDeleteProfile = (profileId: string) => {
    const newProfiles = profiles.filter((p) => p.id !== profileId);
    const newActiveId = newProfiles[0]?.id || '';
    saveData(newProfiles, newActiveId);
    showToast('已刪除組合');
  };

  // 更新 Profile
  const handleUpdateProfile = (profile: Profile) => {
    const newProfiles = profiles.map((p) => (p.id === profile.id ? profile : p));
    saveData(newProfiles, activeProfileId);
    showToast('已更新組合設定');
  };

  // 更新風險偏好
  const handleRiskLevelChange = (riskLevel: RiskLevel) => {
    if (!activeProfile) return;
    const updatedProfile = { ...activeProfile, riskLevel };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
  };

  // 新增持股
  const handleAddHolding = async (symbol: string, quantity: number, costBasis: number, holdingMarket?: HoldingMarket) => {
    if (!activeProfile) return;

    // 檢查是否已存在相同股票
    const existingIndex = activeProfile.holdings.findIndex((h) => h.symbol === symbol);

    let updatedHoldings: Holding[];
    if (existingIndex >= 0) {
      // 如果存在，更新數量和成本
      const existing = activeProfile.holdings[existingIndex];
      const totalQuantity = existing.quantity + quantity;
      const totalCost = existing.costBasis * existing.quantity + costBasis * quantity;
      const newCostBasis = totalCost / totalQuantity;

      updatedHoldings = [...activeProfile.holdings];
      updatedHoldings[existingIndex] = {
        ...existing,
        quantity: totalQuantity,
        costBasis: newCostBasis,
      };
    } else {
      // 新增持股
      const newHolding: Holding = {
        id: uuidv4(),
        symbol,
        name: nameMap[symbol] || symbol,
        quantity,
        costBasis,
        market: holdingMarket, // 混合帳戶時記錄該持股所屬市場
      };
      updatedHoldings = [...activeProfile.holdings, newHolding];
    }

    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast(`已${existingIndex >= 0 ? '更新' : '新增'} ${symbol}`);

    // 自動獲取新股票的報價
    if (!priceMap[symbol]) {
      await fetchQuotesForSymbols([symbol], holdingMarket);
    }
  };

  // 編輯持股
  const handleEditHolding = (holding: Holding) => {
    if (!activeProfile) return;

    const updatedHoldings = activeProfile.holdings.map((h) =>
      h.id === holding.id ? holding : h
    );
    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast('已更新持股');
  };

  // 刪除持股
  const handleDeleteHolding = (id: string) => {
    if (!activeProfile) return;

    const updatedHoldings = activeProfile.holdings.filter((h) => h.id !== id);
    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast('已刪除持股');
  };

  // 獲取報價
  const fetchQuotesForSymbols = async (symbols: string[], holdingMarket?: HoldingMarket) => {
    if (symbols.length === 0 || !activeProfile) return;

    setIsLoadingQuotes(true);
    try {
      let requestBody: Record<string, unknown>;

      if (activeProfile.market === 'MIXED') {
        // 混合帳戶：分離美股和台股
        if (holdingMarket) {
          // 單一股票請求（從 handleAddHolding）
          if (holdingMarket === 'US') {
            requestBody = { market: 'MIXED', usSymbols: symbols, twSymbols: [] };
          } else {
            requestBody = { market: 'MIXED', usSymbols: [], twSymbols: symbols };
          }
        } else {
          // 批次請求（從 handleRefreshQuotes）
          const usSymbols = activeProfile.holdings
            .filter((h) => h.market === 'US')
            .map((h) => h.symbol);
          const twSymbols = activeProfile.holdings
            .filter((h) => h.market === 'TW')
            .map((h) => h.symbol);
          requestBody = { market: 'MIXED', usSymbols, twSymbols };
        }
      } else {
        // 單一市場帳戶
        requestBody = { symbols, market: activeProfile.market || 'US' };
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '獲取報價失敗');
      }

      const data = await response.json();
      const quotes: Quote[] = data.quotes;

      // 更新價格和名稱
      const newPriceMap = quotesToPriceMap(quotes);
      const newNameMap = quotesToNameMap(quotes);

      setPriceMap((prev) => ({ ...prev, ...newPriceMap }));
      setNameMap((prev) => ({ ...prev, ...newNameMap }));

      // 更新快取
      updatePriceCache(newPriceMap);

      // 更新持股名稱
      if (activeProfile) {
        const needsUpdate = activeProfile.holdings.some(
          (h) => newNameMap[h.symbol] && h.name !== newNameMap[h.symbol]
        );
        if (needsUpdate) {
          const updatedHoldings = activeProfile.holdings.map((h) => ({
            ...h,
            name: newNameMap[h.symbol] || h.name,
          }));
          const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
          const newProfiles = profiles.map((p) =>
            p.id === activeProfile.id ? updatedProfile : p
          );
          saveData(newProfiles, activeProfileId);
        }
      }

      showToast('報價已更新');
    } catch (error) {
      const message = error instanceof Error ? error.message : '獲取報價失敗';
      showToast(message, 'error');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // 更新所有持股報價
  const handleRefreshQuotes = () => {
    if (!activeProfile || activeProfile.holdings.length === 0) {
      showToast('沒有持股需要更新', 'info');
      return;
    }

    const symbols = activeProfile.holdings.map((h) => h.symbol);
    fetchQuotesForSymbols(symbols);
  };

  // 獲取 AI 建議
  const handleGetAdvice = async () => {
    if (!activeProfile || holdingsWithMetrics.length === 0 || !summary) {
      showToast('請先新增持股並更新報價', 'info');
      return;
    }

    // 確認是否有價格資料
    const hasNoPrices = holdingsWithMetrics.every((h) => h.currentPrice === 0);
    if (hasNoPrices) {
      showToast('請先更新報價', 'info');
      return;
    }

    setIsLoadingAdvice(true);
    setAdviceError(null);

    try {
      const payload = buildPortfolioPayload(activeProfile, holdingsWithMetrics, summary);

      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: payload }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '獲取建議失敗');
      }

      const data = await response.json();
      console.log('API Response:', data);
      if (data.advice) {
        setAdvice(data.advice);
      } else {
        console.error('No advice in response:', data);
        setAdviceError('API 回應中沒有建議內容');
      }
    } catch (error) {
      console.error('Error fetching advice:', error);
      const message = error instanceof Error ? error.message : '獲取建議失敗';
      setAdviceError(message);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // SSR 保護
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900">My Portfolio Helper</h1>
            </div>
            <ProfileSelector
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={handleSelectProfile}
              onCreateProfile={handleCreateProfile}
              onDeleteProfile={handleDeleteProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            summary={summary}
            isLoading={isLoadingQuotes}
            baseCurrency={activeProfile?.baseCurrency || 'USD'}
            exchangeRate={exchangeRate}
            isMixed={isMixed}
          />

          {/* 新增持股表單 */}
          <AddHoldingForm
            market={activeProfile?.market || 'US'}
            onAdd={handleAddHolding}
            isLoading={isLoadingQuotes}
          />

          {/* 更新報價按鈕 */}
          <div className="flex justify-end">
            <button
              onClick={handleRefreshQuotes}
              disabled={isLoadingQuotes || !activeProfile?.holdings.length}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              {isLoadingQuotes ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>更新中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>更新報價</span>
                </>
              )}
            </button>
          </div>

          {/* 持股表格與圖表 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HoldingsTable
                holdings={holdingsWithMetrics}
                onEdit={handleEditHolding}
                onDelete={handleDeleteHolding}
                isLoading={isLoadingQuotes}
              />
            </div>
            <div>
              <PieChartCard holdings={holdingsWithMetrics} isLoading={isLoadingQuotes} />
            </div>
          </div>

          {/* AI 建議 */}
          <AdvicePanel
            advice={advice}
            isLoading={isLoadingAdvice}
            error={adviceError}
            onGetAdvice={handleGetAdvice}
            disabled={!activeProfile?.holdings.length || holdingsWithMetrics.every((h) => h.currentPrice === 0)}
            riskLevel={activeProfile?.riskLevel || 'balanced'}
            onRiskLevelChange={handleRiskLevelChange}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            本工具僅供參考，不構成任何投資建議。投資有風險，決策請謹慎。
          </p>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          show={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
