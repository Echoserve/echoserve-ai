import React from 'react';

export const metadata = {
  title: 'EchoServe AI',
  description: 'AI-powered support agent for modern businesses',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 