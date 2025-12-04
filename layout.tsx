import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crummey Notice Manager',
  description: 'Manage and track Crummey notices for irrevocable trusts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
