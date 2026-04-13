import { useEffect } from 'react';
import firebaseConfig from '../../firebase-applet-config.json';

export function FirebaseDebugger() {
  useEffect(() => {
    console.log('--- FIREBASE DIAGNOSTIC ---');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
    console.log('API Key:', firebaseConfig.apiKey ? 'Present' : 'MISSING');
    console.log('---------------------------');
  }, []);

  return null;
}
