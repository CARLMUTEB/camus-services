/* =========================================================
   CAMU SERVICES — PUBLICATION D'UNE OFFRE JOB
   Fichier : js/publier-job.js

   Fonctionnalités :
   - Authentification Firebase
   - Validation du formulaire
   - Aperçu image
   - Upload image Firebase Storage
   - Création offre Firestore
   - Gestion salaire
   - Gestion compétences
   - Messages succès / erreur
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

let app = null;
let auth = null;
let db = null;
let storage = null;

try {

    if (!getApps().length) {

        throw new Error(
            "Firebase n'est pas initialisé. Vérifie js/app.js."
        );

    }


    app = getApp();

    auth = getAuth(app);

    db = getFirestore(app);

    storage = getStorage(app);


} catch (error) {

    console.error(
        "PUBLICATION JOB — Initialisation Firebase :",
        error
    );

}


/* =========================================================
   ÉLÉMENTS DOM
========================================================= */

const form =
    document.getElementById(
        "publishJobForm"
    );


const submitButton =
    document.getElementById(
        "publishJobButton"
    );


const submitButtonText =
    submitButton?.querySelector(
        "span"
    );


const authMessage =
    document.getElementById(
        "authMessage"
    );


const authMessageText =
    document.getElementById(
        "authMessageText"
    );


const successMessage =
    document.getElementById(
        "publishJobSuccess"
    );


const errorMessage =
    document.getElementById(
        "publishJobError"
    );


const errorMessageText =
    document.getElementById(
        "publishJobErrorText"
    );


/* ---------------------------------------------------------
   CHAMPS
--------------------------------------------------------- */

const jobTitle =
    document.getElementById(
        "jobTitle"
    );


const jobCategory =
    document.getElementById(
        "jobCategory"
    );


const jobContract =
    document.getElementById(
        "jobContract"
    );


const jobExperience =
    document.getElementById(
        "jobExperience"
    );


const jobCity =
    document.getElementById(
        "jobCity"
    );


const jobDescription =
    document.getElementById(
        "jobDescription"
    );


const jobSkills =
    document.getElementById(
        "jobSkills"
    );


const jobRequirements =
    document.getElementById(
        "jobRequirements"
    );


const salaryType =
    document.getElementById(
        "salaryType"
    );


const jobCurrency =
    document.getElementById(
        "jobCurrency"
    );


const salaryMin =
    document.getElementById(
        "salaryMin"
    );


const salaryMax =
    document.getElementById(
        "salaryMax"
    );


const jobSalary =
    document.getElementById(
        "jobSalary"
    );


const companyName =
    document.getElementById(
        "companyName"
    );


const companyPhone =
    document.getElementById(
        "companyPhone"
    );


const companyEmail =
    document.getElementById(
        "companyEmail"
    );


const applicationLink =
    document.getElementById(
        "applicationLink"
    );


const companyDescription =
    document.getElementById(
        "companyDescription"
    );


const jobBenefits =
    document.getElementById(
        "jobBenefits"
    );


const companyImage =
    document.getElementById(
        "companyImage"
    );


const imagePreview =
    document.getElementById(
        "imagePreview"
    );


const imagePreviewImg =
    document.getElementById(
        "imagePreviewImg"
    );


const jobTerms =
    document.getElementById(
        "jobTerms"
    );


const descriptionCounter =
    document.getElementById(
        "descriptionCounter"
    );


const salaryMinField =
    document.getElementById(
        "salaryMinField"
    );


const salaryMaxField =
    document.getElementById(
        "salaryMaxField"
    );


const salaryDirectField =
    document.getElementById(
        "salaryDirectField"
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

function showAuthMessage(
    message
) {

    if (authMessage) {

        authMessage.style.display =
            "flex";

    }


    if (authMessageText) {

        authMessageText.textContent =
            message;

    }

}


function hideAuthMessage() {

    if (authMessage) {

        authMessage.style.display =
            "none";

    }

}


/* ---------------------------------------------------------
   SUCCÈS
--------------------------------------------------------- */

function showSuccess(
    message
) {

    hideError();


    if (successMessage) {

        successMessage.style.display =
            "flex";


        const paragraph =
            successMessage.querySelector(
                "p"
            );


        if (paragraph) {

            paragraph.textContent =
                message;

        }

    }


    successMessage?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* ---------------------------------------------------------
   ERREUR
--------------------------------------------------------- */

function showError(
    message
) {

    if (errorMessage) {

        errorMessage.style.display =
            "flex";

    }


    if (errorMessageText) {

        errorMessageText.textContent =
            message;

    }


    errorMessage?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function hideError() {

    if (errorMessage) {

        errorMessage.style.display =
            "none";

    }

}


function hideSuccess() {

    if (successMessage) {

        successMessage.style.display =
            "none";

    }

}


/* =========================================================
   BOUTON
========================================================= */

function setSubmitting(
    submitting
) {

    if (!submitButton) {
        return;
    }


    submitButton.disabled =
        submitting;


    if (submitting) {

        submitButtonText &&
            (
                submitButtonText.textContent =
                    "Publication..."
            );


        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Publication...</span>
        `;

    } else {

        submitButton.innerHTML = `
            <i class="fa-solid fa-paper-plane"></i>
            <span>Publier l'offre</span>
        `;

    }

}


/* =========================================================
   NORMALISATION
========================================================= */

function normalizeText(
    value
) {

    return String(value || "")
        .trim();

}


function normalizeArray(
    value
) {

    if (!value) {
        return [];
    }


    return String(value)
        .split(",")
        .map(item =>
            item.trim()
        )
        .filter(Boolean);

}


/* =========================================================
   EMAIL
========================================================= */

function isValidEmail(
    value
) {

    if (!value) {
        return true;
    }


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);

}


/* =========================================================
   URL
========================================================= */

function isValidUrl(
    value
) {

    if (!value) {
        return true;
    }


    try {

        const url =
            new URL(value);


        return [
            "http:",
            "https:"
        ].includes(
            url.protocol
        );

    } catch {

        return false;

    }

}


/* =========================================================
   VALIDATION
========================================================= */

function markInvalid(
    element
) {

    if (!element) {
        return;
    }


    const field =
        element.closest(
            ".publish-job-field"
        );


    if (field) {

        field.classList.add(
            "invalid"
        );

    }

}


function clearInvalidFields() {

    document
        .querySelectorAll(
            ".publish-job-field.invalid"
        )
        .forEach(field => {

            field.classList.remove(
                "invalid"
            );

        });

}


function validateForm() {

    clearInvalidFields();


    const title =
        normalizeText(
            jobTitle?.value
        );


    const category =
        normalizeText(
            jobCategory?.value
        );


    const contract =
        normalizeText(
            jobContract?.value
        );


    const city =
        normalizeText(
            jobCity?.value
        );


    const description =
        normalizeText(
            jobDescription?.value
        );


    const company =
        normalizeText(
            companyName?.value
        );


    if (!title) {

        markInvalid(jobTitle);

        showError(
            "Veuillez renseigner l'intitulé du poste."
        );

        jobTitle?.focus();

        return false;

    }


    if (!category) {

        markInvalid(jobCategory);

        showError(
            "Veuillez sélectionner un domaine."
        );

        jobCategory?.focus();

        return false;

    }


    if (!contract) {

        markInvalid(jobContract);

        showError(
            "Veuillez sélectionner le type de contrat."
        );

        jobContract?.focus();

        return false;

    }


    if (!city) {

        markInvalid(jobCity);

        showError(
            "Veuillez renseigner la ville."
        );

        jobCity?.focus();

        return false;

    }


    if (!description) {

        markInvalid(jobDescription);

        showError(
            "Veuillez renseigner la description du poste."
        );

        jobDescription?.focus();

        return false;

    }


    if (description.length < 30) {

        markInvalid(jobDescription);

        showError(
            "La description du poste doit contenir au moins 30 caractères."
        );

        jobDescription?.focus();

        return false;

    }


    if (!company) {

        markInvalid(companyName);

        showError(
            "Veuillez renseigner le nom de l'entreprise."
        );

        companyName?.focus();

        return false;

    }


    const email =
        normalizeText(
            companyEmail?.value
        );


    if (
        email &&
        !isValidEmail(email)
    ) {

        markInvalid(companyEmail);

        showError(
            "L'adresse email de candidature n'est pas valide."
        );

        companyEmail?.focus();

        return false;

    }


    const link =
        normalizeText(
            applicationLink?.value
        );


    if (
        link &&
        !isValidUrl(link)
    ) {

        markInvalid(applicationLink);

        showError(
            "Le lien de candidature doit commencer par http:// ou https://."
        );

        applicationLink?.focus();

        return false;

    }


    /* -------------------------------------------------------
       SALAIRE
    ------------------------------------------------------- */

    const selectedSalaryType =
        salaryType?.value ||
        "negociable";


    if (
        selectedSalaryType === "intervalle"
    ) {

        const min =
            parseFloat(
                salaryMin?.value
            );


        const max =
            parseFloat(
                salaryMax?.value
            );


        if (
            !Number.isFinite(min) ||
            min < 0
        ) {

            markInvalid(salaryMin);

            showError(
                "Veuillez renseigner un salaire minimum valide."
            );

            salaryMin?.focus();

            return false;

        }


        if (
            !Number.isFinite(max) ||
            max < 0
        ) {

            markInvalid(salaryMax);

            showError(
                "Veuillez renseigner un salaire maximum valide."
            );

            salaryMax?.focus();

            return false;

        }


        if (max < min) {

            markInvalid(salaryMin);
            markInvalid(salaryMax);

            showError(
                "Le salaire maximum doit être supérieur ou égal au salaire minimum."
            );

            return false;

        }

    }


    if (
        selectedSalaryType === "fixe"
    ) {

        const directSalary =
            normalizeText(
                jobSalary?.value
            );


        if (!directSalary) {

            markInvalid(jobSalary);

            showError(
                "Veuillez renseigner le salaire proposé."
            );

            jobSalary?.focus();

            return false;

        }

    }


    /* -------------------------------------------------------
       CONDITIONS
    ------------------------------------------------------- */

    if (
        jobTerms &&
        !jobTerms.checked
    ) {

        showError(
            "Vous devez accepter les règles de publication."
        );

        jobTerms.focus();

        return false;

    }


    /* -------------------------------------------------------
       IMAGE
    ------------------------------------------------------- */

    if (companyImage?.files?.length) {

        const file =
            companyImage.files[0];


        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            showError(
                "L'image doit être au format JPG, PNG ou WEBP."
            );

            companyImage.focus();

            return false;

        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            showError(
                "L'image ne doit pas dépasser 5 Mo."
            );

            companyImage.focus();

            return false;

        }

    }


    return true;

}


/* =========================================================
   GESTION DU SALAIRE
========================================================= */

function updateSalaryFields() {

    const type =
        salaryType?.value ||
        "negociable";


    if (
        salaryMinField
    ) {

        salaryMinField.style.display =
            type === "intervalle"
                ? ""
                : "none";

    }


    if (
        salaryMaxField
    ) {

        salaryMaxField.style.display =
            type === "intervalle"
                ? ""
                : "none";

    }


    if (
        salaryDirectField
    ) {

        salaryDirectField.style.display =
            type === "fixe"
                ? ""
                : "none";

    }


    if (
        type !== "intervalle"
    ) {

        if (salaryMin) {
            salaryMin.value = "";
        }

        if (salaryMax) {
            salaryMax.value = "";
        }

    }


    if (
        type !== "fixe"
    ) {

        if (jobSalary) {
            jobSalary.value = "";
        }

    }

}


/* =========================================================
   COMPTEUR DESCRIPTION
========================================================= */

function updateDescriptionCounter() {

    if (
        !descriptionCounter ||
        !jobDescription
    ) {
        return;
    }


    descriptionCounter.textContent =
        jobDescription.value.length;

}


/* =========================================================
   APERÇU IMAGE
========================================================= */

function previewImage(
    file
) {

    if (
        !file ||
        !imagePreview ||
        !imagePreviewImg
    ) {
        return;
    }


    const objectUrl =
        URL.createObjectURL(
            file
        );


    imagePreviewImg.src =
        objectUrl;


    imagePreview.style.display =
        "block";


    imagePreviewImg.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


function clearImagePreview() {

    if (imagePreview) {

        imagePreview.style.display =
            "none";

    }


    if (imagePreviewImg) {

        imagePreviewImg.src =
            "";

    }

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadCompanyImage(
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
        `job-images/${user.uid}/${fileName}`;


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


    const downloadUrl =
        await getDownloadURL(
            storageReference
        );


    return downloadUrl;

}


/* =========================================================
   DONNÉES DU FORMULAIRE
========================================================= */

function collectFormData() {

    const salarySelectedType =
        salaryType?.value ||
        "negociable";


    let salaryValue =
        "";


    let salaryMinValue =
        null;


    let salaryMaxValue =
        null;


    if (
        salarySelectedType === "fixe"
    ) {

        salaryValue =
            normalizeText(
                jobSalary?.value
            );

    }


    if (
        salarySelectedType === "intervalle"
    ) {

        salaryMinValue =
            Number(
                salaryMin.value
            );


        salaryMaxValue =
            Number(
                salaryMax.value
            );

    }


    const skillsArray =
        normalizeArray(
            jobSkills?.value
        );


    return {

        title:
            normalizeText(
                jobTitle?.value
            ),

        category:
            normalizeText(
                jobCategory?.value
            ),

        contractType:
            normalizeText(
                jobContract?.value
            ),

        experience:
            normalizeText(
                jobExperience?.value
            ),

        city:
            normalizeText(
                jobCity?.value
            ),

        description:
            normalizeText(
                jobDescription?.value
            ),

        skills:
            skillsArray,

        requirements:
            normalizeText(
                jobRequirements?.value
            ),

        salaryType:
            salarySelectedType,

        salary:
            salaryValue,

        salaryMin:
            salaryMinValue,

        salaryMax:
            salaryMaxValue,

        currency:
            normalizeText(
                jobCurrency?.value
            ),

        company:
            normalizeText(
                companyName?.value
            ),

        phone:
            normalizeText(
                companyPhone?.value
            ),

        email:
            normalizeText(
                companyEmail?.value
            ),

        applicationLink:
            normalizeText(
                applicationLink?.value
            ),

        companyDescription:
            normalizeText(
                companyDescription?.value
            ),

        benefits:
            normalizeText(
                jobBenefits?.value
            )

    };

}


/* =========================================================
   PUBLICATION FIRESTORE
========================================================= */

async function publishJob() {

    if (!db) {

        throw new Error(
            "Firestore n'est pas disponible."
        );

    }


    if (!currentUser) {

        throw new Error(
            "Vous devez être connecté pour publier une offre."
        );

    }


    const formData =
        collectFormData();


    let imageUrl =
        "";


    /* -------------------------------------------------------
       IMAGE
    ------------------------------------------------------- */

    if (
        companyImage?.files?.length
    ) {

        const file =
            companyImage.files[0];


        imageUrl =
            await uploadCompanyImage(
                file,
                currentUser
            );

    }


    /* -------------------------------------------------------
       DOCUMENT FIRESTORE
    ------------------------------------------------------- */

    const jobData = {

        /* Offre */

        title:
            formData.title,

        category:
            formData.category,

        contractType:
            formData.contractType,

        experience:
            formData.experience,

        city:
            formData.city,

        description:
            formData.description,

        skills:
            formData.skills,

        requirements:
            formData.requirements,

        /* Salaire */

        salaryType:
            formData.salaryType,

        salary:
            formData.salary,

        salaryMin:
            formData.salaryMin,

        salaryMax:
            formData.salaryMax,

        currency:
            formData.currency,

        /* Entreprise */

        company:
            formData.company,

        companyDescription:
            formData.companyDescription,

        phone:
            formData.phone,

        email:
            formData.email,

        applicationLink:
            formData.applicationLink,

        /* Avantages */

        benefits:
            formData.benefits,

        /* Image */

        image:
            imageUrl,

        /* Propriétaire */

        userId:
            currentUser.uid,

        recruiterEmail:
            currentUser.email || "",

        /* Statut */

        status:
            "active",

        /* Dates */

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()

    };


    const jobReference =
        await addDoc(
            collection(
                db,
                "jobs"
            ),
            jobData
        );


    return jobReference.id;

}


/* =========================================================
   SOUMISSION
========================================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();


    hideError();
    hideSuccess();


    /* -------------------------------------------------------
       Auth
    ------------------------------------------------------- */

    if (!currentUser) {

        showError(
            "Vous devez être connecté pour publier une offre."
        );

        return;

    }


    /* -------------------------------------------------------
       Validation
    ------------------------------------------------------- */

    if (!validateForm()) {
        return;
    }


    setSubmitting(true);


    try {

        const jobId =
            await publishJob();


        showSuccess(
            "Votre offre a été publiée avec succès."
        );


        /*
         * On désactive le formulaire après succès.
         */

        const fields =
            form.querySelectorAll(
                "input, select, textarea, button"
            );


        fields.forEach(
            field => {

                if (
                    field !== submitButton
                ) {

                    field.disabled =
                        true;

                }

            }
        );


        /*
         * Redirection vers la fiche de l'offre.
         *
         * Petit délai pour laisser voir le message
         * de confirmation.
         */

        setTimeout(
            () => {

                window.location.href =
                    `job-details.html?id=${encodeURIComponent(jobId)}`;

            },
            1500
        );


    } catch (error) {

        console.error(
            "PUBLICATION JOB — Erreur publication :",
            error
        );


        let message =
            "Une erreur est survenue lors de la publication de l'offre.";


        if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "Publication refusée par Firebase. Vérifiez les règles Firestore.";

        }


        if (
            error?.code ===
            "storage/unauthorized"
        ) {

            message =
                "L'image ne peut pas être envoyée. Vérifiez les règles Firebase Storage.";

        }


        if (
            error?.code ===
            "storage/unauthenticated"
        ) {

            message =
                "Vous devez être connecté pour envoyer une image.";

        }


        showError(message);


    } finally {

        setSubmitting(false);

    }

}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

function handleAuthState(
    user
) {

    currentUser =
        user;


    if (user) {

        hideAuthMessage();


        if (submitButton) {

            submitButton.disabled =
                false;

        }


        console.log(
            "PUBLICATION JOB — Utilisateur connecté :",
            user.uid
        );


    } else {

        showAuthMessage(
            "Vous devez être connecté pour publier une offre."
        );


        if (submitButton) {

            submitButton.disabled =
                true;

        }

    }

}


/* =========================================================
   EVENEMENTS SALAIRE
========================================================= */

if (salaryType) {

    salaryType.addEventListener(
        "change",
        updateSalaryFields
    );

}


/* =========================================================
   COMPTEUR
========================================================= */

if (jobDescription) {

    jobDescription.addEventListener(
        "input",
        updateDescriptionCounter
    );

}


/* =========================================================
   IMAGE
========================================================= */

if (companyImage) {

    companyImage.addEventListener(
        "change",
        () => {

            const file =
                companyImage.files?.[0];


            if (!file) {

                clearImagePreview();

                return;

            }


            previewImage(file);

        }
    );

}


/* =========================================================
   SUPPRIMER ERREUR LORSQUE L'UTILISATEUR MODIFIE
========================================================= */

document
    .querySelectorAll(
        ".publish-job-field input, .publish-job-field select, .publish-job-field textarea"
    )
    .forEach(
        field => {

            field.addEventListener(
                "input",
                () => {

                    const wrapper =
                        field.closest(
                            ".publish-job-field"
                        );


                    wrapper?.classList.remove(
                        "invalid"
                    );

                }
            );


            field.addEventListener(
                "change",
                () => {

                    const wrapper =
                        field.closest(
                            ".publish-job-field"
                        );


                    wrapper?.classList.remove(
                        "invalid"
                    );

                }
            );

        }
    );


/* =========================================================
   FORMULAIRE
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        handleSubmit
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

function init() {

    updateSalaryFields();

    updateDescriptionCounter();

    clearImagePreview();


    if (!auth) {

        showAuthMessage(
            "Firebase n'est pas disponible."
        );

        if (submitButton) {
            submitButton.disabled =
                true;
        }

        return;

    }


    onAuthStateChanged(
        auth,
        handleAuthState
    );

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}
