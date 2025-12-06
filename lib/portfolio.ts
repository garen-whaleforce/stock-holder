import {
  Holding,
  HoldingWithMetrics,
  PortfolioPayload,
  PortfolioSummary,
  MarketBreakdown,
  Profile,
  Quote,
  Currency,
  HoldingMarket,
} from './types';
import { convertCurrency } from './exchangeRate';

/**
 * 根據持股或 Profile 市場決定原始幣別
 */
function getHoldingCurrency(holding: Holding, profileMarket: string): Currency {
  if (holding.market === 'TW') return 'TWD';
  if (holding.market === 'US') return 'USD';
  if (profileMarket === 'TW') return 'TWD';
  return 'USD';
}

/**
 * 計算單一持股的指標（支援匯率轉換）
 */
export function calculateHoldingMetrics(
  holding: Holding,
  currentPrice: number,
  totalMarketValue: number,
  originalCurrency: Currency = 'USD'
): HoldingWithMetrics {
  const originalMarketValue = holding.quantity * currentPrice;
  const weight = totalMarketValue > 0 ? originalMarketValue / totalMarketValue : 0;
  const unrealizedPnL = (currentPrice - holding.costBasis) * holding.quantity;
  const unrealizedPnLPercent =
    holding.costBasis > 0 ? (currentPrice - holding.costBasis) / holding.costBasis : 0;

  return {
    ...holding,
    currentPrice,
    originalCurrency,
    marketValue: originalMarketValue, // 會在後續步驟轉換
    originalMarketValue,
    weight,
    unrealizedPnL,
    unrealizedPnLPercent,
  };
}

/**
 * 計算所有持股的指標（支援混合帳戶匯率轉換）
 */
export function calculateAllHoldingsMetrics(
  holdings: Holding[],
  priceMap: Record<string, number>,
  profileMarket: string = 'US',
  baseCurrency: Currency = 'USD',
  exchangeRate: number = 32
): HoldingWithMetrics[] {
  // 第一階段：計算原始市值並轉換到 baseCurrency
  let totalMarketValue = 0;
  const preliminaryData = holdings.map((holding) => {
    const currentPrice = priceMap[holding.symbol] || 0;
    const originalCurrency = getHoldingCurrency(holding, profileMarket);
    const originalMarketValue = holding.quantity * currentPrice;

    // 轉換到 baseCurrency
    const convertedMarketValue = convertCurrency(
      originalMarketValue,
      originalCurrency,
      baseCurrency,
      exchangeRate
    );

    totalMarketValue += convertedMarketValue;

    return {
      holding,
      currentPrice,
      originalCurrency,
      originalMarketValue,
      convertedMarketValue,
    };
  });

  // 第二階段：計算各持股權重與轉換後的損益
  return preliminaryData.map(({ holding, currentPrice, originalCurrency, originalMarketValue, convertedMarketValue }) => {
    const weight = totalMarketValue > 0 ? convertedMarketValue / totalMarketValue : 0;
    const originalPnL = (currentPrice - holding.costBasis) * holding.quantity;

    // 轉換損益到 baseCurrency
    const convertedPnL = convertCurrency(
      originalPnL,
      originalCurrency,
      baseCurrency,
      exchangeRate
    );

    // 轉換成本到 baseCurrency
    const originalCost = holding.costBasis * holding.quantity;
    const convertedCost = convertCurrency(
      originalCost,
      originalCurrency,
      baseCurrency,
      exchangeRate
    );

    const unrealizedPnLPercent =
      holding.costBasis > 0 ? (currentPrice - holding.costBasis) / holding.costBasis : 0;

    return {
      ...holding,
      currentPrice,
      originalCurrency,
      marketValue: convertedMarketValue,
      originalMarketValue,
      weight,
      unrealizedPnL: convertedPnL,
      unrealizedPnLPercent,
    };
  });
}

/**
 * 計算投資組合摘要
 */
export function calculatePortfolioSummary(
  holdingsWithMetrics: HoldingWithMetrics[],
  exchangeRate?: number
): PortfolioSummary {
  const totalMarketValue = holdingsWithMetrics.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.costBasis * h.quantity,
    0
  );
  const totalUnrealizedPnL = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.unrealizedPnL,
    0
  );
  const totalUnrealizedPnLPercent = totalCost > 0 ? totalUnrealizedPnL / totalCost : 0;

  const sortedHoldings = [...holdingsWithMetrics].sort((a, b) => b.weight - a.weight);
  const topHoldings = sortedHoldings.slice(0, 5);
  const top3Weight = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.weight, 0);

  // 計算市場分類摘要（以原始幣別計算）
  const usHoldings = holdingsWithMetrics.filter((h) => h.market === 'US' || h.originalCurrency === 'USD');
  const twHoldings = holdingsWithMetrics.filter((h) => h.market === 'TW' || h.originalCurrency === 'TWD');

  const usBreakdown: MarketBreakdown | undefined = usHoldings.length > 0 ? {
    marketValue: usHoldings.reduce((sum, h) => sum + h.originalMarketValue, 0),
    cost: usHoldings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0),
    unrealizedPnL: usHoldings.reduce((sum, h) => sum + (h.currentPrice - h.costBasis) * h.quantity, 0),
  } : undefined;

  const twBreakdown: MarketBreakdown | undefined = twHoldings.length > 0 ? {
    marketValue: twHoldings.reduce((sum, h) => sum + h.originalMarketValue, 0),
    cost: twHoldings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0),
    unrealizedPnL: twHoldings.reduce((sum, h) => sum + (h.currentPrice - h.costBasis) * h.quantity, 0),
  } : undefined;

  return {
    totalMarketValue,
    totalCost,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    topHoldings,
    concentration: top3Weight,
    exchangeRate,
    usBreakdown,
    twBreakdown,
  };
}

/**
 * 建立給 AI 的 Payload
 */
export function buildPortfolioPayload(
  profile: Profile,
  holdingsWithMetrics: HoldingWithMetrics[],
  summary: PortfolioSummary
): PortfolioPayload {
  return {
    profileName: profile.name,
    riskLevel: profile.riskLevel,
    market: profile.market || 'US',
    baseCurrency: profile.baseCurrency || 'USD',
    totalMarketValue: summary.totalMarketValue,
    totalCost: summary.totalCost,
    totalUnrealizedPnL: summary.totalUnrealizedPnL,
    concentration: summary.concentration,
    holdings: holdingsWithMetrics.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      costBasis: h.costBasis,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      weight: h.weight,
      unrealizedPnL: h.unrealizedPnL,
      unrealizedPnLPercent: h.unrealizedPnLPercent,
    })),
  };
}

/**
 * 格式化金額顯示
 */
export function formatCurrency(value: number, currency: Currency = 'USD', decimals: number = 2): string {
  const currencyCode = currency === 'TWD' ? 'TWD' : 'USD';
  const locale = currency === 'TWD' ? 'zh-TW' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化百分比顯示
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * 將報價陣列轉換為價格對照表
 */
export function quotesToPriceMap(quotes: Quote[]): Record<string, number> {
  return quotes.reduce(
    (map, quote) => {
      map[quote.symbol] = quote.price;
      return map;
    },
    {} as Record<string, number>
  );
}

/**
 * 將報價陣列轉換為名稱對照表
 */
export function quotesToNameMap(quotes: Quote[]): Record<string, string> {
  return quotes.reduce(
    (map, quote) => {
      map[quote.symbol] = quote.name;
      return map;
    },
    {} as Record<string, string>
  );
}

/**
 * 將報價陣列轉換為市場對照表
 */
export function quotesToMarketMap(quotes: Quote[]): Record<string, HoldingMarket> {
  return quotes.reduce(
    (map, quote) => {
      if (quote.market === 'US' || quote.market === 'TW') {
        map[quote.symbol] = quote.market;
      }
      return map;
    },
    {} as Record<string, HoldingMarket>
  );
}
