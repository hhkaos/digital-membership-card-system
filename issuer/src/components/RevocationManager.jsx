import { useMemo, useState } from 'react';
import {
  createEmptyRevocationList,
  addToRevocationList,
  removeFromRevocationList,
  mergeRevocationLists,
  exportRevocationJSON,
  importRevocationJSON,
} from '../utils/revocation';
import {
  decodeQRCodeFromImageFile,
  extractIdentifiersFromQrText,
} from '../utils/tokenLookup';
import { useI18n } from '../i18n';

const DEFAULT_LOCAL_REVOKED_URL = 'http://localhost:5173/revoked.json';
const DEFAULT_DEPLOYED_REVOKED_URL = 'https://verify.ampanovaschoolalmeria.org/revoked.json';

function resolveDefaultLoadSource() {
  if (typeof window === 'undefined' || !window.location) {
    return 'local';
  }

  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
  return isLocalHost ? 'local' : 'deployed';
}

const styles = {
  container: {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },
  heading: {
    marginTop: 0,
    marginBottom: '8px',
    color: '#30414B',
  },
  description: {
    marginTop: 0,
    color: '#5c6770',
    marginBottom: '20px',
  },
  section: {
    marginBottom: '24px',
    padding: '16px',
    border: '1px solid #e7eaee',
    borderRadius: '10px',
    backgroundColor: '#fafbfc',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '12px',
    color: '#30414B',
    fontSize: '18px',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: '1 1 320px',
    padding: '10px 12px',
    border: '1px solid #ccd3da',
    borderRadius: '8px',
    fontSize: '14px',
  },
  select: {
    flex: '0 0 230px',
    padding: '10px 12px',
    border: '1px solid #ccd3da',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },
  primaryButton: {
    backgroundColor: '#30414B',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#52717B',
    color: '#fff',
  },
  ghostButton: {
    backgroundColor: '#f2f4f6',
    color: '#2a2f33',
  },
  dangerButton: {
    backgroundColor: '#fff1f1',
    color: '#b42318',
    border: '1px solid #f2c5c2',
  },
  info: {
    marginTop: '10px',
    marginBottom: 0,
    fontSize: '13px',
    color: '#6b7280',
  },
  error: {
    marginTop: '10px',
    marginBottom: 0,
    color: '#b42318',
    fontWeight: 600,
  },
  success: {
    marginTop: '10px',
    marginBottom: 0,
    color: '#087443',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '1px solid #e7eaee',
    color: '#334155',
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    wordBreak: 'break-all',
  },
  textarea: {
    width: '100%',
    minHeight: '140px',
    padding: '10px 12px',
    border: '1px solid #ccd3da',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    boxSizing: 'border-box',
  },
  instructions: {
    marginTop: '12px',
    marginBottom: 0,
    fontSize: '13px',
    color: '#334155',
    lineHeight: 1.5,
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#30414B',
  },
  lookupCard: {
    marginTop: '12px',
    padding: '12px',
    border: '1px solid #d6e2ea',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  smallInput: {
    flex: '1 1 420px',
    padding: '10px 12px',
    border: '1px solid #ccd3da',
    borderRadius: '8px',
    fontSize: '13px',
  },
};

function buildRows(list) {
  const jtiRows = list.revoked_jti.map((id) => ({ id, type: 'jti' }));
  const subRows = list.revoked_sub.map((id) => ({ id, type: 'sub' }));
  return [...jtiRows, ...subRows].sort((a, b) => a.id.localeCompare(b.id));
}

export function RevocationManager() {
  const { t, language } = useI18n();
  const [revocationList, setRevocationList] = useState(createEmptyRevocationList);
  const [entryId, setEntryId] = useState('');
  const [entryType, setEntryType] = useState('jti');
  const [importText, setImportText] = useState('');
  const [feedback, setFeedback] = useState({ kind: '', message: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loadSource, setLoadSource] = useState(resolveDefaultLoadSource);
  const [localRevokedUrl, setLocalRevokedUrl] = useState(DEFAULT_LOCAL_REVOKED_URL);
  const [deployedRevokedUrl, setDeployedRevokedUrl] = useState(DEFAULT_DEPLOYED_REVOKED_URL);
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadStatus, setLoadStatus] = useState({ kind: '', message: '' });

  const rows = useMemo(() => buildRows(revocationList), [revocationList]);
  const exportedJSON = useMemo(() => exportRevocationJSON(revocationList), [revocationList]);

  const setError = (message) => setFeedback({ kind: 'error', message });
  const setSuccess = (message) => setFeedback({ kind: 'success', message });

  const mergeIntoCurrentList = (loadedList, successMessage) => {
    const merged = mergeRevocationLists(revocationList, loadedList);
    setRevocationList(merged);
    if (merged === revocationList) {
      setSuccess(t('revocation.feedback.noNewEntries'));
    } else {
      setSuccess(successMessage);
    }
  };

  const addRevocationEntry = (id, type) => {
    try {
      const nextList = addToRevocationList(revocationList, id, type);
      setRevocationList(nextList);
      if (nextList === revocationList) {
        setSuccess(t('revocation.feedback.entryAlreadyExists'));
      } else {
        setSuccess(t('revocation.feedback.entryAdded', { type: type.toUpperCase() }));
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAdd = () => {
    addRevocationEntry(entryId, entryType);
    setEntryId('');
  };

  const handleLookupRevoke = (type) => {
    if (!lookupResult || !lookupResult[type]) {
      setError(t('revocation.feedback.lookupMissingType', { type: type.toUpperCase() }));
      return;
    }
    addRevocationEntry(lookupResult[type], type);
    setEntryType(type);
    setEntryId(lookupResult[type]);
  };

  const handleRemove = (id, type) => {
    try {
      const nextList = removeFromRevocationList(revocationList, id, type);
      setRevocationList(nextList);
      setSuccess(t('revocation.feedback.entryRemoved', { type: type.toUpperCase() }));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleImport = () => {
    try {
      const parsed = importRevocationJSON(importText);
      mergeIntoCurrentList(parsed, t('revocation.feedback.mergedFromPastedJson'));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFileImport = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const text = await file.text();
      setImportText(text);
      const parsed = importRevocationJSON(text);
      mergeIntoCurrentList(parsed, t('revocation.feedback.mergedFromFile'));
    } catch (error) {
      setError(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleLoadFromUrl = async () => {
    setLoadBusy(true);
    setLoadStatus({ kind: '', message: '' });
    try {
      const url = loadSource === 'local' ? localRevokedUrl : deployedRevokedUrl;
      const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
      const response = await fetch(cacheBustedUrl, {
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('revocation.errors.revokedNotFound', { url }));
        }
        throw new Error(t('revocation.errors.failedToLoadFromUrl', { url, status: response.status }));
      }

      const data = await response.json();
      const parsed = importRevocationJSON(JSON.stringify(data));
      mergeIntoCurrentList(parsed, t('revocation.feedback.mergedFromUrl', { url }));
      setLoadStatus({ kind: 'success', message: t('revocation.feedback.loadedAndMergedFromUrl', { url }) });
    } catch (error) {
      setError(error.message);
      setLoadStatus({ kind: 'error', message: error.message || t('revocation.errors.loadFailed') });
    } finally {
      setLoadBusy(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'revoked.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setSuccess(t('revocation.feedback.downloaded'));
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error(t('revocation.errors.clipboardUnavailable'));
      }
      await navigator.clipboard.writeText(exportedJSON);
      setSuccess(t('revocation.feedback.copiedToClipboard'));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleQrPngUpload = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    setLookupLoading(true);
    try {
      const qrText = await decodeQRCodeFromImageFile(file);
      const identifiers = extractIdentifiersFromQrText(qrText);
      setLookupResult({
        ...identifiers,
        fileName: file.name,
        rawValue: qrText,
      });

      if (identifiers.jti) {
        setEntryType('jti');
        setEntryId(identifiers.jti);
      } else if (identifiers.sub) {
        setEntryType('sub');
        setEntryId(identifiers.sub);
      }

      setSuccess(t('revocation.feedback.qrDecoded'));
    } catch (error) {
      setLookupResult(null);
      setError(error.message);
    } finally {
      setLookupLoading(false);
      event.target.value = '';
    }
  };

  const dateLocale = language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{t('revocation.title')}</h2>
      <p style={styles.description}>
        {t('revocation.description')}
      </p>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.loadExisting.title')}</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            <input
              type="radio"
              name="revoked-source"
              value="local"
              checked={loadSource === 'local'}
              onChange={(event) => setLoadSource(event.target.value)}
            />{' '}
            {t('revocation.loadExisting.sources.local')}
          </label>
          <label style={styles.label}>
            <input
              type="radio"
              name="revoked-source"
              value="deployed"
              checked={loadSource === 'deployed'}
              onChange={(event) => setLoadSource(event.target.value)}
            />{' '}
            {t('revocation.loadExisting.sources.deployed')}
          </label>
        </div>
        <div style={styles.row}>
          <input
            type="text"
            style={styles.smallInput}
            value={localRevokedUrl}
            onChange={(event) => setLocalRevokedUrl(event.target.value)}
            disabled={loadSource !== 'local'}
            placeholder={t('revocation.loadExisting.placeholders.localUrl')}
          />
          <input
            type="text"
            style={styles.smallInput}
            value={deployedRevokedUrl}
            onChange={(event) => setDeployedRevokedUrl(event.target.value)}
            disabled={loadSource !== 'deployed'}
            placeholder={t('revocation.loadExisting.placeholders.deployedUrl')}
          />
          <button
            type="button"
            onClick={handleLoadFromUrl}
            disabled={loadBusy}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            {loadBusy ? t('revocation.loadExisting.actions.loading') : t('revocation.loadExisting.actions.loadAndMerge')}
          </button>
        </div>
        <p style={styles.info}>
          {t('revocation.loadExisting.help')}
        </p>
        {loadStatus.kind === 'error' && <p style={styles.error}>{loadStatus.message}</p>}
        {loadStatus.kind === 'success' && <p style={styles.success}>{loadStatus.message}</p>}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.qrLookup.title')}</h3>
        <div style={styles.row}>
          <label style={styles.label} htmlFor="qr-png-upload">
            {t('revocation.qrLookup.uploadLabel')}
          </label>
          <input
            id="qr-png-upload"
            type="file"
            accept=".png,image/png"
            onChange={handleQrPngUpload}
          />
        </div>
        <p style={styles.info}>
          {t('revocation.qrLookup.help')}
        </p>
        {lookupLoading && <p style={styles.info}>{t('revocation.qrLookup.reading')}</p>}
        {lookupResult && (
          <div style={styles.lookupCard}>
            <p style={styles.info}>{t('revocation.qrLookup.fields.file')}: {lookupResult.fileName}</p>
            <p style={{ ...styles.info, ...styles.mono }}>jti: {lookupResult.jti || t('revocation.qrLookup.notFound')}</p>
            <p style={{ ...styles.info, ...styles.mono }}>sub: {lookupResult.sub || t('revocation.qrLookup.notFound')}</p>
            <p style={styles.info}>{t('revocation.qrLookup.fields.name')}: {lookupResult.name || t('revocation.qrLookup.notFound')}</p>
            <p style={styles.info}>{t('revocation.qrLookup.fields.issuer')}: {lookupResult.iss || t('revocation.qrLookup.notFound')}</p>
            <div style={styles.row}>
              <button
                type="button"
                disabled={!lookupResult.jti}
                onClick={() => handleLookupRevoke('jti')}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                {t('revocation.qrLookup.actions.revokeToken')}
              </button>
              <button
                type="button"
                disabled={!lookupResult.sub}
                onClick={() => handleLookupRevoke('sub')}
                style={{ ...styles.button, ...styles.ghostButton }}
              >
                {t('revocation.qrLookup.actions.revokeMember')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.addEntry.title')}</h3>
        <div style={styles.row}>
          <input
            type="text"
            value={entryId}
            onChange={(event) => setEntryId(event.target.value)}
            placeholder={t('revocation.addEntry.placeholder')}
            style={styles.input}
          />
          <select value={entryType} onChange={(event) => setEntryType(event.target.value)} style={styles.select}>
            <option value="jti">{t('revocation.addEntry.options.jti')}</option>
            <option value="sub">{t('revocation.addEntry.options.sub')}</option>
          </select>
          <button
            type="button"
            onClick={handleAdd}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {t('revocation.addEntry.actions.add')}
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.currentList.title')}</h3>
        {rows.length === 0 ? (
          <p style={styles.info}>{t('revocation.currentList.empty')}</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('revocation.currentList.table.type')}</th>
                <th style={styles.th}>{t('revocation.currentList.table.id')}</th>
                <th style={styles.th}>{t('revocation.currentList.table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}:${row.id}`}>
                  <td style={styles.td}>{row.type.toUpperCase()}</td>
                  <td style={{ ...styles.td, ...styles.mono }}>{row.id}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleRemove(row.id, row.type)}
                      style={{ ...styles.button, ...styles.dangerButton }}
                    >
                      {t('revocation.currentList.actions.remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={styles.info}>{t('revocation.currentList.lastUpdated')}: {new Date(revocationList.updated_at).toLocaleString(dateLocale)}</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.importSection.title')}</h3>
        <div style={styles.row}>
          <input type="file" accept=".json,application/json" onChange={handleFileImport} />
          <button
            type="button"
            onClick={handleImport}
            style={{ ...styles.button, ...styles.ghostButton }}
          >
            {t('revocation.importSection.actions.importFromText')}
          </button>
        </div>
        <textarea
          style={styles.textarea}
          placeholder={t('revocation.importSection.placeholder')}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
        />
        <p style={styles.info}>{t('revocation.importSection.help')}</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('revocation.exportSection.title')}</h3>
        <div style={styles.row}>
          <button
            type="button"
            onClick={handleDownload}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            {t('revocation.exportSection.actions.download')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{ ...styles.button, ...styles.ghostButton }}
          >
            {t('revocation.exportSection.actions.copy')}
          </button>
        </div>
        <textarea style={styles.textarea} readOnly value={exportedJSON} />
        <p style={styles.instructions}>
          {t('revocation.exportSection.instructions')}
        </p>
      </section>

      {feedback.kind === 'error' && <p style={styles.error}>{feedback.message}</p>}
      {feedback.kind === 'success' && <p style={styles.success}>{feedback.message}</p>}
    </div>
  );
}

export default RevocationManager;
