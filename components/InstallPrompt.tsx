'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);

    // ¿Ya está instalada / abierta como app?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || dismissed || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  }

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-2xl leading-none">📲</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Instala la app
        </p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Acceso directo en tu pantalla de inicio
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="px-4 py-2 rounded-xl text-white text-sm font-medium flex-shrink-0"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{ color: 'var(--color-muted)' }}
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
