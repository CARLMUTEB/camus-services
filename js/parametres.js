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
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail,
    signOut,
    deleteUser
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

const darkModeToggle =
    document.getElementById("darkModeToggle");

const notificationsToggle =
    document.getElementById("notificationsToggle");

const notificationMessage =
    document.getElementById("notificationMessage");

const changePasswordButton =
    document.getElementById("changePasswordButton");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const passwordFormContainer =
    document.getElementById("passwordFormContainer");

const passwordForm =
    document.getElementById("passwordForm");

const currentPassword =
    document.getElementById("currentPassword");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const savePasswordButton =
    document.getElementById("savePasswordButton");

const cancelPasswordButton =
    document.getElementById("cancelPasswordButton");

const passwordMessage =
    document.getElementById("passwordMessage");

const accountType =
    document.getElementById("accountType");

const accountStatus =
    document.getElementById("accountStatus");

const accountCreated =
    document.getElementById("accountCreated");

const logoutButton =
    document.getElementById("logoutButton");

const deleteAccountButton =
    document.getElementById("deleteAccountButton");

const deleteAccountModal =
    document.getElementById("deleteAccountModal");

const deleteAccountPassword =
    document.getElementById(
        "deleteAccountPassword"
    );

const deleteAccountMessage =
    document.getElementById(
        "deleteAccountMessage"
    );

const cancelDeleteButton =
    document.getElementById(
        "cancelDeleteButton"
    );

const confirmDeleteButton =
    document.getElementById(
        "confirmDeleteButton"
    );

const settingsYear =
    document.getElementById("settingsYear");


/* =========================================================
   ANNÉE
========================================================= */

settingsYear.textContent =
    new Date().getFullYear();


/* =========================================================
   MODE SOMBRE
========================================================= */

function loadDarkMode() {

    const saved =
        localStorage.getItem(
            "camu_dark_mode"
        );


    const enabled =
        saved === "true";


    document.body.classList.toggle(
        "dark-mode",
        enabled
    );


    darkModeToggle.checked =
        enabled;

}


loadDarkMode();


darkModeToggle.addEventListener(
    "change",
    () => {

        const enabled =
            darkModeToggle.checked;


        document.body.classList.toggle(
            "dark-mode",
            enabled
        );


        localStorage.setItem(
            "camu_dark_mode",
            String(enabled)
        );

    }
);


/* =========================================================
   NOTIFICATIONS
========================================================= */

function loadNotificationPreference() {

    const saved =
        localStorage.getItem(
            "camu_notifications"
        );


    /*
     * Par défaut : activées.
     */

    const enabled =
        saved === null
            ? true
            : saved === "true";


    notificationsToggle.checked =
        enabled;

}


loadNotificationPreference();


notificationsToggle.addEventListener(
    "change",
    async () => {

        const enabled =
            notificationsToggle.checked;


        if (
            !enabled
        ) {

            localStorage.setItem(
                "camu_notifications",
                "false"
            );


            showNotificationMessage(
                "Les notifications sont désactivées sur cet appareil.",
                "success"
            );

            return;

        }


        /*
         * Vérifier si le navigateur
         * supporte les notifications.
         */

        if (
            !("Notification" in window)
        ) {

            notificationsToggle.checked =
                false;


            localStorage.setItem(
                "camu_notifications",
                "false"
            );


            showNotificationMessage(
                "Votre navigateur ne prend pas en charge les notifications.",
                "error"
            );

            return;

        }


        try {

            let permission =
                Notification.permission;


            if (
                permission === "default"
            ) {

                permission =
                    await Notification.requestPermission();

            }


            if (
                permission === "granted"
            ) {

                localStorage.setItem(
                    "camu_notifications",
                    "true"
                );


                showNotificationMessage(
                    "Les notifications sont activées.",
                    "success"
                );

            }

            else {

                notificationsToggle.checked =
                    false;


                localStorage.setItem(
                    "camu_notifications",
                    "false"
                );


                showNotificationMessage(
                    "L'autorisation des notifications a été refusée.",
                    "error"
                );

            }


        } catch (error) {

            console.error(
                "CAMU NOTIFICATIONS :",
                error
            );


            notificationsToggle.checked =
                false;


            showNotificationMessage(
                "Impossible d'activer les notifications.",
                "error"
            );

        }

    }
);


/* =========================================================
   MESSAGE NOTIFICATIONS
========================================================= */

function showNotificationMessage(
    message,
    type
) {

    notificationMessage.textContent =
        message;


    notificationMessage.className =
        `settings-form-message ${type}`;


    setTimeout(
        () => {

            notificationMessage.textContent =
                "";

            notificationMessage.className =
                "settings-form-message";

        },
        5000
    );

}


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
   LOGIN
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
   CONTENT
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
   CHARGER COMPTE
========================================================= */

async function loadAccount(
    user
) {

    try {

        await loadCities();


        settingsEmail.value =
            user.email || "";


        settingsName.value =
            user.displayName || "";


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
            "CAMU PARAMÈTRES — compte :",
            error
        );


        showProfileMessage(
            "Impossible de charger toutes les informations.",
            "error"
        );

    }

}


/* =========================================================
   VILLE
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
   PROFIL
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

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


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
                "Vos informations ont été enregistrées.",
                "success"
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — profil :",
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
                Enregistrer
            `;

        }

    }
);


/* =========================================================
   PASSWORD — AFFICHER
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
   PASSWORD — ANNULER
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

    }
);


/* =========================================================
   PASSWORD — MODIFIER
========================================================= */

passwordForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (
            !user
            ||
            !user.email
        ) {

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
                "Les deux mots de passe ne correspondent pas.",
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
                "Votre mot de passe a été modifié.",
                "success"
            );


            passwordForm.reset();


            setTimeout(
                () => {

                    passwordFormContainer.classList.add(
                        "hidden"
                    );

                },
                1800
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — password :",
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
                Modifier
            `;

        }

    }
);


/* =========================================================
   PASSWORD MESSAGE
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
                `Le lien a été envoyé à ${user.email}.`,
                "success"
            );


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — reset :",
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

        if (
            !confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            )
        ) {

            return;

        }


        try {

            await signOut(
                auth
            );


            window.location.href =
                "connexion.html";


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — logout :",
                error
            );


            alert(
                "Impossible de vous déconnecter."
            );

        }

    }
);


/* =========================================================
   SUPPRESSION — OUVRIR MODAL
========================================================= */

deleteAccountButton.addEventListener(
    "click",
    () => {

        deleteAccountPassword.value =
            "";

        deleteAccountMessage.textContent =
            "";

        deleteAccountModal.classList.remove(
            "hidden"
        );

        setTimeout(
            () => {

                deleteAccountPassword.focus();

            },
            100
        );

    }
);


/* =========================================================
   SUPPRESSION — ANNULER
========================================================= */

cancelDeleteButton.addEventListener(
    "click",
    closeDeleteModal
);


deleteAccountModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            deleteAccountModal
        ) {

            closeDeleteModal();

        }

    }
);


function closeDeleteModal() {

    deleteAccountModal.classList.add(
        "hidden"
    );

    deleteAccountPassword.value =
        "";

    deleteAccountMessage.textContent =
        "";

}


/* =========================================================
   SUPPRESSION DU COMPTE
========================================================= */

confirmDeleteButton.addEventListener(
    "click",
    async () => {

        const user =
            auth.currentUser;


        if (
            !user
        ) {

            return;

        }


        const password =
            deleteAccountPassword.value;


        if (
            !password
        ) {

            deleteAccountMessage.textContent =
                "Veuillez saisir votre mot de passe.";

            return;

        }


        if (
            !user.email
        ) {

            deleteAccountMessage.textContent =
                "Impossible de vérifier ce compte.";

            return;

        }


        confirmDeleteButton.disabled =
            true;


        cancelDeleteButton.disabled =
            true;


        confirmDeleteButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Suppression...
        `;


        try {

            /*
             * 1. Réauthentification
             */

            const credential =
                EmailAuthProvider.credential(
                    user.email,
                    password
                );


            await reauthenticateWithCredential(
                user,
                credential
            );


            /*
             * 2. Supprimer le profil Firestore
             */

            await deleteDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


            /*
             * 3. Supprimer le compte Firebase Auth
             */

            await deleteUser(
                user
            );


            /*
             * 4. Nettoyage local
             */

            localStorage.removeItem(
                "camu_dark_mode"
            );

            localStorage.removeItem(
                "camu_notifications"
            );


            /*
             * 5. Retour connexion
             */

            window.location.href =
                "connexion.html";


        } catch (error) {

            console.error(
                "CAMU PARAMÈTRES — suppression compte :",
                error
            );


            /*
             * Si la suppression Firestore
             * a réussi mais que deleteUser()
             * échoue, le compte Auth peut
             * encore exister.
             */

            deleteAccountMessage.textContent =
                getFirebaseErrorMessage(
                    error
                );


            confirmDeleteButton.disabled =
                false;

            cancelDeleteButton.disabled =
                false;


            confirmDeleteButton.innerHTML = `
                <i class="fa-solid fa-trash"></i>
                Supprimer définitivement
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

            return "Le mot de passe est incorrect.";


        case "auth/invalid-credential":

            return "Le mot de passe ou les identifiants sont incorrects.";


        case "auth/weak-password":

            return "Le mot de passe est trop faible.";


        case "auth/requires-recent-login":

            return "Veuillez vous reconnecter puis réessayer.";


        case "auth/too-many-requests":

            return "Trop de tentatives. Veuillez patienter avant de réessayer.";


        case "auth/network-request-failed":

            return "Problème de connexion Internet.";


        case "permission-denied":

            return "Vous n'avez pas l'autorisation d'effectuer cette action.";


        default:

            return (
                error?.message
                ||
                "Une erreur est survenue. Veuillez réessayer."
            );

    }

}
