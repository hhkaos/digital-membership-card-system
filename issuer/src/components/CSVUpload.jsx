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
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2>{t('csv.title')}</h2>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>{t('csv.format.title')}</h3>
        <p>{t('csv.format.requiredColumnsIntro')}</p>
        <ul>
          <li><strong>full_name</strong> - {t('csv.format.fullName')}</li>
          <li><strong>member_id</strong> - {t('csv.format.memberId')}</li>
          <li><strong>expiry_date</strong> - {t('csv.format.expiryDate')}</li>
        </ul>
      </div>

      {!csvFile && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="csv-upload" style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#30414B',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            {t('csv.actions.selectFile')}
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {parseResults && (
        <>
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: parseResults.errors.length > 0 ? '#fff3cd' : '#d4edda',
            border: `1px solid ${parseResults.errors.length > 0 ? '#ffc107' : '#28a745'}`,
            borderRadius: '5px'
          }}>
            <strong>{t('csv.summary.label')}</strong> {t('csv.summary.value', {
              valid: parseResults.valid.length,
              errors: parseResults.errors.length,
            })}
          </div>

          <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#30414B', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv.table.status')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv.table.line')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv.table.name')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv.table.memberId')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv.table.expiryDate')}</th>
                </tr>
              </thead>
              <tbody>
                {/* Valid entries */}
                {parseResults.valid.map((entry, idx) => (
                  <tr key={`valid-${idx}`} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>✅</td>
                    <td style={{ padding: '12px' }}>{entry.lineNumber}</td>
                    <td style={{ padding: '12px' }}>{entry.data.full_name}</td>
                    <td style={{ padding: '12px' }}>{entry.data.member_id}</td>
                    <td style={{ padding: '12px' }}>{entry.data.expiry_date}</td>
                  </tr>
                ))}

                {/* Error entries */}
                {parseResults.errors.map((entry, idx) => (
                  <tr key={`error-${idx}`} style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f8d7da'
                  }}>
                    <td style={{ padding: '12px' }}>❌</td>
                    <td style={{ padding: '12px' }}>{entry.lineNumber}</td>
                    <td style={{ padding: '12px' }} colSpan="3">
                      <div>
                        <strong>{t('csv.table.errorLabel')}</strong> {entry.error}
                      </div>
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleGenerateBatch}
              disabled={parseResults.errors.length > 0 || isGenerating || !privateKey}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: parseResults.errors.length > 0 || isGenerating || !privateKey ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: parseResults.errors.length > 0 || isGenerating || !privateKey ? 'not-allowed' : 'pointer'
              }}
            >
              {isGenerating
                ? t('csv.actions.generatingProgress', { current: progress.current, total: progress.total })
                : t('csv.actions.generateAll', { count: parseResults.valid.length })
              }
            </button>

            <button
              onClick={handleReset}
              disabled={isGenerating}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {t('csv.actions.reset')}
            </button>
          </div>

          {!privateKey && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '5px',
              color: '#721c24'
            }}>
              {t('csv.warnings.noPrivateKey')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
