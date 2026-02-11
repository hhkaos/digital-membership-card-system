import { useState } from 'react';
import { createMemberPayload, signJWT } from '../utils/crypto';
import { generatePlainQRCard, generateCardFilename, downloadCard } from '../utils/card';
import { useI18n } from '../i18n';
import config from '../config.json';

function getDefaultExpiryDate() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const { courseEndMonth, courseEndDay, defaultExpiryMonth, defaultExpiryDay } = config.academicYear;

  const courseEnd = new Date(currentYear, courseEndMonth - 1, courseEndDay);

  let expiryYear = currentYear;
  if (today > courseEnd) {
    expiryYear = currentYear + 1;
  }

  const month = String(defaultExpiryMonth).padStart(2, '0');
  const day = String(defaultExpiryDay).padStart(2, '0');
  return `${expiryYear}-${month}-${day}`;
}

export function ManualEntry({ privateKey }) {
  const { t, language } = useI18n();
  const [fullName, setFullName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [expiryDate, setExpiryDate] = useState(getDefaultExpiryDate);
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
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (expiry <= now) {
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
      const payload = createMemberPayload({
        fullName: fullName.trim(),
        memberId: memberId.trim(),
        expiryDate
      });

      const jwt = await signJWT(payload, privateKey);

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

      const filename = generateCardFilename(memberId.trim(), fullName.trim());
      downloadCard(cardBlob, filename);

      setSuccess(true);

      setTimeout(() => {
        setFullName('');
        setMemberId('');
        setExpiryDate(getDefaultExpiryDate());
        setSuccess(false);
      }, 3000);

    } catch (error) {
      alert(`${t('manual.alerts.generateFailed')}: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="mb-5">
          <label className="block font-semibold mb-2 text-gray-800">{t('manual.fields.fullName')} *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 text-base border border-gray-300 rounded-lg box-border focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B]"
            placeholder={t('manual.placeholders.fullName')}
          />
          {errors.fullName && <div className="text-red-700 text-sm mt-1">{errors.fullName}</div>}
        </div>

        <div className="mb-5">
          <label className="block font-semibold mb-2 text-gray-800">{t('manual.fields.memberId')} *</label>
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full p-3 text-base border border-gray-300 rounded-lg box-border focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B]"
            placeholder={t('manual.placeholders.memberId')}
          />
          {errors.memberId && <div className="text-red-700 text-sm mt-1">{errors.memberId}</div>}
        </div>

        <div className="mb-5">
          <label className="block font-semibold mb-2 text-gray-800">{t('manual.fields.expiryDate')} *</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full p-3 text-base border border-gray-300 rounded-lg box-border focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B]"
          />
          {errors.expiryDate && <div className="text-red-700 text-sm mt-1">{errors.expiryDate}</div>}
        </div>

        <button
          type="submit"
          disabled={generating || !privateKey}
          className={`w-full min-h-[44px] px-7 py-3 text-base font-semibold rounded-lg border-none cursor-pointer ${
            generating || !privateKey
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#30414B] text-white hover:bg-[#52717B]'
          }`}
        >
          {generating ? t('manual.actions.generating') : t('manual.actions.generate')}
        </button>
      </form>

      {success && (
        <div className="mt-5 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
          <strong className="block mb-1">{t('manual.success.title')}</strong>
          <p className="m-0 text-gray-700">{t('manual.success.subtitle')}</p>
        </div>
      )}
    </div>
  );
}
