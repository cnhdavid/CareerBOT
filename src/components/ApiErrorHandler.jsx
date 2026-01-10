import { useState, useEffect } from 'react';

export function useApiErrorHandler() {
  const [error, setError] = useState(null);

  const handleApiError = (error, context = '') => {
    console.error(`API Error ${context}:`, error);
    
    let errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    
    if (error.message === 'Failed to fetch') {
      errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
    } else if (error.status === 401) {
      errorMessage = 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.';
    } else if (error.status === 429) {
      errorMessage = 'Zu viele Anfragen. Bitte warten Sie einen Moment.';
    } else if (error.status === 500) {
      errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
    } else if (error.status === 503) {
      errorMessage = 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
    }
    
    setError({ message: errorMessage, context, originalError: error });
    
    setTimeout(() => setError(null), 5000);
  };

  const clearError = () => setError(null);

  return { error, handleApiError, clearError };
}

export function ApiErrorDisplay({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      maxWidth: '400px',
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#c00', display: 'block', marginBottom: '0.5rem' }}>
            ⚠️ Fehler
          </strong>
          <p style={{ margin: 0, color: '#600' }}>
            {error.message}
          </p>
          {error.context && (
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#900' }}>
              Kontext: {error.context}
            </small>
          )}
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#c00',
            padding: '0 0.5rem',
            marginLeft: '0.5rem'
          }}
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}
