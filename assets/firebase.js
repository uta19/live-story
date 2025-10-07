import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAkIjW72hcEfsnJQ8Y9FlZP40Bmg3ng3v4',
  authDomain: 'billionare-501bf.firebaseapp.com',
  projectId: 'billionare-501bf',
  storageBucket: 'billionare-501bf.firebasestorage.app',
  messagingSenderId: '1001317636102',
  appId: '1:1001317636102:web:a7e2c522d7ef5808e14b87',
  measurementId: 'G-SSK2MRSE70'
};

export function getFirebaseApp() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    window.__FIREBASE_APP__ = app;
  }
  return app;
}

export function getFirebaseConfig() {
  return firebaseConfig;
}
