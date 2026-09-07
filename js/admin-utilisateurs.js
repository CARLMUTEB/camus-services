// =========================================================
// CAMU SERVICES — ADMIN UTILISATEURS
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

let allUsers = [];


// =========================================================
// ÉLÉMENTS HTML
// =========================================================

const container =
    document.getElementById("adminUsersContainer");

const loading =
    document.getElementById("usersLoading");

const empty =
    document.getElementById("usersEmpty");

const totalCount =
    document.getElementById("usersTotalCount");

const resultCount =
    document.getElementById("usersResultCount");

const searchInput =
    document.getElementById("adminUsersSearch");

const citySelect =
    document.getElementById("adminUsersCity");

const resetButton =
    document.getElementById("clearAdminUsersFilters");

const refreshButton =
    document.getElementById("refreshUsersButton");


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "connexion.html";

        return;
    }


    const email =
        user.email
            ? user.email.toLowerCase()
            : "";


    if (
        email !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        alert(
            "Accès réservé à l'administrateur CAMU SERVICES."
        );

        window.location.href =
            "index.html";

        return;
    }


    await loadUsers();

});


// =========================================================
// CHARGER LES UTILISATEURS
// =========================================================

async function loadUsers() {

    try {

        showLoading(true);


        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        allUsers = [];


        snapshot.forEach((documentSnapshot) => {

            allUsers.push({

                id: documentSnapshot.id,

                ...documentSnapshot.data()

            });

        });


        // Trier du plus récent au plus ancien
        allUsers.sort((a, b) => {

            return (
                getDateValue(b.createdAt) -
                getDateValue(a.createdAt)
            );

        });


        updateTotalCount();

        renderUsers(allUsers);


    } catch (error) {

        console.error(
            "Erreur chargement utilisateurs :",
            error
        );


        showError(
            "Impossible de charger les utilisateurs. Vérifie Firebase."
        );


    } finally {

        showLoading(false);

    }

}


// =========================================================
// AFFICHER LES UTILISATEURS
// =========================================================

function renderUsers(users) {

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (resultCount) {

        resultCount.textContent =
            `${users.length} utilisateur${users.length > 1 ? "s" : ""}`;

    }


    if (users.length === 0) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }


    users.forEach((user) => {

        const card =
            createUserCard(user);

        container.appendChild(card);

    });

}


// =========================================================
// CRÉER UNE CARTE UTILISATEUR
// =========================================================

function createUserCard(user) {

    const card =
        document.createElement("article");

    card.className =
        "admin-user-card";


    const name =
        user.name ||
        user.displayName ||
        user.fullName ||
        user.nom ||
        "Utilisateur";


    const email =
        user.email ||
        "";


    const phone =
        user.phone ||
        user.telephone ||
        user.phoneNumber ||
        "";


    const city =
        user.city ||
        user.ville ||
        "";


    const photo =
        user.photoURL ||
        user.photoUrl ||
        user.photo ||
        "";


    const initials =
        getInitials(name);


    const date =
        formatDate(user.createdAt);


    const adsCount =
        Number(
            user.adsCount ||
            user.servicesCount ||
            0
        );


    card.innerHTML = `

        <div class="admin-user-avatar">

            ${
                photo
                ? `
                    <img
                        src="${escapeHtml(photo)}"
                        alt="${escapeHtml(name)}"
                    >
                `
                : `
                    ${escapeHtml(initials)}
                `
            }

        </div>


        <div class="admin-user-info">

            <h3 title="${escapeHtml(name)}">
                ${escapeHtml(name)}
            </h3>


            ${
                email
                ? `
                    <div
                        class="admin-user-email"
                        title="${escapeHtml(email)}"
                    >
                        ${escapeHtml(email)}
                    </div>
                `
                : ""
            }


            <div class="admin-user-meta">

                ${
                    phone
                    ? `
                        <span>
                            <i class="fa-solid fa-phone"></i>
                            ${escapeHtml(phone)}
                        </span>
                    `
                    : ""
                }


                ${
                    city
                    ? `
                        <span>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHtml(city)}
                        </span>
                    `
                    : ""
                }


                <span>
                    <i class="fa-regular fa-calendar"></i>
                    Inscrit le ${escapeHtml(date)}
                </span>

            </div>

        </div>


        <div class="admin-user-badges">

            <span class="admin-user-badge">

                <i class="fa-solid fa-bullhorn"></i>

                ${adsCount}
                annonce${adsCount > 1 ? "s" : ""}

            </span>


            <span class="admin-user-date">

                ID :
                ${escapeHtml(user.id.substring(0, 8))}

            </span>

        </div>

    `;


    // Fallback photo
    const image =
        card.querySelector("img");


    if (image) {

        image.addEventListener(
            "error",
            () => {

                const avatar =
                    image.parentElement;

                avatar.innerHTML =
                    escapeHtml(initials);

            }
        );

    }


    return card;

}


// =========================================================
// RECHERCHE + FILTRE
// =========================================================

function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const city =
        citySelect
            ? citySelect.value
                .trim()
                .toLowerCase()
            : "";


    const filteredUsers =
        allUsers.filter((user) => {


            const name =
                String(
                    user.name ||
                    user.displayName ||
                    user.fullName ||
                    user.nom ||
                    ""
                ).toLowerCase();


            const email =
                String(
                    user.email ||
                    ""
                ).toLowerCase();


            const phone =
                String(
                    user.phone ||
                    user.telephone ||
                    user.phoneNumber ||
                    ""
                ).toLowerCase();


            const userCity =
                String(
                    user.city ||
                    user.ville ||
                    ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                phone.includes(search);


            const matchesCity =
                !city ||
                userCity === city;


            return (
                matchesSearch &&
                matchesCity
            );

        });


    renderUsers(filteredUsers);

}


// =========================================================
// TOTAL
// =========================================================

function updateTotalCount() {

    if (totalCount) {

        totalCount.textContent =
            allUsers.length;

    }

}


// =========================================================
// RESET
// =========================================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        () => {

            if (searchInput) {
                searchInput.value = "";
            }


            if (citySelect) {
                citySelect.value = "";
            }


            renderUsers(allUsers);

        }
    );

}


// =========================================================
// RECHERCHE
// =========================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


// =========================================================
// FILTRE VILLE
// =========================================================

if (citySelect) {

    citySelect.addEventListener(
        "change",
        applyFilters
    );

}


// =========================================================
// ACTUALISER
// =========================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.disabled =
                true;


            const icon =
                refreshButton.querySelector("i");


            if (icon) {

                icon.classList.add(
                    "fa-spin"
                );

            }


            await loadUsers();


            if (icon) {

                icon.classList.remove(
                    "fa-spin"
                );

            }


            refreshButton.disabled =
                false;

        }
    );

}


// =========================================================
// MENU MOBILE
// =========================================================

const menuButton =
    document.querySelector(
        ".admin-menu-button"
    );


const sidebar =
    document.querySelector(
        ".admin-sidebar"
    );


const overlay =
    document.querySelector(
        ".admin-sidebar-overlay"
    );


const closeButton =
    document.querySelector(
        ".admin-sidebar-close"
    );


function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    document.body.classList.add(
        "admin-menu-open"
    );

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "admin-menu-open"
    );

}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openSidebar
    );

}


if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeSidebar
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


document
    .querySelectorAll(
        ".admin-sidebar-nav a"
    )
    .forEach((link) => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


// =========================================================
// DÉCONNEXION
// =========================================================

const logoutButton =
    document.querySelector(
        ".admin-logout"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const confirmed =
                confirm(
                    "Voulez-vous vous déconnecter ?"
                );


            if (!confirmed) {
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


                alert(
                    "Impossible de vous déconnecter."
                );

            }

        }
    );

}


// =========================================================
// LOADING
// =========================================================

function showLoading(show) {

    if (loading) {

        loading.hidden =
            !show;

    }


    if (show && empty) {

        empty.hidden =
            true;

    }


    if (show && container) {

        container.innerHTML =
            "";

    }

}


// =========================================================
// ERREUR
// =========================================================

function showError(message) {

    if (!container) {
        return;
    }


    if (empty) {

        empty.hidden =
            true;

    }


    container.innerHTML = `

        <div class="admin-users-empty">

            <div class="admin-users-empty-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Une erreur est survenue
            </h3>


            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


// =========================================================
// INITIALLES
// =========================================================

function getInitials(name) {

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 0) {
        return "U";
    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


// =========================================================
// DATE FIREBASE
// =========================================================

function getDateValue(value) {

    if (!value) {
        return 0;
    }


    if (
        typeof value === "object" &&
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {

        return value.seconds * 1000;

    }


    if (value instanceof Date) {

        return value.getTime();

    }


    const date =
        new Date(value).getTime();


    return Number.isNaN(date)
        ? 0
        : date;

}


function formatDate(value) {

    const timestamp =
        getDateValue(value);


    if (!timestamp) {

        return "Date inconnue";

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(
        new Date(timestamp)
    );

}


// =========================================================
// PROTECTION HTML
// =========================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
