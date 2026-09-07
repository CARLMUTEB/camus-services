// =====================================================
// CAMU SERVICES
// AUTHENTIFICATION + COMPTE UTILISATEUR
// Firebase Authentication + Firestore + Cloudinary
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CLOUDINARY
// =====================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// =====================================================
// MESSAGE GÉNÉRAL
// =====================================================

function showMessage(elementId, message, type = "error") {

    const element = document.getElementById(elementId);

    if (!element) {
        console.warn("Élément introuvable :", elementId);
        return;
    }

    element.textContent = message;
    element.className = `auth-message ${type}`;
    element.style.display = "block";
}


// =====================================================
// MESSAGE PAGE COMPTE
// =====================================================

function showAccountMessage(message, type = "success") {

    const element = document.getElementById("accountMessage");

    if (!element) return;

    element.textContent = message;
    element.className = `auth-message ${type}`;
    element.style.display = "block";

    setTimeout(() => {
        element.style.display = "none";
    }, 3500);
}


// =====================================================
// ERREURS FIREBASE
// =====================================================

function getFirebaseErrorMessage(error) {

    console.error("Firebase Error :", error);

    switch (error.code) {

        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
        case "auth/wrong-password":
            return "E-mail ou mot de passe incorrect.";

        case "auth/user-not-found":
            return "Aucun compte ne correspond à cette adresse e-mail.";

        case "auth/invalid-email":
            return "L'adresse e-mail n'est pas valide.";

        case "auth/email-already-in-use":
            return "Cette adresse e-mail est déjà utilisée.";

        case "auth/weak-password":
            return "Le mot de passe doit contenir au moins 6 caractères.";

        case "auth/password-does-not-meet-requirements":
            return "Le mot de passe ne respecte pas les exigences de sécurité.";

        case "auth/network-request-failed":
            return "Problème de connexion Internet.";

        case "auth/too-many-requests":
            return "Trop de tentatives. Veuillez patienter quelques minutes.";

        case "auth/user-disabled":
            return "Ce compte a été désactivé.";

        case "auth/operation-not-allowed":
            return "La connexion par e-mail n'est pas activée dans Firebase.";

        default:
            return "Une erreur est survenue. Veuillez réessayer.";
    }
}


// =====================================================
// AFFICHER / MASQUER MOT DE PASSE
// =====================================================

document.addEventListener("click", function (event) {

    const button = event.target.closest(".password-toggle");

    if (!button) return;

    const target = button.dataset.target;

    const input = document.getElementById(target);

    if (!input) return;

    const icon = button.querySelector("i");

    if (input.type === "password") {

        input.type = "text";

        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }

    } else {

        input.type = "password";

        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
});


// =====================================================
// INSCRIPTION
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName")
                ?.value
                .trim();

        const email =
            document.getElementById("registerEmail")
                ?.value
                .trim()
                .toLowerCase();

        const phone =
            document.getElementById("registerPhone")
                ?.value
                .trim();

        const password =
            document.getElementById("registerPassword")
                ?.value;

        const passwordConfirm =
            document.getElementById("registerPasswordConfirm")
                ?.value;

        const terms =
            document.getElementById("registerTerms")
                ?.checked;

        const button =
            document.getElementById("registerButton");


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !passwordConfirm
        ) {

            showMessage(
                "registerMessage",
                "Veuillez remplir tous les champs.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "registerMessage",
                "Le mot de passe doit contenir au moins 6 caractères.",
                "error"
            );

            return;
        }


        if (password !== passwordConfirm) {

            showMessage(
                "registerMessage",
                "Les deux mots de passe ne correspondent pas.",
                "error"
            );

            return;
        }


        if (!terms) {

            showMessage(
                "registerMessage",
                "Veuillez accepter les conditions d'utilisation.",
                "error"
            );

            return;
        }


        // -------------------------------------------------
        // CHARGEMENT
        // -------------------------------------------------

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Création...
            `;
        }


        try {

            // -------------------------------------------------
            // CRÉATION DU COMPTE FIREBASE
            // -------------------------------------------------

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // -------------------------------------------------
            // NOM D'AFFICHAGE FIREBASE
            // -------------------------------------------------

            await updateProfile(user, {
                displayName: name
            });


            // -------------------------------------------------
            // PROFIL FIRESTORE
            // -------------------------------------------------

            await setDoc(
                doc(db, "users", user.uid),
                {
                    uid: user.uid,
                    name: name,
                    email: email,
                    phone: phone,
                    description: "",
                    photoURL: "",
                    role: "user",
                    status: "active",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            );


            // -------------------------------------------------
            // SUCCÈS
            // -------------------------------------------------

            showMessage(
                "registerMessage",
                "Compte créé avec succès ! Redirection...",
                "success"
            );


            setTimeout(() => {

                window.location.href = "compte.html";

            }, 1000);


        } catch (error) {

            showMessage(
                "registerMessage",
                getFirebaseErrorMessage(error),
                "error"
            );


            if (button) {

                button.disabled = false;

                button.innerHTML = `
                    <i class="fa-solid fa-user-plus"></i>
                    Créer mon compte
                `;
            }
        }
    });
}


// =====================================================
// CONNEXION
// =====================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log(
            "CAMU SERVICES : formulaire de connexion envoyé."
        );


        const email =
            document.getElementById("loginEmail")
                ?.value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("loginPassword")
                ?.value;

        const button =
            document.getElementById("loginButton");


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!email || !password) {

            showMessage(
                "loginMessage",
                "Veuillez saisir votre e-mail et votre mot de passe.",
                "error"
            );

            return;
        }


        // -------------------------------------------------
        // CHARGEMENT
        // -------------------------------------------------

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Connexion...</span>
            `;
        }


        try {

            console.log(
                "Connexion Firebase en cours..."
            );


            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "Connexion réussie :",
                user.email
            );


            showMessage(
                "loginMessage",
                "Connexion réussie ! Redirection...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "compte.html";

            }, 800);


        } catch (error) {

            showMessage(
                "loginMessage",
                getFirebaseErrorMessage(error),
                "error"
            );


            if (button) {

                button.disabled = false;

                button.innerHTML = `
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Se connecter</span>
                `;
            }
        }
    });
}


// =====================================================
// MOT DE PASSE OUBLIÉ
// =====================================================

const forgotPassword =
    document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", async function (event) {

        event.preventDefault();


        const emailInput =
            document.getElementById("loginEmail");

        const email =
            emailInput
                ?.value
                .trim()
                .toLowerCase();


        if (!email) {

            showMessage(
                "loginMessage",
                "Veuillez d'abord saisir votre adresse e-mail.",
                "error"
            );

            emailInput?.focus();

            return;
        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            showMessage(
                "loginMessage",
                "Un e-mail de réinitialisation a été envoyé.",
                "success"
            );


        } catch (error) {

            showMessage(
                "loginMessage",
                getFirebaseErrorMessage(error),
                "error"
            );
        }
    });
}


// =====================================================
// CHARGER LE PROFIL UTILISATEUR
// =====================================================

async function loadUserProfile(user) {

    if (!user) return;

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        let profile = {};

        if (userSnap.exists()) {
            profile = userSnap.data();
        }


        const name =
            profile.name ||
            user.displayName ||
            "Utilisateur CAMU";


        const email =
            profile.email ||
            user.email ||
            "";


        const phone =
            profile.phone ||
            user.phoneNumber ||
            "";


        const description =
            profile.description ||
            "";


        const photoURL =
            profile.photoURL ||
            user.photoURL ||
            "";


        // -------------------------------------------------
        // NOM
        // -------------------------------------------------

        const nameElement =
            document.getElementById("accountName");

        if (nameElement) {
            nameElement.textContent = name;
        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        const emailElement =
            document.getElementById("accountEmail");

        if (emailElement) {
            emailElement.textContent = email;
        }


        // -------------------------------------------------
        // TÉLÉPHONE
        // -------------------------------------------------

        const phoneElement =
            document.getElementById("accountPhone");

        if (phoneElement) {
            phoneElement.textContent =
                phone || "Non renseigné";
        }


        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        const descriptionElement =
            document.getElementById(
                "accountDescription"
            );

        if (descriptionElement) {

            descriptionElement.textContent =
                description ||
                "Aucune description pour le moment.";
        }


        // -------------------------------------------------
        // PHOTO
        // -------------------------------------------------

        const avatarImage =
            document.getElementById("accountAvatarImage");

        const avatarDefault =
            document.getElementById("accountAvatarDefault");


        if (avatarImage && avatarDefault) {

            if (photoURL) {

                avatarImage.src = photoURL;
                avatarImage.style.display = "block";

                avatarDefault.style.display = "none";

            } else {

                avatarImage.src = "";
                avatarImage.style.display = "none";

                avatarDefault.style.display = "flex";
            }
        }


        // -------------------------------------------------
        // INPUT PHOTO
        // -------------------------------------------------

        const photoInput =
            document.getElementById(
                "profilePhotoInput"
            );

        if (photoInput) {
            photoInput.dataset.uid = user.uid;
        }


        console.log(
            "CAMU SERVICES : profil chargé."
        );


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );


        showAccountMessage(
            "Impossible de charger votre profil.",
            "error"
        );
    }
}


// =====================================================
// PROTECTION DE LA PAGE COMPTE
// =====================================================

onAuthStateChanged(
    auth,
    async function (user) {

        const isAccountPage =
            window.location.pathname
                .toLowerCase()
                .endsWith("/compte.html");


        // -------------------------------------------------
        // PAGE COMPTE + PAS CONNECTÉ
        // -------------------------------------------------

        if (isAccountPage && !user) {

            console.log(
                "CAMU SERVICES : accès compte refusé, utilisateur non connecté."
            );


            window.location.href =
                "connexion.html";

            return;
        }


        // -------------------------------------------------
        // UTILISATEUR CONNECTÉ
        // -------------------------------------------------

        if (user) {

            console.log(
                "CAMU SERVICES : utilisateur connecté.",
                user.email
            );


            if (isAccountPage) {

                await loadUserProfile(user);
            }
        }


        // -------------------------------------------------
        // PERSONNE NON CONNECTÉE
        // -------------------------------------------------

        else {

            console.log(
                "CAMU SERVICES : aucun utilisateur connecté."
            );
        }
    }
);


// =====================================================
// PHOTO DE PROFIL — CLOUDINARY
// =====================================================

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async function () {

            const file =
                this.files?.[0];


            if (!file) return;


            const user =
                auth.currentUser;


            if (!user) {

                showAccountMessage(
                    "Vous devez être connecté.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // VALIDATION TYPE
            // -------------------------------------------------

            if (!file.type.startsWith("image/")) {

                showAccountMessage(
                    "Veuillez sélectionner une image.",
                    "error"
                );

                this.value = "";

                return;
            }


            // -------------------------------------------------
            // VALIDATION TAILLE
            // -------------------------------------------------

            if (file.size > 5 * 1024 * 1024) {

                showAccountMessage(
                    "La photo ne doit pas dépasser 5 Mo.",
                    "error"
                );

                this.value = "";

                return;
            }


            try {

                showAccountMessage(
                    "Envoi de la photo en cours...",
                    "success"
                );


                // -------------------------------------------------
                // PRÉPARER CLOUDINARY
                // -------------------------------------------------

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );

                formData.append(
                    "upload_preset",
                    CLOUDINARY_UPLOAD_PRESET
                );

                formData.append(
                    "folder",
                    `camu-services/profiles/${user.uid}`
                );


                // -------------------------------------------------
                // UPLOAD CLOUDINARY
                // -------------------------------------------------

                const response =
                    await fetch(
                        CLOUDINARY_UPLOAD_URL,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok || !result.secure_url) {

                    console.error(
                        "Cloudinary Error :",
                        result
                    );

                    throw new Error(
                        "L'envoi de la photo vers Cloudinary a échoué."
                    );
                }


                const photoURL =
                    result.secure_url;


                console.log(
                    "Photo Cloudinary :",
                    photoURL
                );


                // -------------------------------------------------
                // FIREBASE AUTH
                // -------------------------------------------------

                await updateProfile(
                    user,
                    {
                        photoURL: photoURL
                    }
                );


                // -------------------------------------------------
                // FIRESTORE
                // -------------------------------------------------

                await setDoc(
                    doc(db, "users", user.uid),
                    {
                        photoURL: photoURL,
                        updatedAt: serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                // -------------------------------------------------
                // AFFICHER IMMÉDIATEMENT LA PHOTO
                // -------------------------------------------------

                const avatarImage =
                    document.getElementById(
                        "accountAvatarImage"
                    );

                const avatarDefault =
                    document.getElementById(
                        "accountAvatarDefault"
                    );


                if (avatarImage) {

                    avatarImage.src =
                        photoURL;

                    avatarImage.style.display =
                        "block";
                }


                if (avatarDefault) {

                    avatarDefault.style.display =
                        "none";
                }


                // -------------------------------------------------
                // MESSAGE
                // -------------------------------------------------

                showAccountMessage(
                    "Photo de profil mise à jour.",
                    "success"
                );


                // Réinitialiser input
                this.value = "";


            } catch (error) {

                console.error(
                    "Erreur photo de profil :",
                    error
                );


                showAccountMessage(
                    error.message ||
                    "Impossible d'envoyer la photo.",
                    "error"
                );

                this.value = "";
            }

        }
    );
}


// =====================================================
// MODIFICATION DU PROFIL
// =====================================================

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );


if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        async function () {

            const user =
                auth.currentUser;


            if (!user) {

                window.location.href =
                    "connexion.html";

                return;
            }


            // -------------------------------------------------
            // RÉCUPÉRATION DU PROFIL
            // -------------------------------------------------

            let profile = {};

            try {

                const snapshot =
                    await getDoc(
                        doc(db, "users", user.uid)
                    );


                if (snapshot.exists()) {
                    profile = snapshot.data();
                }

            } catch (error) {

                console.error(
                    "Erreur récupération profil :",
                    error
                );
            }


            const currentName =
                profile.name ||
                user.displayName ||
                "";


            const currentPhone =
                profile.phone ||
                "";


            const currentDescription =
                profile.description ||
                "";


            // -------------------------------------------------
            // NOM
            // -------------------------------------------------

            const newName =
                prompt(
                    "Votre nom :",
                    currentName
                );


            if (newName === null) {
                return;
            }


            const cleanName =
                newName.trim();


            if (!cleanName) {

                showAccountMessage(
                    "Le nom ne peut pas être vide.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // TÉLÉPHONE
            // -------------------------------------------------

            const newPhone =
                prompt(
                    "Votre numéro WhatsApp / téléphone :",
                    currentPhone
                );


            if (newPhone === null) {
                return;
            }


            // -------------------------------------------------
            // DESCRIPTION
            // -------------------------------------------------

            const newDescription =
                prompt(
                    "Votre description :",
                    currentDescription
                );


            if (newDescription === null) {
                return;
            }


            try {

                // -------------------------------------------------
                // FIREBASE AUTH
                // -------------------------------------------------

                await updateProfile(
                    user,
                    {
                        displayName: cleanName
                    }
                );


                // -------------------------------------------------
                // FIRESTORE
                // -------------------------------------------------

                await setDoc(
                    doc(db, "users", user.uid),
                    {
                        name: cleanName,
                        phone: newPhone.trim(),
                        description: newDescription.trim(),
                        updatedAt: serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                // -------------------------------------------------
                // RAFRAÎCHIR NOM
                // -------------------------------------------------

                const nameElement =
                    document.getElementById(
                        "accountName"
                    );


                if (nameElement) {

                    nameElement.textContent =
                        cleanName;
                }


                // -------------------------------------------------
                // RAFRAÎCHIR TÉLÉPHONE
                // -------------------------------------------------

                const phoneElement =
                    document.getElementById(
                        "accountPhone"
                    );


                if (phoneElement) {

                    phoneElement.textContent =
                        newPhone.trim() ||
                        "Non renseigné";
                }


                // -------------------------------------------------
                // RAFRAÎCHIR DESCRIPTION
                // -------------------------------------------------

                const descriptionElement =
                    document.getElementById(
                        "accountDescription"
                    );


                if (descriptionElement) {

                    descriptionElement.textContent =
                        newDescription.trim() ||
                        "Aucune description pour le moment.";
                }


                showAccountMessage(
                    "Votre profil a été mis à jour.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Erreur modification profil :",
                    error
                );


                showAccountMessage(
                    getFirebaseErrorMessage(error),
                    "error"
                );
            }

        }
    );
}


// =====================================================
// DÉCONNEXION
// =====================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#logoutButton, #logoutButtonBottom, #logoutBtn, .logout-button, [data-action='logout']"
            );


        if (!button) return;


        event.preventDefault();


        try {

            await signOut(auth);


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "Erreur de déconnexion :",
                error
            );


            showAccountMessage(
                "Impossible de vous déconnecter.",
                "error"
            );
        }

    }
);


// =====================================================
// CONFIRMATION
// =====================================================

console.log(
    "CAMU SERVICES : auth.js chargé correctement."
);
