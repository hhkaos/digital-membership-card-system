import { useEffect, useState } from 'react';
import { KeyManagement } from './components/KeyManagement';
import { ManualEntry } from './components/ManualEntry';
import CSVUpload from './components/CSVUpload';
import RevocationManager from './components/RevocationManager';
import InstallPrompt from './components/InstallPrompt';
import ResponsiveTabs from './components/ResponsiveTabs';
import { importPrivateKey } from './utils/crypto';
import { useI18n } from './i18n';
import { initAnalytics, trackPageView } from './utils/analytics';
import { ConsentBanner, getAnalyticsConsent } from './components/ConsentBanner';
import config from './config.json';

const STORAGE_KEYS = {
  privateKeyPEM: 'ampa.issuer.privateKeyPEM',
  publicKeyPEM: 'ampa.issuer.publicKeyPEM'
};

function startAnalytics() {
  initAnalytics(config);
  trackPageView();
}

function App() {
  const { t, language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState('keys');
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

  const tabs = [
    { id: 'keys', label: t('app.tabs.keys') },
    { id: 'generate', label: t('app.tabs.generate') },
    { id: 'batch', label: t('app.tabs.batch') },
    { id: 'revocation', label: t('app.tabs.revocation') },
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-5">
      <header className="text-center mb-8 pt-4">
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">{t('language.label')}:</span>
          <button
            type="button"
            onClick={() => setLanguage('es')}
            className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer border-none ${
              language === 'es'
                ? 'bg-[#30414B] text-white'
                : 'bg-gray-200 text-[#30414B]'
            }`}
          >
            {t('language.es')}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer border-none ${
              language === 'en'
                ? 'bg-[#30414B] text-white'
                : 'bg-gray-200 text-[#30414B]'
            }`}
          >
            {t('language.en')}
          </button>
          <a
            href={`${import.meta.env.BASE_URL}docs/index.html?lang=${language}`}
            className="inline-flex items-center gap-1.5 ml-3 px-3 py-1.5 text-xs font-bold text-[#0B4F66] bg-[#E7F4F8] border border-[#0B6B8F] rounded-full shadow-sm no-underline hover:shadow"
            aria-label={t('help.label')}
            title={t('help.label')}
          >
            <span aria-hidden="true" className="text-xs leading-none">ℹ️</span>
            <span>{t('help.label')}</span>
          </a>
        </div>

        <img
          src={`${import.meta.env.BASE_URL}ampa-logo.png`}
          alt="AMPA Logo"
          className="max-w-[120px] h-auto mb-4 mx-auto block"
        />
        <h1 className="text-[#30414B] text-3xl font-bold mb-2">{t('app.title')}</h1>
        <p className="text-[#52717B] text-lg">{t('app.subtitle')}</p>
      </header>

      <InstallPrompt />

      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
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
      </ResponsiveTabs>

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
