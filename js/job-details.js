/* =========================================================
   CAMU SERVICES
   JOB DETAILS
   Compatible avec la collection Firestore "jobs"
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   FIREBASE
   app.js initialise déjà Firebase
========================================================= */

let app;
let db;
let auth;

try {
    const apps = getApps();

    if (!apps.length) {
        throw new Error(
            "Firebase n'est pas encore initialisé. Vérifiez app.js."
        );
    }

    app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);

} catch (error) {
    console.error(
        "JOB DETAILS — Erreur initialisation Firebase :",
        error
    );
}


/* =========================================================
   ELEMENTS HTML
========================================================= */

const loading = document.getElementById("jobDetailsLoading");
const errorBox = document.getElementById("jobDetailsError");
const errorText = document.getElementById("jobDetailsErrorText");
const content = document.getElementById("jobDetailsContent");

const jobCompanyLogo = document.getElementById("jobCompanyLogo");

const jobCompany = document.getElementById("jobCompany");
const jobTitle = document.getElementById("jobTitle");

const jobLocation = document.getElementById("jobLocation");
const jobCategory = document.getElementById("jobCategory");

const jobCategoryInfo = document.getElementById("jobCategoryInfo");
const jobContract = document.getElementById("jobContract");
const jobPositions = document.getElementById("jobPositions");
const jobExperience = document.getElementById("jobExperience");
const jobLocationInfo = document.getElementById("jobLocationInfo");
const jobSalary = document.getElementById("jobSalary");
const jobDate = document.getElementById("jobDate");

const jobDeadline = document.getElementById("jobDeadline");
const jobAvailability = document.getElementById("jobAvailability");
const jobTravel = document.getElementById("jobTravel");

const jobDescription = document.getElementById("jobDescription");

const jobResponsibilitiesSection =
    document.getElementById("jobResponsibilitiesSection");

const jobResponsibilities =
    document.getElementById("jobResponsibilities");

const jobSkillsSection =
    document.getElementById("jobSkillsSection");

const jobSkills =
    document.getElementById("jobSkills");

const jobRequirementsSection =
    document.getElementById("jobRequirementsSection");

const jobRequirements =
    document.getElementById("jobRequirements");

const jobBenefitsSection =
    document.getElementById("jobBenefitsSection");

const jobBenefits =
    document.getElementById("jobBenefits");

const jobCompanyDescriptionSection =
    document.getElementById("jobCompanyDescriptionSection");

const jobCompanyDescription =
    document.getElementById("jobCompanyDescription");

const jobFavorite =
    document.getElementById("jobFavorite");

const jobShare =
    document.getElementById("jobShare");

const jobApply =
    document.getElementById("jobApply");

const jobApplicationLink =
    document.getElementById("jobApplicationLink");

const jobPhone =
    document.getElementById("jobPhone");

const jobEmail =
    document.getElementById("jobEmail");

const jobReport =
    document.getElementById("jobReport");


/* =========================================================
   UTILITAIRES
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function cleanValue(value, fallback = "") {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const text = String(value).trim();

    if (!text) {
        return fallback;
    }

    return text;
}


function formatList(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => cleanValue(item))
            .filter(Boolean);
    }

    if (!value) {
        return [];
    }

    return String(value)
        .split(/\r?\n|[,;|]/)
        .map(item => item.trim())
        .filter(Boolean);
}


function formatDate(value) {
    if (!value) {
        return "Non précisée";
    }

    try {
        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();

        } else if (
            value instanceof Date
        ) {
            date = value;

        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "Non précisée";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        ).format(date);

    } catch (error) {
        console.warn(
            "JOB DETAILS — Date invalide :",
            value
        );

        return "Non précisée";
    }
}


function hideElement(element) {
    if (element) {
        element.style.display = "none";
    }
}


function showElement(element, display = "") {
    if (element) {
        element.style.display = display;
    }
}


function setText(element, value, fallback = "Non précisé") {
    if (!element) {
        return;
    }

    element.textContent =
        cleanValue(value, fallback);
}


/* =========================================================
   LOGO ENTREPRISE
========================================================= */

function renderCompanyLogo(imageUrl) {

    if (!jobCompanyLogo) {
        return;
    }

    const image = cleanValue(imageUrl);

    /*
     * Ne pas tenter de charger :
     * - chaîne vide
     * - texte de test
     * - valeurs invalides
     */
    const invalidImageValues = [
        "laisser vide pour le test",
        "laisser vide",
        "test",
        "none",
        "null",
        "undefined"
    ];

    if (
        !image ||
        invalidImageValues.includes(image.toLowerCase()) ||
        !/^https?:\/\//i.test(image)
    ) {

        jobCompanyLogo.innerHTML = `
            <div class="job-company-logo-placeholder">
                <i class="fa-solid fa-building"></i>
            </div>
        `;

        return;
    }


    jobCompanyLogo.innerHTML = "";

    const img = document.createElement("img");

    img.src = image;
    img.alt = "Logo de l'entreprise";

    img.loading = "lazy";

    img.addEventListener("error", () => {

        jobCompanyLogo.innerHTML = `
            <div class="job-company-logo-placeholder">
                <i class="fa-solid fa-building"></i>
            </div>
        `;

    });

    jobCompanyLogo.appendChild(img);
}


/* =========================================================
   AFFICHER UNE LISTE
========================================================= */

function renderList(section, listElement, value) {

    if (!section || !listElement) {
        return;
    }

    const items = formatList(value);

    listElement.innerHTML = "";

    if (!items.length) {
        hideElement(section);
        return;
    }

    items.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        listElement.appendChild(li);

    });

    showElement(section);
}


/* =========================================================
   AFFICHER LES INFORMATIONS
========================================================= */

function renderJob(job) {

    /* -----------------------------------------------------
       VALEURS
    ----------------------------------------------------- */

    const title =
        cleanValue(job.title, "Poste non précisé");

    const company =
        cleanValue(job.company, "Entreprise non précisée");

    const category =
        cleanValue(job.category, "Non précisée");

    const city =
        cleanValue(job.city, "Non précisée");

    const contract =
        cleanValue(job.contractType, "Non précisé");

    const experience =
        cleanValue(job.experience, "Non précisée");

    const positions =
        cleanValue(job.poste, "Non précisé");

    const salary =
        cleanValue(
            job.salary,
            "Selon la grille de l'entreprise"
        );

    const description =
        cleanValue(
            job.description,
            "Aucune description disponible."
        );

    const companyDescription =
        cleanValue(
            job.companyDescription,
            ""
        );

    const phone =
        cleanValue(job.phone, "");

    const email =
        cleanValue(
            job.email || job.providerEmail,
            ""
        );

    const applicationLink =
        cleanValue(
            job.applicationLink,
            ""
        );


    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    setText(
        jobTitle,
        title,
        "Poste non précisé"
    );

    setText(
        jobCompany,
        company,
        "Entreprise non précisée"
    );


    /* LOCALISATION HEADER */

    if (jobLocation) {
        jobLocation.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(city)}</span>
        `;
    }


    /* CATÉGORIE HEADER */

    if (jobCategory) {
        jobCategory.innerHTML = `
            <i class="fa-solid fa-layer-group"></i>
            <span>${escapeHtml(category)}</span>
        `;
    }


    /* LOGO */

    renderCompanyLogo(job.image);


    /* -----------------------------------------------------
       INFORMATIONS
    ----------------------------------------------------- */

    setText(
        jobCategoryInfo,
        category,
        "Non précisée"
    );

    setText(
        jobContract,
        contract,
        "Non précisé"
    );

    setText(
        jobPositions,
        positions,
        "Non précisé"
    );

    setText(
        jobExperience,
        experience,
        "Non précisée"
    );

    setText(
        jobLocationInfo,
        city,
        "Non précisée"
    );

    setText(
        jobSalary,
        salary,
        "Selon la grille de l'entreprise"
    );

    setText(
        jobDate,
        formatDate(job.createdAt),
        "Non précisée"
    );


    /* -----------------------------------------------------
       CHAMPS OPTIONNELS
    ----------------------------------------------------- */

    if (jobDeadline) {
        if (job.applicationDeadline) {
            jobDeadline.textContent =
                formatDate(job.applicationDeadline);

            showElement(jobDeadline.parentElement);
        } else {
            hideElement(jobDeadline.parentElement);
        }
    }


    if (jobAvailability) {
        const availability =
            cleanValue(job.availability);

        if (availability) {
            jobAvailability.textContent =
                availability;

            showElement(jobAvailability.parentElement);
        } else {
            hideElement(jobAvailability.parentElement);
        }
    }


    if (jobTravel) {
        const travel =
            cleanValue(job.travelRequired);

        if (travel) {
            jobTravel.textContent =
                travel;

            showElement(jobTravel.parentElement);
        } else {
            hideElement(jobTravel.parentElement);
        }
    }


    /* -----------------------------------------------------
       DESCRIPTION
    ----------------------------------------------------- */

    if (jobDescription) {
        jobDescription.textContent = description;
    }


    /* -----------------------------------------------------
       RESPONSABILITÉS
    ----------------------------------------------------- */

    renderList(
        jobResponsibilitiesSection,
        jobResponsibilities,
        job.responsibilities
    );


    /* -----------------------------------------------------
       COMPÉTENCES
    ----------------------------------------------------- */

    renderList(
        jobSkillsSection,
        jobSkills,
        job.skills
    );


    /* -----------------------------------------------------
       EXIGENCES / PROFIL
    ----------------------------------------------------- */

    renderList(
        jobRequirementsSection,
        jobRequirements,
        job.requirements
    );


    /* -----------------------------------------------------
       AVANTAGES
    ----------------------------------------------------- */

    renderList(
        jobBenefitsSection,
        jobBenefits,
        job.benefits
    );


    /* -----------------------------------------------------
       ENTREPRISE
    ----------------------------------------------------- */

    if (jobCompanyDescription) {

        if (companyDescription) {

            jobCompanyDescription.textContent =
                companyDescription;

            showElement(
                jobCompanyDescriptionSection
            );

        } else {

            hideElement(
                jobCompanyDescriptionSection
            );
        }
    }


    /* -----------------------------------------------------
       CONTACT
    ----------------------------------------------------- */

    renderPhone(phone);
    renderEmail(email);


    /* -----------------------------------------------------
       CANDIDATURE
    ----------------------------------------------------- */

    setupApplication(
        applicationLink,
        email,
        phone
    );
}


/* =========================================================
   TELEPHONE
========================================================= */

function renderPhone(phone) {

    if (!jobPhone) {
        return;
    }

    jobPhone.innerHTML = "";

    if (!phone) {

        jobPhone.textContent =
            "Non renseigné";

        return;
    }

    const link = document.createElement("a");

    link.href =
        `tel:${phone.replace(/\s+/g, "")}`;

    link.textContent = phone;

    jobPhone.appendChild(link);
}


/* =========================================================
   EMAIL
========================================================= */

function renderEmail(email) {

    if (!jobEmail) {
        return;
    }

    jobEmail.innerHTML = "";

    if (!email) {

        jobEmail.textContent =
            "Non renseigné";

        return;
    }

    const link = document.createElement("a");

    link.href =
        `mailto:${email}`;

    link.textContent = email;

    jobEmail.appendChild(link);
}


/* =========================================================
   POSTULER
========================================================= */

function setupApplication(
    applicationLink,
    email,
    phone
) {

    if (!jobApply) {
        return;
    }

    if (jobApplicationLink) {
        jobApplicationLink.innerHTML = "";
    }


    /* -----------------------------------------------------
       LIEN DIRECT
    ----------------------------------------------------- */

    if (applicationLink) {

        jobApply.onclick = () => {

            window.open(
                applicationLink,
                "_blank",
                "noopener,noreferrer"
            );

        };

        if (jobApplicationLink) {

            const text =
                document.createElement("div");

            text.innerHTML = `
                <a
                    href="${escapeHtml(applicationLink)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Voir la page de candidature
                </a>
            `;

            jobApplicationLink.appendChild(text);
        }

        return;
    }


    /* -----------------------------------------------------
       EMAIL
    ----------------------------------------------------- */

    if (email) {

        jobApply.onclick = () => {

            window.location.href =
                `mailto:${email}?subject=${encodeURIComponent(
                    "Candidature - offre CAMU SERVICES"
                )}`;

        };

        return;
    }


    /* -----------------------------------------------------
       TELEPHONE
    ----------------------------------------------------- */

    if (phone) {

        jobApply.onclick = () => {

            window.location.href =
                `tel:${phone.replace(/\s+/g, "")}`;

        };

        return;
    }


    /* -----------------------------------------------------
       AUCUN MOYEN
    ----------------------------------------------------- */

    jobApply.onclick = () => {

        alert(
            "Aucune méthode de candidature n'est renseignée pour cette offre."
        );

    };
}


/* =========================================================
   FAVORIS
========================================================= */

const FAVORITES_KEY =
    "camu_jobs_favorites";


function getFavorites() {

    try {

        const data =
            localStorage.getItem(FAVORITES_KEY);

        if (!data) {
            return [];
        }

        const favorites =
            JSON.parse(data);

        return Array.isArray(favorites)
            ? favorites
            : [];

    } catch (error) {

        console.warn(
            "JOB DETAILS — Favoris illisibles :",
            error
        );

        return [];
    }
}


function saveFavorites(favorites) {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );
}


function updateFavoriteIcon(jobId) {

    if (!jobFavorite) {
        return;
    }

    const favorites = getFavorites();

    const isFavorite =
        favorites.includes(jobId);

    jobFavorite.classList.toggle(
        "active",
        isFavorite
    );

    jobFavorite.setAttribute(
        "aria-pressed",
        String(isFavorite)
    );

    jobFavorite.title =
        isFavorite
            ? "Retirer des favoris"
            : "Ajouter aux favoris";

    jobFavorite.innerHTML = isFavorite
        ? `<i class="fa-solid fa-heart"></i>`
        : `<i class="fa-regular fa-heart"></i>`;
}


function setupFavorite(jobId) {

    if (!jobFavorite) {
        return;
    }

    updateFavoriteIcon(jobId);

    jobFavorite.addEventListener(
        "click",
        () => {

            let favorites =
                getFavorites();

            const index =
                favorites.indexOf(jobId);

            if (index === -1) {

                favorites.push(jobId);

            } else {

                favorites.splice(index, 1);

            }

            saveFavorites(favorites);

            updateFavoriteIcon(jobId);
        }
    );
}


/* =========================================================
   PARTAGE
========================================================= */

function setupShare(job) {

    if (!jobShare) {
        return;
    }

    jobShare.addEventListener(
        "click",
        async () => {

            const shareUrl =
                window.location.href;

            const shareData = {
                title:
                    cleanValue(
                        job.title,
                        "Offre d'emploi"
                    ),
                text:
                    `${cleanValue(
                        job.title,
                        "Offre d'emploi"
                    )} - ${cleanValue(
                        job.company,
                        "CAMU SERVICES"
                    )}`,
                url: shareUrl
            };


            /* Partage natif */

            if (
                navigator.share
            ) {

                try {

                    await navigator.share(
                        shareData
                    );

                    return;

                } catch (error) {

                    if (
                        error?.name ===
                        "AbortError"
                    ) {
                        return;
                    }

                    console.warn(
                        "JOB DETAILS — Partage natif échoué :",
                        error
                    );
                }
            }


            /* Presse-papiers */

            try {

                await navigator.clipboard.writeText(
                    shareUrl
                );

                alert(
                    "Lien de l'offre copié."
                );

            } catch (error) {

                window.prompt(
                    "Copiez le lien de l'offre :",
                    shareUrl
                );
            }
        }
    );
}


/* =========================================================
   SIGNALER
========================================================= */

function setupReport(jobId) {

    if (!jobReport) {
        return;
    }

    jobReport.addEventListener(
        "click",
        async () => {

            const reason =
                window.prompt(
                    "Pourquoi souhaitez-vous signaler cette offre ?"
                );

            if (!reason) {
                return;
            }


            try {

                if (!db) {
                    throw new Error(
                        "Firestore n'est pas disponible."
                    );
                }


                const currentUser =
                    auth?.currentUser || null;


                const reportData = {
                    jobId,
                    reason: reason.trim(),

                    pageUrl:
                        window.location.href,

                    createdAt:
                        serverTimestamp()
                };


                if (currentUser) {

                    reportData.userId =
                        currentUser.uid;

                    if (currentUser.email) {

                        reportData.userEmail =
                            currentUser.email;
                    }
                }


                await addDoc(
                    collection(
                        db,
                        "jobReports"
                    ),
                    reportData
                );


                alert(
                    "Merci. Votre signalement a été envoyé."
                );

            } catch (error) {

                console.error(
                    "JOB DETAILS — Erreur signalement :",
                    error
                );

                alert(
                    "Impossible d'envoyer le signalement."
                );
            }
        }
    );
}


/* =========================================================
   AFFICHER ERREUR
========================================================= */

function showError(message) {

    if (loading) {
        hideElement(loading);
    }

    if (content) {
        hideElement(content);
    }

    if (errorBox) {
        showElement(errorBox);
    }

    if (errorText) {
        errorText.textContent =
            message;
    }
}


/* =========================================================
   CHARGER L'OFFRE
========================================================= */

async function loadJob() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const jobId =
        urlParams.get("id");


    console.log(
        "JOB DETAILS — ID demandé :",
        jobId
    );


    if (!jobId) {

        showError(
            "Identifiant de l'offre manquant."
        );

        return;
    }


    if (!db) {

        showError(
            "La connexion à la base de données n'est pas disponible."
        );

        return;
    }


    try {

        console.log(
            `JOB DETAILS — Lecture de jobs/${jobId}`
        );


        const jobRef =
            doc(
                db,
                "jobs",
                jobId
            );


        const jobSnapshot =
            await getDoc(jobRef);


        console.log(
            "JOB DETAILS — Document existe :",
            jobSnapshot.exists()
        );


        if (!jobSnapshot.exists()) {

            showError(
                "Cette offre d'emploi n'existe plus ou n'est pas disponible."
            );

            return;
        }


        const job = {
            id: jobSnapshot.id,
            ...jobSnapshot.data()
        };


        console.log(
            "JOB DETAILS — Offre chargée :",
            job
        );


        renderJob(job);


        setupFavorite(
            jobId
        );


        setupShare(
            job
        );


        setupReport(
            jobId
        );


        if (loading) {
            hideElement(loading);
        }

        if (errorBox) {
            hideElement(errorBox);
        }

        if (content) {
            showElement(content);
        }


        console.log(
            "JOB DETAILS — Offre affichée avec succès."
        );


    } catch (error) {

        console.error(
            "JOB DETAILS — Erreur de chargement :",
            error
        );


        showError(
            "Impossible de charger cette offre. Veuillez réessayer."
        );

    } finally {

        if (loading) {
            hideElement(loading);
        }
    }
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


    function openMenu() {

        sidebar.classList.add(
            "open"
        );

        overlay.classList.add(
            "active"
        );

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    function closeMenu() {

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


    menuButton.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
                    "open"
                )
            ) {

                closeMenu();

            } else {

                openMenu();
            }
        }
    );


    overlay.addEventListener(
        "click",
        closeMenu
    );


    sidebar
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMenu
            );

        });
}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupMobileMenu();

        loadJob();

    }
);
