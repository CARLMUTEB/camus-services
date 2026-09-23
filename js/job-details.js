/* =========================================================
   CAMU SERVICES — DÉTAIL D'UNE OFFRE JOB
   Fichier : js/job-details.js

   Fonctionnalités :
   - Récupération de l'ID depuis l'URL
   - Lecture de l'offre dans Firestore
   - Affichage des informations
   - Logo entreprise
   - Description
   - Compétences
   - Profil recherché
   - Avantages
   - Salaire
   - Contact
   - Lien de candidature
   - Favori
   - Partage
   - Signalement
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    collection
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

let db = null;

try {

    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas initialisé."
        );
    }

    const app = getApp();

    db = getFirestore(app);

} catch (error) {

    console.error(
        "JOB DETAILS — Erreur Firebase :",
        error
    );

}


/* =========================================================
   PARAMÈTRES URL
========================================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const jobId =
    urlParams.get("id");


/* =========================================================
   ÉLÉMENTS DOM
========================================================= */

const loading =
    document.getElementById(
        "jobDetailsLoading"
    );

const errorBox =
    document.getElementById(
        "jobDetailsError"
    );

const content =
    document.getElementById(
        "jobDetailsContent"
    );

const logoBox =
    document.getElementById(
        "jobDetailsLogo"
    );

const company =
    document.getElementById(
        "jobDetailsCompany"
    );

const locationElement =
    document.getElementById(
        "jobDetailsLocation"
    );

const title =
    document.getElementById(
        "jobDetailsTitle"
    );

const category =
    document.getElementById(
        "jobDetailsCategory"
    );

const date =
    document.getElementById(
        "jobDetailsDate"
    );

const contract =
    document.getElementById(
        "jobDetailsContract"
    );

const experience =
    document.getElementById(
        "jobDetailsExperience"
    );

const salary =
    document.getElementById(
        "jobDetailsSalary"
    );

const city =
    document.getElementById(
        "jobDetailsCity"
    );

const description =
    document.getElementById(
        "jobDetailsDescription"
    );

const skills =
    document.getElementById(
        "jobDetailsSkills"
    );

const requirements =
    document.getElementById(
        "jobDetailsRequirements"
    );

const benefits =
    document.getElementById(
        "jobDetailsBenefits"
    );

const skillsSection =
    document.getElementById(
        "jobSkillsSection"
    );

const requirementsSection =
    document.getElementById(
        "jobRequirementsSection"
    );

const benefitsSection =
    document.getElementById(
        "jobBenefitsSection"
    );

const favoriteButton =
    document.getElementById(
        "jobDetailsFavorite"
    );

const shareButton =
    document.getElementById(
        "jobShareButton"
    );

const applyButton =
    document.getElementById(
        "jobApplyButton"
    );

const companySideName =
    document.getElementById(
        "jobCompanySideName"
    );

const companyDescription =
    document.getElementById(
        "jobCompanyDescription"
    );

const phoneLink =
    document.getElementById(
        "jobPhone"
    );

const emailLink =
    document.getElementById(
        "jobEmail"
    );

const applicationLink =
    document.getElementById(
        "jobApplicationLink"
    );

const reportButton =
    document.getElementById(
        "reportJobButton"
    );


/* =========================================================
   VARIABLES
========================================================= */

let currentJob = null;

const FAVORITES_KEY =
    "camu_jobs_favorites";


/* =========================================================
   UTILITAIRES
========================================================= */

function normalizeText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
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


    if (typeof value === "number") {

        const result =
            new Date(value);

        return isNaN(
            result.getTime()
        )
            ? null
            : result;

    }


    if (typeof value === "string") {

        const result =
            new Date(value);

        return isNaN(
            result.getTime()
        )
            ? null
            : result;

    }


    return null;

}


function formatDate(value) {

    const dateValue =
        getDateValue(value);


    if (!dateValue) {
        return "Date non précisée";
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(dateValue);

}


/* =========================================================
   SALAIRE
========================================================= */

function formatSalary(job) {

    const directSalary =
        firstValue(
            job.salary,
            job.salaire,
            job.remuneration
        );


    if (directSalary) {
        return String(directSalary);
    }


    const min =
        firstValue(
            job.salaryMin,
            job.salaireMin
        );

    const max =
        firstValue(
            job.salaryMax,
            job.salaireMax
        );

    const currency =
        firstValue(
            job.currency,
            job.devise
        );


    if (min && max) {

        return `${min} - ${max}${
            currency
                ? ` ${currency}`
                : ""
        }`;

    }


    if (min) {

        return `À partir de ${min}${
            currency
                ? ` ${currency}`
                : ""
        }`;

    }


    if (max) {

        return `Jusqu'à ${max}${
            currency
                ? ` ${currency}`
                : ""
        }`;

    }


    return "Salaire à négocier";

}


/* =========================================================
   FAVORIS
========================================================= */

function getFavorites() {

    try {

        const stored =
            localStorage.getItem(
                FAVORITES_KEY
            );


        if (!stored) {
            return [];
        }


        const parsed =
            JSON.parse(stored);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.warn(
            "JOB DETAILS — Erreur favoris :",
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


function isFavorite() {

    if (!jobId) {
        return false;
    }

    return getFavorites().includes(
        jobId
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


    favoriteButton.setAttribute(
        "title",
        active
            ? "Retirer des favoris"
            : "Ajouter aux favoris"
    );

}


function toggleFavorite() {

    if (!jobId) {
        return;
    }


    const favorites =
        getFavorites();


    const index =
        favorites.indexOf(jobId);


    if (index >= 0) {

        favorites.splice(
            index,
            1
        );

    } else {

        favorites.push(jobId);

    }


    saveFavorites(
        favorites
    );


    updateFavoriteButton();

}


/* =========================================================
   AFFICHAGE SIMPLE
========================================================= */

function setText(
    element,
    value,
    fallback = "—"
) {

    if (!element) {
        return;
    }


    const finalValue =
        firstValue(
            value,
            fallback
        );


    element.textContent =
        finalValue;

}


/* =========================================================
   DESCRIPTION
========================================================= */

function renderRichText(
    element,
    value,
    fallback = "Aucune information disponible."
) {

    if (!element) {
        return;
    }


    const text =
        firstValue(
            value
        );


    if (!text) {

        element.innerHTML = `
            <p>${escapeHtml(fallback)}</p>
        `;

        return;

    }


    /*
     * On conserve les retours à la ligne.
     * Le CSS possède déjà white-space: pre-line.
     */

    element.textContent =
        String(text);

}


/* =========================================================
   TAGS / COMPÉTENCES
========================================================= */

function normalizeArray(value) {

    if (Array.isArray(value)) {

        return value
            .map(item => String(item).trim())
            .filter(Boolean);

    }


    if (typeof value === "string") {

        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);

    }


    return [];

}


function renderSkills(job) {

    if (!skills) {
        return;
    }


    const skillsData =
        normalizeArray(
            firstValue(
                job.skills,
                job.competences,
                job.tags
            )
        );


    if (!skillsData.length) {

        if (skillsSection) {
            skillsSection.style.display =
                "none";
        }

        return;

    }


    if (skillsSection) {
        skillsSection.style.display =
            "";
    }


    skills.innerHTML =
        skillsData
            .map(skill => `
                <span class="job-tag">
                    ${escapeHtml(skill)}
                </span>
            `)
            .join("");

}


/* =========================================================
   LOGO
========================================================= */

function renderLogo(job) {

    if (!logoBox) {
        return;
    }


    const logo =
        firstValue(
            job.image,
            job.logo,
            job.companyLogo,
            job.photo,
            job.imageUrl
        );


    const companyName =
        firstValue(
            job.company,
            job.entreprise,
            "Entreprise"
        );


    if (logo) {

        logoBox.innerHTML = `
            <img
                src="${escapeHtml(logo)}"
                alt="${escapeHtml(companyName)}"
            >
        `;


        const image =
            logoBox.querySelector("img");


        if (image) {

            image.addEventListener(
                "error",
                () => {

                    logoBox.innerHTML = `
                        <i class="fa-solid fa-building"></i>
                    `;

                }
            );

        }

    } else {

        logoBox.innerHTML = `
            <i class="fa-solid fa-building"></i>
        `;

    }

}


/* =========================================================
   CONTACT
========================================================= */

function renderContact(job) {

    const phone =
        firstValue(
            job.phone,
            job.telephone,
            job.mobile,
            job.contactPhone
        );


    const email =
        firstValue(
            job.email,
            job.contactEmail
        );


    const link =
        firstValue(
            job.applicationLink,
            job.applyLink,
            job.url,
            job.link
        );


    /* Téléphone */

    if (phoneLink) {

        if (phone) {

            phoneLink.href =
                `tel:${String(phone)
                    .replace(/\s+/g, "")}`;

            phoneLink.style.display =
                "flex";

            const span =
                phoneLink.querySelector(
                    "span"
                );

            if (span) {
                span.textContent =
                    phone;
            }

        } else {

            phoneLink.style.display =
                "none";

        }

    }


    /* Email */

    if (emailLink) {

        if (email) {

            emailLink.href =
                `mailto:${String(email)}`;

            emailLink.style.display =
                "flex";

            const span =
                emailLink.querySelector(
                    "span"
                );

            if (span) {

                span.textContent =
                    email;

            }

        } else {

            emailLink.style.display =
                "none";

        }

    }


    /* Lien candidature */

    if (applicationLink) {

        if (link) {

            applicationLink.href =
                String(link);

            applicationLink.style.display =
                "flex";

        } else {

            applicationLink.style.display =
                "none";

        }

    }


    /*
     * Bouton principal Postuler
     */

    if (applyButton) {

        if (link) {

            applyButton.href =
                String(link);

            applyButton.target =
                "_blank";

            applyButton.rel =
                "noopener noreferrer";

        } else if (email) {

            applyButton.href =
                `mailto:${email}?subject=${
                    encodeURIComponent(
                        `Candidature - ${
                            firstValue(
                                job.title,
                                job.poste,
                                "Offre d'emploi"
                            )
                        }`
                    )
                `;

        } else if (phone) {

            applyButton.href =
                `tel:${String(phone)
                    .replace(/\s+/g, "")}`;

        } else {

            applyButton.href =
                "#";

            applyButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    alert(
                        "Les informations de candidature ne sont pas encore disponibles pour cette offre."
                    );

                }
            );

        }

    }

}


/* =========================================================
   RENDU DE L'OFFRE
========================================================= */

function renderJob(job) {

    currentJob = job;


    /* -----------------------------------------
       TITRE
    ----------------------------------------- */

    const jobTitle =
        firstValue(
            job.title,
            job.poste,
            job.name,
            "Poste non précisé"
        );


    setText(
        title,
        jobTitle,
        "Poste non précisé"
    );


    document.title =
        `${jobTitle} – CAMU SERVICES`;


    /* -----------------------------------------
       ENTREPRISE
    ----------------------------------------- */

    const companyName =
        firstValue(
            job.company,
            job.entreprise,
            job.employer,
            "Entreprise non précisée"
        );


    setText(
        company,
        companyName,
        "Entreprise non précisée"
    );


    setText(
        companySideName,
        companyName,
        "Entreprise"
    );


    /* -----------------------------------------
       VILLE
    ----------------------------------------- */

    const jobCity =
        firstValue(
            job.city,
            job.ville,
            job.location,
            job.localisation,
            "Ville non précisée"
        );


    if (locationElement) {

        locationElement.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            ${escapeHtml(jobCity)}
        `;

    }


    setText(
        city,
        jobCity,
        "Ville non précisée"
    );


    /* -----------------------------------------
       CATÉGORIE
    ----------------------------------------- */

    setText(
        category,
        firstValue(
            job.category,
            job.categoryName,
            job.categorie,
            job.domaine,
            job.sector,
            "Emploi"
        ),
        "Emploi"
    );


    /* -----------------------------------------
       DATE
    ----------------------------------------- */

    const createdAt =
        firstValue(
            job.createdAt,
            job.date,
            job.publishedAt,
            job.created_at
        );


    setText(
        date,
        formatDate(createdAt),
        "Date non précisée"
    );


    /* -----------------------------------------
       CONTRAT
    ----------------------------------------- */

    setText(
        contract,
        firstValue(
            job.contractType,
            job.typeContrat,
            job.contract,
            job.type,
            "Non précisé"
        ),
        "Non précisé"
    );


    /* -----------------------------------------
       EXPÉRIENCE
    ----------------------------------------- */

    setText(
        experience,
        firstValue(
            job.experience,
            job.experienceLevel,
            job.niveauExperience,
            "Non précisée"
        ),
        "Non précisée"
    );


    /* -----------------------------------------
       SALAIRE
    ----------------------------------------- */

    setText(
        salary,
        formatSalary(job),
        "Salaire à négocier"
    );


    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

    renderRichText(
        description,
        firstValue(
            job.description,
            job.details,
            job.content,
            job.resume
        )
    );


    /* -----------------------------------------
       PROFIL RECHERCHÉ
    ----------------------------------------- */

    const requirementsValue =
        firstValue(
            job.requirements,
            job.exigences,
            job.profile,
            job.profil,
            job.qualifications
        );


    if (requirementsValue) {

        if (requirementsSection) {
            requirementsSection.style.display =
                "";
        }

        renderRichText(
            requirements,
            requirementsValue
        );

    } else {

        if (requirementsSection) {
            requirementsSection.style.display =
                "none";
        }

    }


    /* -----------------------------------------
       AVANTAGES
    ----------------------------------------- */

    const benefitsValue =
        firstValue(
            job.benefits,
            job.avantages,
            job.perks
        );


    if (benefitsValue) {

        if (benefitsSection) {
            benefitsSection.style.display =
                "";
        }

        renderRichText(
            benefits,
            benefitsValue
        );

    } else {

        if (benefitsSection) {
            benefitsSection.style.display =
                "none";
        }

    }


    /* -----------------------------------------
       ENTREPRISE — DESCRIPTION
    ----------------------------------------- */

    const companyDesc =
        firstValue(
            job.companyDescription,
            job.descriptionCompany,
            job.aboutCompany,
            job.companyAbout,
            job.entrepriseDescription
        );


    if (companyDescription) {

        companyDescription.textContent =
            companyDesc ||
            "Aucune présentation disponible.";

    }


    /* -----------------------------------------
       LOGO
    ----------------------------------------- */

    renderLogo(job);


    /* -----------------------------------------
       COMPÉTENCES
    ----------------------------------------- */

    renderSkills(job);


    /* -----------------------------------------
       CONTACT
    ----------------------------------------- */

    renderContact(job);


    /* -----------------------------------------
       FAVORI
    ----------------------------------------- */

    updateFavoriteButton();


    /* -----------------------------------------
       AFFICHER
    ----------------------------------------- */

    if (loading) {
        loading.style.display =
            "none";
    }

    if (errorBox) {
        errorBox.style.display =
            "none";
    }

    if (content) {
        content.style.display =
            "block";
    }

}


/* =========================================================
   CHARGER L'OFFRE
========================================================= */

async function loadJobDetails() {

    if (!jobId) {

        showError(
            "Aucun identifiant d'offre n'a été fourni."
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

        if (loading) {
            loading.style.display =
                "flex";
        }


        const jobReference =
            doc(
                db,
                "jobs",
                jobId
            );


        const jobSnapshot =
            await getDoc(
                jobReference
            );


        if (!jobSnapshot.exists()) {

            showError(
                "Cette offre n'existe plus ou n'est plus disponible."
            );

            return;

        }


        const job =
            {
                id: jobSnapshot.id,
                ...jobSnapshot.data()
            };


        /*
         * Vérification du statut.
         * Si le champ n'existe pas,
         * on laisse l'offre accessible.
         */

        const status =
            normalizeText(
                job.status
            );


        if (
            status &&
            ![
                "active",
                "published",
                "publie",
                "publiee",
                "public",
                "valide"
            ].includes(status)
        ) {

            showError(
                "Cette offre n'est plus disponible."
            );

            return;

        }


        renderJob(job);


        console.log(
            "JOB DETAILS — Offre chargée :",
            job
        );


    } catch (error) {

        console.error(
            "JOB DETAILS — Erreur :",
            error
        );


        showError(
            "Une erreur est survenue lors du chargement de cette offre."
        );

    }

}


/* =========================================================
   ERREUR
========================================================= */

function showError(message) {

    if (loading) {
        loading.style.display =
            "none";
    }


    if (content) {
        content.style.display =
            "none";
    }


    if (errorBox) {

        errorBox.style.display =
            "block";


        const paragraph =
            errorBox.querySelector(
                "p"
            );


        if (paragraph) {
            paragraph.textContent =
                message;
        }

    }

}


/* =========================================================
   PARTAGE
========================================================= */

async function shareJob() {

    if (!currentJob) {
        return;
    }


    const jobTitle =
        firstValue(
            currentJob.title,
            currentJob.poste,
            "Offre d'emploi"
        );


    const companyName =
        firstValue(
            currentJob.company,
            currentJob.entreprise,
            ""
        );


    const shareUrl =
        window.location.href;


    const shareData = {

        title:
            `${jobTitle} – CAMU SERVICES`,

        text:
            companyName
                ? `${jobTitle} chez ${companyName}`
                : jobTitle,

        url:
            shareUrl

    };


    try {

        if (
            navigator.share &&
            typeof navigator.share === "function"
        ) {

            await navigator.share(
                shareData
            );

            return;

        }


        /*
         * Fallback : copier le lien
         */

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
