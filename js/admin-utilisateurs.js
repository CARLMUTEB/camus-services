import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

let allUsers = [];
let filteredUsers = [];
let selectedUser = null;


/* =========================================================
   DOM
========================================================= */

const sidebar = document.getElementById("adminSidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarClose = document.getElementById("sidebarClose");
const mobileOverlay = document.getElementById("mobileOverlay");

const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");

const userSearch = document.getElementById("userSearch");
const accountTypeFilter = document.getElementById("accountTypeFilter");
const statusFilter = document.getElementById("statusFilter");
const cityFilter = document.getElementById("cityFilter");
const resetFilters = document.getElementById("resetFilters");

const usersTableBody = document.getElementById("usersTableBody");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const pendingUsers = document.getElementById("pendingUsers");
const professionalUsers = document.getElementById("professionalUsers");

const userModal = document.getElementById("userModal");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const modalDelete = document.getElementById("modalDelete");


/* =========================================================
   AUTHENTIFICATION ADMIN
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "connexion.html";
        return;
    }

    if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {

        alert("Accès réservé à l'administrateur.");

        await signOut(auth);

        window.location.href = "connexion.html";
        return;
    }

    console.log("CAMU ADMIN UTILISATEURS — administrateur connecté.");

    await loadUsers();
});


/* =========================================================
   CHARGER LES UTILISATEURS
========================================================= */

async function loadUsers() {

    showLoading();

    try {

        const snapshot = await getDocs(
            collection(db, "users")
        );

        allUsers = [];

        snapshot.forEach((documentSnapshot) => {

            const data = documentSnapshot.data();

            allUsers.push({
                id: documentSnapshot.id,
                ...data
            });

        });

        allUsers.sort((a, b) => {

            const dateA = getTimestampMillis(a.createdAt);
            const dateB = getTimestampMillis(b.createdAt);

            return dateB - dateA;

        });

        console.log(
            `CAMU ADMIN UTILISATEURS — ${allUsers.length} utilisateur(s) chargé(s).`
        );

        updateStatistics();
        populateCities();
        applyFilters();

    } catch (error) {

        console.error(
            "CAMU ADMIN UTILISATEURS — erreur chargement :",
            error
        );

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Impossible de charger les utilisateurs.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   STATISTIQUES
========================================================= */

function updateStatistics() {

    totalUsers.textContent = allUsers.length;

    activeUsers.textContent =
        allUsers.filter(user => getUserStatus(user) === "active").length;

    pendingUsers.textContent =
        allUsers.filter(user => getUserStatus(user) === "pending").length;

    professionalUsers.textContent =
        allUsers.filter(user => isProfessional(user)).length;
}


/* =========================================================
   VILLES
========================================================= */

function populateCities() {

    const cities = new Set();

    allUsers.forEach(user => {

        const city = cleanValue(
            user.ville || user.city
        );

        if (city) {
            cities.add(city);
        }

    });

    cityFilter.innerHTML = `
        <option value="">Toutes les villes</option>
    `;

    [...cities]
        .sort((a, b) => a.localeCompare(b, "fr"))
        .forEach(city => {

            const option = document.createElement("option");

            option.value = city;
            option.textContent = city;

            cityFilter.appendChild(option);

        });
}


/* =========================================================
   FILTRES
========================================================= */

function applyFilters() {

    const search =
        cleanValue(userSearch.value).toLowerCase();

    const accountType =
        cleanValue(accountTypeFilter.value).toLowerCase();

    const status =
        cleanValue(statusFilter.value).toLowerCase();

    const city =
        cleanValue(cityFilter.value).toLowerCase();

    filteredUsers = allUsers.filter(user => {

        const name =
            cleanValue(
                user.name ||
                user.displayName ||
                user.nom
            ).toLowerCase();

        const email =
            cleanValue(user.email).toLowerCase();

        const phone =
            cleanValue(
                user.phone ||
                user.telephone
            ).toLowerCase();

        const whatsapp =
            cleanValue(user.whatsapp).toLowerCase();

        const userType =
            getAccountType(user).toLowerCase();

        const userStatus =
            getUserStatus(user).toLowerCase();

        const userCity =
            cleanValue(
                user.ville ||
                user.city
            ).toLowerCase();

        const searchMatch =
            !search ||
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search) ||
            whatsapp.includes(search);

        const typeMatch =
            !accountType ||
            userType === accountType;

        const statusMatch =
            !status ||
            userStatus === status;

        const cityMatch =
            !city ||
            userCity === city;

        return (
            searchMatch &&
            typeMatch &&
            statusMatch &&
            cityMatch
        );

    });

    renderUsers();
}


/* =========================================================
   AFFICHER LES UTILISATEURS
========================================================= */

function renderUsers() {

    resultsCount.textContent =
        `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? "s" : ""}`;

    if (filteredUsers.length === 0) {

        usersTableBody.innerHTML = "";

        emptyState.classList.remove("hidden");

        return;
    }

    emptyState.classList.add("hidden");

    usersTableBody.innerHTML =
        filteredUsers.map(user => createUserRow(user)).join("");

    bindUserActions();
}


/* =========================================================
   LIGNE UTILISATEUR
========================================================= */

function createUserRow(user) {

    const name =
        cleanValue(
            user.name ||
            user.displayName ||
            user.nom
        ) || "Utilisateur";

    const email =
        cleanValue(user.email) || "—";

    const phone =
        cleanValue(
            user.phone ||
            user.telephone
        );

    const whatsapp =
        cleanValue(user.whatsapp);

    const city =
        cleanValue(
            user.ville ||
            user.city
        ) || "—";

    const type =
        getAccountType(user);

    const status =
        getUserStatus(user);

    const createdAt =
        formatDate(user.createdAt);

    const initials =
        getInitials(name);

    return `
        <tr>

            <td>

                <div class="user-cell">

                    <div class="user-avatar">
                        ${escapeHtml(initials)}
                    </div>

                    <div>
                        <div class="user-name">
                            ${escapeHtml(name)}
                        </div>

                        <div class="user-email">
                            ${escapeHtml(email)}
                        </div>
                    </div>

                </div>

            </td>

            <td>

                ${
                    phone
                        ? `
                            <div class="contact-line">
                                ${escapeHtml(phone)}
                            </div>
                        `
                        : ""
                }

                ${
                    whatsapp
                        ? `
                            <div class="contact-line">
                                <i class="fa-brands fa-whatsapp"></i>
                                ${escapeHtml(whatsapp)}
                            </div>
                        `
                        : ""
                }

                ${
                    !phone && !whatsapp
                        ? "—"
                        : ""
                }

            </td>

            <td>

                <span class="account-badge">
                    ${escapeHtml(getAccountTypeLabel(type))}
                </span>

            </td>

            <td>
                ${escapeHtml(city)}
            </td>

            <td>
                ${getStatusBadge(status)}
            </td>

            <td>
                ${escapeHtml(createdAt)}
            </td>

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="table-action view-user"
                        data-id="${escapeHtml(user.id)}"
                        title="Voir"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action delete delete-user"
                        data-id="${escapeHtml(user.id)}"
                        title="Supprimer"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
   ACTIONS
========================================================= */

function bindUserActions() {

    document
        .querySelectorAll(".view-user")
        .forEach(button => {

            button.addEventListener("click", () => {

                const user = allUsers.find(
                    item => item.id === button.dataset.id
                );

                if (user) {
                    openUserModal(user);
                }

            });

        });


    document
        .querySelectorAll(".delete-user")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const user = allUsers.find(
                    item => item.id === button.dataset.id
                );

                if (!user) {
                    return;
                }

                await deleteUser(user);

            });

        });
}


/* =========================================================
   MODAL
========================================================= */

function openUserModal(user) {

    selectedUser = user;

    const name =
        cleanValue(
            user.name ||
            user.displayName ||
            user.nom
        ) || "Utilisateur";

    document.getElementById("modalUserName").textContent =
        name;

    document.getElementById("modalUserEmail").textContent =
        cleanValue(user.email) || "—";

    document.getElementById("modalUserType").textContent =
        getAccountTypeLabel(getAccountType(user));

    document.getElementById("modalName").textContent =
        name;

    document.getElementById("modalEmail").textContent =
        cleanValue(user.email) || "—";

    document.getElementById("modalPhone").textContent =
        cleanValue(
            user.phone ||
            user.telephone
        ) || "—";

    document.getElementById("modalWhatsapp").textContent =
        cleanValue(user.whatsapp) || "—";

    document.getElementById("modalCity").textContent =
        cleanValue(
            user.ville ||
            user.city
        ) || "—";

    document.getElementById("modalCommune").textContent =
        cleanValue(user.commune) || "—";

    document.getElementById("modalAccountType").textContent =
        getAccountTypeLabel(getAccountType(user));

    document.getElementById("modalStatus").textContent =
        getStatusLabel(getUserStatus(user));

    document.getElementById("modalCreatedAt").textContent =
        formatDate(user.createdAt);

    userModal.classList.remove("hidden");
}


function closeUserModal() {

    selectedUser = null;

    userModal.classList.add("hidden");
}


/* =========================================================
   SUPPRESSION
========================================================= */

async function deleteUser(user) {

    const name =
        cleanValue(
            user.name ||
            user.displayName ||
            user.email
        ) || "cet utilisateur";

    const confirmation = confirm(
        `Voulez-vous vraiment supprimer le profil Firestore de ${name} ?\n\n` +
        `Attention : cette action supprime le document users/${user.id}.`
    );

    if (!confirmation) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "users", user.id)
        );

        alert("Utilisateur supprimé de Firestore.");

        closeUserModal();

        await loadUsers();

    } catch (error) {

        console.error(
            "CAMU ADMIN UTILISATEURS — erreur suppression :",
            error
        );

        alert(
            "Impossible de supprimer cet utilisateur.\n\n" +
            error.message
        );
    }
}


/* =========================================================
   HELPERS
========================================================= */

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


function getAccountType(user) {

    return cleanValue(
        user.accountType ||
        user.type ||
        "client"
    ).toLowerCase();
}


function getAccountTypeLabel(type) {

    const labels = {

        client: "Client",

        immobilier: "CAMU IMMO",

        commerce: "CAMU COMMERCE",

        vehicules: "Véhicules & Transport",

        hotels: "Hôtels & Hébergement"

    };

    return labels[type] || type || "Client";
}


function getUserStatus(user) {

    const accountStatus =
        cleanValue(user.accountStatus).toLowerCase();

    if (
        accountStatus === "disabled" ||
        accountStatus === "suspended"
    ) {
        return "disabled";
    }

    if (
        accountStatus === "pending" ||
        accountStatus === "en_attente"
    ) {
        return "pending";
    }

    return "active";
}


function getStatusLabel(status) {

    const labels = {

        active: "Actif",

        pending: "En attente",

        disabled: "Désactivé"

    };

    return labels[status] || "Actif";
}


function getStatusBadge(status) {

    return `
        <span class="status-badge status-${status}">
            ${escapeHtml(getStatusLabel(status))}
        </span>
    `;
}


function isProfessional(user) {

    const type = getAccountType(user);

    return [
        "immobilier",
        "commerce",
        "vehicules",
        "hotels"
    ].includes(type);
}


function getInitials(name) {

    const words =
        cleanValue(name)
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
        return "U";
    }

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}


function getTimestampMillis(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toMillis === "function"
    ) {
        return value.toMillis();
    }

    if (
        value.seconds !== undefined
    ) {
        return value.seconds * 1000;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();
}


function formatDate(value) {

    const millis =
        getTimestampMillis(value);

    if (!millis) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(new Date(millis));
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showLoading() {

    emptyState.classList.add("hidden");

    usersTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Chargement des utilisateurs...
            </td>
        </tr>
    `;
}


/* =========================================================
   EVENTS
========================================================= */

userSearch.addEventListener(
    "input",
    applyFilters
);

accountTypeFilter.addEventListener(
    "change",
    applyFilters
);

statusFilter.addEventListener(
    "change",
    applyFilters
);

cityFilter.addEventListener(
    "change",
    applyFilters
);


resetFilters.addEventListener(
    "click",
    () => {

        userSearch.value = "";
        accountTypeFilter.value = "";
        statusFilter.value = "";
        cityFilter.value = "";

        applyFilters();
    }
);


refreshButton.addEventListener(
    "click",
    async () => {

        refreshButton.disabled = true;

        const original =
            refreshButton.innerHTML;

        refreshButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Actualisation...
        `;

        await loadUsers();

        refreshButton.disabled = false;
        refreshButton.innerHTML = original;
    }
);


/* =========================================================
   MODAL EVENTS
========================================================= */

modalClose.addEventListener(
    "click",
    closeUserModal
);

modalCancel.addEventListener(
    "click",
    closeUserModal
);

modalDelete.addEventListener(
    "click",
    async () => {

        if (selectedUser) {
            await deleteUser(selectedUser);
        }

    }
);

userModal.addEventListener(
    "click",
    (event) => {

        if (event.target === userModal) {
            closeUserModal();
        }

    }
);


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

mobileMenuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.add("open");
        mobileOverlay.classList.add("show");

    }
);


sidebarClose.addEventListener(
    "click",
    closeSidebar
);


mobileOverlay.addEventListener(
    "click",
    closeSidebar
);


function closeSidebar() {

    sidebar.classList.remove("open");
    mobileOverlay.classList.remove("show");
}


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        const confirmation = confirm(
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
                "CAMU ADMIN — erreur déconnexion :",
                error
            );

            alert(
                "Impossible de se déconnecter."
            );
        }

    }
);
