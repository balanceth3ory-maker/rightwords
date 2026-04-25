import { Lora, DM_Sans } from 'next/font/google';
import './globals.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata = {
  title: 'RightWords — Find the words that bridge the gap',
  description: 'AI-powered tools for clearer conflict communication and ADHD coaching.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
