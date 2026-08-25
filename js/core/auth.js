```javascript
// =========================================================
// CAMU SERVICES — AUTHENTIFICATION
// =========================================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

        email =
            email.trim();

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;


        await updateProfile(
            user,
            {
                displayName:
                    displayName || ""
            }
        );


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
                    displayName || "",

                phoneNumber:
                    phone || "",

                photoURL:
                    "",

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


        await fetchUserData(
            user.uid
        );


        return {

            success: true,

            user

        };


    } catch (error) {

        console.error(
            "Erreur inscription :",
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

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

        await fetchUserData(
            credential.user.uid
        );

        return {

            success: true,

            user:
                credential.user

        };


    } catch (error) {

        console.error(
            "Erreur connexion :",
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
            "Erreur déconnexion :",
            error
        );

        return {

            success: false,

            error:
                error.message
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

        await sendPasswordResetEmail(
            auth,
            email.trim()
        );

        return {
            success: true
        };


    } catch (error) {

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
// DONNÉES UTILISATEUR
// =========================================================

export async function fetchUserData(
    uid
) {

    try {

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


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();

            setUser(
                auth.currentUser,
                data
            );

            return data;
        }


        return null;


    } catch (error) {

        console.error(
            "Erreur récupération utilisateur :",
            error
        );

        return null;
    }
}


// =========================================================
// SURVEILLANCE AUTH
// =========================================================

export function initAuth() {

    return onAuthStateChanged(
        auth,
        async user => {

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

            } else {

                setUser(
                    user,
                    {

                        uid:
                            user.uid,

                        email:
                            user.email,

                        displayName:
                            user.displayName || "",

                        role:
                            "client"
                    }
                );
            }

        }
    );
}


// =========================================================
// ERREURS FIREBASE
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
            "La connexion par email/mot de passe n'est pas activée dans Firebase.",

        "auth/missing-password":
            "Veuillez saisir votre mot de passe."

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
```
