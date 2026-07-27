import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'MR Booking',
  description: 'Meeting-room booking foundation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
