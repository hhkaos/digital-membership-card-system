import { useState } from 'react';
import { useI18n } from '../i18n';

const STORAGE_KEY = 'ampa.issuer.analytics_consent';

export function getAnalyticsConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ConsentBanner({ onDecision }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    setVisible(false);
    onDecision('accepted');
  };

  const handleDecline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch {}
    setVisible(false);
    onDecision('declined');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
      <div className="bg-[#30414B]/97 backdrop-blur-sm shadow-[0_-2px_16px_rgba(0,0,0,0.15)] px-6 py-4 flex items-center justify-center gap-4 flex-wrap">
        <p className="text-white text-sm leading-snug m-0 text-center max-w-[480px]">
          {t('consent.message')}
        </p>
        <div className="flex gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleAccept}
            className="bg-white text-[#30414B] border-none rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-85"
          >
            {t('consent.accept')}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="bg-transparent text-white border-[1.5px] border-white/50 rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-70"
          >
            {t('consent.decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
