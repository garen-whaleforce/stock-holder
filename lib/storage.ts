import { v4 as uuidv4 } from 'uuid';
import { Profile, StoredData, Market } from './types';

const STORAGE_KEY = 'portfolio_profiles_v1';

/**
 * 建立預設的投資組合 Profile
 */
export function createDefaultProfile(market: Market = 'MIXED'): Profile {
  const getProfileName = () => {
    if (market === 'MIXED') return '混合帳戶';
    if (market === 'TW') return '台股主帳戶';
    return '美股主帳戶';
  };

  const getBaseCurrency = () => {
    if (market === 'TW') return 'TWD';
    return 'USD'; // MIXED 和 US 都預設使用 USD
  };

  return {
    id: uuidv4(),
    name: getProfileName(),
    riskLevel: 'balanced',
    market: market,
    baseCurrency: getBaseCurrency(),
    holdings: [],
  };
}

/**
 * 升級舊版 Profile 資料（補上 market 和 baseCurrency）
 */
function migrateProfile(profile: Profile): Profile {
  // 如果沒有 market 欄位，預設為美股
  if (!profile.market) {
    profile.market = 'US';
  }
  // 確保 baseCurrency 與 market 一致
  if (!profile.baseCurrency) {
    profile.baseCurrency = profile.market === 'TW' ? 'TWD' : 'USD';
  }
  return profile;
}

/**
 * 建立預設的儲存資料結構
 */
function createDefaultStoredData(): StoredData {
  const defaultProfile = createDefaultProfile();
  return {
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    priceCache: {},
  };
}

/**
 * 從 localStorage 讀取資料
 * @returns 儲存的資料或預設值
 */
export function loadFromStorage(): StoredData {
  if (typeof window === 'undefined') {
    return createDefaultStoredData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultData = createDefaultStoredData();
      saveToStorage(defaultData);
      return defaultData;
    }

    const data: StoredData = JSON.parse(stored);

    // 確保資料結構完整
    if (!data.profiles || data.profiles.length === 0) {
      const defaultData = createDefaultStoredData();
      saveToStorage(defaultData);
      return defaultData;
    }

    // 升級舊版 Profile 資料
    data.profiles = data.profiles.map(migrateProfile);

    // 確保 activeProfileId 有效
    const activeProfile = data.profiles.find((p) => p.id === data.activeProfileId);
    if (!activeProfile) {
      data.activeProfileId = data.profiles[0].id;
    }

    // 儲存升級後的資料
    saveToStorage(data);

    return data;
  } catch (error) {
    console.error('讀取 localStorage 失敗:', error);
    return createDefaultStoredData();
  }
}

/**
 * 儲存資料到 localStorage
 * @param data - 要儲存的資料
 */
export function saveToStorage(data: StoredData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('儲存到 localStorage 失敗:', error);
  }
}

/**
 * 更新價格快取
 * @param priceMap - 價格對照表
 */
export function updatePriceCache(priceMap: Record<string, number>): void {
  const data = loadFromStorage();
  const timestamp = Date.now();

  Object.entries(priceMap).forEach(([symbol, price]) => {
    data.priceCache[symbol] = { price, timestamp };
  });

  saveToStorage(data);
}

/**
 * 從快取獲取價格（5 分鐘內有效）
 * @param symbol - 股票代碼
 * @returns 價格或 undefined
 */
export function getPriceCached(symbol: string): number | undefined {
  const data = loadFromStorage();
  const cached = data.priceCache[symbol];

  if (!cached) return undefined;

  // 快取有效期 5 分鐘
  const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
  if (isExpired) return undefined;

  return cached.price;
}

/**
 * 取得所有快取的價格（不檢查過期）
 */
export function getAllCachedPrices(): Record<string, number> {
  const data = loadFromStorage();
  const result: Record<string, number> = {};

  Object.entries(data.priceCache).forEach(([symbol, { price }]) => {
    result[symbol] = price;
  });

  return result;
}
