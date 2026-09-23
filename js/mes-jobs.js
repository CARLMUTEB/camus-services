/* =========================================================
   CAMU SERVICES — MES OFFRES JOB
   Fichier : js/mes-jobs.js

   Fonctionnalités :
   - Authentification
   - Chargement des offres de l'utilisateur
   - Statistiques
   - Recherche
   - Filtre par statut
   - Tri
   - Voir une offre
   - Modifier une offre
   - Fermer / réouvrir une offre
   - Supprimer une offre
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
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

let auth = null;
let db = null;

try {

    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas encore initialisé par app.js."
        );
    }

    const app = getApp();

    auth = getAuth(app);

    db = getFirestore(app);

} catch (error) {

    console.error(
        "MES JOBS — Initialisation Firebase :",
        error
    );

}


/* =========================================================
   DOM
========================================================= */

const authMessage =
    document.getElementById("mesJobsAuthMessage");

const statsBox =
    document.getElementById("mesJobsStats");

const totalJobs =
    document.getElementById("totalJobs");

const activeJobs =
    document.getElementById("activeJobs");

const pendingJobs =
    document.getElementById("pendingJobs");

const closedJobs =
    document.getElementById("closedJobs");

const searchInput =
    document.getElementById("myJobSearch");

const statusFilter =
    document.getElementById("myJobStatus");

const sortSelect =
    document.getElementById("myJobSort");

const jobsCount =
    document.getElementById("myJobsCount");

const jobsLoading =
    document.getElementById("myJobsLoading");

const jobsList =
    document.getElementById("myJobsList");

const jobsEmpty =
    document.getElementById("myJobsEmpty");


/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;

let allMyJobs = [];

let filteredMyJobs = [];


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

        const date = new Date(value);

        return isNaN(date.getTime())
            ? null
            : date;

    }

    if (typeof value === "string") {

        const date = new Date(value);

        return isNaN(date.getTime())
            ? null
            : date;

    }

    return null;

}


function getTimestamp(value) {

    const date = getDateValue(value);

    return date
        ? date.getTime()
        : 0;

}


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


/* =========================================================
   STATUT
========================================================= */

function normalizeStatus(status) {

    const value =
        normalizeText(status);

    if (
        [
            "active",
            "actif",
            "publie",
            "publiee",
            "published",
            "public",
            "valide"
        ].includes(value)
    ) {
        return "active";
    }

    if (
        [
            "pending",
            "en attente",
            "attente",
            "en_attente",
            "review",
            "moderation"
        ].includes(value)
    ) {
        return "pending";
    }

    if (
        [
            "closed",
            "fermee",
            "ferme",
            "fermee",
            "inactive",
            "desactive",
            "archive",
            "archived"
        ].includes(value)
    ) {
        return "closed";
    }

    /*
     * Pour les anciens documents sans status,
     * on considère l'offre comme active.
     */

    return "active";

}


/* =========================================================
   LIBELLÉ STATUT
========================================================= */

function getStatusLabel(status) {

    switch (normalizeStatus(status)) {

        case "active":
            return "Active";

        case "pending":
            return "En attente";

        case "closed":
            return "Fermée";

        default:
            return "Active";

    }

}


/* =========================================================
   SALAIRE
========================================================= */

function formatSalary(job) {

    const salary =
        firstValue(
            job.salary,
            job.salaire,
            job.remuneration
        );

    if (salary) {
        return String(salary);
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
