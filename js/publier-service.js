/* =========================================================
   CAMU SERVICES — PUBLICATION D'UN SERVICE
   Fichier : js/publier-service.js

   Fonctionnalités :
   - Vérification utilisateur connecté
   - Validation du formulaire
   - Gestion du tarif
   - Compteur de description
   - Aperçu de l'image
   - Upload Firebase Storage
   - Création du document Firestore
   - Messages succès / erreur
   - Redirection vers la fiche du service
========================================================= */


import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   FIREBASE
========================================================= */

let auth = null;
let db = null;
let storage = null;

try {

    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas initialisé. Vérifie js/app.js."
        );
    }

    const app = getApp();

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

} catch (error) {

    console.error(
        "PUBLICATION SERVICE — Initialisation Firebase :",
        error
    );

}


/* =========================================================
   DOM
========================================================= */

const form =
    document.getElementById(
        "publishServiceForm"
    );

const submitButton =
    document.getElementById(
        "publishServiceButton"
    );

const authMessage =
    document.getElementById(
        "serviceAuthMessage"
    );

const authMessageText =
    document.getElementById(
        "serviceAuthMessageText"
    );

const successMessage =
    document.getElementById(
        "publishServiceSuccess"
    );

const errorMessage =
    document.getElementById(
        "publishServiceError"
    );

const errorMessageText =
    document.getElementById(
        "publishServiceErrorText"
    );


/* =========================================================
   CHAMPS FORMULAIRE
========================================================= */

const serviceTitle =
    document.getElementById(
        "serviceTitle"
    );

const serviceCategory =
    document.getElementById(
        "serviceCategory"
    );

const serviceCity =
    document.getElementById(
        "serviceCity"
    );

const serviceDescription =
    document.getElementById(
        "serviceDescription"
    );

const serviceDescriptionCounter =
    document.getElementById(
        "serviceDescriptionCounter"
    );

const servicePriceType =
    document.getElementById(
        "servicePriceType"
    );

const serviceCurrency =
    document.getElementById(
        "serviceCurrency"
    );

const servicePrice =
    document.getElementById(
        "servicePrice"
    );

const providerName =
    document.getElementById(
        "providerName"
    );

const providerPhone =
    document.getElementById(
        "providerPhone"
    );

const providerEmail =
    document.getElementById(
        "providerEmail"
    );

const providerWhatsapp =
    document.getElementById(
        "providerWhatsapp"
    );

const providerDescription =
    document.getElementById(
        "providerDescription"
    );

const serviceSkills =
    document.getElementById(
        "serviceSkills"
    );

const serviceImage =
    document.getElementById(
        "serviceImage"
    );

const serviceImagePreview =
    document.getElementById(
        "serviceImagePreview"
    );

const serviceImagePreviewImg =
    document.getElementById(
        "serviceImagePreviewImg"
    );

const serviceTerms =
    document.getElementById(
        "serviceTerms"
    );


/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;


/* =========================================================
   CONSTANTES
========================================================= */

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* =========================================================
   UTILITAIRES
========================================================= */

function normalizeText(value) {

    return String(value || "")
        .trim();

}


function normalizeArray(value) {

    if (!value) {
        return [];
    }

    return String(value)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   EMAIL
========================================================= */

function isValidEmail(value) {

    if (!value) {
        return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value
    );

}


/* =========================================================
   AFFICHAGE MESSAGES
========================================================= */

function showSuccess(message) {

    hideError();

    if (!successMessage) {
        return;
    }

    successMessage.style.display = "flex";

    const paragraph =
        successMessage.querySelector("p");

    if (paragraph) {
        paragraph.textContent = message;
    }

    successMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function showError(message) {

    if (!errorMessage) {
        return;
    }

    errorMessage.style.display = "flex";

    if (errorMessageText) {
        errorMessageText.textContent = message;
    }

    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function hideError() {

    if (errorMessage) {
        errorMessage.style.display = "none";
    }

}


function hideSuccess() {

    if (successMessage) {
        successMessage.style.display = "none";
    }

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(message) {

    if (authMessage) {
        authMessage.style.display = "flex";
    }

    if (authMessageText) {
        authMessageText.textContent = message;
    }

}


function hideAuthMessage() {

    if (authMessage) {
        authMessage.style.display = "none";
    }

}


/* =========================================================
   BOUTON ENVOI
========================================================= */

function setSubmitting(submitting) {

    if (!submitButton) {
        return;
    }

    submitButton.disabled =
        submitting;

    if (submitting) {

        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Publication...</span>
        `;

    } else {

        submitButton.innerHTML = `
            <i class="fa-solid fa-paper-plane"></i>
            <span>Publier le service</span>
        `;

    }

}


/* =========================================================
   VALIDATION CSS
========================================================= */

function markInvalid(element) {

    if (!element) {
        return;
    }

    const field =
        element.closest(
            ".publish-service-field"
        );

    if (field) {
        field.classList.add(
            "invalid"
        );
    }

}


function clearInvalid(element) {

    if (!element) {
        return;
    }

    const field =
        element.closest(
            ".publish-service-field"
        );

    if (field) {
        field.classList.remove(
            "invalid"
        );
    }

}


function clearAllInvalid() {

    document
        .querySelectorAll(
            ".publish-service-field.invalid"
        )
        .forEach(
            field => {
                field.classList.remove(
                    "invalid"
                );
            }
        );

}


/* =========================================================
   VALIDATION FORMULAIRE
========================================================= */

function validateForm() {

    clearAllInvalid();


    const title =
        normalizeText(
            serviceTitle?.value
        );

    const category =
        normalizeText(
            serviceCategory?.value
        );

    const city =
        normalizeText(
            serviceCity?.value
        );

    const description =
        normalizeText(
            serviceDescription?.value
        );

    const provider =
        normalizeText(
            providerName?.value
        );


    /* -----------------------------------------
       TITRE
    ----------------------------------------- */

    if (!title) {

        markInvalid(serviceTitle);

        showError(
            "Veuillez renseigner le nom du service."
        );

        serviceTitle?.focus();

        return false;

    }


    /* -----------------------------------------
       CATÉGORIE
    ----------------------------------------- */

    if (!category) {

        markInvalid(serviceCategory);

        showError(
            "Veuillez sélectionner une catégorie."
        );

        serviceCategory?.focus();

        return false;

    }


    /* -----------------------------------------
       VILLE
    ----------------------------------------- */

    if (!city) {

        markInvalid(serviceCity);

        showError(
            "Veuillez renseigner la ville."
        );

        serviceCity?.focus();

        return false;

    }


    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

    if (!description) {

        markInvalid(serviceDescription);

        showError(
            "Veuillez renseigner la description du service."
        );

        serviceDescription?.focus();

        return false;

    }


    if (description.length < 30) {

        markInvalid(serviceDescription);

        showError(
            "La description doit contenir au moins 30 caractères."
        );

        serviceDescription?.focus();

        return false;

    }


    /* -----------------------------------------
       PRESTATAIRE
    ----------------------------------------- */

    if (!provider) {

        markInvalid(providerName);

        showError(
            "Veuillez renseigner le nom du prestataire."
        );

        providerName?.focus();

        return false;

    }


    /* -----------------------------------------
       EMAIL
    ----------------------------------------- */

    const email =
        normalizeText(
            providerEmail?.value
        );


    if (
        email &&
        !isValidEmail(email)
    ) {

        markInvalid(providerEmail);

        showError(
            "L'adresse email n'est pas valide."
        );

        providerEmail?.focus();

        return false;

    }


    /* -----------------------------------------
       TARIF
    ----------------------------------------- */

    const selectedPriceType =
        servicePriceType?.value ||
        "negociable";


    if (
        [
            "fixe",
            "heure",
            "jour",
            "mois"
        ].includes(
            selectedPriceType
        )
    ) {

        const price =
            Number(
                servicePrice?.value
            );


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            markInvalid(servicePrice);

            showError(
                "Veuillez renseigner un tarif valide."
            );

            servicePrice?.focus();

            return false;

        }

    }


    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    if (
        serviceImage?.files?.length
    ) {

        const file =
            serviceImage.files[0];


        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            showError(
                "L'image doit être au format JPG, PNG ou WEBP."
            );

            serviceImage.focus();

            return false;

        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            showError(
                "L'image ne doit pas dépasser 5 Mo."
            );

            serviceImage.focus();

            return false;

        }

    }


    /* -----------------------------------------
       CONDITIONS
    ----------------------------------------- */

    if (
        serviceTerms &&
        !serviceTerms.checked
    ) {

        showError(
            "Vous devez accepter les règles de publication."
        );

        serviceTerms.focus();

        return false;

    }


    return true;

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function updateDescriptionCounter() {

    if (
        !serviceDescription ||
        !serviceDescriptionCounter
    ) {
        return;
    }

    serviceDescriptionCounter.textContent =
        serviceDescription.value.length;

}


/* =========================================================
   APERÇU IMAGE
========================================================= */

function showImagePreview(file) {

    if (
        !file ||
        !serviceImagePreview ||
        !serviceImagePreviewImg
    ) {
        return;
    }


    const objectUrl =
        URL.createObjectURL(
            file
        );


    serviceImagePreviewImg.src =
        objectUrl;


    serviceImagePreview.style.display =
        "block";


    serviceImagePreviewImg.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


function clearImagePreview() {

    if (serviceImagePreview) {
        serviceImagePreview.style.display =
            "none";
    }

    if (serviceImagePreviewImg) {
        serviceImagePreviewImg.src = "";
    }

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadServiceImage(
    file,
    user
) {

    if (
        !file ||
        !storage
    ) {
        return "";
    }


    const safeName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    const fileName =
        `${Date.now()}_${safeName}`;


    const storagePath =
        `service-images/${user.uid}/${fileName}`;


    const storageReference =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageReference,
        file,
        {
            contentType:
                file.type
        }
    );


    return await getDownloadURL(
        storageReference
    );

}


/* =========================================================
   DONNÉES DU FORMULAIRE
========================================================= */

function collectFormData() {

    const priceType =
        normalizeText(
            servicePriceType?.value
        ) ||
        "negociable";


    let price = null;


    if (
        [
            "fixe",
            "heure",
            "jour",
            "mois"
        ].includes(
            priceType
        )
    ) {

        price =
            Number(
                servicePrice?.value
            );

    }


    return {

        title:
            normalizeText(
                serviceTitle?.value
            ),

        category:
            normalizeText(
                serviceCategory?.value
            ),

        city:
            normalizeText(
                serviceCity?.value
            ),

        description:
            normalizeText(
                serviceDescription?.value
            ),

        priceType:
            priceType,

        price:
            price,

        currency:
            normalizeText(
                serviceCurrency?.value
            ) ||
            "USD",

        providerName:
            normalizeText(
                providerName?.value
            ),

        phone:
            normalizeText(
                providerPhone?.value
            ),

        email:
            normalizeText(
                providerEmail?.value
            ),

        whatsapp:
            normalizeText(
                providerWhatsapp?.value
            ),

        providerDescription:
            normalizeText(
                providerDescription?.value
            ),

        skills:
            normalizeArray(
                serviceSkills?.value
            )

    };

}


/* =========================================================
   PUBLICATION FIRESTORE
========================================================= */

async function publishService() {

    if (!db) {

        throw new Error(
            "Firestore n'est pas disponible."
        );

    }


    if (!currentUser)
