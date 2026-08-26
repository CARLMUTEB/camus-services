// =========================================================
// CAMU SERVICES — AUTHENTIFICATION
// Firebase Authentication + Firestore
// =========================================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    auth,
    db
} from "../config/firebase.js";

import {
    setUser,
    addListener
} from "./store.js";


// =========================================================
// INSCRIPTION
// =========================================================

export async function signUp(
    email,
    password,
    displayName,
    phone = ""
) {

    try {

        email = email.trim();

        if (!email || !password) {
            return {
                success: false,
                error: "Veuillez remplir tous les champs obligatoires."
            };
        }

        if (password.length < 6) {
            return {
                success: false,
                error: "Le mot de passe doit contenir au moins 6 caractères."
            };
        }


        // Création du compte Firebase Authentication
        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;


        // Enregistrement du nom dans Firebase Authentication
        await updateProfile(
            user,
            {
                displayName:
                    displayName?.trim() || ""
            }
        );


        // Création du profil dans Firestore
        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {
                uid:
                    user.uid,

                email:
                    user.email,

                displayName:
                    displayName?.trim() || "",

                phoneNumber:
                    phone?.trim() || "",

                photoURL:
                    user.photoURL || "",

                role:
                    "client",

                isActive:
                    true,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );


        // Mettre immédiatement l'utilisateur dans le store
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: displayName?.trim() || "",
            phoneNumber: phone?.trim() || "",
            photoURL: user.photoURL || "",
            role: "client",
            isActive: true
        };

        setUser(
            user,
            userData
        );


        return {
            success: true,
            user: user,
            userData: userData
        };


    } catch (error) {

        console.error(
            "CAMU SERVICES — Erreur inscription :",
            error
        );

        return {
            success: false,
            error:
                translateFirebaseError(
                    error.code
                )
        };
    }
}


// =========================================================
// CONNEXION
// =========================================================

export async function signIn(
    email,
    password
) {

    try {

        email =
            email.trim();


        if (!email || !password) {

            return {
                success: false,
                error:
                    "Veuillez saisir votre email et votre mot de passe."
            };
        }


        // Connexion Firebase Authentication
        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;


        // Récupération du profil Firestore
        const userData =
            await fetchUserData(
                user.uid
            );


        // Si le document n'existe pas encore,
        // créer un profil local minimal.
        if (!userData) {

            const defaultData = {

                uid:
                    user.uid,

                email:
                    user.email,

                displayName:
                    user.displayName || "",

                phoneNumber:
                    "",

                photoURL:
                    user.photoURL || "",

                role:
                    "client",

                isActive:
                    true
            };


            setUser(
                user,
                defaultData
            );

        }


        return {
            success: true,
            user: user,
            userData: userData
        };


    } catch (error) {

        console.error(
            "CAMU SERVICES — Erreur connexion :",
            error
        );

        return {
            success: false,
            error:
                translateFirebaseError(
                    error.code
                )
        };
    }
}


// =========================================================
// DÉCONNEXION
// =========================================================

export async function signOutUser() {

    try {

        await signOut(
            auth
        );


        setUser(
            null,
            null
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "CAMU SERVICES — Erreur déconnexion :",
            error
        );

        return {
            success: false,
            error:
                error.message ||
                "Impossible de se déconnecter."
        };
    }
}


// =========================================================
// MOT DE PASSE OUBLIÉ
// =========================================================

export async function resetPassword(
    email
) {

    try {

        email =
            email.trim();


        if (!email) {

            return {
                success: false,
                error:
                    "Veuillez saisir votre adresse email."
            };
        }


        await sendPasswordResetEmail(
            auth,
            email
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "CAMU SERVICES — Erreur réinitialisation :",
            error
        );

        return {
            success: false,
            error:
                translateFirebaseError(
                    error.code
                )
        };
    }
}


// =========================================================
// RÉCUPÉRER LES DONNÉES FIRESTORE
// =========================================================

export async function fetchUserData(
    uid
) {

    try {

        if (!uid) {
            return null;
        }


        const reference =
            doc(
                db,
                "users",
                uid
            );


        const snapshot =
            await getDoc(
                reference
            );


        if (!snapshot.exists()) {

            return null;
        }


        const data =
            snapshot.data();


        // Utilisateur Firebase actuellement connecté
        const currentUser =
            auth.currentUser;


        setUser(
            currentUser,
            data
        );


        return data;


    } catch (error) {

        console.error(
            "CAMU SERVICES — Erreur Firestore :",
            error
        );

        return null;
    }
}


// =========================================================
// SURVEILLANCE DE L'AUTHENTIFICATION
// =========================================================

export function initAuth() {

    return onAuthStateChanged(
        auth,
        async user => {

            try {

                if (!user) {

                    setUser(
                        null,
                        null
                    );

                    return;
                }


                const data =
                    await fetchUserData(
                        user.uid
                    );


                if (data) {

                    setUser(
                        user,
                        data
                    );

                    return;
                }


                // Profil Firestore absent
                const defaultData = {

                    uid:
                        user.uid,

                    email:
                        user.email,

                    displayName:
                        user.displayName || "",

                    phoneNumber:
                        "",

                    photoURL:
                        user.photoURL || "",

                    role:
                        "client",

                    isActive:
                        true
                };


                setUser(
                    user,
                    defaultData
                );


            } catch (error) {

                console.error(
                    "CAMU SERVICES — Erreur surveillance auth :",
                    error
                );

                setUser(
                    user,
                    null
                );
            }
        }
    );
}


// =========================================================
// TRADUCTION DES ERREURS FIREBASE
// =========================================================

function translateFirebaseError(
    code
) {

    const errors = {

        "auth/invalid-email":
            "Adresse email invalide.",

        "auth/user-not-found":
            "Aucun compte ne correspond à cet email.",

        "auth/wrong-password":
            "Mot de passe incorrect.",

        "auth/invalid-credential":
            "Email ou mot de passe incorrect.",

        "auth/email-already-in-use":
            "Cette adresse email est déjà utilisée.",

        "auth/weak-password":
            "Le mot de passe doit contenir au moins 6 caractères.",

        "auth/network-request-failed":
            "Problème de connexion Internet.",

        "auth/too-many-requests":
            "Trop de tentatives. Réessayez plus tard.",

        "auth/operation-not-allowed":
            "La connexion par email et mot de passe n'est pas activée dans Firebase.",

        "auth/missing-password":
            "Veuillez saisir votre mot de passe.",

        "auth/user-disabled":
            "Ce compte a été désactivé.",

        "auth/requires-recent-login":
            "Veuillez vous reconnecter avant d'effectuer cette opération."
    };


    return (
        errors[code] ||
        "Une erreur Firebase est survenue."
    );
}


// =========================================================
// EXPORT
// =========================================================

export {
    addListener
};
