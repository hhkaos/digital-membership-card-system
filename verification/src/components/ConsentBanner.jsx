import { useState } from 'react';
import { useI18n } from '../i18n';

const STORAGE_KEY = 'ampa.verification.analytics_consent';

const styles = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    animation: 'slideUp 0.4s ease-out',
  },
  banner: {
    backgroundColor: 'rgba(48, 65, 75, 0.97)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.15)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  message: {
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.4',
    margin: 0,
    textAlign: 'center',
    maxWidth: '480px',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
  },
  acceptButton: {
    backgroundColor: '#fff',
    color: '#30414B',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  declineButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1.5px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};

// Inject animation keyframes once
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
  document.head.appendChild(styleEl);
}

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
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <p style={styles.message}>{t('consent.message')}</p>
        <div style={styles.buttons}>
          <button
            type="button"
            style={styles.acceptButton}
            onClick={handleAccept}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {t('consent.accept')}
          </button>
          <button
            type="button"
            style={styles.declineButton}
            onClick={handleDecline}
            onMouseEnter={e => e.target.style.opacity = '0.7'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {t('consent.decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
