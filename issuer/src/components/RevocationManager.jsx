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
import InfoTooltip from './InfoTooltip';

const DEFAULT_LOCAL_REVOKED_URL = 'http://localhost:5173/revoked.json';
const DEFAULT_DEPLOYED_REVOKED_URL = 'https://verify.ampanovaschoolalmeria.org/revoked.json';

function resolveDefaultSourceType() {
  if (typeof window === 'undefined' || !window.location) return 'local';
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
  return isLocalHost ? 'local' : 'deployed';
}

function buildRows(list) {
  const jtiRows = list.revoked_jti.map((id) => ({ id, type: 'jti' }));
  const subRows = list.revoked_sub.map((id) => ({ id, type: 'sub' }));
  return [...jtiRows, ...subRows].sort((a, b) => a.id.localeCompare(b.id));
}

export function RevocationManager() {
  const { t, language } = useI18n();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);

  // Data state
  const [revocationList, setRevocationList] = useState(createEmptyRevocationList);
  const [entryId, setEntryId] = useState('');
  const [entryType, setEntryType] = useState('jti');
  const [feedback, setFeedback] = useState({ kind: '', message: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Step 1 state
  const [sourceType, setSourceType] = useState(resolveDefaultSourceType);
  const [sourceUrl, setSourceUrl] = useState(
    resolveDefaultSourceType() === 'local' ? DEFAULT_LOCAL_REVOKED_URL : DEFAULT_DEPLOYED_REVOKED_URL
  );
  const [customUrl, setCustomUrl] = useState('');
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadStatus, setLoadStatus] = useState({ kind: '', message: '' });

  // Step 2 state
  const [manualMode, setManualMode] = useState(false);

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

  const handleSourceTypeChange = (newType) => {
    setSourceType(newType);
    if (newType === 'local') setSourceUrl(DEFAULT_LOCAL_REVOKED_URL);
    else if (newType === 'deployed') setSourceUrl(DEFAULT_DEPLOYED_REVOKED_URL);
  };

  const handleLoadFromUrl = async () => {
    setLoadBusy(true);
    setLoadStatus({ kind: '', message: '' });
    try {
      const url = sourceType === 'custom' ? customUrl : sourceUrl;
      const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
      const response = await fetch(cacheBustedUrl, { cache: 'no-store' });

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

  const handleFileImport = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = importRevocationJSON(text);
      mergeIntoCurrentList(parsed, t('revocation.feedback.mergedFromFile'));
      setLoadStatus({ kind: 'success', message: t('revocation.feedback.mergedFromFile') });
    } catch (error) {
      setError(error.message);
      setLoadStatus({ kind: 'error', message: error.message });
    } finally {
      event.target.value = '';
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

  const stepLabels = {
    1: t('revocation.wizard.step1Label'),
    2: t('revocation.wizard.step2Label'),
    3: t('revocation.wizard.step3Label'),
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <p className="text-sm text-gray-500 mb-6">
        {t('revocation.wizard.stepOf', { current: wizardStep, total: '3', label: stepLabels[wizardStep] })}
      </p>

      {/* Feedback */}
      {feedback.kind && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          feedback.kind === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {feedback.message}
          <button
            type="button"
            onClick={() => setFeedback({ kind: '', message: '' })}
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: Load */}
      {wizardStep === 1 && (
        <div className="bg-white p-6 rounded-lg border border-gray-300">
          <h3 className="text-lg font-semibold text-[#30414B] mb-4">
            {t('revocation.loadExisting.title')}
            <InfoTooltip content={t('revocation.loadExisting.help')} />
          </h3>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-800 text-sm">
              {t('revocation.loadExisting.sources.label')}
            </label>
            <select
              value={sourceType}
              onChange={(e) => handleSourceTypeChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B] bg-white"
            >
              <option value="local">{t('revocation.loadExisting.sources.local')}</option>
              <option value="deployed">{t('revocation.loadExisting.sources.deployed')}</option>
              <option value="file">{t('revocation.loadExisting.sources.file')}</option>
              <option value="custom">{t('revocation.loadExisting.sources.custom')}</option>
            </select>
          </div>

          {(sourceType === 'local' || sourceType === 'deployed') && (
            <div className="mb-4">
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B] box-border"
                placeholder={sourceType === 'local' ? DEFAULT_LOCAL_REVOKED_URL : DEFAULT_DEPLOYED_REVOKED_URL}
              />
            </div>
          )}

          {sourceType === 'file' && (
            <div className="mb-4">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="w-full p-2 text-sm"
              />
            </div>
          )}

          {sourceType === 'custom' && (
            <div className="mb-4">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/revoked.json"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B] box-border"
              />
            </div>
          )}

          {loadStatus.kind && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              loadStatus.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {loadStatus.message}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {sourceType !== 'file' && (
              <button
                type="button"
                onClick={handleLoadFromUrl}
                disabled={loadBusy}
                className={`px-5 py-3 rounded-lg font-semibold text-sm border-none cursor-pointer min-h-[44px] ${
                  loadBusy
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#52717B] text-white hover:bg-[#30414B]'
                }`}
              >
                {loadBusy ? t('revocation.loadExisting.actions.loading') : t('revocation.loadExisting.actions.loadAndMerge')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="px-5 py-3 bg-[#30414B] text-white rounded-lg font-semibold text-sm hover:bg-[#52717B] cursor-pointer border-none min-h-[44px]"
            >
              {t('common.next')} →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Manage Entries */}
      {wizardStep === 2 && (
        <>
          {/* Add entry section */}
          <div className="bg-white p-6 rounded-lg border border-gray-300 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-[#30414B] m-0">
                {manualMode ? t('revocation.addEntry.title') : t('revocation.qrLookup.title')}
                {!manualMode && <InfoTooltip content={t('revocation.qrLookup.help')} />}
              </h3>
              <button
                type="button"
                onClick={() => setManualMode(!manualMode)}
                className="px-3 py-2 text-xs bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer border-none font-semibold"
              >
                {manualMode ? t('revocation.manage.switchToQr') : t('revocation.manage.switchToManual')}
              </button>
            </div>

            {!manualMode ? (
              /* QR Upload mode */
              <div>
                <div className="mb-3">
                  <label className="block mb-2 text-sm font-semibold text-gray-800" htmlFor="qr-png-upload">
                    {t('revocation.qrLookup.uploadLabel')}
                  </label>
                  <input
                    id="qr-png-upload"
                    type="file"
                    accept=".png,image/png"
                    onChange={handleQrPngUpload}
                    className="text-sm"
                  />
                </div>

                {lookupLoading && (
                  <p className="text-gray-500 text-sm">{t('revocation.qrLookup.reading')}</p>
                )}

                {lookupResult && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1">
                      {t('revocation.qrLookup.fields.file')}: <strong>{lookupResult.fileName}</strong>
                    </p>
                    <p className="text-sm font-mono mb-1 break-all">
                      jti: {lookupResult.jti || t('revocation.qrLookup.notFound')}
                    </p>
                    <p className="text-sm font-mono mb-1 break-all">
                      sub: {lookupResult.sub || t('revocation.qrLookup.notFound')}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      {t('revocation.qrLookup.fields.name')}: {lookupResult.name || t('revocation.qrLookup.notFound')}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      {t('revocation.qrLookup.fields.issuer')}: {lookupResult.iss || t('revocation.qrLookup.notFound')}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={!lookupResult.jti}
                        onClick={() => handleLookupRevoke('jti')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer min-h-[44px] ${
                          lookupResult.jti
                            ? 'bg-[#30414B] text-white hover:bg-[#52717B]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {t('revocation.qrLookup.actions.revokeToken')}
                      </button>
                      <button
                        type="button"
                        disabled={!lookupResult.sub}
                        onClick={() => handleLookupRevoke('sub')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer min-h-[44px] ${
                          lookupResult.sub
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {t('revocation.qrLookup.actions.revokeMember')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual entry mode */
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={entryId}
                  onChange={(e) => setEntryId(e.target.value)}
                  placeholder={t('revocation.addEntry.placeholder')}
                  className="flex-1 min-w-[200px] p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B] box-border"
                />
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#30414B]/30"
                >
                  <option value="jti">{t('revocation.addEntry.options.jti')}</option>
                  <option value="sub">{t('revocation.addEntry.options.sub')}</option>
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-5 py-3 bg-[#30414B] text-white rounded-lg font-semibold text-sm hover:bg-[#52717B] cursor-pointer border-none min-h-[44px]"
                >
                  {t('revocation.addEntry.actions.add')}
                </button>
              </div>
            )}
          </div>

          {/* Current revocation list */}
          <div className="bg-white p-6 rounded-lg border border-gray-300 mb-6">
            <h3 className="text-lg font-semibold text-[#30414B] mb-4">
              {t('revocation.currentList.title')}
            </h3>

            {rows.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('revocation.currentList.empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b border-gray-200 font-semibold text-gray-700">
                        {t('revocation.currentList.table.type')}
                      </th>
                      <th className="text-left p-3 border-b border-gray-200 font-semibold text-gray-700">
                        {t('revocation.currentList.table.id')}
                      </th>
                      <th className="text-left p-3 border-b border-gray-200 font-semibold text-gray-700">
                        {t('revocation.currentList.table.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.type}:${row.id}`} className="border-b border-gray-100">
                        <td className="p-3 font-semibold text-gray-700">{row.type.toUpperCase()}</td>
                        <td className="p-3 font-mono text-xs break-all">{row.id}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleRemove(row.id, row.type)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer hover:bg-red-100 min-h-[36px]"
                          >
                            {t('revocation.currentList.actions.remove')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              {t('revocation.currentList.lastUpdated')}: {new Date(revocationList.updated_at).toLocaleString(dateLocale)}
            </p>
          </div>

          {/* Step navigation */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="px-5 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm hover:bg-gray-300 cursor-pointer border-none min-h-[44px]"
            >
              ← {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="px-5 py-3 bg-[#30414B] text-white rounded-lg font-semibold text-sm hover:bg-[#52717B] cursor-pointer border-none min-h-[44px]"
            >
              {t('common.next')} →
            </button>
          </div>
        </>
      )}

      {/* STEP 3: Export */}
      {wizardStep === 3 && (
        <div className="bg-white p-6 rounded-lg border border-gray-300">
          <h3 className="text-lg font-semibold text-[#30414B] mb-4">
            {t('revocation.exportSection.title')}
            <InfoTooltip content={t('revocation.exportSection.instructions')} />
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </p>

          <div className="flex gap-3 flex-wrap mb-6">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 px-5 py-3 bg-[#52717B] text-white rounded-lg font-semibold text-sm hover:bg-[#30414B] cursor-pointer border-none min-h-[44px] min-w-[180px]"
            >
              {t('revocation.exportSection.actions.download')}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 px-5 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm hover:bg-gray-300 cursor-pointer border-none min-h-[44px] min-w-[180px]"
            >
              {t('revocation.exportSection.actions.copy')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className="px-5 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm hover:bg-gray-300 cursor-pointer border-none min-h-[44px]"
          >
            ← {t('common.back')}
          </button>
        </div>
      )}
    </div>
  );
}

export default RevocationManager;
