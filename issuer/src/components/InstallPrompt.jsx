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
    <div className="bg-[#30414B] text-white rounded-xl px-4 py-3 mb-5 mx-auto max-w-[680px] w-full flex items-center justify-between gap-3 box-border">
      <div>
        <strong className="block mb-1">{t('pwa.installPrompt.title')}</strong>
        <span className="text-sm">{t('pwa.installPrompt.message')}</span>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="border border-white/35 rounded-lg bg-transparent text-white px-2.5 py-2 cursor-pointer hover:bg-white/10"
        >
          {t('pwa.installPrompt.dismiss')}
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="border-none rounded-lg bg-white text-[#30414B] px-3 py-2 font-bold cursor-pointer hover:bg-gray-100"
        >
          {t('pwa.installPrompt.install')}
        </button>
      </div>
    </div>
  );
}
