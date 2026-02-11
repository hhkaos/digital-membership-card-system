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

const DEFAULT_LOCAL_REVOKED_URL = 'http://localhost:5173/revoked.json';
const DEFAULT_DEPLOYED_REVOKED_URL = 'https://verify.ampanovaschoolalmeria.org/revoked.json';

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
  const [revocationList, setRevocationList] = useState(createEmptyRevocationList);
  const [entryId, setEntryId] = useState('');
  const [entryType, setEntryType] = useState('jti');
  const [importText, setImportText] = useState('');
  const [feedback, setFeedback] = useState({ kind: '', message: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loadSource, setLoadSource] = useState('local');
  const [localRevokedUrl, setLocalRevokedUrl] = useState(DEFAULT_LOCAL_REVOKED_URL);
  const [deployedRevokedUrl, setDeployedRevokedUrl] = useState(DEFAULT_DEPLOYED_REVOKED_URL);
  const [loadBusy, setLoadBusy] = useState(false);

  const rows = useMemo(() => buildRows(revocationList), [revocationList]);
  const exportedJSON = useMemo(() => exportRevocationJSON(revocationList), [revocationList]);

  const setError = (message) => setFeedback({ kind: 'error', message });
  const setSuccess = (message) => setFeedback({ kind: 'success', message });

  const mergeIntoCurrentList = (loadedList, successMessage) => {
    const merged = mergeRevocationLists(revocationList, loadedList);
    setRevocationList(merged);
    if (merged === revocationList) {
      setSuccess('No new revocation entries found. Existing list preserved.');
    } else {
      setSuccess(successMessage);
    }
  };

  const addRevocationEntry = (id, type) => {
    try {
      const nextList = addToRevocationList(revocationList, id, type);
      setRevocationList(nextList);
      if (nextList === revocationList) {
        setSuccess('Entry already exists in the list.');
      } else {
        setSuccess(`Added ${type.toUpperCase()} to revocation list.`);
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
      setError(`No ${type.toUpperCase()} found in uploaded QR token`);
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
      setSuccess(`Removed ${type.toUpperCase()} from revocation list.`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleImport = () => {
    try {
      const parsed = importRevocationJSON(importText);
      mergeIntoCurrentList(parsed, 'Revocation list merged from pasted JSON.');
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
      mergeIntoCurrentList(parsed, 'Revocation list merged from file.');
    } catch (error) {
      setError(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleLoadFromUrl = async () => {
    setLoadBusy(true);
    try {
      const url = loadSource === 'local' ? localRevokedUrl : deployedRevokedUrl;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'cache-control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load revoked.json (${response.status})`);
      }

      const data = await response.json();
      const parsed = importRevocationJSON(JSON.stringify(data));
      mergeIntoCurrentList(parsed, `Revocation list merged from ${url}`);
    } catch (error) {
      setError(error.message);
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
    setSuccess('Downloaded revoked.json');
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Clipboard API is not available in this browser.');
      }
      await navigator.clipboard.writeText(exportedJSON);
      setSuccess('JSON copied to clipboard.');
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

      setSuccess('QR decoded successfully. Token identifiers loaded.');
    } catch (error) {
      setLookupResult(null);
      setError(error.message);
    } finally {
      setLookupLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Revocation Manager</h2>
      <p style={styles.description}>
        Revoke single cards by token ID (`jti`) or revoke all cards for a member by member ID (`sub`).
      </p>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Load Existing `revoked.json`</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            <input
              type="radio"
              name="revoked-source"
              value="local"
              checked={loadSource === 'local'}
              onChange={(event) => setLoadSource(event.target.value)}
            />{' '}
            Local verifier (default)
          </label>
          <label style={styles.label}>
            <input
              type="radio"
              name="revoked-source"
              value="deployed"
              checked={loadSource === 'deployed'}
              onChange={(event) => setLoadSource(event.target.value)}
            />{' '}
            Deployed domain
          </label>
        </div>
        <div style={styles.row}>
          <input
            type="text"
            style={styles.smallInput}
            value={localRevokedUrl}
            onChange={(event) => setLocalRevokedUrl(event.target.value)}
            disabled={loadSource !== 'local'}
            placeholder="http://localhost:5173/revoked.json"
          />
          <input
            type="text"
            style={styles.smallInput}
            value={deployedRevokedUrl}
            onChange={(event) => setDeployedRevokedUrl(event.target.value)}
            disabled={loadSource !== 'deployed'}
            placeholder="https://verify.ampanovaschoolalmeria.org/revoked.json"
          />
          <button
            type="button"
            onClick={handleLoadFromUrl}
            disabled={loadBusy}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            {loadBusy ? 'Loading...' : 'Load and Merge'}
          </button>
        </div>
        <p style={styles.info}>
          Loading from URL merges entries into the current list (deduplicated) to avoid overwriting previous revokes.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Identify from QR PNG</h3>
        <div style={styles.row}>
          <label style={styles.label} htmlFor="qr-png-upload">
            Upload PNG with member QR
          </label>
          <input
            id="qr-png-upload"
            type="file"
            accept=".png,image/png"
            onChange={handleQrPngUpload}
          />
        </div>
        <p style={styles.info}>
          The app decodes the QR locally in your browser, then reads unverified `jti`/`sub` claims from the JWT.
        </p>
        {lookupLoading && <p style={styles.info}>Reading QR image...</p>}
        {lookupResult && (
          <div style={styles.lookupCard}>
            <p style={styles.info}>File: {lookupResult.fileName}</p>
            <p style={{ ...styles.info, ...styles.mono }}>jti: {lookupResult.jti || 'not found'}</p>
            <p style={{ ...styles.info, ...styles.mono }}>sub: {lookupResult.sub || 'not found'}</p>
            <p style={styles.info}>name: {lookupResult.name || 'not found'}</p>
            <p style={styles.info}>iss: {lookupResult.iss || 'not found'}</p>
            <div style={styles.row}>
              <button
                type="button"
                disabled={!lookupResult.jti}
                onClick={() => handleLookupRevoke('jti')}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                Revoke this token (jti)
              </button>
              <button
                type="button"
                disabled={!lookupResult.sub}
                onClick={() => handleLookupRevoke('sub')}
                style={{ ...styles.button, ...styles.ghostButton }}
              >
                Revoke this member (sub)
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Add Revocation Entry</h3>
        <div style={styles.row}>
          <input
            type="text"
            value={entryId}
            onChange={(event) => setEntryId(event.target.value)}
            placeholder="Enter token ID (jti) or member ID (sub)"
            style={styles.input}
          />
          <select value={entryType} onChange={(event) => setEntryType(event.target.value)} style={styles.select}>
            <option value="jti">Revoke specific token (jti)</option>
            <option value="sub">Revoke all tokens for member (sub)</option>
          </select>
          <button
            type="button"
            onClick={handleAdd}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Add to Revocation List
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Current Revocation List</h3>
        {rows.length === 0 ? (
          <p style={styles.info}>No revoked entries yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Action</th>
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
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={styles.info}>Last updated: {new Date(revocationList.updated_at).toLocaleString('es-ES')}</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Import Existing `revoked.json`</h3>
        <div style={styles.row}>
          <input type="file" accept=".json,application/json" onChange={handleFileImport} />
          <button
            type="button"
            onClick={handleImport}
            style={{ ...styles.button, ...styles.ghostButton }}
          >
            Import from text
          </button>
        </div>
        <textarea
          style={styles.textarea}
          placeholder="Paste existing revoked.json content here"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
        />
        <p style={styles.info}>File/text imports are merged into the current list, not replaced.</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Export `revoked.json`</h3>
        <div style={styles.row}>
          <button
            type="button"
            onClick={handleDownload}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Download `revoked.json`
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{ ...styles.button, ...styles.ghostButton }}
          >
            Copy JSON to Clipboard
          </button>
        </div>
        <textarea style={styles.textarea} readOnly value={exportedJSON} />
        <p style={styles.instructions}>
          Upload this file to your GitHub Pages repo at `verification/public/revoked.json`, then deploy the
          verification app so merchants receive the updated revocation status.
        </p>
      </section>

      {feedback.kind === 'error' && <p style={styles.error}>{feedback.message}</p>}
      {feedback.kind === 'success' && <p style={styles.success}>{feedback.message}</p>}
    </div>
  );
}

export default RevocationManager;
