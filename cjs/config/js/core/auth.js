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


export async function signUp(
    email,
    password,
    displayName,
    phone = ""
) {

    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = credential.user;


        if (displayName) {

            await updateProfile(user, {
                displayName: displayName
            });

        }


        await setDoc(
            doc(db, "users", user.uid),
            {

                uid: user.uid,

                email: user.email,

                displayName: displayName || "",

                phoneNumber: phone || "",

                photoURL: "",

                role: "client",

                isActive: true,

                createdAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            }
        );


        const data = await fetchUserData(
            user.uid
        );


        return {

            success: true,

            user: user,

            data: data

        };


    } catch (error) {

        console.error(
            "Erreur inscription:",
            error
        );

        return {

            success: false,

            error: translateFirebaseError(
                error
            )

        };

    }

}


export async function signIn(
    email,
    password
) {

    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = credential.user;

        const data =
            await fetchUserData(user.uid);


        if (!data) {

            await setDoc(
                doc(db, "users", user.uid),
                {

                    uid: user.uid,

                    email: user.email,

                    displayName:
                        user.displayName || "",

                    phoneNumber: "",

                    photoURL:
                        user.photoURL || "",

                    role: "client",

                    isActive: true,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );

        }


        return {

            success: true,

            user: user,

            data: data

        };


    } catch (error) {

        console.error(
            "Erreur connexion:",
            error
        );

        return {

            success: false,

            error: translateFirebaseError(
                error
            )

        };

    }

}


export async function signOutUser() {

    try {

        await signOut(auth);

        setUser(null, null);

        return {
            success: true
        };

    } catch (error) {

        return {

            success: false,

            error: translateFirebaseError(
                error
            )

        };

    }

}


export async function resetPassword(
    email
) {

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        return {
            success: true
        };

    } catch (error) {

        return {

            success: false,

            error: translateFirebaseError(
                error
            )

        };

    }

}


export async function fetchUserData(uid) {

    try {

        const ref =
            doc(db, "users", uid);

        const snapshot =
            await getDoc(ref);


        if (!snapshot.exists()) {
            return null;
        }


        const data = snapshot.data();

        setUser(
            auth.currentUser,
            data
        );


        return data;


    } catch (error) {

        console.error(
            "Erreur Firestore:",
            error
        );

        return null;

    }

}


export function initAuth() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                setUser(null, null);

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

                        uid: user.uid,

                        email: user.email,

                        displayName:
                            user.displayName || "",

                        role: "client"

                    }
                );

            }

        }
    );

}


function translateFirebaseError(
    error
) {

    const code = error?.code || "";

    const messages = {

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

        "auth/too-many-requests":
            "Trop de tentatives. Réessayez plus tard.",

        "auth/network-request-failed":
            "Problème de connexion Internet."

    };


    return messages[code]
        || error?.message
        || "Une erreur est survenue.";

}


export {
    addListener
};
