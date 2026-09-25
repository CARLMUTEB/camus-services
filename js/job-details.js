/* =========================================================
   CAMU SERVICES — JOB DETAILS
   Fichier : js/job-details.js
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
   ========================================================= */

let db = null;
let auth = null;

try {
    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas initialisé par app.js."
        );
    }

    const app = getApp();

    db = getFirestore(app);
    auth = getAuth(app);

} catch (error) {
    console.error(
        "JOB DETAILS — Erreur Firebase :",
        error
    );
}


/* =========================================================
   UTILITAIRES DOM
   ========================================================= */

function getElement(...ids) {
    for (const id of ids) {
        const element = document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}


/* =========================================================
   ÉLÉMENTS
   ========================================================= */

const loadingElement = getElement(
    "jobDetailsLoading",
    "jobsDetailsLoading",
    "jobLoading"
);

const contentElement = getElement(
    "jobDetailsContent",
    "jobDetails",
    "jobContent"
);

const errorElement = getElement(
    "jobDetailsError",
    "jobError"
);

const errorTextElement = getElement(
    "jobDetailsErrorText",
    "jobErrorText"
);

const jobTitle = getElement(
    "jobTitle"
);

const jobCompany = getElement(
    "jobCompany"
);

const jobLocation = getElement(
    "jobLocation"
);

const jobCategory = getElement(
    "jobCategory"
);

const jobDate = getElement(
    "jobDate"
);

const jobContract = getElement(
    "jobContract"
);

const jobExperience = getElement(
    "jobExperience"
);

const jobSalary = getElement(
    "jobSalary"
);

const jobDescription = getElement(
    "jobDescription"
);

const jobSkills = getElement(
    "jobSkills"
);

const jobRequirements = getElement(
    "jobRequirements"
);

const jobBenefits = getElement(
    "jobBenefits"
);

const jobCompanyLogo = getElement(
    "jobCompanyLogo"
);

const jobCompanyDescription = getElement(
    "jobCompanyDescription"
);

const jobPhone = getElement(
    "jobPhone"
);

const jobEmail = getElement(
    "jobEmail"
);

const jobApplicationLink = getElement(
    "jobApplicationLink"
);

const favoriteButton = getElement(
    "jobFavorite"
);

const shareButton = getElement(
    "jobShare"
);

const applyButton = getElement(
    "jobApply"
);

const reportButton = getElement(
    "jobReport"
);


/* =========================================================
   VARIABLES
   ========================================================= */

const FAVORITES_KEY =
    "camu_jobs_favorites";

let currentJob = null;


/* =========================================================
   OUTILS
   ========================================================= */

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function firstValue(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}


/* =========================================================
   ID DE L'OFFRE
   ========================================================= */

function getJobId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("id");
}


/* =========================================================
   DATE
   ========================================================= */

function getDateValue(value) {
    if (!value) {
        return null;
    }

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}


function formatDate(value) {
    const date = getDateValue(value);

    if (!date) {
        return "Date non précisée";
    }

    try {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        ).format(date);
    } catch (error) {
        return "Date non précisée";
    }
}


/* =========================================================
   CHAMPS JOB
   ========================================================= */

function getTitle(job) {
    return firstValue(
        job.title,
        job.poste,
        job.name,
        job.jobTitle,
        job.position,
        "Poste non précisé"
    );
}


function getCompany(job) {
    return firstValue(
        job.company,
        job.entreprise,
        job.companyName,
        job.employer,
        "Entreprise non précisée"
    );
}


function getCity(job) {
    return firstValue(
        job.city,
        job.ville,
        job.location,
        job.localisation,
        ""
    );
}


function getCategory(job) {
    return firstValue(
        job.category,
        job.categoryName,
        job.categorie,
        job.domaine,
        job.sector,
        ""
    );
}


function getContract(job) {
    return firstValue(
        job.contractType,
        job.typeContrat,
        job.contract,
        job.type,
        ""
    );
}


function getExperience(job) {
    return firstValue(
        job.experience,
        job.experienceLevel,
        job.niveauExperience,
        job.niveau,
        ""
    );
}


function getDescription(job) {
    return firstValue(
        job.description,
        job.details,
        job.content,
        job.resume,
        ""
    );
}


function getCompanyDescription(job) {
    return firstValue(
        job.companyDescription,
        job.descriptionCompany,
        job.aboutCompany,
        job.presentationEntreprise,
        ""
    );
}


function getPhone(job) {
    return firstValue(
        job.phone,
        job.telephone,
        job.contactPhone,
        ""
    );
}


function getEmail(job) {
    return firstValue(
        job.email,
        job.contactEmail,
        job.providerEmail,
        job.recruiterEmail,
        ""
    );
}


function getApplicationLink(job) {
    return firstValue(
        job.applicationLink,
        job.applyLink,
        job.candidatureLink,
        job.url,
        ""
    );
}


/* =========================================================
   LISTES
   ========================================================= */

function convertToList(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/[,;\n]/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


function getSkills(job) {
    return convertToList(
        firstValue(
            job.skills,
            job.competences,
            job.tags,
            ""
        )
    );
}


function getRequirements(job) {
    return convertToList(
        firstValue(
            job.requirements,
            job.exigences,
            job.conditions,
            ""
        )
    );
}


function getBenefits(job) {
    return convertToList(
        firstValue(
            job.benefits,
            job.avantages,
            job.benefitsList,
            ""
        )
    );
}


/* =========================================================
   SALAIRE
   ========================================================= */

function getSalary(job) {
    const currency = firstValue(
        job.currency,
        job.devise,
        ""
    );

    const salary = firstValue(
        job.salary,
        job.salaire,
        job.remuneration,
        ""
    );

    const min = firstValue(
        job.salaryMin,
        job.salaireMin,
        ""
    );

    const max = firstValue(
        job.salaryMax,
        job.salaireMax,
        ""
    );

    if (salary) {
        return String(salary) +
            (currency ? " " + currency : "");
    }

    if (min !== "" && max !== "") {
        return String(min) +
            " - " +
            String(max) +
            (currency ? " " + currency : "");
    }

    if (min !== "") {
        return "À partir de " +
            String(min) +
            (currency ? " " + currency : "");
    }

    if (max !== "") {
        return "Jusqu'à " +
            String(max) +
            (currency ? " " + currency : "");
    }

    const salaryType = normalizeText(
        firstValue(
            job.salaryType,
            job.typeSalaire,
            ""
        )
    );

    if (
        salaryType.includes("sur devis") ||
        salaryType.includes("sur-devis")
    ) {
        return "Sur devis";
    }

    return "À négocier";
}


/* =========================================================
   IMAGE
   ========================================================= */

function getJobImage(job) {
    const value = firstValue(
        job.image,
        job.imageUrl,
        job.logo,
        job.companyLogo,
        job.photo,
        job.cover,
        ""
    );

    if (!value) {
        return "";
    }

    const image = String(value).trim();

    if (!image) {
        return "";
    }

    const invalidValues = [
        "laisser vide pour le test",
        "laisser vide",
        "test",
        "null",
        "undefined",
        "none",
        "sans image",
        "pas d'image",
        "no image"
    ];

    if (
        invalidValues.includes(
            normalizeText(image)
        )
    ) {
        return "";
    }

    if (
        !image.startsWith("http://") &&
        !image.startsWith("https://")
    ) {
        return "";
    }

    return image;
}


/* =========================================================
   CHARGEMENT
   ========================================================= */

function showLoading() {
    if (loadingElement) {
        loadingElement.style.display = "flex";
    }

    if (contentElement) {
        contentElement.style.display = "none";
    }

    if (errorElement) {
        errorElement.style.display = "none";
    }
}


function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = "none";
    }
}


function showContent() {
    hideLoading();

    if (contentElement) {
        contentElement.style.display = "";
    }

    if (errorElement) {
        errorElement.style.display = "none";
    }
}


function showError(message) {
    hideLoading();

    if (contentElement) {
        contentElement.style.display = "none";
    }

    if (errorElement) {
        errorElement.style.display = "block";
    }

    if (errorTextElement) {
        errorTextElement.textContent = message;
    }

    console.error(
        "JOB DETAILS —",
        message
    );
}


/* =========================================================
   AFFICHAGE TEXTE
   ========================================================= */

function setValue(element, value) {
    if (!element) {
        return;
    }

    element.textContent = value || "";
}


function setOptionalValue(element, value) {
    if (!element) {
        return;
    }

    if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    ) {
        element.textContent = String(value);
        element.style.display = "";
    } else {
        element.textContent = "";
        element.style.display = "none";
    }
}


/* =========================================================
   AFFICHAGE LISTE
   ========================================================= */

function renderList(element, items) {
    if (!element) {
        return;
    }

    element.innerHTML = "";

    if (!items.length) {
        element.style.display = "none";
        return;
    }

    element.style.display = "";

    items.forEach(item => {
        const li =
            document.createElement("li");

        li.textContent =
            String(item);

        element.appendChild(li);
    });
}


/* =========================================================
   LOGO
   ========================================================= */

function renderLogo(job) {
    if (!jobCompanyLogo) {
        return;
    }

    const image =
        getJobImage(job);

    jobCompanyLogo.innerHTML = "";

    if (!image) {
        const placeholder =
            document.createElement("div");

        placeholder.className =
            "job-company-logo-placeholder";

        placeholder.innerHTML =
            '<i class="fa-solid fa-building"></i>';

        jobCompanyLogo.appendChild(
            placeholder
        );

        return;
    }

    const img =
        document.createElement("img");

    img.src = image;

    img.alt =
        getCompany(job);

    img.loading =
        "eager";

    img.referrerPolicy =
        "no-referrer";

    img.addEventListener(
        "error",
        () => {
            jobCompanyLogo.innerHTML = "";

            const placeholder =
                document.createElement("div");

            placeholder.className =
                "job-company-logo-placeholder";

            placeholder.innerHTML =
                '<i class="fa-solid fa-building"></i>';

            jobCompanyLogo.appendChild(
                placeholder
            );
        },
        {
            once: true
        }
    );

    jobCompanyLogo.appendChild(
        img
    );
}


/* =========================================================
   AFFICHER L'OFFRE
   ========================================================= */

function renderJob(job) {
    currentJob = job;

    const title =
        getTitle(job);

    const company =
        getCompany(job);

    const city =
        getCity(job);

    const category =
        getCategory(job);

    const contract =
        getContract(job);

    const experience =
        getExperience(job);

    const description =
        getDescription(job);

    const companyDescription =
        getCompanyDescription(job);

    const phone =
        getPhone(job);

    const email =
        getEmail(job);

    const applicationLink =
        getApplicationLink(job);

    const salary =
        getSalary(job);

    const createdAt =
        firstValue(
            job.createdAt,
            job.date,
            job.publishedAt,
            job.created_at,
            null
        );


    /* -----------------------------------------
       TITRE
       ----------------------------------------- */

    setValue(
        jobTitle,
        title
    );

    setValue(
        jobCompany,
        company
    );


    /* -----------------------------------------
       INFORMATIONS
       ----------------------------------------- */

    setOptionalValue(
        jobLocation,
        city
    );

    setOptionalValue(
        jobCategory,
        category
    );

    setOptionalValue(
        jobDate,
        formatDate(createdAt)
    );

    setOptionalValue(
        jobContract,
        contract
    );

    setOptionalValue(
        jobExperience,
        experience
    );

    setOptionalValue(
        jobSalary,
        salary
    );


    /* -----------------------------------------
       DESCRIPTION
       ----------------------------------------- */

    if (jobDescription) {
        jobDescription.textContent =
            description ||
            "Aucune description disponible.";
    }


    /* -----------------------------------------
       COMPÉTENCES
       ----------------------------------------- */

    renderList(
        jobSkills,
        getSkills(job)
    );


    /* -----------------------------------------
       EXIGENCES
       ----------------------------------------- */

    renderList(
        jobRequirements,
        getRequirements(job)
    );


    /* -----------------------------------------
       AVANTAGES
       ----------------------------------------- */

    renderList(
        jobBenefits,
        getBenefits(job)
    );


    /* -----------------------------------------
       ENTREPRISE
       ----------------------------------------- */

    setOptionalValue(
        jobCompanyDescription,
        companyDescription
    );


    /* -----------------------------------------
       TÉLÉPHONE
       ----------------------------------------- */

    if (jobPhone) {
        jobPhone.innerHTML = "";

        if (phone) {
            const link =
                document.createElement("a");

            link.href =
                "tel:" + phone;

            link.textContent =
                phone;

            jobPhone.appendChild(
                link
            );

            jobPhone.style.display =
                "";
        } else {
            jobPhone.style.display =
                "none";
        }
    }


    /* -----------------------------------------
       EMAIL
       ----------------------------------------- */

    if (jobEmail) {
        jobEmail.innerHTML = "";

        if (email) {
            const link =
                document.createElement("a");

            link.href =
                "mailto:" + email;

            link.textContent =
                email;

            jobEmail.appendChild(
                link
            );

            jobEmail.style.display =
                "";
        } else {
            jobEmail.style.display =
                "none";
        }
    }


    /* -----------------------------------------
       LIEN DE CANDIDATURE
       ----------------------------------------- */

    if (jobApplicationLink) {
        jobApplicationLink.innerHTML = "";

        if (applicationLink) {
            const link =
                document.createElement("a");

            link.href =
                applicationLink;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                "Postuler en ligne";

            jobApplicationLink.appendChild(
                link
            );

            jobApplicationLink.style.display =
                "";
        } else {
            jobApplicationLink.style.display =
                "none";
        }
    }


    /* -----------------------------------------
       BOUTON POSTULER
       ----------------------------------------- */

    if (applyButton) {
        applyButton.onclick = null;

        if (applicationLink) {
            applyButton.style.display =
                "";

            applyButton.onclick =
                function () {
                    window.open(
                        applicationLink,
                        "_blank",
                        "noopener,noreferrer"
                    );
                };

        } else if (email) {
            applyButton.style.display =
                "";

            applyButton.onclick =
                function () {
                    const subject =
                        encodeURIComponent(
                            "Candidature - " + title
                        );

                    window.location.href =
                        "mailto:" +
                        email +
                        "?subject=" +
                        subject;
                };

        } else if (phone) {
            applyButton.style.display =
                "";

            applyButton.onclick =
                function () {
                    window.location.href =
                        "tel:" + phone;
                };

        } else {
            applyButton.style.display =
                "none";
        }
    }


    /* -----------------------------------------
       LOGO
       ----------------------------------------- */

    renderLogo(job);


    /* -----------------------------------------
       FAVORI
       ----------------------------------------- */

    updateFavoriteButton();


    /* -----------------------------------------
       TITRE DU NAVIGATEUR
       ----------------------------------------- */

    document.title =
        title +
        " — " +
        company +
        " | CAMU SERVICES";
}


/* =========================================================
   FAVORIS
   ========================================================= */

function getFavorites() {
    try {
        const value =
            localStorage.getItem(
                FAVORITES_KEY
            );

        if (!value) {
            return [];
        }

        const parsed =
            JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {
        return [];
    }
}


function saveFavorites(favorites) {
    try {
        localStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(favorites)
        );
    } catch (error) {
        console.warn(
            "JOB DETAILS — Erreur favoris :",
            error
        );
    }
}


function isFavorite() {
    if (!currentJob) {
        return false;
    }

    return getFavorites().includes(
        currentJob.id
    );
}


function updateFavoriteButton() {
    if (!favoriteButton) {
        return;
    }

    const active =
        isFavorite();

    favoriteButton.classList.toggle(
        "active",
        active
    );

    favoriteButton.innerHTML =
        active
            ? '<i class="fa-solid fa-heart"></i>'
            : '<i class="fa-regular fa-heart"></i>';

    favoriteButton.setAttribute(
        "aria-label",
        active
            ? "Retirer des favoris"
            : "Ajouter aux favoris"
    );
}


function toggleFavorite() {
    if (!currentJob) {
        return;
    }

    const favorites =
        getFavorites();

    const index =
        favorites.indexOf(
            currentJob.id
        );

    if (index >= 0) {
        favorites.splice(
            index,
            1
        );
    } else {
        favorites.push(
            currentJob.id
        );
    }

    saveFavorites(
        favorites
    );

    updateFavoriteButton();
}


/* =========================================================
   PARTAGE
   ========================================================= */

async function shareJob() {
    if (!currentJob) {
        return;
    }

    const title =
        getTitle(currentJob);

    const company =
        getCompany(currentJob);

    const shareText =
        "Découvrez cette offre d'emploi sur CAMU SERVICES : " +
        title +
        " — " +
        company;

    try {
        if (
            typeof navigator.share ===
            "function"
        ) {
            await navigator.share({
                title:
                    title +
                    " — " +
                    company,

                text:
                    shareText,

                url:
                    window.location.href
            });

            return;
        }

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(
                window.location.href
            );

            alert(
                "Lien de l'offre copié."
            );

            return;
        }

        window.prompt(
            "Copiez le lien de l'offre :",
            window.location.href
        );

    } catch (error) {
        if (
            error &&
            error.name ===
            "AbortError"
        ) {
            return;
        }

        console.error(
            "JOB DETAILS — Erreur partage :",
            error
        );
    }
}


/* =========================================================
   SIGNALEMENT
   ========================================================= */

async function reportJob() {
    if (!currentJob) {
        return;
    }

    if (!db) {
        alert(
            "Firebase n'est pas disponible."
        );

        return;
    }

    const reason =
        window.prompt(
            "Pourquoi souhaitez-vous signaler cette offre ?"
        );

    if (!reason) {
        return;
    }

    try {
        const user =
            auth?.currentUser || null;

        await addDoc(
            collection(
                db,
                "jobReports"
            ),
            {
                jobId:
                    currentJob.id,

                reason:
                    reason.trim(),

                pageUrl:
                    window.location.href,

                userId:
                    user
                        ? user.uid
                        : null,

                userEmail:
                    user
                        ? user.email
                        : null,

                createdAt:
                    serverTimestamp()
            }
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


/* =========================================================
   CHARGER L'OFFRE
   ========================================================= */

async function loadJobDetails() {
    showLoading();

    const jobId =
        getJobId();

    console.log(
        "JOB DETAILS — ID demandé :",
        jobId
    );

    if (!jobId) {
        showError(
            "Aucune offre n'a été spécifiée."
        );

        return;
    }

    if (!db) {
        showError(
            "Firebase n'est pas disponible."
        );

        return;
    }

    try {
        console.log(
            "JOB DETAILS — Lecture de jobs/" +
            jobId
        );

        const jobRef =
            doc(
                db,
                "jobs",
                jobId
            );

        const snapshot =
            await getDoc(
                jobRef
            );

        console.log(
            "JOB DETAILS — Document existe :",
            snapshot.exists()
        );

        if (!snapshot.exists()) {
            showError(
                "Cette offre n'existe pas ou a été supprimée."
            );

            return;
        }

        const job = {
            id:
                snapshot.id,

            ...snapshot.data()
        };

        console.log(
            "JOB DETAILS — Offre chargée :",
            job
        );


        /* -----------------------------------------
           STATUT
           ----------------------------------------- */

        const status =
            normalizeText(
                job.status
            );

        const allowedStatuses = [
            "active",
            "published",
            "publie",
            "publiee",
            "public",
            "valide"
        ];

        if (
            status &&
            !allowedStatuses.includes(
                status
            )
        ) {
            showError(
                "Cette offre n'est plus disponible."
            );

            return;
        }


        /* -----------------------------------------
           RENDU
           ----------------------------------------- */

        renderJob(
            job
        );

        showContent();

        console.log(
            "JOB DETAILS — Offre affichée avec succès."
        );

    } catch (error) {
        console.error(
            "JOB DETAILS — Erreur chargement :",
            error
        );

        showError(
            "Impossible de charger cette offre."
        );

    } finally {
        hideLoading();
    }
}


/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */

if (favoriteButton) {
    favoriteButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            toggleFavorite();
        }
    );
}


if (shareButton) {
    shareButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            shareJob();
        }
    );
}


if (reportButton) {
    reportButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            reportJob();
        }
    );
}


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadJobDetails();
    }
);


/* =========================================================
   DEBUG
   ========================================================= */

window.CAMU_JOB_DETAILS = {
    loadJobDetails,
    toggleFavorite,
    shareJob,
    reportJob
};
