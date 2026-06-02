import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Exercise Tracker',
  description: 'Tu biblioteca personal de ejercicios',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {children}
      </body>
    </html>
  );
}
