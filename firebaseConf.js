import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseCredentials = {
    apiKey: 'AIzaSyDmRGlNH6R3Nm7jWPtSnBcZgri1GR3Xvdc',
    authDomain: 'tcc-app-sos.firebaseapp.com',
    projectId: 'tcc-app-sos',
    storageBucket: 'tcc-app-sos.firebasestorage.app',
    messagingSenderId: '422608365737',
    appId: '1:422608365737:web:c1e4635124f13e8e8721b8',
    measurementId: 'G-PTVMBXQHVF',
};

// const firebaseCredentials = {
//     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
//     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
//     storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
//     appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
//     messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
// };

export const app =
    getApps().length > 0 ? getApp() : initializeApp(firebaseCredentials);
export const auth = getAuth(app);
export const db = getFirestore(app);

