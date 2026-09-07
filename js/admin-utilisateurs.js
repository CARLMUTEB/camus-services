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
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

let allUsers = [];


// =========================================================
// ÉLÉMENTS
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
// AUTH ADMIN
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "connexion.html";

        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !==
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
// CHARGER UTILISATEURS
// =========================================================

async function loadUsers() {

    try {

        showLoading(true);

        const snapshot =
            await getDocs(
                collection(db, "users")
            );

        allUsers = [];

        snapshot.forEach(
            (documentSnapshot) => {

                allUsers.push({

                    id: documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        allUsers.sort(
            (a, b) => {

                const dateA =
                    getDateValue(
                        a.createdAt
                    );

                const dateB =
                    getDateValue(
                        b.createdAt
                    );

                return dateB - dateA;

            }
        );


        updateTotalCount();

        applyFilters();


    } catch (error) {

        console.error(
            "Erreur chargement utilisateurs :",
            error
        );

        showError(
            "Impossible de charger les utilisateurs."
        );


    } finally {

        showLoading(false);

    }

}


// =========================================================
// AFFICHER UTILISATEURS
// =========================================================

function renderUsers(users) {

    if (!container) return;

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


    users.forEach(
        user => {

            container.appendChild(
                createUserCard(user)
            );

        }
    );

}


// =========================================================
// CARTE UTILISATEUR
// =========================================================

function createUserCard(user) {

    const card =
        document.createElement("article");

    card.className =
        "admin-user-card";


    const name =
        user.name ||
        user.displayName ||
        user.username ||
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
        user.location ||
        "Ville non précisée";


    const status =
        user.status ||
        "active";


    const createdAt =
        formatDate(
            user.createdAt
        );


    card.innerHTML = `

        <div class="admin-user-avatar">

            <i class="fa-solid fa-user"></i>

        </div>


        <div class="admin-user-content">

            <div class="admin-user-top">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <span
                    class="admin-user-status ${escapeHtml(status)}"
                >
                    ${formatUserStatus(status)}
                </span>

            </div>


            <div class="admin-user-meta">

                ${
                    email
                    ? `
                        <span>
                            <i class="fa-solid fa-envelope"></i>
                            ${escapeHtml(email)}
                        </span>
                    `
                    : ""
                }


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


                <span>
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHtml(city)}
                </span>


                <span>
                    <i class="fa-regular fa-calendar"></i>
                    ${escapeHtml(createdAt)}
                </span>

            </div>

        </div>


        <div class="admin-user-actions">

            <button
                type="button"
                class="admin-user-view"
                data-id="${escapeHtml(user.id)}"
                title="Voir"
            >
                <i class="fa-solid fa-eye"></i>
                <span>Voir</span>
            </button>


            <button
                type="button"
                class="admin-user-edit"
                data-id="${escapeHtml(user.id)}"
                title="Modifier"
            >
                <i class="fa-solid fa-pen"></i>
                <span>Modifier</span>
            </button>


            <button
                type="button"
                class="admin-user-warning"
                data-id="${escapeHtml(user.id)}"
                title="Avertir"
            >
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Avertir</span>
            </button>


            <button
                type="button"
                class="admin-user-disable"
                data-id="${escapeHtml(user.id)}"
                title="Désactiver"
            >
                <i class="fa-solid fa-ban"></i>
                <span>Désactiver</span>
            </button>


            <button
                type="button"
                class="admin-user-delete"
                data-id="${escapeHtml(user.id)}"
                title="Supprimer"
            >
                <i class="fa-solid fa-trash"></i>
                <span>Supprimer</span>
            </button>

        </div>

    `;


    return card;

}


// =========================================================
// RECHERCHE / FILTRES
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
        allUsers.filter(
            user => {

                const name =
                    String(
                        user.name ||
                        user.displayName ||
                        user.username ||
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
                        user.location ||
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

            }
        );


    renderUsers(
        filteredUsers
    );

}


// =========================================================
// VOIR
// =========================================================

function viewUser(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    const name =
        user.name ||
        user.displayName ||
        user.username ||
        "Utilisateur";


    const email =
        user.email ||
        "Non renseigné";


    const phone =
        user.phone ||
        user.telephone ||
        user.phoneNumber ||
        "Non renseigné";


    const city =
        user.city ||
        user.location ||
        "Non renseignée";


    alert(
        `UTILISATEUR\n\n` +
        `Nom : ${name}\n` +
        `Email : ${email}\n` +
        `Téléphone : ${phone}\n` +
        `Ville : ${city}\n` +
        `Statut : ${formatUserStatus(user.status || "active")}`
    );

}


// =========================================================
// MODIFIER
// =========================================================

const editModal =
    document.getElementById(
        "userEditModal"
    );

const editForm =
    document.getElementById(
        "userEditForm"
    );

const editId =
    document.getElementById(
        "editUserId"
    );

const editName =
    document.getElementById(
        "editUserName"
    );

const editPhone =
    document.getElementById(
        "editUserPhone"
    );

const editCity =
    document.getElementById(
        "editUserCity"
    );

const editSave =
    document.getElementById(
        "userEditSave"
    );


function openEditUser(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    editId.value =
        user.id;


    editName.value =
        user.name ||
        user.displayName ||
        user.username ||
        "";


    editPhone.value =
        user.phone ||
        user.telephone ||
        user.phoneNumber ||
        "";


    editCity.value =
        user.city ||
        user.location ||
        "Lubumbashi";


    editModal.hidden = false;

    document.body.classList.add(
        "admin-user-modal-open"
    );


    editName.focus();

}


function closeEditUser() {

    if (!editModal) return;

    editModal.hidden = true;

    document.body.classList.remove(
        "admin-user-modal-open"
    );

}


if (editForm) {

    editForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const userId =
                editId.value.trim();


            const name =
                editName.value.trim();


            const phone =
                editPhone.value.trim();


            const city =
                editCity.value.trim();


            if (!userId || !name) {

                alert(
                    "Le nom est obligatoire."
                );

                return;
            }


            try {

                editSave.disabled = true;

                editSave.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement...';


                await updateDoc(
                    doc(
                        db,
                        "users",
                        userId
                    ),
                    {

                        name,
                        phone,
                        city,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                allUsers =
                    allUsers.map(
                        user =>
                            user.id === userId
                                ? {
                                    ...user,
                                    name,
                                    phone,
                                    city
                                }
                                : user
                    );


                closeEditUser();

                applyFilters();


                alert(
                    "Utilisateur modifié avec succès."
                );


            } catch (error) {

                console.error(
                    "Erreur modification utilisateur :",
                    error
                );


                alert(
                    "Impossible de modifier l'utilisateur."
                );


            } finally {

                editSave.disabled = false;

                editSave.innerHTML =
                    '<i class="fa-solid fa-floppy-disk"></i> Enregistrer';

            }

        }
    );

}


// =========================================================
// AVERTIR
// =========================================================

const warningModal =
    document.getElementById(
        "userWarningModal"
    );

const warningForm =
    document.getElementById(
        "userWarningForm"
    );

const warningUserId =
    document.getElementById(
        "warningUserId"
    );

const warningUserName =
    document.getElementById(
        "warningUserName"
    );

const warningLevel =
    document.getElementById(
        "warningLevel"
    );

const warningReason =
    document.getElementById(
        "warningReason"
    );

const warningMessage =
    document.getElementById(
        "warningMessage"
    );

const warningSend =
    document.getElementById(
        "userWarningSend"
    );


function openWarningModal(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    const name =
        user.name ||
        user.displayName ||
        user.username ||
        "Utilisateur";


    warningUserId.value =
        user.id;


    warningUserName.textContent =
        `Utilisateur : ${name}`;


    warningLevel.value =
        "avertissement";


    warningReason.value =
        "";


    warningMessage.value =
        "";


    warningModal.hidden =
        false;


    document.body.classList.add(
        "admin-user-modal-open"
    );


    warningReason.focus();

}


function closeWarningModal() {

    if (!warningModal) return;

    warningModal.hidden =
        true;

    document.body.classList.remove(
        "admin-user-modal-open"
    );

}


if (warningForm) {

    warningForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const userId =
                warningUserId.value.trim();


            const level =
                warningLevel.value.trim();


            const reason =
                warningReason.value.trim();


            const message =
                warningMessage.value.trim();


            if (
                !userId ||
                !reason ||
                !message
            ) {

                alert(
                    "Veuillez remplir tous les champs."
                );

                return;
            }


            try {

                warningSend.disabled =
                    true;


                warningSend.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';


                await addDoc(
                    collection(
                        db,
                        "warnings"
                    ),
                    {

                        userId,

                        level,

                        reason,

                        message,

                        createdBy:
                            auth.currentUser.uid,

                        createdByEmail:
                            auth.currentUser.email,

                        createdAt:
                            serverTimestamp(),

                        read:
                            false

                    }
                );


                // Enregistrer aussi le dernier avertissement
                await updateDoc(
                    doc(
                        db,
                        "users",
                        userId
                    ),
                    {

                        lastWarning:
                            message,

                        lastWarningLevel:
                            level,

                        lastWarningReason:
                            reason,

                        lastWarningAt:
                            serverTimestamp()

                    }
                );


                closeWarningModal();


                alert(
                    "Avertissement envoyé avec succès."
                );


            } catch (error) {

                console.error(
                    "Erreur avertissement :",
                    error
                );


                alert(
                    "Impossible d'envoyer l'avertissement."
                );


            } finally {

                warningSend.disabled =
                    false;


                warningSend.innerHTML =
                    '<i class="fa-solid fa-triangle-exclamation"></i> Envoyer l\'avertissement';

            }

        }
    );

}


// =========================================================
// DÉSACTIVER
// =========================================================

async function disableUser(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) {

        alert(
            "Utilisateur introuvable."
        );

        return;
    }


    const name =
        user.name ||
        user.displayName ||
        user.username ||
        "cet utilisateur";


    const isDisabled =
        user.status === "disabled";


    const action =
        isDisabled
            ? "réactiver"
            : "désactiver";


    const confirmed =
        confirm(
            `Voulez-vous vraiment ${action} "${name}" ?`
        );


    if (!confirmed) return;


    try {

        const newStatus =
            isDisabled
                ? "active"
                : "disabled";


        await updateDoc(
            doc(
                db,
                "users",
                userId
            ),
            {

                status:
                    newStatus,

                updatedAt:
                    serverTimestamp()

            }
        );


        allUsers =
            allUsers.map(
                item =>
                    item.id === userId
                        ? {
                            ...item,
                            status: newStatus
                        }
                        : item
            );


        applyFilters();


        alert(
            isDisabled
                ? "Utilisateur réactivé."
                : "Utilisateur désactivé."
        );


    } catch (error) {

        console.error(
            "Erreur statut utilisateur :",
            error
        );


        alert(
            "Impossible de modifier le statut."
        );

    }

}


// =========================================================
// SUPPRIMER
// =========================================================

async function deleteUser(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) return;


    const name =
        user.name ||
        user.displayName ||
        user.username ||
        "cet utilisateur";


    const confirmed =
        confirm(
            `Voulez-vous vraiment supprimer "${name}" ?\n\nCette action supprimera son document Firestore.`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "users",
                userId
            )
        );


        allUsers =
            allUsers.filter(
                item =>
                    item.id !== userId
            );


        updateTotalCount();

        applyFilters();


        alert(
            "Utilisateur supprimé avec succès."
        );


    } catch (error) {

        console.error(
            "Erreur suppression utilisateur :",
            error
        );


        alert(
            "Impossible de supprimer l'utilisateur."
        );

    }

}


// =========================================================
// CLICS ACTIONS
// =========================================================

document.addEventListener(
    "click",
    (event) => {

        const viewButton =
            event.target.closest(
                ".admin-user-view"
            );


        if (viewButton) {

            viewUser(
                viewButton.dataset.id
            );

            return;
        }


        const editButton =
            event.target.closest(
                ".admin-user-edit"
            );


        if (editButton) {

            openEditUser(
                editButton.dataset.id
            );

            return;
        }


        const warningButton =
            event.target.closest(
                ".admin-user-warning"
            );


        if (warningButton) {

            openWarningModal(
                warningButton.dataset.id
            );

            return;
        }


        const disableButton =
            event.target.closest(
                ".admin-user-disable"
            );


        if (disableButton) {

            disableUser(
                disableButton.dataset.id
            );

            return;
        }


        const deleteButton =
            event.target.closest(
                ".admin-user-delete"
            );


        if (deleteButton) {

            deleteUser(
                deleteButton.dataset.id
            );

        }

    }
);


// =========================================================
// FERMETURE MODAL MODIFICATION
// =========================================================

const editClose =
    document.getElementById(
        "userEditModalClose"
    );

const editCancel =
    document.getElementById(
        "userEditCancel"
    );

const editOverlay =
    document.getElementById(
        "userEditModalOverlay"
    );


if (editClose) {

    editClose.addEventListener(
        "click",
        closeEditUser
    );

}


if (editCancel) {

    editCancel.addEventListener(
        "click",
        closeEditUser
    );

}


if (editOverlay) {

    editOverlay.addEventListener(
        "click",
        closeEditUser
    );

}


// =========================================================
// FERMETURE MODAL AVERTISSEMENT
// =========================================================

const warningClose =
    document.getElementById(
        "userWarningModalClose"
    );

const warningCancel =
    document.getElementById(
        "userWarningCancel"
    );

const warningOverlay =
    document.getElementById(
        "userWarningModalOverlay"
    );


if (warningClose) {

    warningClose.addEventListener(
        "click",
        closeWarningModal
    );

}


if (warningCancel) {

    warningCancel.addEventListener(
        "click",
        closeWarningModal
    );

}


if (warningOverlay) {

    warningOverlay.addEventListener(
        "click",
        closeWarningModal
    );

}


// =========================================================
// ÉCHAP
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") {
            return;
        }


        if (
            editModal &&
            !editModal.hidden
        ) {

            closeEditUser();

        }


        if (
            warningModal &&
            !warningModal.hidden
        ) {

            closeWarningModal();

        }

    }
);


// =========================================================
// FILTRES
// =========================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


if (citySelect) {

    citySelect.addEventListener(
        "change",
        applyFilters
    );

}


if (resetButton) {

    resetButton.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            citySelect.value = "";

            applyFilters();

        }
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
                refreshButton.querySelector(
                    "i"
                );


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


            if (!confirmed) return;


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
// TOTAL
// =========================================================

function updateTotalCount() {

    if (totalCount) {

        totalCount.textContent =
            allUsers.length;

    }

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

    if (!container) return;


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
// STATUT
// =========================================================

function formatUserStatus(status) {

    const value =
        String(
            status || "active"
        ).toLowerCase();


    if (value === "disabled") {

        return "Désactivé";

    }


    if (value === "suspended") {

        return "Suspendu";

    }


    return "Actif";

}


// =========================================================
// DATE
// =========================================================

function getDateValue(value) {

    if (!value) return 0;


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

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
