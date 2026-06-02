'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/today',   label: 'Hoy',       icon: '◎' },
  { href: '/library', label: 'Biblioteca', icon: '◫' },
  { href: '/add',     label: 'Agregar',    icon: '+' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {links.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-xs transition-colors"
            style={{
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
