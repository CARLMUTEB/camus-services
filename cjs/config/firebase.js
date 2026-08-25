import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


const firebaseConfig = {

    apiKey: "VOTRE_API_KEY",

    authDomain: "VOTRE_PROJECT.firebaseapp.com",

    projectId: "VOTRE_PROJECT_ID",

    storageBucket: "VOTRE_PROJECT.firebasestorage.app",

    messagingSenderId: "VOTRE_SENDER_ID",

    appId: "VOTRE_APP_ID"

};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;
