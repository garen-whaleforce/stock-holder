// 市場類型
export type Market = 'US' | 'TW' | 'MIXED';

// 幣別類型
export type Currency = 'USD' | 'TWD';

// 單一持股的市場類型（不含 MIXED）
export type HoldingMarket = 'US' | 'TW';

// 風險偏好類型
export type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

// FMP API 回傳的報價資料（美股）
export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

// 統一的報價資料格式（支援美股與台股）
export interface Quote {
  symbol: string;
  name: string;
  price: number;
  market: Market;
  currency: Currency;
  changesPercentage?: number;
  change?: number;
  marketCap?: number;
}

// 單一持股資料
export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  market?: HoldingMarket; // 該持股所屬市場（混合帳戶用）
  note?: string;
}

// 計算後的持股資料（包含現價與損益）
export interface HoldingWithMetrics extends Holding {
  currentPrice: number;
  originalCurrency: Currency; // 原始幣別
  marketValue: number; // 轉換後的市值（以 baseCurrency 計）
  originalMarketValue: number; // 原始幣別市值
  weight: number;
  unrealizedPnL: number; // 轉換後的損益
  unrealizedPnLPercent: number;
}

// 投資組合 Profile
export interface Profile {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  market: Market;
  baseCurrency: Currency;
  holdings: Holding[];
}

// 市場分類摘要（混合帳戶用）
export interface MarketBreakdown {
  marketValue: number;
  cost: number;
  unrealizedPnL: number;
}

// 投資組合摘要資訊
export interface PortfolioSummary {
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  topHoldings: HoldingWithMetrics[];
  concentration: number; // 前三大持股佔比
  exchangeRate?: number; // USD/TWD 匯率（混合帳戶用）
  // 市場分類摘要（混合帳戶用，以原始幣別計算）
  usBreakdown?: MarketBreakdown;
  twBreakdown?: MarketBreakdown;
}

// 給 AI 的 Payload
export interface PortfolioPayload {
  profileName: string;
  riskLevel: RiskLevel;
  market: Market;
  baseCurrency: Currency;
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  concentration: number;
  holdings: {
    symbol: string;
    name: string;
    quantity: number;
    costBasis: number;
    currentPrice: number;
    marketValue: number;
    weight: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
  }[];
}

// API 請求與回應類型
export interface QuotesRequest {
  symbols: string[];
  market: Market;
}

export interface QuotesResponse {
  quotes: Quote[];
}

export interface AdviceRequest {
  profile: PortfolioPayload;
}

export interface AdviceResponse {
  advice: string;
}

// localStorage 的資料結構
export interface StoredData {
  profiles: Profile[];
  activeProfileId: string;
  priceCache: Record<string, { price: number; timestamp: number }>;
}

// 市場顯示名稱對照
export const MARKET_LABELS: Record<Market, string> = {
  US: '美股',
  TW: '台股',
  MIXED: '混合',
};

// 幣別符號對照
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  TWD: 'NT$',
};
