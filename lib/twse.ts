import { Quote } from './types';

const TWSE_API_URL = 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL';

// TWSE API 回傳的資料格式
interface TWSEStockData {
  Code: string;
  Name: string;
  ClosingPrice: string;
  Change: string;
  Transaction: string;
  TradeVolume: string;
  TradeValue: string;
  OpeningPrice: string;
  HighestPrice: string;
  LowestPrice: string;
}

// 快取機制：每日只需抓一次
let cachedData: TWSEStockData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

/**
 * 從 TWSE OpenAPI 獲取台股報價
 * @param symbols - 股票代碼陣列（例如 ['2330', '2317']）
 * @returns 報價資料陣列
 */
export async function fetchTwQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) {
    return [];
  }

  const now = Date.now();

  // 檢查快取是否有效
  if (!cachedData || now - cacheTimestamp > CACHE_DURATION) {
    try {
      const response = await fetch(TWSE_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`TWSE API 錯誤: ${response.status}`);
      }

      cachedData = await response.json();
      cacheTimestamp = now;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`獲取台股報價失敗: ${error.message}`);
      }
      throw new Error('獲取台股報價時發生未知錯誤');
    }
  }

  // 建立 symbol 對照表以快速查詢
  const symbolSet = new Set(symbols.map(s => s.toUpperCase()));

  // 篩選並轉換資料
  const quotes: Quote[] = [];

  for (const item of cachedData || []) {
    if (symbolSet.has(item.Code)) {
      const price = parseFloat(item.ClosingPrice.replace(/,/g, ''));
      const change = parseFloat(item.Change.replace(/,/g, '')) || 0;

      // 跳過無效價格
      if (isNaN(price) || price <= 0) {
        continue;
      }

      const changesPercentage = price > 0 ? (change / (price - change)) * 100 : 0;

      quotes.push({
        symbol: item.Code,
        name: item.Name,
        price: price,
        market: 'TW',
        currency: 'TWD',
        change: change,
        changesPercentage: isNaN(changesPercentage) ? 0 : changesPercentage,
      });
    }
  }

  return quotes;
}

/**
 * 驗證台股代碼是否有效
 * @param symbol - 股票代碼
 * @returns 是否有效
 */
export function isValidTwSymbol(symbol: string): boolean {
  // 台股代碼通常為 4-6 位數字
  return /^\d{4,6}$/.test(symbol);
}

/**
 * 清除快取（用於手動刷新）
 */
export function clearTwseCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
}
