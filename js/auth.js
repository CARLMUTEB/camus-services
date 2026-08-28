/* =========================================================
   CAMU SERVICES — AUTHENTIFICATION (Firebase)
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================
// VOS VRAIES CLÉS FIREBASE
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
    authDomain: "camu-services.firebaseapp.com",
    projectId: "camu-services",
    storageBucket: "camu-services.firebasestorage.app",
    messagingSenderId: "879100396449",
    appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
    measurementId: "G-RQ16SX2SNV"
};

// =========================================================
// INITIALISATION
// =========================================================
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// =========================================================
// ÉTAT
// =========================================================
let currentUser = null;

export function getUser() {
    return currentUser;
}

export function isAuthenticated() {
    return currentUser !== null;
}

// =========================================================
// INSCRIPTION
// =========================================================
export async function registerUser({ email, password, displayName = "", role = "client" }) {
    try {
        if (!email || !password) {
            throw new Error("Email et mot de passe requis.");
        }
        if (password.length < 6) {
            throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;
        if (displayName.trim()) {
            await updateProfile(user, { displayName: displayName.trim() });
        }
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName.trim() || "Utilisateur",
            role: role,
            phone: "",
            city: "",
            photoURL: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            preferences: {
                notifications: true,
                darkMode: false
            }
        }, { merge: true });
        currentUser = user;
        return { success: true, user };
    } catch (error) {
        console.error("Erreur inscription :", error);
        return { success: false, error: getAuthErrorMessage(error) };
    }
}

// =========================================================
// CONNEXION
// =========================================================
export async function loginUser(email, password) {
    try {
        if (!email || !password) {
            throw new Error("Veuillez remplir tous les champs.");
        }
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        currentUser = credential.user;
        return { success: true, user: credential.user };
    } catch (error) {
        console.error("Erreur connexion :", error);
        return { success: false, error: getAuthErrorMessage(error) };
    }
}

// =========================================================
// DÉCONNEXION
// =========================================================
export async function logoutUser() {
    try {
        await signOut(auth);
        currentUser = null;
        return { success: true };
    } catch (error) {
        console.error("Erreur déconnexion :", error);
        return { success: false, error: getAuthErrorMessage(error) };
    }
}

// =========================================================
// RÉINITIALISATION MOT DE PASSE
// =========================================================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error) };
    }
}

// =========================================================
// OBSERVER L'ÉTAT
// =========================================================
export function observeAuth(callback) {
    return onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        let profile = null;
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                const snapshot = await getDoc(userRef);
                if (snapshot.exists()) {
                    profile = snapshot.data();
                }
            } catch (error) {
                console.warn("Impossible de récupérer le profil :", error);
            }
        }
        if (typeof callback === "function") {
            callback(user, profile);
        }
    });
}

// =========================================================
// RÉCUPÉRER LE PROFIL
// =========================================================
export async function getUserProfile(uid = null) {
    try {
        const userId = uid || currentUser?.uid;
        if (!userId) return null;
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        console.error("Erreur récupération profil :", error);
        return null;
    }
}

// =========================================================
// METTRE À JOUR LE PROFIL
// =========================================================
export async function updateUserProfile(uid, data) {
    try {
        await updateDoc(doc(db, "users", uid), {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur mise à jour profil :", error);
        return { success: false, error: error.message };
    }
}

// =========================================================
// TRADUCTION DES ERREURS
// =========================================================
function getAuthErrorMessage(error) {
    if (!error) return "Une erreur inconnue est survenue.";
    switch (error.code) {
        case "auth/email-already-in-use": return "Cette adresse e-mail est déjà utilisée.";
        case "auth/invalid-email": return "L'adresse e-mail n'est pas valide.";
        case "auth/weak-password": return "Le mot de passe est trop faible.";
        case "auth/user-not-found": return "Aucun compte ne correspond à cette adresse e-mail.";
        case "auth/wrong-password": return "Mot de passe incorrect.";
        case "auth/invalid-credential": return "E-mail ou mot de passe incorrect.";
        case "auth/too-many-requests": return "Trop de tentatives. Réessayez plus tard.";
        case "auth/network-request-failed": return "Problème de connexion Internet.";
        case "auth/user-disabled": return "Ce compte a été désactivé.";
        default: return error.message || "Une erreur est survenue.";
    }
}
