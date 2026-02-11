import { useEffect, useState } from 'react';
import { parseTokenFromFragment, verifyToken, checkRevocation, VerificationError } from './utils/verify';
import { LoadingState, ValidState, InvalidState } from './components/VerificationResult';
import config from './config.json';
import { useI18n } from './i18n';
import { initAnalytics, trackPageView, trackVerificationResult } from './utils/analytics';
import { ConsentBanner, getAnalyticsConsent } from './components/ConsentBanner';

const ERROR_TYPE_TO_OUTCOME = {
  NO_TOKEN: 'invalid_no_token',
  CONFIG_ERROR: 'invalid_config_error',
  [VerificationError.INVALID_SIGNATURE]: 'invalid_signature',
  [VerificationError.EXPIRED]: 'invalid_expired',
  [VerificationError.REVOKED]: 'invalid_revoked',
  [VerificationError.WRONG_ISSUER]: 'invalid_signature',
  [VerificationError.MALFORMED]: 'invalid_signature',
};

function startAnalytics() {
  initAnalytics(config);
  trackPageView();
}

function App() {
  const { t } = useI18n();
  const [state, setState] = useState('loading'); // 'loading', 'valid', 'invalid'
  const [result, setResult] = useState(null);
  const [revocationWarning, setRevocationWarning] = useState(false);
  const [consentPending, setConsentPending] = useState(() => getAnalyticsConsent() === null);

  useEffect(() => {
    if (getAnalyticsConsent() === 'accepted') {
      startAnalytics();
    }
  }, []);

  useEffect(() => {
    async function performVerification() {
      // Parse token from URL fragment
      const token = parseTokenFromFragment();

      if (!token) {
        setState('invalid');
        setResult({
          error: {
            type: 'NO_TOKEN',
            message: t('errors.noTokenMessage'),
            details: t('errors.noTokenDetails')
          }
        });
        trackVerificationResult('invalid_no_token');
        return;
      }

      // Check if public key is configured
      if (!config.publicKey || config.publicKey.trim() === '') {
        setState('invalid');
        setResult({
          error: {
            type: 'CONFIG_ERROR',
            message: t('errors.configMessage'),
            details: t('errors.configDetails')
          }
        });
        trackVerificationResult('invalid_config_error');
        return;
      }

      // Perform verification
      const verificationResult = await verifyToken(
        token,
        config.publicKey,
        config.issuer,
        config.clockSkewSeconds
      );

      if (verificationResult.success) {
        // Check revocation status
        const revocation = await checkRevocation(
          verificationResult.payload.jti,
          verificationResult.payload.sub,
          config
        );

        if (revocation.revoked) {
          setState('invalid');
          setResult({
            error: {
              type: VerificationError.REVOKED,
              message: verificationResult.payload.name || t('errors.unknownMember'),
              memberName: verificationResult.payload.name || null,
              details: `Token ID '${verificationResult.payload.jti}' found in revocation list`
            }
          });
          trackVerificationResult('invalid_revoked');
        } else {
          setState('valid');
          setResult(verificationResult);
          trackVerificationResult('valid');
          if (revocation.warning) {
            setRevocationWarning(true);
          }
        }
      } else {
        setState('invalid');
        setResult(verificationResult);
        trackVerificationResult(ERROR_TYPE_TO_OUTCOME[verificationResult.error?.type] || 'invalid_signature');
      }
    }

    // Small delay to show loading state (better UX)
    const timer = setTimeout(performVerification, 500);
    return () => clearTimeout(timer);
  }, [t]);

  const handleConsent = (decision) => {
    setConsentPending(false);
    if (decision === 'accepted') {
      startAnalytics();
    }
  };

  // Render appropriate state
  let content;
  switch (state) {
    case 'loading':
      content = <LoadingState />;
      break;
    case 'valid':
      content = (
        <ValidState
          memberName={result.payload.name}
          expiryDate={result.payload.exp}
          revocationWarning={revocationWarning}
        />
      );
      break;
    case 'invalid':
      content = (
        <InvalidState
          errorType={result.error.type}
          errorMessage={result.error.message}
          memberName={result.error.memberName}
          errorDetails={result.error.details}
        />
      );
      break;
    default:
      content = <LoadingState />;
  }

  return (
    <>
      {content}
      {consentPending && <ConsentBanner onDecision={handleConsent} />}
    </>
  );
}

export default App;
