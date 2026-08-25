import { auth, db } from "../config/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";


/* =========================================
   ELEMENTS
========================================= */

const loading =
    document.getElementById("admin-loading");

const app =
    document.getElementById("admin-app");

const adminName =
    document.getElementById("admin-name");

const toast =
    document.getElementById("admin-toast");


/* =========================================
   AUTHENTIFICATION ADMIN
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "connexion.html";

        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            alert(
                "Votre profil utilisateur n'existe pas."
            );

            await signOut(auth);

            window.location.href =
                "connexion.html";

            return;
        }


        const userData =
            userSnap.data();


        if (userData.role !== "admin") {

            alert(
                "Accès refusé. Cette zone est réservée aux administrateurs."
            );

            window.location.href =
                "index.html";

            return;
        }


        adminName.textContent =
            userData.displayName ||
            user.email ||
            "Administrateur";


        loading.classList.add("hidden");

        app.classList.remove("hidden");


        await loadDashboard();

    } catch (error) {

        console.error(
            "Erreur vérification admin:",
            error
        );

        alert(
            "Impossible de vérifier votre compte administrateur."
        );

    }

});


/* =========================================
   NAVIGATION
========================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                openSection(section);

            }
        );

    });


document
    .querySelectorAll("[data-section-target]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openSection(
                    button.dataset.sectionTarget
                );

            }
        );

    });


function openSection(section) {

    document
        .querySelectorAll(".admin-section")
        .forEach(element => {

            element.classList.remove("active");

        });


    const target =
        document.getElementById(
            `section-${section}`
        );


    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === section
            );

        });


    const titles = {

        dashboard:
            "Tableau de bord",

        users:
            "Utilisateurs",

        annonces:
            "Annonces",

        pending:
            "Annonces en attente",

        communiques:
            "Communiqués"

    };


    document.getElementById(
        "section-title"
    ).textContent =
        titles[section] ||
        "Administration";


    if (section === "users") {
        loadUsers();
    }

    if (section === "annonces") {
        loadAnnonces();
    }

    if (section === "pending") {
        loadPending();
    }

    if (section === "communiques") {
        loadCommunique();
    }

}


/* =========================================
   DASHBOARD
========================================= */

async function loadDashboard() {

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        const annoncesSnapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        const pendingSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "annonces"
                    ),
                    where(
                        "status",
                        "==",
                        "pending"
                    )
                )
            );


        const professionalsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "users"
                    ),
                    where(
                        "role",
                        "==",
                        "professional"
                    )
                )
            );


        document.getElementById(
            "stat-users"
        ).textContent =
            usersSnapshot.size;


        document.getElementById(
            "stat-annonces"
        ).textContent =
            annoncesSnapshot.size;


        document.getElementById(
            "stat-pending"
        ).textContent =
            pendingSnapshot.size;


        document.getElementById(
            "stat-professionals"
        ).textContent =
            professionalsSnapshot.size;


        document.getElementById(
            "pending-badge"
        ).textContent =
            pendingSnapshot.size;


        await loadRecentAnnonces();

    } catch (error) {

        console.error(
            "Erreur dashboard:",
            error
        );

        showToast(
            "Erreur lors du chargement du tableau de bord."
        );

    }

}


/* =========================================
   RECENTES ANNONCES
========================================= */

async function loadRecentAnnonces() {

    const container =
        document.getElementById(
            "recent-annonces"
        );


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "annonces"
                    ),
                    orderBy(
                        "createdAt",
                        "desc"
                    ),
                    limit(10)
                )
            );


        if (snapshot.empty) {

            container.innerHTML =
                `<div class="empty-state">
                    Aucune annonce.
                </div>`;

            return;
        }


        container.innerHTML =
            createAnnoncesTable(
                snapshot.docs
            );

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Impossible de charger les annonces.
            </div>`;

    }

}


/* =========================================
   UTILISATEURS
========================================= */

async function loadUsers() {

    const container =
        document.getElementById(
            "users-table"
        );


    container.innerHTML =
        `<div class="empty-state">
            Chargement...
        </div>`;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        if (snapshot.empty) {

            container.innerHTML =
                `<div class="empty-state">
                    Aucun utilisateur.
                </div>`;

            return;
        }


        let html = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Statut</th>

                </tr>

            </thead>

            <tbody>
        `;


        snapshot.forEach(
            userDoc => {

                const user =
                    userDoc.data();


                html += `

                <tr>

                    <td>
                        ${escapeHTML(
                            user.displayName ||
                            "Sans nom"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.email ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.phoneNumber ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.role ||
                            "client"
                        )}
                    </td>

                    <td>
                        ${
                            user.isActive === false
                            ? "Inactif"
                            : "Actif"
                        }
                    </td>

                </tr>

                `;

            }
        );


        html += `
            </tbody>
        </table>
        `;


        container.innerHTML =
            html;

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Erreur de chargement.
            </div>`;

    }

}


/* =========================================
   ANNONCES
========================================= */

async function loadAnnonces() {

    const container =
        document.getElementById(
            "annonces-table"
        );


    container.innerHTML =
        `<div class="empty-state">
            Chargement...
        </div>`;


    try {

        const filter =
            document.getElementById(
                "annonce-filter"
            ).value;


        let annoncesQuery;


        if (filter === "all") {

            annoncesQuery =
                collection(
                    db,
                    "annonces"
                );

        } else {

            annoncesQuery =
                query(
                    collection(
                        db,
                        "annonces"
                    ),
                    where(
                        "status",
                        "==",
                        filter
                    )
                );

        }


        const snapshot =
            await getDocs(
                annoncesQuery
            );


        container.innerHTML =
            createAnnoncesTable(
                snapshot.docs,
                true
            );


        attachAnnonceActions();

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Erreur de chargement des annonces.
            </div>`;

    }

}


document
    .getElementById("annonce-filter")
    .addEventListener(
        "change",
        loadAnnonces
    );


/* =========================================
   TABLE ANNONCES
========================================= */

function createAnnoncesTable(
    docs,
    actions = true
) {

    if (!docs.length) {

        return `
            <div class="empty-state">
                Aucune annonce.
            </div>
        `;

    }


    let html = `

    <table class="admin-table">

        <thead>

            <tr>

                <th>Titre</th>
                <th>Catégorie</th>
                <th>Ville</th>
                <th>Prix</th>
                <th>Statut</th>

                ${
                    actions
                    ? "<th>Actions</th>"
                    : ""
                }

            </tr>

        </thead>

        <tbody>

    `;


    docs.forEach(
        annonceDoc => {

            const annonce =
                annonceDoc.data();


            const status =
                annonce.status ||
                "pending";


            html += `

            <tr>

                <td>
                    ${escapeHTML(
                        annonce.title ||
                        "Sans titre"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        annonce.category ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        annonce.city ||
                        "-"
                    )}
                </td>

                <td>
                    ${formatPrice(
                        annonce.price,
                        annonce.currency
                    )}
                </td>

                <td>

                    <span class="status ${status}">
                        ${status}
                    </span>

                </td>

                ${
                    actions
                    ?

                    `<td>

                        ${
                            status === "pending"

                            ?

                            `

                            <button
                                class="action-btn approve"
                                data-action="approve"
                                data-id="${annonceDoc.id}"
                                title="Approuver"
                            >
                                <i class="fas fa-check"></i>
                            </button>

                            <button
                                class="action-btn reject"
                                data-action="reject"
                                data-id="${annonceDoc.id}"
                                title="Refuser"
                            >
                                <i class="fas fa-times"></i>
                            </button>

                            `

                            :

                            ""

                        }


                        <button
                            class="action-btn delete"
                            data-action="delete"
                            data-id="${annonceDoc.id}"
                            title="Supprimer"
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </td>`

                    :

                    ""
                }

            </tr>

            `;

        }
    );


    html += `

        </tbody>

    </table>

    `;


    return html;

}


/* =========================================
   ACTIONS ANNONCES
========================================= */

function attachAnnonceActions() {

    document
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.action;

                    const id =
                        button.dataset.id;


                    if (action === "approve") {

                        await updateAnnonceStatus(
                            id,
                            "approved"
                        );

                    }


                    if (action === "reject") {

                        await updateAnnonceStatus(
                            id,
                            "rejected"
                        );

                    }


                    if (action === "delete") {

                        await deleteAnnonce(
                            id
                        );

                    }

                }
            );

        });

}


/* =========================================
   STATUT
========================================= */

async function updateAnnonceStatus(
    id,
    status
) {

    try {

        await updateDoc(
            doc(
                db,
                "annonces",
                id
            ),
            {
                status,
                updatedAt:
                    serverTimestamp()
            }
        );


        showToast(
            status === "approved"
                ? "Annonce approuvée."
                : "Annonce refusée."
        );


        await loadDashboard();

        await loadAnnonces();

        await loadPending();

    } catch (error) {

        console.error(error);

        showToast(
            "Impossible de modifier cette annonce."
        );

    }

}


/* =========================================
   SUPPRIMER
========================================= */

async function deleteAnnonce(id) {

    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer cette annonce ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "annonces",
                id
            )
        );


        showToast(
            "Annonce supprimée."
        );


        await loadDashboard();

        await loadAnnonces();

    } catch (error) {

        console.error(error);

        showToast(
            "Impossible de supprimer l'annonce."
        );

    }

}


/* =========================================
   PENDING
========================================= */

async function loadPending() {

    const container =
        document.getElementById(
            "pending-list"
        );


    container.innerHTML =
        `<div class="empty-state">
            Chargement...
        </div>`;


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "annonces"
                    ),
                    where(
                        "status",
                        "==",
                        "pending"
                    )
                )
            );


        if (snapshot.empty) {

            container.innerHTML =
                `<div class="empty-state">
                    Aucune annonce en attente.
                </div>`;

            return;

        }


        container.innerHTML = "";


        snapshot.forEach(
            annonceDoc => {

                const annonce =
                    annonceDoc.data();


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pending-card";


                card.innerHTML = `

                    <img
                        src="${
                            escapeHTML(
                                annonce.imageURL ||
                                "assets/default-annonce.jpg"
                            )
                        }"
                        onerror="
                            this.src='assets/default-annonce.jpg'
                        "
                    >

                    <div class="pending-card-body">

                        <h3>
                            ${escapeHTML(
                                annonce.title ||
                                "Sans titre"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                annonce.category ||
                                "-"
                            )}
                        </p>

                        <p>
                            <i class="fas fa-location-dot"></i>
                            ${escapeHTML(
                                annonce.city ||
                                "-"
                            )}
                        </p>

                        <strong>
                            ${formatPrice(
                                annonce.price,
                                annonce.currency
                            )}
                        </strong>


                        <div class="pending-actions">

                            <button
                                class="approve-btn"
                                data-pending-action="approve"
                                data-id="${annonceDoc.id}"
                            >
                                <i class="fas fa-check"></i>
                                Approuver
                            </button>


                            <button
                                class="reject-btn"
                                data-pending-action="reject"
                                data-id="${annonceDoc.id}"
                            >
                                <i class="fas fa-times"></i>
                                Refuser
                            </button>

                        </div>

                    </div>

                `;


                container.appendChild(card);

            }
        );


        attachPendingActions();

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty-state">
                Erreur de chargement.
            </div>`;

    }

}


/* =========================================
   ACTIONS PENDING
========================================= */

function attachPendingActions() {

    document
        .querySelectorAll(
            "[data-pending-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.pendingAction;

                    const id =
                        button.dataset.id;


                    await updateAnnonceStatus(
                        id,
                        action === "approve"
                            ? "approved"
                            : "rejected"
                    );

                }
            );

        });

}


/* =========================================
   COMMUNIQUE
========================================= */

async function loadCommunique() {

    try {

        const ref =
            doc(
                db,
                "communiques",
                "principal"
            );


        const snapshot =
            await getDoc(ref);


        const display =
            document.getElementById(
                "current-communique"
            );


        if (!snapshot.exists()) {

            display.textContent =
                "Aucun communiqué.";

            return;

        }


        const data =
            snapshot.data();


        display.textContent =
            data.text ||
            "Aucun communiqué.";


        document.getElementById(
            "communique-text-input"
        ).value =
            data.text || "";

    } catch (error) {

        console.error(error);

    }

}


document
    .getElementById("communique-form")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const text =
                document.getElementById(
                    "communique-text-input"
                ).value.trim();


            if (!text) {

                showToast(
                    "Écrivez un communiqué."
                );

                return;

            }


            try {

                await setDoc(

                    doc(
                        db,
                        "communiques",
                        "principal"
                    ),

                    {
                        text,

                        updatedAt:
                            serverTimestamp(),

                        updatedBy:
                            auth.currentUser.uid
                    }

                );


                document.getElementById(
                    "current-communique"
                ).textContent =
                    text;


                showToast(
                    "Communiqué enregistré."
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Impossible d'enregistrer le communiqué."
                );

            }

        }
    );


/* =========================================
   RECHERCHE UTILISATEURS
========================================= */

document
    .getElementById("user-search")
    .addEventListener(
        "input",
        async event => {

            const search =
                event.target.value
                    .trim()
                    .toLowerCase();


            const rows =
                document.querySelectorAll(
                    "#users-table tbody tr"
                );


            rows.forEach(row => {

                row.style.display =
                    row.textContent
                        .toLowerCase()
                        .includes(search)
                        ? ""
                        : "none";

            });

        }
    );


/* =========================================
   REFRESH
========================================= */

document
    .getElementById("refresh-btn")
    .addEventListener(
        "click",
        async () => {

            const icon =
                document.querySelector(
                    "#refresh-btn i"
                );


            icon.classList.add(
                "fa-spin"
            );


            await loadDashboard();


            icon.classList.remove(
                "fa-spin"
            );


            showToast(
                "Tableau de bord actualisé."
            );

        }
    );


/* =========================================
   MENU MOBILE
========================================= */

document
    .getElementById("mobile-menu-btn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "admin-sidebar"
                )
                .classList.toggle("open");

        }
    );


/* =========================================
   RETOUR SITE
========================================= */

document
    .getElementById("back-site-btn")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "index.html";

        }
    );


/* =========================================
   LOGOUT
========================================= */

document
    .getElementById("logout-btn")
    .addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "connexion.html";

            } catch (error) {

                console.error(error);

                showToast(
                    "Erreur de déconnexion."
                );

            }

        }
    );


/* =========================================
   UTILITAIRES
========================================= */

function formatPrice(
    price,
    currency
) {

    if (
        price === undefined ||
        price === null
    ) {

        return "-";

    }


    return `${Number(price).toLocaleString("fr-FR")} ${currency || "USD"}`;

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3000);

}
