// js/core/auth.js
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { auth, db } from "../config/firebase.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { setUser, addListener } from "./store.js";
import { router } from "./router.js";

export async function signUp(email, password, displayName, phone = '') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Créer le document utilisateur dans Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName || '',
            phoneNumber: phone || '',
            photoURL: '',
            role: 'client',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Recharger l'utilisateur
        await fetchUserData(user.uid);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await fetchUserData(user.uid);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function signOutUser() {
    try {
        await signOut(auth);
        setUser(null, null);
        router.navigate('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function fetchUserData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(auth.currentUser, data);
            return data;
        }
        return null;
    } catch (error) {
        console.error("Erreur chargement user data:", error);
        return null;
    }
}

export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const data = await fetchUserData(user.uid);
            if (data) {
                setUser(user, data);
            } else {
                setUser(user, { role: 'client' });
            }
        } else {
            setUser(null, null);
        }
    });
}

// Export du store pour les composants
export { addListener };
