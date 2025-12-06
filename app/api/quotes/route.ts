import { NextRequest, NextResponse } from 'next/server';
import { fetchUsQuotes, isValidSymbol } from '@/lib/fmp';
import { fetchTwQuotes, isValidTwSymbol } from '@/lib/twse';
import { QuotesResponse, Market } from '@/lib/types';

interface MixedQuotesRequest {
  symbols?: string[];
  market?: Market;
  usSymbols?: string[];
  twSymbols?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: MixedQuotesRequest = await request.json();
    const { symbols, market = 'US', usSymbols, twSymbols } = body;

    // 處理混合市場請求
    if (market === 'MIXED') {
      const usSymbolsClean = (usSymbols || [])
        .map((s) => s.trim().toUpperCase())
        .filter((s) => isValidSymbol(s));

      const twSymbolsClean = (twSymbols || [])
        .map((s) => s.trim())
        .filter((s) => isValidTwSymbol(s));

      // 限制總數
      if (usSymbolsClean.length + twSymbolsClean.length > 50) {
        return NextResponse.json(
          { error: '單次請求最多 50 個股票代碼' },
          { status: 400 }
        );
      }

      // 並行獲取兩個市場的報價
      const [usQuotes, twQuotes] = await Promise.all([
        usSymbolsClean.length > 0 ? fetchUsQuotes(usSymbolsClean) : [],
        twSymbolsClean.length > 0 ? fetchTwQuotes(twSymbolsClean) : [],
      ]);

      const quotes = [...usQuotes, ...twQuotes];
      return NextResponse.json({ quotes } as QuotesResponse);
    }

    // 處理單一市場請求（向後相容）
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: '請提供有效的股票代碼陣列' },
        { status: 400 }
      );
    }

    if (symbols.length === 0) {
      return NextResponse.json({ quotes: [] } as QuotesResponse);
    }

    if (symbols.length > 50) {
      return NextResponse.json(
        { error: '單次請求最多 50 個股票代碼' },
        { status: 400 }
      );
    }

    const isValid = market === 'TW' ? isValidTwSymbol : isValidSymbol;
    const cleanedSymbols = symbols
      .map((s) => s.trim().toUpperCase())
      .filter((s) => isValid(s));

    if (cleanedSymbols.length === 0) {
      return NextResponse.json(
        { error: '沒有有效的股票代碼' },
        { status: 400 }
      );
    }

    const quotes = market === 'TW'
      ? await fetchTwQuotes(cleanedSymbols)
      : await fetchUsQuotes(cleanedSymbols);

    return NextResponse.json({ quotes } as QuotesResponse);
  } catch (error) {
    console.error('獲取報價錯誤:', error);

    const errorMessage =
      error instanceof Error ? error.message : '獲取報價時發生未知錯誤';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
