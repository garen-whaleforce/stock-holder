import { FMPQuote, Quote } from './types';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

/**
 * 從 FMP Stable API 獲取美股報價
 * @param symbols - 股票代碼陣列
 * @returns 報價資料陣列
 */
export async function fetchUsQuotes(symbols: string[]): Promise<Quote[]> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    throw new Error('FMP_API_KEY 環境變數未設定');
  }

  if (symbols.length === 0) {
    return [];
  }

  // 限制單次請求最多 50 個股票代碼
  const limitedSymbols = symbols.slice(0, 50);
  const symbolsStr = limitedSymbols.join(',');

  // 使用 stable API 的 batch-quote 端點
  const url = `${FMP_BASE_URL}/batch-quote?symbols=${symbolsStr}&apikey=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 設定 10 秒超時
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FMP API 錯誤: ${response.status} - ${errorText}`);
    }

    const data: FMPQuote[] = await response.json();

    // 轉換為簡化的 Quote 格式
    const quotes: Quote[] = data.map((item) => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      price: item.price,
      market: 'US' as const,
      currency: 'USD' as const,
      changesPercentage: item.changesPercentage,
      change: item.change,
      marketCap: item.marketCap,
    }));

    return quotes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`獲取報價失敗: ${error.message}`);
    }
    throw new Error('獲取報價時發生未知錯誤');
  }
}

/**
 * 驗證股票代碼是否有效
 * @param symbol - 股票代碼
 * @returns 是否有效
 */
export function isValidSymbol(symbol: string): boolean {
  // 美股代碼通常為 1-5 個大寫字母
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}
