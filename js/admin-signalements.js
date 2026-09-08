import { auth, db }
    from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* =========================================================
   ADMIN
========================================================= */

const ADMIN_EMAIL =
    "meschackmuteb@gmail.com";



/* =========================================================
   ÉLÉMENTS
========================================================= */

const container =
    document.getElementById(
        "adminReportsContainer"
    );


const loading =
    document.getElementById(
        "reportsLoading"
    );


const empty =
    document.getElementById(
        "reportsEmpty"
    );


const searchInput =
    document.getElementById(
        "adminReportsSearch"
    );


const statusSelect =
    document.getElementById(
        "adminReportsStatus"
    );


const resultCount =
    document.getElementById(
        "reportsResultCount"
    );


const totalCount =
    document.getElementById(
        "reportsTotalCount"
    );


const pendingCount =
    document.getElementById(
        "reportsPendingCount"
    );


const handledCount =
    document.getElementById(
        "reportsHandledCount"
    );


const modal =
    document.getElementById(
        "reportDetailsModal"
    );


const modalContent =
    document.getElementById(
        "reportModalContent"
    );


const modalHandleButton =
    document.getElementById(
        "modalHandleReport"
    );


let allReports = [];

let currentReportId = null;



/* =========================================================
   PROTECTION HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}



/* =========================================================
   DATE
========================================================= */

function timestampMillis(timestamp) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        typeof timestamp.seconds ===
        "number"
    ) {

        return timestamp.seconds * 1000;

    }


    if (timestamp instanceof Date) {

        return timestamp.getTime();

    }


    return 0;
}



function formatDate(timestamp) {

    const value =
        timestampMillis(timestamp);


    if (!value) {

        return "Date inconnue";

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(value)
    );
}



/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    isError = false
) {

    const box =
        document.getElementById(
            "adminReportMessage"
        );


    if (!box) {
        return;
    }


    box.textContent = text;

    box.hidden = false;


    box.style.background =
        isError
            ? "#fef2f2"
            : "#ecfdf3";


    box.style.color =
        isError
            ? "#b91c1c"
            : "#166534";


    box.style.borderColor =
        isError
            ? "#fecaca"
            : "#bbf7d0";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                box.hidden = true;

            },
            4500
        );
}



/* =========================================================
   STATUT
========================================================= */

function getStatus(report) {

    if (
        report.status === "handled" ||
        report.status === "traite"
    ) {

        return "handled";

    }


    return "pending";
}



/* =========================================================
   INFORMATIONS
========================================================= */

function getTitle(report) {

    return (
        report.serviceTitle ||
        report.title ||
        report.serviceName ||
        "Annonce non renseignée"
    );
}



function getReason(report) {

    return (
        report.reason ||
        report.motif ||
        "Motif non précisé"
    );
}



function getReporter(report) {

    return (
        report.reporterName ||
        report.reporterEmail ||
        report.reporterId ||
        "Utilisateur non renseigné"
    );
}



/* =========================================================
   STATISTIQUES
========================================================= */

function renderStats() {

    const pending =
        allReports.filter(
            report =>
                getStatus(report) ===
                "pending"
        ).length;


    const handled =
        allReports.length -
        pending;


    totalCount.textContent =
        allReports.length;


    pendingCount.textContent =
        pending;


    handledCount.textContent =
        handled;
}



/* =========================================================
   FILTRES
========================================================= */

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusSelect.value;


    const filtered =
        allReports.filter(
            report => {

                const reportStatus =
                    getStatus(report);


                if (
                    selectedStatus !==
                    "all" &&
                    reportStatus !==
                    selectedStatus
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const text = [

                    report.id,

                    getTitle(report),

                    getReason(report),

                    report.description,

                    report.serviceId,

                    report.ownerId,

                    report.reporterId,

                    report.reporterName,

                    report.reporterEmail

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    renderReports(filtered);
}



/* =========================================================
   AFFICHER LES SIGNALEMENTS
========================================================= */

function renderReports(reports) {

    resultCount.textContent =
        `${reports.length} signalement${
            reports.length > 1
                ? "s"
                : ""
        }`;


    loading.hidden = true;


    if (!reports.length) {

        container.innerHTML = "";

        empty.hidden = false;

        return;

    }


    empty.hidden = true;


    container.innerHTML =
        reports.map(
            report => {

                const status =
                    getStatus(report);


                const handled =
                    status ===
                    "handled";


                return `

<article
    class="admin-report-card ${
        handled
            ? "is-handled"
            : ""
    }"
>

    <div class="report-card-main">

        <div class="report-card-top">

            <h2 class="report-card-title">

                ${
                    escapeHTML(
                        getTitle(report)
                    )
                }

            </h2>


            <span
                class="report-status ${
                    status
                }"
            >

                <i
                    class="fa-solid ${
                        handled
                            ? "fa-circle-check"
                            : "fa-hourglass-half"
                    }"
                ></i>

                ${
                    handled
                        ? "Traité"
                        : "En attente"
                }

            </span>

        </div>


        <p class="report-reason">

            <i
                class="fa-solid fa-triangle-exclamation"
            ></i>

            ${
                escapeHTML(
                    getReason(report)
                )
            }

        </p>


        <div class="report-meta">

            <span>

                <i
                    class="fa-solid fa-user"
                ></i>

                ${
                    escapeHTML(
                        getReporter(report)
                    )
                }

            </span>


            <span>

                <i
                    class="fa-regular fa-calendar"
                ></i>

                ${
                    escapeHTML(
                        formatDate(
                            report.createdAt
                        )
                    )
                }

            </span>


            <span>

                <i
                    class="fa-solid fa-hashtag"
                ></i>

                ${
                    escapeHTML(
                        report.id
                    )
                }

            </span>

        </div>

    </div>


    <div class="report-card-actions">

        <button
            type="button"
            class="report-view-btn"
            data-action="view"
            data-id="${
                escapeHTML(report.id)
            }"
        >

            <i
                class="fa-solid fa-eye"
            ></i>

            Voir

        </button>


        ${
            handled
                ? ""
                : `

<button
    type="button"
    class="report-handle-btn"
    data-action="handle"
    data-id="${
        escapeHTML(report.id)
    }"
>

    <i
        class="fa-solid fa-check"
    ></i>

    Traiter

</button>

`
        }


        <button
            type="button"
            class="report-delete-btn"
            data-action="delete"
            data-id="${
                escapeHTML(report.id)
            }"
        >

            <i
                class="fa-solid fa-trash"
            ></i>

            Supprimer

        </button>

    </div>

</article>

`;

            }
        )
        .join("");
}



/* =========================================================
   CHARGER LES SIGNALEMENTS
========================================================= */

async function loadReports() {

    loading.hidden = false;

    empty.hidden = true;

    container.innerHTML = "";


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "reports"
                )
            );


        allReports =
            snapshot.docs

                .map(
                    item => ({

                        id: item.id,

                        ...item.data()

                    })
                )

                .sort(
                    (a, b) =>
                        timestampMillis(
                            b.createdAt
                        ) -
                        timestampMillis(
                            a.createdAt
                        )
                );


        renderStats();

        applyFilters();


    } catch (error) {

        console.error(
            "Erreur chargement signalements :",
            error
        );


        loading.innerHTML = `

            <i
                class="fa-solid fa-circle-exclamation"
            ></i>

            <p>
                Impossible de charger les signalements.
            </p>

        `;


        loading.hidden = false;


        showMessage(
            "Erreur lors du chargement des signalements.",
            true
        );

    }

}



/* =========================================================
   OUVRIR LA MODALE
========================================================= */

function openReportModal(
    reportId
) {

    const report =
        allReports.find(
            item =>
                item.id ===
                reportId
        );


    if (!report) {
        return;
    }


    currentReportId =
        reportId;


    const status =
        getStatus(report);


    modalContent.innerHTML = `

<div class="report-detail-grid">

    <div class="report-detail-item">

        <span class="report-detail-label">
            Annonce concernée
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    getTitle(report)
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Motif du signalement
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    getReason(report)
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Description / précision
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    report.description ||
                    "Aucune précision fournie."
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Signalé par
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    getReporter(report)
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            ID de l'annonce
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    report.serviceId ||
                    "Non renseigné"
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Propriétaire
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    report.ownerId ||
                    "Non renseigné"
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Date
        </span>

        <div class="report-detail-value">

            ${
                escapeHTML(
                    formatDate(
                        report.createdAt
                    )
                )
            }

        </div>

    </div>


    <div class="report-detail-item">

        <span class="report-detail-label">
            Statut
        </span>

        <div class="report-detail-value">

            ${
                status === "handled"
                    ? "Traité"
                    : "En attente"
            }

        </div>

    </div>

</div>

`;


    modalHandleButton.hidden =
        status === "handled";


    modal.hidden = false;


    document.body.style.overflow =
        "hidden";
}



/* =========================================================
   FERMER MODALE
========================================================= */

function closeReportModal() {

    modal.hidden = true;

    currentReportId = null;

    document.body.style.overflow =
        "";
}



/* =========================================================
   TRAITER
========================================================= */

async function handleReport(
    reportId
) {

    const report =
        allReports.find(
            item =>
                item.id ===
                reportId
        );


    if (!report) {
        return;
    }


    if (
        getStatus(report) ===
        "handled"
    ) {

        return;

    }


    const confirmed =
        confirm(
            "Voulez-vous marquer ce signalement comme traité ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await updateDoc(

            doc(
                db,
                "reports",
                reportId
            ),

            {

                status:
                    "handled",

                handledAt:
                    serverTimestamp(),

                handledBy:
                    auth.currentUser?.uid ||
                    null,

                handledByEmail:
                    auth.currentUser?.email ||
                    null

            }

        );


        allReports =
            allReports.map(
                item =>
                    item.id ===
                    reportId

                        ? {
                            ...item,
                            status:
                                "handled"
                        }

                        : item
            );


        renderStats();

        applyFilters();


        if (
            currentReportId ===
            reportId
        ) {

            closeReportModal();

        }


        showMessage(
            "Signalement marqué comme traité."
        );


    } catch (error) {

        console.error(
            "Erreur traitement :",
            error
        );


        showMessage(
            "Impossible de traiter ce signalement.",
            true
        );

    }

}



/* =========================================================
   SUPPRIMER
========================================================= */

async function deleteReport(
    reportId
) {

    const report =
        allReports.find(
            item =>
                item.id ===
                reportId
        );


    if (!report) {
        return;
    }


    const confirmed =
        confirm(
            `Supprimer définitivement le signalement concernant "${getTitle(report)}" ?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(

            doc(
                db,
                "reports",
                reportId
            )

        );


        allReports =
            allReports.filter(
                item =>
                    item.id !==
                    reportId
            );


        renderStats();

        applyFilters();


        if (
            currentReportId ===
            reportId
        ) {

            closeReportModal();

        }


        showMessage(
            "Signalement supprimé."
        );


    } catch (error) {

        console.error(
            "Erreur suppression :",
            error
        );


        showMessage(
            "Impossible de supprimer ce signalement.",
            true
        );

    }

}



/* =========================================================
   ACTIONS DES CARTES
========================================================= */

container.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        const action =
            button.dataset.action;


        if (action === "view") {

            openReportModal(id);

        }


        if (action === "handle") {

            handleReport(id);

        }


        if (action === "delete") {

            deleteReport(id);

        }

    }
);



/* =========================================================
   MODALE
========================================================= */

document
    .querySelectorAll(
        "[data-close-report-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeReportModal
            );

        }
    );


modalHandleButton.addEventListener(
    "click",
    () => {

        if (currentReportId) {

            handleReport(
                currentReportId
            );

        }

    }
);



/* =========================================================
   FILTRES
========================================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


statusSelect.addEventListener(
    "change",
    applyFilters
);


document
    .getElementById(
        "clearAdminReportsFilters"
    )
    .addEventListener(
        "click",
        () => {

            searchInput.value = "";

            statusSelect.value =
                "all";

            applyFilters();

        }
    );



/* =========================================================
   ACTUALISER
========================================================= */

document
    .getElementById(
        "refreshReportsButton"
    )
    .addEventListener(
        "click",
        loadReports
    );



/* =========================================================
   DÉCONNEXION
========================================================= */

document
    .getElementById(
        "adminLogout"
    )
    .addEventListener(
        "click",
        async event => {

            event.preventDefault();


            try {

                await signOut(auth);

                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );


                showMessage(
                    "Impossible de se déconnecter.",
                    true
                );

            }

        }
    );



/* =========================================================
   MENU MOBILE ADMIN
========================================================= */

const sidebar =
    document.getElementById(
        "adminSidebar"
    );


const overlay =
    document.getElementById(
        "adminSidebarOverlay"
    );


const openSidebarButton =
    document.getElementById(
        "adminSidebarOpen"
    );


const closeSidebarButton =
    document.getElementById(
        "adminSidebarClose"
    );


function openSidebar() {

    sidebar?.classList.add(
        "open"
    );

    overlay?.classList.add(
        "active"
    );

}


function closeSidebar() {

    sidebar?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
        "active"
    );

}


openSidebarButton?.addEventListener(
    "click",
    openSidebar
);


closeSidebarButton?.addEventListener(
    "click",
    closeSidebar
);


overlay?.addEventListener(
    "click",
    closeSidebar
);


sidebar
    ?.querySelectorAll("a")
    .forEach(
        link => {

            link.addEventListener(
                "click",
                closeSidebar
            );

        }
    );



/* =========================================================
   TOUCHE ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeReportModal();

            closeSidebar();

        }

    }
);



/* =========================================================
   AUTHENTIFICATION ADMIN
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;

        }


        if (
            user.email?.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            alert(
                "Accès réservé à l'administrateur CAMU SERVICES."
            );


            window.location.href =
                "index.html";


            return;

        }


        await loadReports();

    }
);
