// ============================================================
// CAMU SERVICES - FIREBASE CONFIG
// ============================================================
// Firebase version : 10.12.2
// Services :
// - Firebase App
// - Authentication
// - Firestore
// - Storage
// - Analytics
// ============================================================


// ============================================================
// FIREBASE APP
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


// ============================================================
// FIREBASE ANALYTICS
// ============================================================

import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIREBASE FIRESTORE
// ============================================================

import {
    getFirestore,

    collection,
    getDocs,
    getDoc,

    doc,

    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,

    query,
    where,
    orderBy,
    limit,

    serverTimestamp,

    onSnapshot,

    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE STORAGE
// ============================================================

import {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// ============================================================
// CONFIGURATION FIREBASE
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",

    authDomain:
        "camu-services.firebaseapp.com",

    projectId:
        "camu-services",

    storageBucket:
        "camu-services.appspot.com",

    messagingSenderId:
        "879100396449",

    appId:
        "1:879100396449:web:9d7ffe441a3df2daf841e0",

    measurementId:
        "G-RQ16SX2SNV"
};


// ============================================================
// INITIALISATION FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// AUTHENTIFICATION
// ============================================================

const auth = getAuth(app);


// ============================================================
// FIRESTORE
// ============================================================

const db = getFirestore(app);


// ============================================================
// STORAGE
// ============================================================

const storage = getStorage(app);


// ============================================================
// ANALYTICS
// ============================================================

let analytics = null;

try {

    analytics = getAnalytics(app);

    console.log(
        "CAMU SERVICES : Firebase Analytics chargé."
    );

} catch (error) {

    console.warn(
        "CAMU SERVICES : Firebase Analytics non disponible.",
        error
    );

}


// ============================================================
// EXPORTS PRINCIPAUX
// ============================================================

export {

    // Firebase
    app,

    // Services
    auth,
    db,
    storage,
    analytics,

    // Authentication
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,

    // Firestore
    collection,
    getDocs,
    getDoc,
    doc,

    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,

    query,
    where,
    orderBy,
    limit,

    serverTimestamp,
    onSnapshot,
    Timestamp,

    // Storage
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
};


// ============================================================
// CONFIRMATION
// ============================================================

console.log(
    "CAMU SERVICES : Firebase initialisé correctement."
);

console.log(
    "CAMU SERVICES : Auth disponible.",
    !!auth
);

console.log(
    "CAMU SERVICES : Firestore disponible.",
    !!db
);

console.log(
    "CAMU SERVICES : Storage disponible.",
    !!storage
);
