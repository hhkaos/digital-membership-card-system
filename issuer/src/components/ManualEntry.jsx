import { useState } from 'react';
import { createMemberPayload, signJWT } from '../utils/crypto';
import { generatePlainQRCard, generateCardFilename, downloadCard } from '../utils/card';
import { useI18n } from '../i18n';

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
  },
  form: {
    backgroundColor: '#f9f9f9',
    padding: '24px',
    borderRadius: '8px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  button: {
    backgroundColor: '#30414B',
    color: 'white',
    padding: '14px 28px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginTop: '4px'
  },
  success: {
    backgroundColor: '#e8f5e9',
    border: '2px solid #4caf50',
    borderRadius: '6px',
    padding: '16px',
    marginTop: '20px',
    textAlign: 'center'
  }
};

export function ManualEntry({ privateKey }) {
  const { t, language } = useI18n();
  const [fullName, setFullName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = t('manual.errors.fullNameRequired');
    }
    
    if (!memberId.trim()) {
      newErrors.memberId = t('manual.errors.memberIdRequired');
    }
    
    if (!expiryDate) {
      newErrors.expiryDate = t('manual.errors.expiryRequired');
    } else {
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiry <= today) {
        newErrors.expiryDate = t('manual.errors.expiryFuture');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    
    if (!privateKey) {
      alert(t('manual.alerts.loadPrivateKey'));
      return;
    }
    
    if (!validate()) {
      return;
    }
    
    setGenerating(true);
    
    try {
      // Create JWT payload
      const payload = createMemberPayload({
        fullName: fullName.trim(),
        memberId: memberId.trim(),
        expiryDate
      });
      
      // Sign JWT
      const jwt = await signJWT(payload, privateKey);

      // Generate card image (QR code is generated internally)
      const cardBlob = await generatePlainQRCard({
        jwt,
        memberName: fullName.trim(),
        memberId: memberId.trim(),
        expiryDate,
        locale: language === 'es' ? 'es-ES' : 'en-US',
        labels: {
          validUntil: t('card.labels.validUntil'),
          memberId: t('card.labels.memberId'),
        },
      });

      // Download card
      const filename = generateCardFilename(memberId.trim(), fullName.trim());
      downloadCard(cardBlob, filename);
      
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        setFullName('');
        setMemberId('');
        setExpiryDate('');
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      alert(`${t('manual.alerts.generateFailed')}: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#30414B', marginBottom: '24px' }}>{t('manual.title')}</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>{t('manual.fields.fullName')} *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={styles.input}
            placeholder={t('manual.placeholders.fullName')}
          />
          {errors.fullName && <div style={styles.error}>{errors.fullName}</div>}
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>{t('manual.fields.memberId')} *</label>
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            style={styles.input}
            placeholder={t('manual.placeholders.memberId')}
          />
          {errors.memberId && <div style={styles.error}>{errors.memberId}</div>}
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>{t('manual.fields.expiryDate')} *</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            style={styles.input}
          />
          {errors.expiryDate && <div style={styles.error}>{errors.expiryDate}</div>}
        </div>
        
        <button
          type="submit"
          disabled={generating || !privateKey}
          style={{
            ...styles.button,
            ...((generating || !privateKey) ? styles.buttonDisabled : {})
          }}
        >
          {generating ? t('manual.actions.generating') : t('manual.actions.generate')}
        </button>
      </form>
      
      {success && (
        <div style={styles.success}>
          <strong>{t('manual.success.title')}</strong>
          <p style={{ margin: '8px 0 0 0' }}>{t('manual.success.subtitle')}</p>
        </div>
      )}
    </div>
  );
}
