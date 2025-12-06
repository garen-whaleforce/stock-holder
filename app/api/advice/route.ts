import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioAdvice } from '@/lib/azureOpenAI';
import { AdviceRequest, AdviceResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AdviceRequest = await request.json();
    const { profile } = body;

    // 驗證請求
    if (!profile) {
      return NextResponse.json(
        { error: '請提供投資組合資料' },
        { status: 400 }
      );
    }

    if (!profile.holdings || profile.holdings.length === 0) {
      return NextResponse.json(
        { error: '投資組合中沒有持股資料' },
        { status: 400 }
      );
    }

    // 限制持股數量避免 token 超限
    if (profile.holdings.length > 20) {
      return NextResponse.json(
        { error: '單次分析最多支援 20 檔持股' },
        { status: 400 }
      );
    }

    // 呼叫 Azure OpenAI
    const advice = await getPortfolioAdvice(profile);

    return NextResponse.json({ advice } as AdviceResponse);
  } catch (error) {
    console.error('獲取 AI 建議錯誤:', error);

    const errorMessage =
      error instanceof Error ? error.message : '獲取 AI 建議時發生未知錯誤';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
