import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jefo ROI Calculator for Broilers',
  description: 'An application to calculate and optimize the ROI for broiler feed additives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
