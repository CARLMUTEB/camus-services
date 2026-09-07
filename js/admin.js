/* =========================================================
   CAMU SERVICES — ADMIN DASHBOARD
   ========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION ADMIN
   ========================================================= */

/*
   IMPORTANT :
   Remplace cette adresse par l'adresse Gmail réellement
   utilisée comme administrateur CAMU SERVICES.
*/
const ADMIN_EMAIL = "meschackmuteb@gmail.com";


/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const totalUsers = document.getElementById("totalUsers");
const totalAds = document.getElementById("totalAds");
const totalReports = document.getElementById("totalReports");
const totalCategories = document.getElementById("totalCategories");

const recentActivity = document.getElementById("recentActivity");
const categoryStats = document.getElementById("categoryStats");
const cityStats = document.getElementById("cityStats");

const adminMessage = document.getElementById("adminMessage");

const adminSidebar = document.getElementById("adminSidebar");
const adminOverlay = document.getElementById("adminOverlay");
const adminMenuButton = document.getElementById("adminMenuButton");
const adminCloseSidebar = document.getElementById("adminCloseSidebar");

const adminLogoutButton =
    document.getElementById("adminLogoutButton");


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminMessage(message, type = "success") {

    if (!adminMessage) return;

    adminMessage.textContent = message;

    adminMessage.hidden = false;

    if (type === "error") {
        adminMessage.style.background = "#fef2f2";
        adminMessage.style.color = "#b91c1c";
        adminMessage.style.borderColor = "#fecaca";
    } else {
        adminMessage.style.background = "#ecfdf3";
        adminMessage.style.color = "#15803d";
        adminMessage.style.borderColor = "#bbf7d0";
    }

    setTimeout(() => {
        adminMessage.hidden = true;
    }, 5000);
}


/* =========================================================
   UTILITAIRES
   ========================================================= */

function getDateValue(timestamp) {

    if (!timestamp) {
        return 0;
    }

    if (typeof timestamp.toMillis === "function") {
        return timestamp.toMillis();
    }

    if (timestamp.seconds) {
        return timestamp.seconds * 1000;
    }

    return 0;
}


function formatDate(timestamp) {

    const value = getDateValue(timestamp);

    if (!value) {
        return "Date inconnue";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}


/* =========================================================
   CHARGEMENT UTILISATEURS
   ========================================================= */

async function loadUsers() {

    try {

        const snapshot = await getDocs(
            collection(db, "users")
        );

        const count = snapshot.size;

        if (totalUsers) {
            totalUsers.textContent = count;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (error) {

        console.error(
            "Erreur chargement utilisateurs :",
            error
        );

        if (totalUsers) {
            totalUsers.textContent = "—";
        }

        return [];
    }
}


/* =========================================================
   CHARGEMENT ANNONCES
   ========================================================= */

async function loadAds() {

    try {

        const snapshot = await getDocs(
            collection(db, "services")
        );

        const count = snapshot.size;

        if (totalAds) {
            totalAds.textContent = count;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );

        if (totalAds) {
            totalAds.textContent = "—";
        }

        return [];
    }
}


/* =========================================================
   CHARGEMENT SIGNALEMENTS
   ========================================================= */

async function loadReports() {

    try {

        const snapshot = await getDocs(
            collection(db, "reports")
        );

        const count = snapshot.size;

        if (totalReports) {
            totalReports.textContent = count;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (error) {

        console.error(
            "Erreur chargement signalements :",
            error
        );

        if (totalReports) {
            totalReports.textContent = "—";
        }

        return [];
    }
}


/* =========================================================
   STATISTIQUES CATÉGORIES
   ========================================================= */

function renderCategoryStats(ads) {

    if (!categoryStats) return;

    const categories = {};

    ads.forEach(ad => {

        const category =
            ad.category?.trim() || "Autres";

        categories[category] =
            (categories[category] || 0) + 1;
    });


    const entries = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);


    if (!entries.length) {

        categoryStats.innerHTML = `
            <div class="admin-loading">
                <span>Aucune annonce disponible.</span>
            </div>
        `;

        return;
    }


    const maxValue =
        Math.max(...entries.map(item => item[1]));


    categoryStats.innerHTML = entries
        .slice(0, 8)
        .map(([category, count]) => {

            const percentage =
                maxValue > 0
                    ? (count / maxValue) * 100
                    : 0;

            return `
                <div class="admin-simple-stat">

                    <span class="admin-simple-stat-name">
                        ${escapeHTML(category)}
                    </span>

                    <div class="admin-simple-stat-bar">
                        <span
                            style="width:${percentage}%"
                        ></span>
                    </div>

                    <strong class="admin-simple-stat-value">
                        ${count}
                    </strong>

                </div>
            `;

        })
        .join("");
}


/* =========================================================
   STATISTIQUES VILLES
   ========================================================= */

function renderCityStats(ads) {

    if (!cityStats) return;

    const cities = {};

    ads.forEach(ad => {

        const city =
            ad.city?.trim() || "Non renseignée";

        cities[city] =
            (cities[city] || 0) + 1;
    });


    const entries = Object.entries(cities)
        .sort((a, b) => b[1] - a[1]);


    if (!entries.length) {

        cityStats.innerHTML = `
            <div class="admin-loading">
                <span>Aucune annonce disponible.</span>
            </div>
        `;

        return;
    }


    const maxValue =
        Math.max(...entries.map(item => item[1]));


    cityStats.innerHTML = entries
        .slice(0, 8)
        .map(([city, count]) => {

            const percentage =
                maxValue > 0
                    ? (count / maxValue) * 100
                    : 0;

            return `
                <div class="admin-simple-stat">

                    <span class="admin-simple-stat-name">
                        ${escapeHTML(city)}
                    </span>

                    <div class="admin-simple-stat-bar">
                        <span
                            style="width:${percentage}%"
                        ></span>
                    </div>

                    <strong class="admin-simple-stat-value">
                        ${count}
                    </strong>

                </div>
            `;

        })
        .join("");
}


/* =========================================================
   ACTIVITÉ RÉCENTE
   ========================================================= */

function renderRecentActivity(ads) {

    if (!recentActivity) return;

    const recentAds = [...ads]
        .sort(
            (a, b) =>
                getDateValue(b.createdAt) -
                getDateValue(a.createdAt)
        )
        .slice(0, 6);


    if (!recentAds.length) {

        recentActivity.innerHTML = `
            <div class="admin-loading">
                <span>Aucune activité récente.</span>
            </div>
        `;

        return;
    }


    recentActivity.innerHTML = recentAds
        .map(ad => {

            const title =
                ad.title || "Nouvelle annonce";

            const owner =
                ad.ownerName ||
                "Utilisateur";

            return `
                <div class="admin-activity-row">

                    <div class="admin-activity-icon">
                        <i class="fa-solid fa-bullhorn"></i>
                    </div>

                    <div class="admin-activity-content">

                        <strong>
                            ${escapeHTML(title)}
                        </strong>

                        <span>
                            Publiée par
                            ${escapeHTML(owner)}
                        </span>

                    </div>

                    <time class="admin-activity-date">
                        ${formatDate(ad.createdAt)}
                    </time>

                </div>
            `;

        })
        .join("");
}


/* =========================================================
   NOMBRE DE CATÉGORIES
   ========================================================= */

function updateCategoryCount() {

    const categories = [
        "Immobilier",
        "Véhicules",
        "Commerce",
        "Services",
        "Emploi",
        "Autres"
    ];

    if (totalCategories) {
        totalCategories.textContent =
            categories.length;
    }
}


/* =========================================================
   PROTECTION CONTRE LE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   CHARGEMENT DU DASHBOARD
   ========================================================= */

async function loadDashboard() {

    console.log(
        "CAMU SERVICES ADMIN : chargement du dashboard..."
    );


    if (totalUsers) {
        totalUsers.textContent = "...";
    }

    if (totalAds) {
        totalAds.textContent = "...";
    }

    if (totalReports) {
        totalReports.textContent = "...";
    }


    try {

        const [
            users,
            ads,
            reports
        ] = await Promise.all([
            loadUsers(),
            loadAds(),
            loadReports()
        ]);


        updateCategoryCount();

        renderCategoryStats(ads);

        renderCityStats(ads);

        renderRecentActivity(ads);


        console.log(
            "Dashboard chargé :",
            {
                users: users.length,
                ads: ads.length,
                reports: reports.length
            }
        );


    } catch (error) {

        console.error(
            "Erreur générale dashboard :",
            error
        );

        showAdminMessage(
            "Impossible de charger certaines données.",
            "error"
        );
    }
}


/* =========================================================
   MENU MOBILE
   ========================================================= */

function openAdminMenu() {

    adminSidebar?.classList.add("open");
    adminOverlay?.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeAdminMenu() {

    adminSidebar?.classList.remove("open");
    adminOverlay?.classList.remove("open");

    document.body.style.overflow = "";
}


adminMenuButton?.addEventListener(
    "click",
    openAdminMenu
);

adminCloseSidebar?.addEventListener(
    "click",
    closeAdminMenu
);

adminOverlay?.addEventListener(
    "click",
    closeAdminMenu
);


/* =========================================================
   NAVIGATION ADMIN
   ========================================================= */

document
    .querySelectorAll("[data-section]")
    .forEach(element => {

        element.addEventListener(
            "click",
            event => {

                const section =
                    element.dataset.section;

                if (!section) {
                    return;
                }

                /*
                   Les pages de gestion seront ajoutées
                   dans les prochaines étapes.
                */

                if (
                    section === "annonces" ||
                    section === "utilisateurs" ||
                    section === "signalements" ||
                    section === "parametres"
                ) {

                    event.preventDefault();

                    showAdminMessage(
                        "Cette section sera activée dans la prochaine étape."
                    );

                    closeAdminMenu();
                }
            }
        );

    });


/* =========================================================
   DÉCONNEXION
   ========================================================= */

adminLogoutButton?.addEventListener(
    "click",
    async () => {

        const confirmation =
            confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            );

        if (!confirmation) {
            return;
        }

        try {

            await signOut(auth);

            window.location.href =
                "connexion.html";

        } catch (error) {

            console.error(
                "Erreur déconnexion :",
                error
            );

            showAdminMessage(
                "Impossible de vous déconnecter.",
                "error"
            );
        }
    }
);


/* =========================================================
   AUTHENTIFICATION + PROTECTION ADMIN
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;
        }


        console.log(
            "Utilisateur connecté :",
            user.email
        );


        /*
           Première protection côté interface.

           La vraie sécurité devra également être
           appliquée dans les règles Firestore.
        */

        if (
            user.email?.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            console.warn(
                "Accès administrateur refusé :",
                user.email
            );

            alert(
                "Accès réservé à l'administrateur CAMU SERVICES."
            );

            window.location.href =
                "index.html";

            return;
        }


        await loadDashboard();

    }
);


/* =========================================================
   INITIALISATION
   ========================================================= */

console.log(
    "CAMU SERVICES : admin.js chargé correctement."
);
