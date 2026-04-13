import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function ErrorBoundary() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const errorStr = event instanceof ErrorEvent ? event.error?.toString() : event.reason?.toString();
      if (errorStr && (errorStr.includes('Unexpected state (ID: ca9)') || errorStr.includes('Unexpected state (ID: b815)') || errorStr.includes('permission-denied'))) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#fef2f2', minHeight: '100vh' }}>
        <h1 style={{ color: '#dc2626', fontSize: '24px', marginBottom: '16px' }}>Action Required: Update Firebase Rules</h1>
        <p style={{ fontSize: '16px', color: '#450a0a', maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.5' }}>
          Your app is crashing because your Firebase database is locked. Since this is your personal Firebase project, I cannot update the rules for you.
        </p>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #fca5a5', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
          <h2 style={{ fontSize: '18px', marginTop: '0' }}>How to fix this right now:</h2>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Go to <a href="https://console.firebase.google.com/project/alphahunt-1f310/firestore/rules" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>your Firebase Rules Console</a>.</li>
            <li>Delete everything in the editor.</li>
            <li>Paste the rules I provided in the chat.</li>
            <li>Click <strong>Publish</strong>.</li>
            <li>Come back here and <strong>Hard Refresh</strong> the page (Ctrl+F5 or Cmd+Shift+R).</li>
          </ol>
        </div>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary />
  </StrictMode>,
);
