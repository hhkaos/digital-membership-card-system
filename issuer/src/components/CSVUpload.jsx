import { useState } from 'react';
import { parseCSV } from '../utils/csv.js';
import { generateBatch, downloadZip, getZipFilename } from '../utils/batch.js';
import { useI18n } from '../i18n';

export default function CSVUpload({ privateKey }) {
  const { t, language } = useI18n();
  const [csvFile, setCsvFile] = useState(null);
  const [parseResults, setParseResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);

    try {
      const results = await parseCSV(file);
      setParseResults(results);
    } catch (error) {
      alert(`${t('csv.alerts.parseFailed')}: ${error.message}`);
      setCsvFile(null);
      setParseResults(null);
    }
  };

  const handleGenerateBatch = async () => {
    if (!parseResults || parseResults.valid.length === 0) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: parseResults.valid.length });

    try {
      const zipBlob = await generateBatch(
        parseResults.valid,
        privateKey,
        (current, total) => {
          setProgress({ current, total });
        },
        undefined,
        {
          locale: language === 'es' ? 'es-ES' : 'en-US',
          cardLabels: {
            validUntil: t('card.labels.validUntil'),
            memberId: t('card.labels.memberId'),
          },
        }
      );

      const filename = getZipFilename();
      downloadZip(zipBlob, filename);

      alert(t('csv.alerts.generateSuccess', {
        count: parseResults.valid.length,
        filename,
      }));
    } catch (error) {
      alert(`${t('csv.alerts.generateFailed')}: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleReset = () => {
    setCsvFile(null);
    setParseResults(null);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="mt-0 mb-3 text-lg font-semibold text-[#30414B]">{t('csv.format.title')}</h3>
        <p className="mb-2 text-gray-700">{t('csv.format.requiredColumnsIntro')}</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><strong>full_name</strong> — {t('csv.format.fullName')}</li>
          <li><strong>member_id</strong> — {t('csv.format.memberId')}</li>
          <li><strong>expiry_date</strong> — {t('csv.format.expiryDate')}</li>
        </ul>
      </div>

      {!csvFile && (
        <div className="mb-5">
          <label
            htmlFor="csv-upload"
            className="inline-block px-5 py-3 bg-[#30414B] text-white rounded-lg cursor-pointer hover:bg-[#52717B] font-semibold min-h-[44px] leading-normal"
          >
            {t('csv.actions.selectFile')}
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {parseResults && (
        <>
          <div className={`mb-5 p-4 rounded-lg border ${
            parseResults.errors.length > 0
              ? 'bg-yellow-50 border-yellow-400'
              : 'bg-green-50 border-green-500'
          }`}>
            <strong>{t('csv.summary.label')}</strong>{' '}
            {t('csv.summary.value', {
              valid: parseResults.valid.length,
              errors: parseResults.errors.length,
            })}
          </div>

          <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="bg-[#30414B] text-white">
                  <th className="p-3 text-left font-semibold">{t('csv.table.status')}</th>
                  <th className="p-3 text-left font-semibold">{t('csv.table.line')}</th>
                  <th className="p-3 text-left font-semibold">{t('csv.table.name')}</th>
                  <th className="p-3 text-left font-semibold">{t('csv.table.memberId')}</th>
                  <th className="p-3 text-left font-semibold">{t('csv.table.expiryDate')}</th>
                </tr>
              </thead>
              <tbody>
                {parseResults.valid.map((entry, idx) => (
                  <tr key={`valid-${idx}`} className="border-b border-gray-200">
                    <td className="p-3">✅</td>
                    <td className="p-3">{entry.lineNumber}</td>
                    <td className="p-3">{entry.data.full_name}</td>
                    <td className="p-3">{entry.data.member_id}</td>
                    <td className="p-3">{entry.data.expiry_date}</td>
                  </tr>
                ))}

                {parseResults.errors.map((entry, idx) => (
                  <tr key={`error-${idx}`} className="border-b border-gray-200 bg-red-50">
                    <td className="p-3">❌</td>
                    <td className="p-3">{entry.lineNumber}</td>
                    <td className="p-3" colSpan="3">
                      <div>
                        <strong>{t('csv.table.errorLabel')}</strong> {entry.error}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {entry.data.full_name && `${t('csv.table.name')}: ${entry.data.full_name} | `}
                        {entry.data.member_id && `${t('csv.table.memberIdShort')}: ${entry.data.member_id} | `}
                        {entry.data.expiry_date && `${t('csv.table.expiryShort')}: ${entry.data.expiry_date}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerateBatch}
              disabled={parseResults.errors.length > 0 || isGenerating || !privateKey}
              className={`px-6 py-3 text-base font-semibold rounded-lg min-h-[44px] border-none cursor-pointer ${
                parseResults.errors.length > 0 || isGenerating || !privateKey
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isGenerating
                ? t('csv.actions.generatingProgress', { current: progress.current, total: progress.total })
                : t('csv.actions.generateAll', { count: parseResults.valid.length })
              }
            </button>

            <button
              onClick={handleReset}
              disabled={isGenerating}
              className={`px-6 py-3 text-base font-semibold rounded-lg min-h-[44px] border-none cursor-pointer ${
                isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {t('csv.actions.reset')}
            </button>
          </div>

          {!privateKey && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {t('csv.warnings.noPrivateKey')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
