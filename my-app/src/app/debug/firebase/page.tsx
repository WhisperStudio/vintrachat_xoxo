'use client'

/**
 * FIREBASE CONFIG DEBUG PAGE
 * 
 * This page shows the current Firebase configuration
 * Use this to verify your setup is correct
 * 
 * Go to: http://localhost:3000/debug/firebase
 */

import React, { useState, useEffect } from 'react'
import { app, auth, db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default function FirebaseDebugPage() {
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    try {
      const firebaseApp = app
      const authInstance = getAuth(firebaseApp)
      const firestoreDb = getFirestore(firebaseApp)

      setConfig({
        status: 'OK',
        app: {
          name: firebaseApp.name,
          automaticDataCollectionEnabled: firebaseApp.automaticDataCollectionEnabled,
        },
        auth: {
          initialized: !!authInstance,
          currentUser: authInstance.currentUser,
          providerId: 'Google OAuth 2.0',
        },
        firestore: {
          initialized: !!firestoreDb,
          type: 'Realtime Database',
        },
        config: {
          projectId: 'vintrasolutions-f58a7',
          authDomain: 'vintrasolutions-f58a7.firebaseapp.com',
          apiKeyPresent: true,
        },
      })
    } catch (error: any) {
      setConfig({
        status: 'ERROR',
        error: error.message,
        code: error.code,
      })
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔥 Firebase Config Debug</h1>
      
      {config?.status === 'ERROR' ? (
        <div style={{ color: 'red', backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '4px' }}>
          <h2>❌ Error</h2>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      ) : config ? (
        <div style={{ color: 'green' }}>
          <h2>✅ Firebase Status</h2>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(config, null, 2)}
          </pre>
          
          <h3>Checklist:</h3>
          <ul>
            <li>✅ Firebase initialized: {config.app.name === '[DEFAULT]' ? 'YES' : 'NO'}</li>
            <li>✅ Auth module: {config.auth.initialized ? 'YES' : 'NO'}</li>
            <li>✅ Firestore: {config.firestore.initialized ? 'YES' : 'NO'}</li>
          </ul>

          <h3>Next Steps:</h3>
          <ol>
            <li>Enable Google Sign-In: <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a> → Authentication → Sign-in method</li>
            <li>Add authorized domains: localhost, 127.0.0.1</li>
            <li>Test signup: <a href="/auth/signup">/auth/signup</a></li>
          </ol>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}
