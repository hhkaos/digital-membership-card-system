import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

const DISMISS_STORAGE_KEY = 'ampa.issuer.installPromptDismissed';

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    if (dismissed || isStandaloneMode()) return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsHidden(false);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsHidden(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setIsHidden(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsHidden(true);
  };

  if (isHidden || !deferredPrompt || isStandaloneMode()) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#30414B',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '0 auto 20px',
        width: 'min(680px, 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <strong style={{ display: 'block', marginBottom: '4px' }}>{t('pwa.installPrompt.title')}</strong>
        <span>{t('pwa.installPrompt.message')}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: '8px',
            background: 'transparent',
            color: '#fff',
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        >
          {t('pwa.installPrompt.dismiss')}
        </button>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            border: 'none',
            borderRadius: '8px',
            background: '#fff',
            color: '#30414B',
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('pwa.installPrompt.install')}
        </button>
      </div>
    </div>
  );
}
