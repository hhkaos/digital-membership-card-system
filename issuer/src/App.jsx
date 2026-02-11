import { useEffect, useState } from 'react';
import { KeyManagement } from './components/KeyManagement';
import { ManualEntry } from './components/ManualEntry';
import CSVUpload from './components/CSVUpload';
import RevocationManager from './components/RevocationManager';
import InstallPrompt from './components/InstallPrompt';
import { importPrivateKey } from './utils/crypto';
import { useI18n } from './i18n';
import { initAnalytics, trackPageView } from './utils/analytics';
import { ConsentBanner, getAnalyticsConsent } from './components/ConsentBanner';
import config from './config.json';

const STORAGE_KEYS = {
  privateKeyPEM: 'ampa.issuer.privateKeyPEM',
  publicKeyPEM: 'ampa.issuer.publicKeyPEM'
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    paddingTop: '20px'
  },
  title: {
    color: '#30414B',
    fontSize: '36px',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#52717B',
    fontSize: '18px'
  },
  logo: {
    maxWidth: '120px',
    height: 'auto',
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  tab: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: '#30414B',
    color: 'white'
  },
  tabInactive: {
    backgroundColor: 'white',
    color: '#666'
  },
  languageRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  languageButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: '#eef2f5',
    color: '#30414B'
  },
  languageButtonActive: {
    backgroundColor: '#30414B',
    color: '#fff'
  }
};

function startAnalytics() {
  initAnalytics(config);
  trackPageView();
}

function App() {
  const { t, language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState('keys'); // 'keys', 'generate', 'batch', or 'revocation'
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState('');
  const [publicKeyPEM, setPublicKeyPEM] = useState('');
  const [consentPending, setConsentPending] = useState(() => getAnalyticsConsent() === null);

  useEffect(() => {
    if (getAnalyticsConsent() === 'accepted') {
      startAnalytics();
    }
  }, []);

  useEffect(() => {
    const storedPrivateKeyPEM = localStorage.getItem(STORAGE_KEYS.privateKeyPEM);
    const storedPublicKeyPEM = localStorage.getItem(STORAGE_KEYS.publicKeyPEM);

    if (!storedPrivateKeyPEM) return;

    const loadStoredKey = async () => {
      try {
        const privKey = await importPrivateKey(storedPrivateKeyPEM);
        setPrivateKey(privKey);
        setPrivateKeyPEM(storedPrivateKeyPEM);
        setPublicKeyPEM(storedPublicKeyPEM || '');
        setPublicKey(null);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.privateKeyPEM);
        localStorage.removeItem(STORAGE_KEYS.publicKeyPEM);
      }
    };

    loadStoredKey();
  }, []);

  const handleKeysChange = (privKey, pubKey, privPEM, pubPEM) => {
    setPrivateKey(privKey);
    setPublicKey(pubKey);
    setPrivateKeyPEM(privPEM);
    setPublicKeyPEM(pubPEM);

    if (privPEM) {
      localStorage.setItem(STORAGE_KEYS.privateKeyPEM, privPEM);
      if (pubPEM) {
        localStorage.setItem(STORAGE_KEYS.publicKeyPEM, pubPEM);
      } else {
        localStorage.removeItem(STORAGE_KEYS.publicKeyPEM);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.privateKeyPEM);
      localStorage.removeItem(STORAGE_KEYS.publicKeyPEM);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.languageRow}>
          <span style={{ fontSize: '12px', color: '#666' }}>{t('language.label')}:</span>
          <button
            type="button"
            onClick={() => setLanguage('es')}
            style={{
              ...styles.languageButton,
              ...(language === 'es' ? styles.languageButtonActive : {})
            }}
          >
            {t('language.es')}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            style={{
              ...styles.languageButton,
              ...(language === 'en' ? styles.languageButtonActive : {})
            }}
          >
            {t('language.en')}
          </button>
        </div>
        <img src={`${import.meta.env.BASE_URL}ampa-logo.png`} alt="AMPA Logo" style={styles.logo} />
        <h1 style={styles.title}>{t('app.title')}</h1>
        <p style={styles.subtitle}>{t('app.subtitle')}</p>
      </div>

      <InstallPrompt />

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            ...styles.tab,
            ...(activeTab === 'keys' ? styles.tabActive : styles.tabInactive)
          }}
        >
          {t('app.tabs.keys')}
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            ...styles.tab,
            ...(activeTab === 'generate' ? styles.tabActive : styles.tabInactive)
          }}
        >
          {t('app.tabs.generate')}
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          style={{
            ...styles.tab,
            ...(activeTab === 'batch' ? styles.tabActive : styles.tabInactive)
          }}
        >
          {t('app.tabs.batch')}
        </button>
        <button
          onClick={() => setActiveTab('revocation')}
          style={{
            ...styles.tab,
            ...(activeTab === 'revocation' ? styles.tabActive : styles.tabInactive)
          }}
        >
          {t('app.tabs.revocation')}
        </button>
      </div>

      {activeTab === 'keys' && (
        <KeyManagement
          privateKey={privateKey}
          publicKey={publicKey}
          privateKeyPEM={privateKeyPEM}
          publicKeyPEM={publicKeyPEM}
          onKeysChange={handleKeysChange}
        />
      )}

      {activeTab === 'generate' && (
        <ManualEntry privateKey={privateKey} />
      )}

      {activeTab === 'batch' && (
        <CSVUpload privateKey={privateKey} />
      )}

      {activeTab === 'revocation' && (
        <RevocationManager />
      )}

      {consentPending && (
        <ConsentBanner onDecision={(decision) => {
          setConsentPending(false);
          if (decision === 'accepted') startAnalytics();
        }} />
      )}
    </div>
  );
}

export default App;
