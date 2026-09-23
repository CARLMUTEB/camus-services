/* =========================================================
   CAMU SERVICES — SPACE JOBS
   Fichier : js/jobs.js

   Fonctionnalités :
   - Chargement des offres depuis Firestore
   - Recherche
   - Filtre par ville
   - Filtre par domaine
   - Filtre par contrat
   - Filtre par expérience
   - Tri
   - Compteur d'offres
   - Favoris
   - État vide
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
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
            "Firebase n'est pas encore initialisé par app.js."
        );
    }

    const app = getApp();

    db = getFirestore(app);
    auth = getAuth(app);

} catch (error) {

    console.error(
        "JOBS — Erreur initialisation Firebase :",
        error
    );

}


/* =========================================================
   VARIABLES
========================================================= */

let allJobs = [];
let filteredJobs = [];

const FAVORITES_KEY = "camu_jobs_favorites";


/* =========================================================
   ÉLÉMENTS DOM
========================================================= */

const jobSearch = document.getElementById("jobSearch");
const jobCity = document.getElementById("jobCity");
const jobCategory = document.getElementById("jobCategory");
const jobContract = document.getElementById("jobContract");
const jobExperience = document.getElementById("jobExperience");
const jobSort = document.getElementById("jobSort");

const jobSearchButton =
    document.getElementById("jobSearchButton");

const resetJobFilters =
    document.getElementById("resetJobFilters");

const emptyResetButton =
    document.getElementById("emptyResetButton");

const jobsList =
    document.getElementById("jobsList");

const jobsLoading =
    document.getElementById("jobsLoading");

const jobsEmpty =
    document.getElementById("jobsEmpty");

const jobsCount =
    document.getElementById("jobsCount");


/* =========================================================
   UTILITAIRES
========================================================= */

function normalizeText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* ---------------------------------------------------------
   ÉCHAPPER HTML
--------------------------------------------------------- */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ---------------------------------------------------------
   VALEUR CHAMPS
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   DATE FIRESTORE
--------------------------------------------------------- */

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

        const date = new Date(value);

        if (!isNaN(date.getTime())) {
            return date;
        }

    }

    if (typeof value === "string") {

        const date = new Date(value);

        if (!isNaN(date.getTime())) {
            return date;
        }

    }

    return null;

}


/* ---------------------------------------------------------
   FORMAT DATE
--------------------------------------------------------- */

function formatDate(value) {

    const date = getDateValue(value);

    if (!date) {
        return "Date non précisée";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* ---------------------------------------------------------
   TIMESTAMP POUR TRI
--------------------------------------------------------- */

function getTimestamp(value) {

    const date = getDateValue(value);

    return date ? date.getTime() : 0;

}


/* ---------------------------------------------------------
   SALAIRE
--------------------------------------------------------- */

function formatSalary(job) {

    const salary = firstValue(
        job.salary,
        job.remuneration,
        job.salaire
    );

    if (salary) {
        return String(salary);
    }


    const min = firstValue(
        job.salaryMin,
        job.salaireMin
    );

    const max = firstValue(
        job.salaryMax,
        job.salaireMax
    );

    const currency = firstValue(
        job.currency,
        job.devise
    );

    if (min && max) {

        return `${min} - ${max}${currency ? ` ${currency}` : ""}`;

    }

    if (min) {

        return `À partir de ${min}${currency ? ` ${currency}` : ""}`;

    }

    if (max) {

        return `Jusqu'à ${max}${currency ? ` ${currency}` : ""}`;

    }

    return "Salaire à négocier";

}


/* ---------------------------------------------------------
   LOGO
--------------------------------------------------------- */

function getCompanyLogo(job) {

    return firstValue(
        job.image,
        job.logo,
        job.companyLogo,
        job.photo,
        job.imageUrl
    );

}


/* ---------------------------------------------------------
   TYPE CONTRAT
--------------------------------------------------------- */

function getContract(job) {

    return firstValue(
        job.contractType,
        job.typeContrat,
        job.contract,
        job.type
    );

}


/* ---------------------------------------------------------
   EXPÉRIENCE
--------------------------------------------------------- */

function getExperience(job) {

    return firstValue(
        job.experience,
        job.experienceLevel,
        job.niveauExperience
    );

}


/* ---------------------------------------------------------
   VILLE
--------------------------------------------------------- */

function getCity(job) {

    return firstValue(
        job.city,
        job.ville,
        job.location,
        job.localisation
    );

}


/* ---------------------------------------------------------
   DOMAINE
--------------------------------------------------------- */

function getCategory(job) {

    return firstValue(
        job.category,
        job.categoryName,
        job.categorie,
        job.domaine,
        job.sector
    );

}


/* ---------------------------------------------------------
   DESCRIPTION
--------------------------------------------------------- */

function getDescription(job) {

    return firstValue(
        job.description,
        job.details,
        job.content,
        job.resume
    );

}


/* ---------------------------------------------------------
   COMPÉTENCES
--------------------------------------------------------- */

function getSkills(job) {

    const skills = firstValue(
        job.skills,
        job.competences,
        job.tags
    );

    if (Array.isArray(skills)) {
        return skills;
    }

    if (typeof skills === "string") {

        return skills
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);

    }

    return [];

}


/* =========================================================
   FAVORIS
========================================================= */

function getFavorites() {

    try {

        const value =
            localStorage.getItem(FAVORITES_KEY);

        if (!value) {
            return [];
        }

        const parsed = JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.warn(
            "JOBS — Impossible de lire les favoris :",
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


function isFavorite(jobId) {

    return getFavorites().includes(jobId);

}


function toggleFavorite(jobId) {

    const favorites = getFavorites();

    const index =
        favorites.indexOf(jobId);


    if (index >= 0) {

        favorites.splice(index, 1);

    } else {

        favorites.push(jobId);

    }


    saveFavorites(favorites);

    renderJobs(filteredJobs);

}


/* =========================================================
   VILLE — REMPLIR SELECT
========================================================= */

function populateCities(jobs) {

    if (!jobCity) {
        return;
    }


    const currentValue = jobCity.value;


    const cities = [
        ...new Set(
            jobs
                .map(job => getCity(job))
                .filter(Boolean)
                .map(city => String(city).trim())
        )
    ];


    cities.sort((a, b) =>
        a.localeCompare(b, "fr")
    );


    jobCity.innerHTML = `
        <option value="">
            Toutes les villes
        </option>
    `;


    cities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;
        option.textContent = city;

        jobCity.appendChild(option);

    });


    if (
        cities.some(city => city === currentValue)
    ) {
        jobCity.value = currentValue;
    }

}


/* =========================================================
   CHARGER LES JOBS
========================================================= */

async function loadJobs() {

    if (!db) {

        showError(
            "Firebase n'est pas disponible."
        );

        return;

    }


    showLoading(true);


    try {

        const snapshot =
            await getDocs(
                collection(db, "jobs")
            );


        allJobs = [];


        snapshot.forEach(documentSnapshot => {

            const data =
                documentSnapshot.data();


            allJobs.push({
                id: documentSnapshot.id,
                ...data
            });

        });


        /*
         * On conserve les offres publiées.
         * Si aucune propriété status n'est présente,
         * l'offre reste affichable.
         */

        allJobs = allJobs.filter(job => {

            const status =
                normalizeText(job.status);

            if (!status) {
                return true;
            }

            return [
                "active",
                "published",
                "publie",
                "publiee",
                "public",
                "valide"
            ].includes(status);

        });


        populateCities(allJobs);


        filteredJobs = [...allJobs];


        applyFilters();


        console.log(
            "JOBS — Offres chargées :",
            allJobs
        );


    } catch (error) {

        console.error(
            "JOBS — Erreur chargement des offres :",
            error
        );


        showError(
            "Impossible de charger les offres pour le moment."
        );


    } finally {

        showLoading(false);

    }

}


/* =========================================================
   FILTRES
========================================================= */

function applyFilters() {

    const keyword =
        normalizeText(
            jobSearch?.value
        );

    const city =
        normalizeText(
            jobCity?.value
        );

    const category =
        normalizeText(
            jobCategory?.value
        );

    const contract =
        normalizeText(
            jobContract?.value
        );

    const experience =
        normalizeText(
            jobExperience?.value
        );


    filteredJobs =
        allJobs.filter(job => {

            /* -----------------------------------------
               RECHERCHE
            ----------------------------------------- */

            if (keyword) {

                const skills =
                    getSkills(job)
                        .join(" ");


                const searchContent =
                    normalizeText(
                        [
                            job.title,
                            job.poste,
                            job.name,
                            job.company,
                            job.entreprise,
                            getDescription(job),
                            getCategory(job),
                            getCity(job),
                            getContract(job),
                            getExperience(job),
                            skills
                        ].join(" ")
                    );


                if (
                    !searchContent.includes(keyword)
                ) {
                    return false;
                }

            }


            /* -----------------------------------------
               VILLE
            ----------------------------------------- */

            if (city) {

                if (
                    normalizeText(
                        getCity(job)
                    ) !== city
                ) {
                    return false;
                }

            }


            /* -----------------------------------------
               DOMAINE
            ----------------------------------------- */

            if (category) {

                const jobCategoryValue =
                    normalizeText(
                        getCategory(job)
                    );


                if (
                    !jobCategoryValue.includes(
                        category
                    )
                ) {
                    return false;
                }

            }


            /* -----------------------------------------
               CONTRAT
            ----------------------------------------- */

            if (contract) {

                const jobContractValue =
                    normalizeText(
                        getContract(job)
                    );


                if (
                    !jobContractValue.includes(
                        contract
                    )
                ) {
                    return false;
                }

            }


            /* -----------------------------------------
               EXPÉRIENCE
            ----------------------------------------- */

            if (experience) {

                const jobExperienceValue =
                    normalizeText(
                        getExperience(job)
                    );


                if (
                    !matchesExperience(
                        jobExperienceValue,
                        experience
                    )
                ) {
                    return false;
                }

            }


            return true;

        });


    applySort();


    renderJobs(filteredJobs);

}


/* =========================================================
   EXPÉRIENCE — CORRESPONDANCE
========================================================= */

function matchesExperience(
    value,
    filter
) {

    if (!value) {
        return false;
    }


    const aliases = {
        debutant: [
            "debutant",
            "sans experience",
            "aucune experience",
            "0",
            "junior"
        ],

        "1-2": [
            "1-2",
            "1 a 2",
            "1 an",
            "2 ans"
        ],

        "3-5": [
            "3-5",
            "3 a 5",
            "3 ans",
            "4 ans",
            "5 ans"
        ],

        "5+": [
            "5+",
            "plus de 5",
            "5 ans et plus",
            "senior",
            "expert"
        ]
    };


    const possibleValues =
        aliases[filter] || [];


    return possibleValues.some(
        item => value.includes(item)
    );

}


/* =========================================================
   TRI
========================================================= */

function applySort() {

    const sort =
        jobSort?.value || "recent";


    if (sort === "recent") {

        filteredJobs.sort(
            (a, b) =>
                getTimestamp(
                    firstValue(
                        b.createdAt,
                        b.date,
                        b.publishedAt,
                        b.created_at
                    )
                )
                -
                getTimestamp(
                    firstValue(
                        a.createdAt,
                        a.date,
                        a.publishedAt,
                        a.created_at
                    )
                )
        );

        return;
    }


    if (sort === "old") {

        filteredJobs.sort(
            (a, b) =>
                getTimestamp(
                    firstValue(
                        a.createdAt,
                        a.date,
                        a.publishedAt,
                        a.created_at
                    )
                )
                -
                getTimestamp(
                    firstValue(
                        b.createdAt,
                        b.date,
                        b.publishedAt,
                        b.created_at
                    )
                )
        );

        return;
    }


    if (sort === "title") {

        filteredJobs.sort(
            (a, b) => {

                const titleA =
                    firstValue(
                        a.title,
                        a.poste,
                        a.name
                    );

                const titleB =
                    firstValue(
                        b.title,
                        b.poste,
                        b.name
                    );


                return String(titleA)
                    .localeCompare(
                        String(titleB),
                        "fr"
                    );

            }
        );

    }

}


/* =========================================================
   RENDU DES JOBS
========================================================= */

function renderJobs(jobs) {

    if (!jobsList) {
        return;
    }


    jobsList.innerHTML = "";


    updateCount(jobs.length);


    if (!jobs.length) {

        showEmpty(true);

        return;

    }


    showEmpty(false);


    jobs.forEach(job => {

        const card =
            createJobCard(job);

        jobsList.appendChild(card);

    });

}


/* =========================================================
   CRÉER UNE CARTE
========================================================= */

function createJobCard(job) {

    const article =
        document.createElement("article");


    article.className = "job-card";


    article.dataset.jobId = job.id;


    const title =
        firstValue(
            job.title,
            job.poste,
            job.name,
            "Poste non précisé"
        );


    const company =
        firstValue(
            job.company,
            job.entreprise,
            job.employer,
            "Entreprise non précisée"
        );


    const city =
        getCity(job) ||
        "Ville non précisée";


    const category =
        getCategory(job);


    const contract =
        getContract(job);


    const experience =
        getExperience(job);


    const description =
        getDescription(job) ||
        "Aucune description disponible.";


    const salary =
        formatSalary(job);


    const logo =
        getCompanyLogo(job);


    const createdAt =
        firstValue(
            job.createdAt,
            job.date,
            job.publishedAt,
            job.created_at
        );


    const skills =
        getSkills(job);


    const favorite =
        isFavorite(job.id);


    /* -----------------------------------------------------
       LOGO
    ----------------------------------------------------- */

    let logoHtml;


    if (logo) {

        logoHtml = `
            <div class="job-company-logo">
                <img
                    src="${escapeHtml(logo)}"
                    alt="${escapeHtml(company)}"
                    loading="lazy"
                >
            </div>
        `;

    } else {

        logoHtml = `
            <div class="job-company-logo">
                <i class="fa-solid fa-building"></i>
            </div>
        `;

    }


    /* -----------------------------------------------------
       META
    ----------------------------------------------------- */

    let metaHtml = "";


    if (city) {

        metaHtml += `
            <span class="job-meta-item">
                <i class="fa-solid fa-location-dot"></i>
                ${escapeHtml(city)}
            </span>
        `;

    }


    if (contract) {

        metaHtml += `
            <span class="job-meta-item">
                <i class="fa-solid fa-file-contract"></i>
                ${escapeHtml(contract)}
            </span>
        `;

    }


    if (experience) {

        metaHtml += `
            <span class="job-meta-item">
                <i class="fa-solid fa-user-clock"></i>
                ${escapeHtml(experience)}
            </span>
        `;

    }


    /* -----------------------------------------------------
       TAGS
    ----------------------------------------------------- */

    let tagsHtml = "";


    if (category) {

        tagsHtml += `
            <span class="job-tag">
                ${escapeHtml(category)}
            </span>
        `;

    }


    skills
        .slice(0, 3)
        .forEach(skill => {

            tagsHtml += `
                <span class="job-tag">
                    ${escapeHtml(skill)}
                </span>
            `;

        });


    /* -----------------------------------------------------
       LIEN OFFRE
    ----------------------------------------------------- */

    const detailUrl =
        `job-details.html?id=${encodeURIComponent(job.id)}`;


    /* -----------------------------------------------------
       HTML
    ----------------------------------------------------- */

    article.innerHTML = `

        <div class="job-card-header">

            ${logoHtml}

            <div class="job-card-heading">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p class="job-company">
                    ${escapeHtml(company)}
                </p>

            </div>

        </div>


        <button
            type="button"
            class="job-favorite ${favorite ? "active" : ""}"
            data-job-id="${escapeHtml(job.id)}"
            aria-label="${
                favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
            }"
            title="${
                favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
            }"
        >
            <i class="${
                favorite
                    ? "fa-solid fa-heart"
                    : "fa-regular fa-heart"
            }"></i>
        </button>


        <div class="job-card-body">

            <p class="job-description">
                ${escapeHtml(description)}
            </p>


            <div class="job-meta">

                ${metaHtml}

            </div>


            ${
                tagsHtml
                    ? `
                        <div class="job-tags">
                            ${tagsHtml}
                        </div>
                    `
                    : ""
            }


            <div class="job-card-footer">

                <div>

                    <span class="job-salary-label">
                        Rémunération
                    </span>

                    <span class="job-salary">
                        ${escapeHtml(salary)}
                    </span>

                </div>


                <a
                    href="${detailUrl}"
                    class="job-view-button"
                >
                    Voir l'offre
                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        </div>
    `;


    /* -----------------------------------------------------
       FAVORI
    ----------------------------------------------------- */

    const favoriteButton =
        article.querySelector(
            ".job-favorite"
        );


    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                toggleFavorite(job.id);

            }
        );

    }


    return article;

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateCount(count) {

    if (!jobsCount) {
        return;
    }


    jobsCount.textContent =
        `${count} offre${count > 1 ? "s" : ""}`;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(show) {

    if (!jobsLoading) {
        return;
    }


    jobsLoading.style.display =
        show ? "flex" : "none";


    if (show && jobsList) {
        jobsList.innerHTML = "";
    }

    if (show) {
        showEmpty(false);
    }

}


/* =========================================================
   EMPTY
========================================================= */

function showEmpty(show) {

    if (!jobsEmpty) {
        return;
    }


    jobsEmpty.style.display =
        show ? "block" : "none";

}


/* =========================================================
   ERREUR
========================================================= */

function showError(message) {

    if (jobsLoading) {

        jobsLoading.style.display = "none";

    }


    if (jobsList) {

        jobsList.innerHTML = `
            <div
                style="
                    grid-column: 1 / -1;
                    padding: 35px 20px;
                    text-align: center;
                    border: 1px solid #f0d5d5;
                    border-radius: 16px;
                    background: #fff7f7;
                "
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="
                        margin-bottom: 12px;
                        font-size: 28px;
                        color: #d9534f;
                    "
                ></i>

                <p
                    style="
                        margin: 0;
                        color: #7c4b4b;
                        font-size: 14px;
                    "
                >
                    ${escapeHtml(message)}
                </p>

            </div>
        `;

    }


    updateCount(0);
    showEmpty(false);

}


/* =========================================================
   RÉINITIALISER FILTRES
========================================================= */

function resetFilters() {

    if (jobSearch) {
        jobSearch.value = "";
    }

    if (jobCity) {
        jobCity.value = "";
    }

    if (jobCategory) {
        jobCategory.value = "";
    }

    if (jobContract) {
        jobContract.value = "";
    }

    if (jobExperience) {
        jobExperience.value = "";
    }

    if (jobSort) {
        jobSort.value = "recent";
    }


    filteredJobs = [...allJobs];

    applyFilters();

}


/* =========================================================
   ÉVÉNEMENTS
========================================================= */

if (jobSearch) {

    jobSearch.addEventListener(
        "input",
        applyFilters
    );

}


if (jobCity) {

    jobCity.addEventListener(
        "change",
        applyFilters
    );

}


if (jobCategory) {

    jobCategory.addEventListener(
        "change",
        applyFilters
    );

}


if (jobContract) {

    jobContract.addEventListener(
        "change",
        applyFilters
    );

}


if (jobExperience) {

    jobExperience.addEventListener(
        "change",
        applyFilters
    );

}


if (jobSort) {

    jobSort.addEventListener(
        "change",
        applyFilters
    );

}


if (jobSearchButton) {

    jobSearchButton.addEventListener(
        "click",
        applyFilters
    );

}


if (resetJobFilters) {

    resetJobFilters.addEventListener(
        "click",
        resetFilters
    );

}


if (emptyResetButton) {

    emptyResetButton.addEventListener(
        "click",
        resetFilters
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadJobs();

    }
);
