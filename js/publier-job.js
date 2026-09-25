/* =========================================================
   CAMU SERVICES
   PUBLICATION D'UNE OFFRE D'EMPLOI
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   FIREBASE
========================================================= */

let app;
let db;
let auth;
let storage;

try {

    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas initialisé. Vérifiez app.js."
        );
    }

    app = getApp();

    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

} catch (error) {

    console.error(
        "PUBLISH JOB — Firebase :",
        error
    );
}


/* =========================================================
   ELEMENTS
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
   UTILITAIRES
========================================================= */

function value(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value.trim();
}


function showError(message) {

    if (successMessage) {
        successMessage.style.display = "none";
    }

    if (errorMessage) {

        errorMessage.textContent =
            message;

        errorMessage.style.display =
            "block";
    }
}


function showSuccess(message) {

    if (errorMessage) {
        errorMessage.style.display =
            "none";
    }

    if (successMessage) {

        successMessage.textContent =
            message;

        successMessage.style.display =
            "block";
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


function splitLines(text) {

    return String(text || "")
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
}


/* =========================================================
   APERÇU IMAGE
========================================================= */

if (imageInput && imagePreview) {

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files?.[0];

            if (!file) {

                imagePreview.src = "";

                imagePreview.style.display =
                    "none";

                return;
            }


            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (!validTypes.includes(file.type)) {

                imageInput.value = "";

                imagePreview.src = "";

                imagePreview.style.display =
                    "none";

                showError(
                    "Format d'image invalide. Utilisez JPG, PNG ou WEBP."
                );

                return;
            }


            if (file.size > 5 * 1024 * 1024) {

                imageInput.value = "";

                imagePreview.src = "";

                imagePreview.style.display =
                    "none";

                showError(
                    "L'image ne doit pas dépasser 5 MB."
                );

                return;
            }


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
    );
}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadCompanyImage(
    user,
    file
) {

    if (!file) {
        return "";
    }


    if (!storage) {

        throw new Error(
            "Firebase Storage n'est pas disponible."
        );
    }


    const safeName =
        file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_");


    const filePath =
        `job-images/${user.uid}/${Date.now()}-${safeName}`;


    const storageRef =
        ref(storage, filePath);


    await uploadBytes(
        storageRef,
        file
    );


    return await getDownloadURL(
        storageRef
    );
}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

let currentUser = null;


onAuthStateChanged(
    auth,
    user => {

        currentUser = user || null;


        if (!authMessage) {
            return;
        }


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


    if (!title) {
        showError(
            "Veuillez renseigner l'intitulé du poste."
        );
        return false;
    }


    if (!company) {
        showError(
            "Veuillez renseigner le nom de l'entreprise."
        );
        return false;
    }


    if (!category) {
        showError(
            "Veuillez sélectionner une catégorie."
        );
        return false;
    }


    if (!contractType) {
        showError(
            "Veuillez sélectionner le type de contrat."
        );
        return false;
    }


    if (!city) {
        showError(
            "Veuillez renseigner la localisation."
        );
        return false;
    }


    if (!description) {
        showError(
            "Veuillez renseigner la description du poste."
        );
        return false;
    }


    if (!terms?.checked) {
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

            hideMessages();


            /* AUTH */

            if (!currentUser) {

                showError(
                    "Vous devez être connecté pour publier une offre."
                );

                return;
            }


            /* FIREBASE */

            if (!db) {

                showError(
                    "La base de données n'est pas disponible."
                );

                return;
            }


            /* VALIDATION */

            if (!validateForm()) {
                return;
            }


            /* BOUTON */

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

                /* ---------------------------------------------
                   IMAGE
                --------------------------------------------- */

                let imageUrl = "";

                const selectedFile =
                    imageInput?.files?.[0] || null;


                if (selectedFile) {

                    imageUrl =
                        await uploadCompanyImage(
                            currentUser,
                            selectedFile
                        );
                }


                /* ---------------------------------------------
                   DONNÉES
                --------------------------------------------- */

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

                    image:
                        imageUrl,

                    userId:
                        currentUser.uid,

                    status:
                        "active",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                };


                console.log(
                    "PUBLISH JOB — Données :",
                    jobData
                );


                /* ---------------------------------------------
                   FIRESTORE
                --------------------------------------------- */

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


                showSuccess(
                    "Votre offre d'emploi a été publiée avec succès."
                );


                form.reset();


                /* Valeur par défaut */

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


                /*
                 * Redirection après publication.
                 * Un petit délai permet d'afficher
                 * le message de succès.
                 */

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
                    "PUBLISH JOB — Erreur :",
                    error
                );


                showError(
                    error?.message ||
                    "Impossible de publier l'offre."
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
