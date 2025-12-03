import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseCredentials = {
    apiKey: 'AIzaSyB6g7xUy6pTS0i52GAX6txvbXRE0cPDx04',
    authDomain: 'sos-js.firebaseapp.com',
    projectId: 'sos-js',
    storageBucket: 'sos-js.firebasestorage.com',
    messagingSenderId: '940097331263',
    appId: '1:940097331263:web:aa76c07d3fcbe05516188a',
    measurementId: "G-EJN54SHZHR",
};

export const app =
    getApps().length > 0 ? getApp() : initializeApp(firebaseCredentials);
export const auth = getAuth(app);
export const db = getFirestore(app);

