import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-primary, #ffffff)',
          color: 'var(--text-primary, #000000)'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            ⚠️ Etwas ist schiefgelaufen
          </h1>
          <p style={{ marginBottom: '1rem', maxWidth: '600px' }}>
            Die Anwendung ist auf einen Fehler gestoßen. Bitte versuchen Sie, die Seite neu zu laden.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Seite neu laden
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                Fehlerdetails (nur in Entwicklung sichtbar)
              </summary>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
