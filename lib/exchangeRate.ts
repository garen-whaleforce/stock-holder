import { Currency } from './types';

// 使用免費的 exchangerate-api 或 fawazahmed0 的免費匯率 API
const EXCHANGE_RATE_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

// 快取匯率資料（每小時更新一次）
let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時

/**
 * 獲取 USD 對 TWD 的匯率
 * @returns USD/TWD 匯率
 */
export async function getUsdTwdRate(): Promise<number> {
  const now = Date.now();

  // 檢查快取是否有效
  if (exchangeRateCache && now - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }

  try {
    const response = await fetch(EXCHANGE_RATE_API, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`匯率 API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.usd?.twd;

    if (!rate || typeof rate !== 'number') {
      throw new Error('無法解析匯率資料');
    }

    // 更新快取
    exchangeRateCache = {
      rate,
      timestamp: now,
    };

    return rate;
  } catch (error) {
    // 如果有舊的快取，使用舊的
    if (exchangeRateCache) {
      console.warn('使用快取的匯率資料');
      return exchangeRateCache.rate;
    }

    // 使用預設匯率（約略值）
    console.warn('使用預設匯率 32.0');
    return 32.0;
  }
}

/**
 * 轉換金額到目標幣別
 * @param amount - 金額
 * @param fromCurrency - 來源幣別
 * @param toCurrency - 目標幣別
 * @param usdTwdRate - USD/TWD 匯率
 * @returns 轉換後的金額
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  usdTwdRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'TWD') {
    return amount * usdTwdRate;
  }

  if (fromCurrency === 'TWD' && toCurrency === 'USD') {
    return amount / usdTwdRate;
  }

  return amount;
}

/**
 * 清除匯率快取
 */
export function clearExchangeRateCache(): void {
  exchangeRateCache = null;
}
