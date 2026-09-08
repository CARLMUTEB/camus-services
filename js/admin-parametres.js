/* =========================================================
   CAMU SERVICES
   ADMINISTRATION — PARAMÈTRES
========================================================= */

import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOCUMENT = "general";


/* =========================================================
   ÉLÉMENTS
========================================================= */

const form = document.getElementById("adminSettingsForm");

const saveSettingsButton =
    document.getElementById("saveSettingsButton");

const resetSettingsButton =
    document.getElementById("resetSettingsButton");

const settingsMessage =
    document.getElementById("settingsMessage");

const adminEmailDisplay =
    document.getElementById("adminEmailDisplay");

const adminMenuButton =
    document.getElementById("adminMenuButton");

const adminSidebar =
    document.getElementById("adminSidebar");

const adminSidebarClose =
    document.getElementById("adminSidebarClose");

const adminSidebarOverlay =
    document.getElementById("adminSidebarOverlay");

const adminLogoutButton =
    document.getElementById("adminLogoutButton");


/* =========================================================
   VALEURS PAR DÉFAUT
========================================================= */

const DEFAULT_SETTINGS = {

    siteName: "CAMU SERVICES",

    siteTagline: "Trouver • Acheter • Réserver",

    siteDescription:
        "CAMU SERVICES est une plateforme permettant de trouver, acheter et réserver des produits et services.",

    contactEmail: "",

    contactPhone: "",

    contactWhatsapp: "",

    contactCity: "Lubumbashi",

    allowAds: true,

    allowEditAds: true,

    allowReports: true,

    allowRegistration: true,

    publicProfiles: true,

    reportNotifications: true,

    newAdNotifications: true
};


/* =========================================================
   AUTHENTIFICATION ADMIN
========================================================= */

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href = "connexion.html";
        return;
    }

    if (
        user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        alert(
            "Accès réservé à l'administrateur CAMU SERVICES."
        );

        window.location.href = "index.html";
        return;
    }


    adminEmailDisplay.textContent =
        user.email || ADMIN_EMAIL;


    await loadSettings();
});


/* =========================================================
   CHARGER LES PARAMÈTRES
========================================================= */

async function loadSettings() {

    try {

        const settingsRef =
            doc(
                db,
                SETTINGS_COLLECTION,
                SETTINGS_DOCUMENT
            );

        const snapshot =
            await getDoc(settingsRef);


        let settings =
            { ...DEFAULT_SETTINGS };


        if (snapshot.exists()) {

            settings = {
                ...DEFAULT_SETTINGS,
                ...snapshot.data()
            };
        }


        fillForm(settings);

    } catch (error) {

        console.error(
            "Erreur chargement paramètres :",
            error
        );

        showMessage(
            "Impossible de charger les paramètres.",
            "error"
        );
    }
}


/* =========================================================
   REMPLIR LE FORMULAIRE
========================================================= */

function fillForm(settings) {

    setValue(
        "siteName",
        settings.siteName
    );

    setValue(
        "siteTagline",
        settings.siteTagline
    );

    setValue(
        "siteDescription",
        settings.siteDescription
    );

    setValue(
        "contactEmail",
        settings.contactEmail
    );

    setValue(
        "contactPhone",
        settings.contactPhone
    );

    setValue(
        "contactWhatsapp",
        settings.contactWhatsapp
    );

    setValue(
        "contactCity",
        settings.contactCity
    );


    setChecked(
        "allowAds",
        settings.allowAds
    );

    setChecked(
        "allowEditAds",
        settings.allowEditAds
    );

    setChecked(
        "allowReports",
        settings.allowReports
    );

    setChecked(
        "allowRegistration",
        settings.allowRegistration
    );

    setChecked(
        "publicProfiles",
        settings.publicProfiles
    );

    setChecked(
        "reportNotifications",
        settings.reportNotifications
    );

    setChecked(
        "newAdNotifications",
        settings.newAdNotifications
    );
}


/* =========================================================
   OUTILS FORMULAIRE
========================================================= */

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.value =
        value ?? "";
}


function setChecked(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.checked =
        Boolean(value);
}


/* =========================================================
   RÉCUPÉRER LES PARAMÈTRES
========================================================= */

function getFormSettings() {

    return {

        siteName:
            document.getElementById("siteName").value.trim(),

        siteTagline:
            document.getElementById("siteTagline").value.trim(),

        siteDescription:
            document.getElementById("siteDescription").value.trim(),

        contactEmail:
            document.getElementById("contactEmail").value.trim(),

        contactPhone:
            document.getElementById("contactPhone").value.trim(),

        contactWhatsapp:
            document.getElementById("contactWhatsapp").value.trim(),

        contactCity:
            document.getElementById("contactCity").value,

        allowAds:
            document.getElementById("allowAds").checked,

        allowEditAds:
            document.getElementById("allowEditAds").checked,

        allowReports:
            document.getElementById("allowReports").checked,

        allowRegistration:
            document.getElementById("allowRegistration").checked,

        publicProfiles:
            document.getElementById("publicProfiles").checked,

        reportNotifications:
            document.getElementById("reportNotifications").checked,

        newAdNotifications:
            document.getElementById("newAdNotifications").checked
    };
}


/* =========================================================
   ENREGISTRER
========================================================= */

form?.addEventListener("submit", async event => {

    event.preventDefault();

    await saveSettings();
});


saveSettingsButton?.addEventListener(
    "click",
    async () => {
        await saveSettings();
    }
);


async function saveSettings() {

    if (!auth.currentUser) {

        showMessage(
            "Vous devez être connecté.",
            "error"
        );

        return;
    }


    try {

        setSavingState(true);


        const settings =
            getFormSettings();


        const settingsRef =
            doc(
                db,
                SETTINGS_COLLECTION,
                SETTINGS_DOCUMENT
            );


        await setDoc(
            settingsRef,
            {
                ...settings,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    auth.currentUser.uid,

                updatedByEmail:
                    auth.currentUser.email || null
            },
            {
                merge: true
            }
        );


        showMessage(
            "Les paramètres ont été enregistrés avec succès.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur enregistrement paramètres :",
            error
        );

        showMessage(
            "Erreur lors de l'enregistrement des paramètres.",
            "error"
        );

    } finally {

        setSavingState(false);
    }
}


/* =========================================================
   ÉTAT BOUTON
========================================================= */

function setSavingState(isSaving) {

    if (!saveSettingsButton) return;


    saveSettingsButton.disabled =
        isSaving;


    if (isSaving) {

        saveSettingsButton.innerHTML =
            `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enregistrement...
            `;

    } else {

        saveSettingsButton.innerHTML =
            `
                <i class="fa-solid fa-floppy-disk"></i>
                Enregistrer
            `;
    }
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "success") {

    if (!settingsMessage) return;


    settingsMessage.textContent =
        message;

    settingsMessage.className =
        `admin-settings-message ${type}`;

    settingsMessage.hidden =
        false;


    window.clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        window.setTimeout(() => {

            settingsMessage.hidden =
                true;

        }, 4500);
}


/* =========================================================
   RÉINITIALISER
========================================================= */

resetSettingsButton?.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Voulez-vous vraiment réinitialiser les paramètres ?"
            );

        if (!confirmed) return;


        try {

            fillForm(
                DEFAULT_SETTINGS
            );


            await saveSettings();


            showMessage(
                "Les paramètres ont été réinitialisés.",
                "success"
            );

        } catch (error) {

            console.error(error);

            showMessage(
                "Impossible de réinitialiser les paramètres.",
                "error"
            );
        }
    }
);


/* =========================================================
   MENU MOBILE
========================================================= */

adminMenuButton?.addEventListener(
    "click",
    () => {

        adminSidebar?.classList.add(
            "open"
        );

        if (adminSidebarOverlay) {

            adminSidebarOverlay.hidden =
                false;
        }
    }
);


adminSidebarClose?.addEventListener(
    "click",
    closeAdminMenu
);


adminSidebarOverlay?.addEventListener(
    "click",
    closeAdminMenu
);


function closeAdminMenu() {

    adminSidebar?.classList.remove(
        "open"
    );

    if (adminSidebarOverlay) {

        adminSidebarOverlay.hidden =
            true;
    }
}


/* =========================================================
   FERMER MENU APRÈS CLIC
========================================================= */

document
    .querySelectorAll(".admin-sidebar a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeAdminMenu
        );
    });


/* =========================================================
   DÉCONNEXION
========================================================= */

adminLogoutButton?.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            );

        if (!confirmed) return;


        try {

            await signOut(auth);

            window.location.href =
                "connexion.html";

        } catch (error) {

            console.error(
                "Erreur déconnexion :",
                error
            );

            alert(
                "Impossible de se déconnecter."
            );
        }
    }
);
