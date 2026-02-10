import { useEffect, useState } from 'react';
import { parseTokenFromFragment, verifyToken } from './utils/verify';
import { LoadingState, ValidState, InvalidState } from './components/VerificationResult';
import config from './config.json';

function App() {
  const [state, setState] = useState('loading'); // 'loading', 'valid', 'invalid'
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function performVerification() {
      // Parse token from URL fragment
      const token = parseTokenFromFragment();
      
      if (!token) {
        setState('invalid');
        setResult({
          error: {
            type: 'NO_TOKEN',
            message: 'No membership card detected',
            details: 'URL must contain #token=<JWT> parameter'
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
            message: 'Verification system not configured',
            details: 'Public key not set in configuration. Please contact AMPA admin.'
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
        setState('valid');
        setResult(verificationResult);
      } else {
        setState('invalid');
        setResult(verificationResult);
      }
    }

    // Small delay to show loading state (better UX)
    const timer = setTimeout(performVerification, 500);
    return () => clearTimeout(timer);
  }, []);

  // Render appropriate state
  switch (state) {
    case 'loading':
      return <LoadingState />;
    
    case 'valid':
      return (
        <ValidState
          memberName={result.payload.name}
          expiryDate={result.payload.exp}
        />
      );
    
    case 'invalid':
      return (
        <InvalidState
          errorMessage={result.error.message}
          errorDetails={result.error.details}
        />
      );
    
    default:
      return <LoadingState />;
  }
}

export default App;
