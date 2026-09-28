/* =========================================================
   CAMU SERVICES
   PUBLICATION D'UNE OFFRE D'EMPLOI
   Firebase Firestore + Cloudinary
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION CLOUDINARY
========================================================= */

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";

const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   ÉLÉMENTS HTML
========================================================= */

const form =
    document.getElementById("publishJobForm");

const publishButton =
    document.getElementById("publishJobButton");

const authMessage =
    document.getElementById("authMessage");

const successMessage =
    document.getElementById("publishJobSuccess");

const errorMessage =
    document.getElementById("publishJobError");

const imageInput =
    document.getElementById("jobImage");

const imagePreview =
    document.getElementById("jobImagePreview");


/* =========================================================
   UTILISATEUR
========================================================= */

let currentUser = null;


/* =========================================================
   UTILITAIRE — VALEUR D'UN CHAMP
========================================================= */

function value(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return String(
        element.value || ""
    ).trim();
}


/* =========================================================
   UTILITAIRE — LISTES
========================================================= */

function splitLines(text) {

    return String(text || "")
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
}


/* =========================================================
   MESSAGES
========================================================= */

function showError(message) {

    if (successMessage) {
        successMessage.style.display = "none";
    }

    if (errorMessage) {

        errorMessage.textContent =
            message;

        errorMessage.style.display =
            "block";

        errorMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    console.error(
        "PUBLISH JOB —",
        message
    );
}


function showSuccess(message) {

    if (errorMessage) {
        errorMessage.style.display = "none";
    }

    if (successMessage) {

        successMessage.textContent =
            message;

        successMessage.style.display =
            "block";

        successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


function hideMessages() {

    if (errorMessage) {
        errorMessage.style.display = "none";
    }

    if (successMessage) {
        successMessage.style.display = "none";
    }
}


/* =========================================================
   APERÇU DE L'IMAGE
========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files?.[0];

            if (!file) {

                if (imagePreview) {

                    imagePreview.src = "";

                    imagePreview.style.display =
                        "none";
                }

                return;
            }


            /* -----------------------------------------
               FORMAT
            ----------------------------------------- */

            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (!validTypes.includes(file.type)) {

                imageInput.value = "";

                if (imagePreview) {

                    imagePreview.src = "";

                    imagePreview.style.display =
                        "none";
                }

                showError(
                    "Format d'image invalide. Utilisez JPG, PNG ou WEBP."
                );

                return;
            }


            /* -----------------------------------------
               TAILLE
            ----------------------------------------- */

            const maxSize =
                5 * 1024 * 1024;


            if (file.size > maxSize) {

                imageInput.value = "";

                if (imagePreview) {

                    imagePreview.src = "";

                    imagePreview.style.display =
                        "none";
                }

                showError(
                    "L'image ne doit pas dépasser 5 MB."
                );

                return;
            }


            /* -----------------------------------------
               APERÇU
            ----------------------------------------- */

            if (imagePreview) {

                const reader =
                    new FileReader();

                reader.onload =
                    event => {

                        imagePreview.src =
                            event.target.result;

                        imagePreview.style.display =
                            "block";
                    };

                reader.readAsDataURL(file);
            }

        }
    );
}


/* =========================================================
   UPLOAD IMAGE — CLOUDINARY
========================================================= */

async function uploadCompanyImage(file) {

    if (!file) {
        return "";
    }


    console.log(
        "PUBLISH JOB — Début upload Cloudinary :",
        file.name
    );


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


    /* -----------------------------------------
       DOSSIER CLOUDINARY
    ----------------------------------------- */

    formData.append(
        "folder",
        "camu-services/jobs"
    );


    const response =
        await fetch(
            CLOUDINARY_UPLOAD_URL,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        let errorMessage =
            "Impossible d'envoyer l'image sur Cloudinary.";

        try {

            const errorData =
                await response.json();

            console.error(
                "CLOUDINARY ERROR :",
                errorData
            );

            if (
                errorData?.error?.message
            ) {

                errorMessage =
                    `Cloudinary : ${errorData.error.message}`;
            }

        } catch (error) {

            console.error(
                "Erreur lecture Cloudinary :",
                error
            );
        }

        throw new Error(
            errorMessage
        );
    }


    const data =
        await response.json();


    console.log(
        "PUBLISH JOB — Image Cloudinary :",
        data.secure_url
    );


    if (!data.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné l'URL de l'image."
        );
    }


    return data.secure_url;
}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        currentUser =
            user || null;


        if (!authMessage) {
            return;
        }


        /* -----------------------------------------
           PAS CONNECTÉ
        ----------------------------------------- */

        if (!user) {

            authMessage.textContent =
                "Vous devez être connecté pour publier une offre.";

            authMessage.style.display =
                "block";


            if (publishButton) {
                publishButton.disabled = true;
            }

            return;
        }


        /* -----------------------------------------
           CONNECTÉ
        ----------------------------------------- */

        authMessage.textContent =
            `Connecté : ${user.email || "Compte utilisateur"}`;

        authMessage.style.display =
            "block";

        authMessage.style.background =
            "rgba(32, 168, 107, .08)";

        authMessage.style.borderColor =
            "rgba(32, 168, 107, .20)";

        authMessage.style.color =
            "#167c4a";


        if (publishButton) {
            publishButton.disabled = false;
        }


        console.log(
            "PUBLISH JOB — Utilisateur connecté :",
            user.email
        );

    }
);


/* =========================================================
   VALIDATION
========================================================= */

function validateForm() {

    const title =
        value("jobTitle");

    const company =
        value("jobCompany");

    const category =
        value("jobCategory");

    const contractType =
        value("jobContractType");

    const city =
        value("jobCity");

    const description =
        value("jobDescription");

    const terms =
        document.getElementById("jobTerms");


    /* -----------------------------------------
       TITRE
    ----------------------------------------- */

    if (!title) {

        showError(
            "Veuillez renseigner l'intitulé du poste."
        );

        return false;
    }


    /* -----------------------------------------
       ENTREPRISE
    ----------------------------------------- */

    if (!company) {

        showError(
            "Veuillez renseigner le nom de l'entreprise."
        );

        return false;
    }


    /* -----------------------------------------
       CATÉGORIE
    ----------------------------------------- */

    if (!category) {

        showError(
            "Veuillez sélectionner une catégorie."
        );

        return false;
    }


    /* -----------------------------------------
       CONTRAT
    ----------------------------------------- */

    if (!contractType) {

        showError(
            "Veuillez sélectionner le type de contrat."
        );

        return false;
    }


    /* -----------------------------------------
       LOCALISATION
    ----------------------------------------- */

    if (!city) {

        showError(
            "Veuillez renseigner la localisation."
        );

        return false;
    }


    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

    if (!description) {

        showError(
            "Veuillez renseigner la description du poste."
        );

        return false;
    }


    /* -----------------------------------------
       CONDITIONS
    ----------------------------------------- */

    if (
        terms &&
        !terms.checked
    ) {

        showError(
            "Veuillez accepter les conditions de publication."
        );

        return false;
    }


    return true;
}


/* =========================================================
   PUBLICATION
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            console.log(
                "PUBLISH JOB — Formulaire soumis."
            );


            hideMessages();


            /* -----------------------------------------
               AUTHENTIFICATION
            ----------------------------------------- */

            if (!currentUser) {

                showError(
                    "Vous devez être connecté pour publier une offre."
                );

                return;
            }


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!validateForm()) {
                return;
            }


            /* -----------------------------------------
               BOUTON
            ----------------------------------------- */

            const originalButton =
                publishButton?.innerHTML;


            if (publishButton) {

                publishButton.disabled =
                    true;

                publishButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Publication...</span>
                `;
            }


            try {

                /* =====================================
                   IMAGE
                ===================================== */

                let imageUrl = "";


                const selectedFile =
                    imageInput?.files?.[0] || null;


                if (selectedFile) {

                    showSuccess(
                        "Envoi de l'image en cours..."
                    );


                    imageUrl =
                        await uploadCompanyImage(
                            selectedFile
                        );


                    console.log(
                        "PUBLISH JOB — Image envoyée :",
                        imageUrl
                    );
                }


                /* =====================================
                   DONNÉES
                ===================================== */

                const jobData = {

                    title:
                        value("jobTitle"),

                    company:
                        value("jobCompany"),

                    category:
                        value("jobCategory"),

                    poste:
                        value("jobPositions") || "1",

                    city:
                        value("jobCity"),

                    contractType:
                        value("jobContractType"),

                    experience:
                        value("jobExperience"),

                    salary:
                        value("jobSalary") ||
                        "Selon la grille de l'entreprise",

                    description:
                        value("jobDescription"),

                    responsibilities:
                        splitLines(
                            value("jobResponsibilities")
                        ),

                    skills:
                        splitLines(
                            value("jobSkills")
                        ),

                    requirements:
                        splitLines(
                            value("jobRequirements")
                        ),

                    benefits:
                        splitLines(
                            value("jobBenefits")
                        ),

                    companyDescription:
                        value("companyDescription"),

                    phone:
                        value("jobPhone"),

                    email:
                        value("jobEmail") ||
                        currentUser.email ||
                        "",

                    providerEmail:
                        value("jobEmail") ||
                        currentUser.email ||
                        "",

                    applicationLink:
                        value("applicationLink"),

                    applicationDeadline:
                        value("jobDeadline"),

                    availability:
                        value("jobAvailability"),

                    travelRequired:
                        value("jobTravel"),


                    /* =================================
                       IMAGE
                    ================================= */

                    image:
                        imageUrl,

                    imageURL:
                        imageUrl,


                    /* =================================
                       PROPRIÉTAIRE
                    ================================= */

                    userId:
                        currentUser.uid,

                    ownerId:
                        currentUser.uid,

                    ownerName:
                        currentUser.displayName ||
                        currentUser.email ||
                        "Administrateur",


                    /* =================================
                       STATUT
                    ================================= */

                    status:
                        "active",

                    accountType:
                        "jobs",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                };


                console.log(
                    "PUBLISH JOB — Données Firestore :",
                    jobData
                );


                /* =====================================
                   FIRESTORE
                ===================================== */

                showSuccess(
                    "Enregistrement de l'offre..."
                );


                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "jobs"
                        ),
                        jobData
                    );


                console.log(
                    "PUBLISH JOB — Offre créée :",
                    docRef.id
                );


                /* =====================================
                   SUCCÈS
                ===================================== */

                showSuccess(
                    "Votre offre d'emploi a été publiée avec succès."
                );


                /* =====================================
                   RÉINITIALISATION
                ===================================== */

                form.reset();


                const salaryField =
                    document.getElementById(
                        "jobSalary"
                    );


                if (salaryField) {

                    salaryField.value =
                        "Selon la grille de l'entreprise";
                }


                if (imagePreview) {

                    imagePreview.src = "";

                    imagePreview.style.display =
                        "none";
                }


                /* =====================================
                   REDIRECTION
                ===================================== */

                setTimeout(
                    () => {

                        window.location.href =
                            `job-details.html?id=${encodeURIComponent(
                                docRef.id
                            )}`;

                    },
                    1200
                );

            } catch (error) {

                console.error(
                    "PUBLISH JOB — ERREUR COMPLÈTE :",
                    error
                );


                let message =
                    "Impossible de publier l'offre.";


                /* -----------------------------------------
                   ERREURS CLOUDINARY
                ----------------------------------------- */

                if (
                    String(error.message || "")
                        .toLowerCase()
                        .includes("cloudinary")
                ) {

                    message =
                        error.message;
                }


                /* -----------------------------------------
                   FIRESTORE
                ----------------------------------------- */

                else if (
                    error.code ===
                    "permission-denied"
                ) {

                    message =
                        "Publication refusée par Firebase Firestore. Vérifiez les règles de la collection jobs.";
                }


                /* -----------------------------------------
                   RÉSEAU
                ----------------------------------------- */

                else if (
                    error.name ===
                    "TypeError"
                ) {

                    message =
                        "Problème de connexion Internet ou impossible de contacter le serveur.";
                }


                else if (
                    error.message
                ) {

                    message =
                        error.message;
                }


                showError(
                    message
                );

            } finally {

                if (publishButton) {

                    publishButton.disabled =
                        false;

                    publishButton.innerHTML =
                        originalButton ||
                        `
                        <i class="fa-solid fa-paper-plane"></i>
                        <span>Publier l'offre</span>
                        `;
                }
            }

        }
    );
}


/* =========================================================
   MENU MOBILE
========================================================= */

function setupMobileMenu() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const menuButton =
        document.getElementById("menuButton");


    if (
        !sidebar ||
        !overlay ||
        !menuButton
    ) {

        return;
    }


    menuButton.addEventListener(
        "click",
        () => {

            const opened =
                sidebar.classList.toggle(
                    "open"
                );


            overlay.classList.toggle(
                "active",
                opened
            );


            menuButton.setAttribute(
                "aria-expanded",
                String(opened)
            );
        }
    );


    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "open"
            );


            overlay.classList.remove(
                "active"
            );


            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    );
}


setupMobileMenu();


/* =========================================================
   FIN
========================================================= */

console.log(
    "CAMU SERVICES — publier-job.js chargé correctement."
);
