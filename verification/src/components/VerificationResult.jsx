import React, { useState } from 'react';
import config from '../config.json';
import { VerificationError } from '../utils/verify';

const styles = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: 'clamp(20px, 5vw, 40px)',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  logo: {
    maxWidth: '150px',
    height: 'auto',
    marginBottom: '20px'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  heading: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: config.branding.primaryColor
  },
  memberName: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '16px 0',
    color: '#333'
  },
  expiryText: {
    fontSize: '18px',
    color: '#666',
    margin: '12px 0'
  },
  errorMessage: {
    fontSize: '18px',
    color: '#666',
    margin: '16px 0'
  },
  details: {
    marginTop: '24px',
    textAlign: 'center'
  },
  detailsToggle: {
    background: 'none',
    border: 'none',
    color: config.branding.secondaryColor,
    display: 'inline-block',
    cursor: 'pointer',
    fontSize: '16px',
    textDecoration: 'underline',
    padding: '0'
  },
  detailsContent: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#555',
    fontFamily: 'monospace',
    textAlign: 'left',
    wordBreak: 'break-word'
  },
  contactLink: {
    color: config.branding.secondaryColor,
    textDecoration: 'underline',
    fontWeight: 600
  },
  spinner: {
    border: `4px solid ${config.branding.secondaryColor}33`,
    borderTop: `4px solid ${config.branding.primaryColor}`,
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '18px',
    color: '#666'
  }
};

// Add keyframe animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export const LoadingState = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img 
          src="/ampa-logo.png" 
          alt={config.branding.organizationName}
          style={styles.logo}
        />
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Verifying membership...</p>
      </div>
    </div>
  );
};

export const ValidState = ({ memberName, expiryDate, revocationWarning }) => {
  const formattedDate = new Date(expiryDate * 1000).toLocaleDateString('es-ES');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img
          src="/ampa-logo.png"
          alt={config.branding.organizationName}
          style={styles.logo}
        />
        <div style={{ ...styles.icon, color: '#28a745' }}>✓</div>
        <h1 style={{ ...styles.heading, color: '#28a745' }}>Valid Membership</h1>
        <p style={styles.memberName}>{memberName}</p>
        <p style={styles.expiryText}>Valid until: {formattedDate}</p>
        {revocationWarning && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            color: '#856404',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ Revocation status could not be checked
          </div>
        )}
        <p style={{ marginTop: '24px', fontSize: '16px', color: '#666' }}>
          This membership is valid for AMPA discounts
        </p>
      </div>
    </div>
  );
};

export const InvalidState = ({ errorType, errorMessage, memberName, errorDetails }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isRevoked = errorType === VerificationError.REVOKED;
  const title = isRevoked ? 'Membership Revoked' : 'Invalid Membership';
  const icon = isRevoked ? '⛔' : '✗';
  const subtitle = isRevoked ? (memberName || errorMessage) : errorMessage;
  const helper = isRevoked ? 'Contact AMPA to restore this membership' : 'Contact AMPA for support';
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img 
          src="/ampa-logo.png" 
          alt={config.branding.organizationName}
          style={styles.logo}
        />
        <div style={{ ...styles.icon, color: '#dc3545' }}>{icon}</div>
        <h1 style={{ ...styles.heading, color: '#dc3545' }}>{title}</h1>
        <p style={styles.errorMessage}>{subtitle}</p>
        
        {errorDetails && (
          <div style={styles.details}>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              style={styles.detailsToggle}
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>
            {showDetails && (
              <div style={styles.detailsContent}>
                {errorDetails}
              </div>
            )}
          </div>
        )}
        
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#999' }}>
          <a
            href={config.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.contactLink}
          >
            {helper}
          </a>
        </p>
      </div>
    </div>
  );
};
