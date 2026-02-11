import { useEffect, useState } from 'react';
import { parseTokenFromFragment, verifyToken, checkRevocation, VerificationError } from './utils/verify';
import { LoadingState, ValidState, InvalidState } from './components/VerificationResult';
import config from './config.json';
import { useI18n } from './i18n';

function App() {
  const { t } = useI18n();
  const [state, setState] = useState('loading'); // 'loading', 'valid', 'invalid'
  const [result, setResult] = useState(null);
  const [revocationWarning, setRevocationWarning] = useState(false);

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
        } else {
          setState('valid');
          setResult(verificationResult);
          if (revocation.warning) {
            setRevocationWarning(true);
          }
        }
      } else {
        setState('invalid');
        setResult(verificationResult);
      }
    }

    // Small delay to show loading state (better UX)
    const timer = setTimeout(performVerification, 500);
    return () => clearTimeout(timer);
  }, [t]);

  // Render appropriate state
  switch (state) {
    case 'loading':
      return <LoadingState />;
    
    case 'valid':
      return (
        <ValidState
          memberName={result.payload.name}
          expiryDate={result.payload.exp}
          revocationWarning={revocationWarning}
        />
      );
    
    case 'invalid':
      return (
        <InvalidState
          errorType={result.error.type}
          errorMessage={result.error.message}
          memberName={result.error.memberName}
          errorDetails={result.error.details}
        />
      );
    
    default:
      return <LoadingState />;
  }
}

export default App;
