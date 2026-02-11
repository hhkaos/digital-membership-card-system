import { useEffect, useState } from 'react';
import { KeyManagement } from './components/KeyManagement';
import { ManualEntry } from './components/ManualEntry';
import CSVUpload from './components/CSVUpload';
import RevocationManager from './components/RevocationManager';
import { importPrivateKey } from './utils/crypto';

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
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys', 'generate', 'batch', or 'revocation'
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState('');
  const [publicKeyPEM, setPublicKeyPEM] = useState('');

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
        <img src="/ampa-logo.png" alt="AMPA Logo" style={styles.logo} />
        <h1 style={styles.title}>AMPA Card Issuer</h1>
        <p style={styles.subtitle}>Generate secure digital membership cards</p>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            ...styles.tab,
            ...(activeTab === 'keys' ? styles.tabActive : styles.tabInactive)
          }}
        >
          🔑 Key Management
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            ...styles.tab,
            ...(activeTab === 'generate' ? styles.tabActive : styles.tabInactive)
          }}
        >
          🎫 Generate Card
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          style={{
            ...styles.tab,
            ...(activeTab === 'batch' ? styles.tabActive : styles.tabInactive)
          }}
        >
          📦 Batch Upload
        </button>
        <button
          onClick={() => setActiveTab('revocation')}
          style={{
            ...styles.tab,
            ...(activeTab === 'revocation' ? styles.tabActive : styles.tabInactive)
          }}
        >
          🚫 Revocation
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
    </div>
  );
}

export default App;
