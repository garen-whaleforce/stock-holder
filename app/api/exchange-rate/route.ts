import { NextResponse } from 'next/server';
import { getUsdTwdRate } from '@/lib/exchangeRate';

export async function GET() {
  try {
    const rate = await getUsdTwdRate();

    return NextResponse.json({
      rate,
      pair: 'USD/TWD',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('獲取匯率錯誤:', error);

    const errorMessage =
      error instanceof Error ? error.message : '獲取匯率時發生未知錯誤';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
