import { useEffect } from 'react';

export function FirebaseDebugger() {
  useEffect(() => {
    const firebaseConfig = {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'MISSING',
    };
    
    console.log('--- FIREBASE DIAGNOSTIC ---');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
    console.log('API Key:', firebaseConfig.apiKey);
    console.log('---------------------------');
  }, []);

  return null;
}
