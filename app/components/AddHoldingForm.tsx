'use client';

import { useState } from 'react';
import { Market, HoldingMarket, CURRENCY_SYMBOLS } from '@/lib/types';

interface AddHoldingFormProps {
  market: Market;
  onAdd: (symbol: string, quantity: number, costBasis: number, holdingMarket?: HoldingMarket) => void;
  isLoading: boolean;
}

export default function AddHoldingForm({ market, onAdd, isLoading }: AddHoldingFormProps) {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [holdingMarket, setHoldingMarket] = useState<HoldingMarket>('US');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMixed = market === 'MIXED';
  const effectiveMarket = isMixed ? holdingMarket : market;
  const isTwMarket = effectiveMarket === 'TW';
  const currencySymbol = isTwMarket ? CURRENCY_SYMBOLS.TWD : CURRENCY_SYMBOLS.USD;
  const symbolPlaceholder = isTwMarket ? '例如: 2330' : '例如: AAPL';
  const costPlaceholder = isTwMarket ? '650.00' : '150.00';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!symbol.trim()) {
      newErrors.symbol = '請輸入股票代碼';
    } else if (isTwMarket) {
      if (!/^\d{4,6}$/.test(symbol.trim())) {
        newErrors.symbol = '台股代碼須為 4-6 位數字';
      }
    } else {
      if (!/^[A-Za-z]{1,5}$/.test(symbol.trim())) {
        newErrors.symbol = '美股代碼須為 1-5 個英文字母';
      }
    }

    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = '請輸入有效股數';
    }

    const cost = parseFloat(costBasis);
    if (!costBasis || isNaN(cost) || cost <= 0) {
      newErrors.costBasis = '請輸入有效成本';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanedSymbol = isTwMarket
      ? symbol.trim()
      : symbol.trim().toUpperCase();

    onAdd(
      cleanedSymbol,
      parseFloat(quantity),
      parseFloat(costBasis),
      isMixed ? holdingMarket : undefined
    );

    setSymbol('');
    setQuantity('');
    setCostBasis('');
    setErrors({});
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isTwMarket) {
      setSymbol(value.replace(/[^0-9]/g, ''));
    } else {
      setSymbol(value.toUpperCase());
    }
  };

  const handleMarketChange = (newMarket: HoldingMarket) => {
    setHoldingMarket(newMarket);
    setSymbol('');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">新增持股</h3>
      <div className={`grid grid-cols-1 gap-4 ${isMixed ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        {isMixed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              市場
            </label>
            <select
              value={holdingMarket}
              onChange={(e) => handleMarketChange(e.target.value as HoldingMarket)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            >
              <option value="US">美股</option>
              <option value="TW">台股</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            股票代碼
          </label>
          <input
            type="text"
            value={symbol}
            onChange={handleSymbolChange}
            placeholder={symbolPlaceholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.symbol ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.symbol && (
            <p className="mt-1 text-xs text-red-500">{errors.symbol}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            股數
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.quantity ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平均成本 ({currencySymbol})
          </label>
          <input
            type="number"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder={costPlaceholder}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.costBasis ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.costBasis && (
            <p className="mt-1 text-xs text-red-500">{errors.costBasis}</p>
          )}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>處理中</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>新增</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
