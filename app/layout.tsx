import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '巴菲羽的小金庫 - 投資組合追蹤工具',
  description: '追蹤您的美股投資組合，計算損益，並獲取 AI 投資建議。本工具僅供參考，不構成投資建議。',
  keywords: ['投資組合', '美股', '股票追蹤', 'AI投資建議', 'portfolio tracker', '巴菲羽'],
  authors: [{ name: 'Fuggler Cat Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#e91e8c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
