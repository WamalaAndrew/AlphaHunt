import { useEffect } from 'react';
import firebaseConfigFromFile from '../../firebase-applet-config.json';

export function FirebaseDebugger() {
  useEffect(() => {
    const firebaseConfig = {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFromFile.projectId,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigFromFile.firestoreDatabaseId,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFromFile.apiKey,
    };
    
    console.log('--- FIREBASE DIAGNOSTIC ---');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
    console.log('API Key:', firebaseConfig.apiKey ? 'Present' : 'MISSING');
    console.log('---------------------------');
  }, []);

  return null;
}
