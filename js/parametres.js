/* =========================================================
   CAMU SERVICES — PARAMÈTRES
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   DOM
========================================================= */

const settingsLoading =
    document.getElementById("settingsLoading");

const settingsLogin =
    document.getElementById("settingsLogin");

const settingsContent =
    document.getElementById("settingsContent");

const profileForm =
    document.getElementById("profileForm");

const settingsName =
    document.getElementById("settingsName");

const settingsEmail =
    document.getElementById("settingsEmail");

const settingsPhone =
    document.getElementById("settingsPhone");

const settingsWhatsapp =
    document.getElementById("settingsWhatsapp");

const settingsVille =
    document.getElementById("settingsVille");

const settingsCommune =
    document.getElementById("settingsCommune");

const saveProfileButton =
    document.getElementById("saveProfileButton");

const profileMessage =
    document.getElementById("profileMessage");

const changePasswordButton =
    document.getElementById("changePasswordButton");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const passwordFormContainer =
    document.getElementById(
        "passwordFormContainer"
    );

const passwordForm =
    document.getElementById("passwordForm");

const currentPassword =
    document.getElementById("currentPassword");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const savePasswordButton =
    document.getElementById(
        "savePasswordButton"
    );

const cancelPasswordButton =
    document.getElementById(
        "cancelPasswordButton"
    );

const passwordMessage =
    document.getElementById(
        "passwordMessage"
    );

const accountType =
    document.getElementById(
        "accountType"
    );

const accountStatus =
    document.getElementById(
        "accountStatus"
    );

const accountCreated =
    document.getElementById(
        "accountCreated"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const settingsYear =
    document.getElementById(
        "settingsYear"
    );


/* =========================================================
   ANNÉE
========================================================= */

settingsYear.textContent =
    new Date().getFullYear();


/* =========================================================
   MENU MOBILE
========================================================= */

const settingsMenuButton =
    document.getElementById(
        "settingsMenuButton"
    );

const settingsSidebar =
    document.getElementById(
        "settingsSidebar"
    );

const settingsOverlay =
    document.getElementById(
        "settingsOverlay"
    );


settingsMenuButton.addEventListener(
    "click",
    () => {

        settingsSidebar.classList.add(
            "open"
        );

        settingsOverlay.classList.add(
            "open"
        );

    }
);


settingsOverlay.addEventListener(
    "click",
    closeMenu
);


function closeMenu() {

    settingsSidebar.classList.remove(
        "open"
    );

    settingsOverlay.classList.remove(
        "open"
    );

}


/* =========================================================
   VILLES
========================================================= */

async function loadCities() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach(
            cityDoc => {

                const data =
                    cityDoc.data();


                if (
                    data.active === false
                ) {

                    return;

                }


                const name =
                    String(
                        data.name || ""
                    ).trim();


                if (!name) {

                    return;

                }


                cities.push({

                    name,

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        cities.sort(
            (a, b) => {

                if (
                    a.order !== b.order
                ) {

                    return (
                        a.order -
                        b.order
                    );

                }

                return a.name.localeCompare(
                    b.name,
                    "fr"
                );

            }
        );


        settingsVille.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


        cities.forEach(
            city => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city.name;


                option.textContent =
                    city.name;


                settingsVille.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "CAMU PARAMÈTRES — villes :",
            error
        );

    }

}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            showLogin();

            return;

        }


        showContent();

        await loadAccount(
            user
        );

    }
);


/* =========================================================
   AFFICHER LOGIN
========================================================= */

function showLogin() {

    settingsLoading.classList.add(
        "hidden"
    );

    settingsContent.classList.add(
        "hidden"
    );

    settingsLogin.classList.remove(
        "hidden"
    );

}


/* =========================================================
   AFFICHER CONTENU
========================================================= */

function showContent() {

    settingsLoading.classList.add(
        "hidden"
    );

    settingsLogin.classList.add(
        "hidden"
    );

    settingsContent.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CHARGER COMPTE
========================================================= */

async function loadAccount(
    user
) {

    try {

        await loadCities();


        /*
         * Informations Firebase Auth
         */

        settingsEmail.value =
            user.email || "";


        settingsName.value =
            user.displayName || "";


        /*
         * Informations Firestore
         */

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            userSnapshot.exists()
        ) {

            const data =
                userSnapshot.data();


            settingsName.value =
                data.name
                ||
                user.displayName
                ||
                "";


            settingsPhone.value =
                data.phone
                ||
                "";


            settingsWhatsapp.value =
                data.whatsapp
                ||
                "";


            selectCity(
                data.ville
            );


            settingsCommune.value =
                data.commune
                ||
                "";


            accountType.textContent =
                getAccountTypeLabel(
                    data.accountType
                );


            accountStatus.textContent =
                getAccountStatusLabel(
                    data.accountStatus
                );


            accountCreated.textContent =
                formatDate(
                    data.createdAt
                );

        } else {

            accountType.textContent =
                "Client";


            accountStatus.textContent =
                "Actif";


            accountCreated.textContent =
                "—";

        }


    } catch (error) {

        console.error(
            "CAMU PARAMÈTRES — chargement compte :",
            error
        );


        showProfileMessage(
            "Impossible de charger toutes les informations du compte.",
            "error"
        );

    }

}


/* =========================================================
   SÉLECTIONNER VILLE
========================================================= */

function selectCity(
    ville
) {

    const value =
        String(
            ville || ""
        ).trim();


    if (!value) {

        return;

    }


    const option =
        [...settingsVille.options]
        .find(
            item =>
                normalizeText(
                    item.value
                )
                ===
                normalizeText(
                    value
                )
        );


    if (option) {

        settingsVille.value =
            option.value;

    }

}


/* =========================================================
   MODIFIER PROFIL
========================================================= */

profileForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (!user) {

            return;

        }


        const name =
            settingsName.value.trim();


        const phone =
            settingsPhone.value.trim();


        const whatsapp =
            settingsWhatsapp.value.trim();


        const ville =
            settingsVille.value.trim();


        const commune =
            settingsCommune.value.trim();


        if (!name) {

            showProfileMessage(
                "Veuillez saisir votre nom complet.",
                "error"
            );

            return;

        }


        saveProfileButton.disabled =
            true;


        saveProfileButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Enregistrement...
        `;


        try {

            /*
             * Mise à jour du profil Firebase Auth
             */

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            /*
             * Mise à jour Firestore
             */

            await updateDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {

                    name,

                    phone,

                    whatsapp,

                    ville,

                    commune,

                    updatedAt:
                        serverTimestamp()

                }
            );


            showProfileMessage(
                "Vos informations ont été enregistrées avec succès.",
                "success"
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — sauvegarde :",
                error
            );


            showProfileMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        } finally {

            saveProfileButton.disabled =
                false;


            saveProfileButton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Enregistrer les modifications
            `;

        }

    }
);


/* =========================================================
   MESSAGE PROFIL
========================================================= */

function showProfileMessage(
    message,
    type
) {

    profileMessage.textContent =
        message;


    profileMessage.className =
        `settings-form-message ${type}`;


    setTimeout(
        () => {

            profileMessage.textContent =
                "";

            profileMessage.className =
                "settings-form-message";

        },
        5000
    );

}


/* =========================================================
   AFFICHER FORMULAIRE PASSWORD
========================================================= */

changePasswordButton.addEventListener(
    "click",
    () => {

        passwordFormContainer.classList.toggle(
            "hidden"
        );


        if (
            !passwordFormContainer.classList.contains(
                "hidden"
            )
        ) {

            currentPassword.focus();

        }

    }
);


/* =========================================================
   ANNULER PASSWORD
========================================================= */

cancelPasswordButton.addEventListener(
    "click",
    () => {

        passwordForm.reset();

        passwordFormContainer.classList.add(
            "hidden"
        );

        passwordMessage.textContent =
            "";

        passwordMessage.className =
            "settings-form-message";

    }
);


/* =========================================================
   CHANGER MOT DE PASSE
========================================================= */

passwordForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (!user || !user.email) {

            return;

        }


        const current =
            currentPassword.value;


        const newPass =
            newPassword.value;


        const confirmation =
            confirmPassword.value;


        if (
            newPass.length < 6
        ) {

            showPasswordMessage(
                "Le nouveau mot de passe doit contenir au moins 6 caractères.",
                "error"
            );

            return;

        }


        if (
            newPass !== confirmation
        ) {

            showPasswordMessage(
                "Les deux nouveaux mots de passe ne correspondent pas.",
                "error"
            );

            return;

        }


        savePasswordButton.disabled =
            true;


        savePasswordButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Modification...
        `;


        try {

            /*
             * Firebase demande généralement
             * une réauthentification avant
             * une opération sensible.
             */

            const credential =
                EmailAuthProvider.credential(
                    user.email,
                    current
                );


            await reauthenticateWithCredential(
                user,
                credential
            );


            await updatePassword(
                user,
                newPass
            );


            showPasswordMessage(
                "Votre mot de passe a été modifié avec succès.",
                "success"
            );


            passwordForm.reset();


            setTimeout(
                () => {

                    passwordFormContainer.classList.add(
                        "hidden"
                    );

                },
                2000
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — mot de passe :",
                error
            );


            showPasswordMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        } finally {

            savePasswordButton.disabled =
                false;


            savePasswordButton.innerHTML = `
                <i class="fa-solid fa-lock"></i>
                Modifier le mot de passe
            `;

        }

    }
);


/* =========================================================
   MESSAGE PASSWORD
========================================================= */

function showPasswordMessage(
    message,
    type
) {

    passwordMessage.textContent =
        message;


    passwordMessage.className =
        `settings-form-message ${type}`;

}


/* =========================================================
   RESET PASSWORD
========================================================= */

resetPasswordButton.addEventListener(
    "click",
    async () => {

        const user =
            auth.currentUser;


        if (
            !user
            ||
            !user.email
        ) {

            return;

        }


        resetPasswordButton.disabled =
            true;


        resetPasswordButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Envoi...
        `;


        try {

            await sendPasswordResetEmail(
                auth,
                user.email
            );


            showPasswordMessage(
                `Un lien de réinitialisation a été envoyé à ${user.email}.`,
                "success"
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — reset password :",
                error
            );


            showPasswordMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        } finally {

            resetPasswordButton.disabled =
                false;


            resetPasswordButton.innerHTML = `
                <i class="fa-solid fa-envelope"></i>
                Envoyer le lien
            `;

        }

    }
);


/* =========================================================
   DÉCONNEXION
========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            );


        if (!confirmed) {

            return;

        }


        logoutButton.disabled =
            true;


        logoutButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Déconnexion...
        `;


        try {

            await signOut(
                auth
            );


            window.location.href =
                "connexion.html";


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — déconnexion :",
                error
            );


            alert(
                "Impossible de vous déconnecter. Veuillez réessayer."
            );


            logoutButton.disabled =
                false;


            logoutButton.innerHTML = `
                <i class="fa-solid fa-right-from-bracket"></i>
                Se déconnecter
            `;

        }

    }
);


/* =========================================================
   LABEL TYPE COMPTE
========================================================= */

function getAccountTypeLabel(
    type
) {

    const value =
        normalizeText(
            type
        );


    const labels = {

        client:
            "Client",

        immobilier:
            "CAMU IMMO",

        commerce:
            "CAMU COMMERCE",

        vehicules:
            "Véhicules & Transport",

        hotels:
            "Hôtels & Hébergement"

    };


    return (
        labels[value]
        ||
        "Compte CAMU SERVICES"
    );

}


/* =========================================================
   LABEL STATUT
========================================================= */

function getAccountStatusLabel(
    status
) {

    const value =
        normalizeText(
            status
        );


    if (
        value === "pending"
    ) {

        return "En attente de validation";

    }


    if (
        value === "active"
    ) {

        return "Actif";

    }


    if (
        value === "suspended"
    ) {

        return "Suspendu";

    }


    return (
        status
        ||
        "Actif"
    );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "—";

    }


    let date;


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }

    else {

        date =
            new Date(timestamp);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(
        date
    );

}


/* =========================================================
   NORMALISATION
========================================================= */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


/* =========================================================
   ERREURS FIREBASE
========================================================= */

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/wrong-password":

            return "Le mot de passe actuel est incorrect.";


        case "auth/invalid-credential":

            return "Les identifiants fournis sont incorrects.";


        case "auth/weak-password":

            return "Le nouveau mot de passe est trop faible.";


        case "auth/requires-recent-login":

            return "Pour cette opération, veuillez vous reconnecter puis réessayer.";


        case "auth/too-many-requests":

            return "Trop de tentatives. Veuillez patienter avant de réessayer.";


        case "auth/network-request-failed":

            return "Problème de connexion Internet.";


        case "permission-denied":

            return "Vous n'avez pas l'autorisation de modifier ces informations.";


        default:

            return (
                error?.message
                ||
                "Une erreur est survenue. Veuillez réessayer."
            );

    }

}
