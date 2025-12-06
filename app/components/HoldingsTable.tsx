'use client';

import { useState } from 'react';
import { HoldingWithMetrics, Holding } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[];
  onEdit: (holding: Holding) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

interface EditModalProps {
  holding: HoldingWithMetrics;
  onSave: (holding: Holding) => void;
  onClose: () => void;
}

function EditModal({ holding, onSave, onClose }: EditModalProps) {
  const [quantity, setQuantity] = useState(holding.quantity.toString());
  const [costBasis, setCostBasis] = useState(holding.costBasis.toString());
  const [note, setNote] = useState(holding.note || '');

  const handleSave = () => {
    const qty = parseFloat(quantity);
    const cost = parseFloat(costBasis);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
      alert('請輸入有效的數值');
      return;
    }

    onSave({
      ...holding,
      quantity: qty,
      costBasis: cost,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          編輯 {holding.symbol}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              股數
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              平均成本 ({holding.originalCurrency === 'TWD' ? 'TWD' : 'USD'})
            </label>
            <input
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備註 (選填)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HoldingsTable({
  holdings,
  onEdit,
  onDelete,
  isLoading,
}: HoldingsTableProps) {
  const [editingHolding, setEditingHolding] = useState<HoldingWithMetrics | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-500">尚未新增任何持股</p>
        <p className="text-sm text-gray-400 mt-1">使用上方表單新增您的第一筆持股</p>
      </div>
    );
  }

  const handleDelete = (id: string, symbol: string) => {
    if (confirm(`確定要刪除 ${symbol} 嗎？`)) {
      onDelete(id);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 桌機版表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">股票</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">股數</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">成本</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">現價</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">市值</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">損益</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">佔比</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holdings.map((holding) => {
                const isProfit = holding.unrealizedPnL >= 0;
                const pnlColor = isProfit ? 'text-green-600' : 'text-red-600';

                return (
                  <tr key={holding.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{holding.symbol}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[150px]">{holding.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {holding.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className={`px-4 py-3 text-right ${pnlColor}`}>
                      {holding.currentPrice > 0 ? (
                        <div>
                          <div>{isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')}</div>
                          <div className="text-xs">{formatPercent(holding.unrealizedPnLPercent)}</div>
                        </div>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {holding.weight > 0 ? `${(holding.weight * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingHolding(holding)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="編輯"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(holding.id, holding.symbol)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 手機版卡片列表 */}
        <div className="md:hidden divide-y divide-gray-100">
          {holdings.map((holding) => {
            const isProfit = holding.unrealizedPnL >= 0;
            const pnlColor = isProfit ? 'text-green-600' : 'text-red-600';
            const pnlBg = isProfit ? 'bg-green-50' : 'bg-red-50';

            return (
              <div key={holding.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{holding.symbol}</div>
                    <div className="text-sm text-gray-500">{holding.name}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingHolding(holding)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(holding.id, holding.symbol)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">股數:</span>{' '}
                    <span className="text-gray-900">{holding.quantity.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">成本:</span>{' '}
                    <span className="text-gray-600">{formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">現價:</span>{' '}
                    <span className="text-gray-900 font-medium">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">市值:</span>{' '}
                    <span className="text-gray-900">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </span>
                  </div>
                </div>
                {holding.currentPrice > 0 && (
                  <div className={`mt-3 p-2 rounded-lg ${pnlBg} flex justify-between items-center`}>
                    <span className="text-sm text-gray-600">損益</span>
                    <span className={`font-medium ${pnlColor}`}>
                      {isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')} ({formatPercent(holding.unrealizedPnLPercent)})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 編輯 Modal */}
      {editingHolding && (
        <EditModal
          holding={editingHolding}
          onSave={onEdit}
          onClose={() => setEditingHolding(null)}
        />
      )}
    </>
  );
}
