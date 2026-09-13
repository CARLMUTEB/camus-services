/* =========================================================
   CAMU SERVICES
   ADMIN — GESTION DES PAIEMENTS PREMIUM
   ========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

const PAYMENTS_COLLECTION = "premiumPayments";
const USERS_COLLECTION = "users";


/* =========================================================
   VARIABLES
   ========================================================= */

let currentAdmin = null;
let allPremiumPayments = [];


/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const pendingCountElement =
    document.getElementById("premiumPendingCount");

const approvedCountElement =
    document.getElementById("premiumApprovedCount");

const rejectedCountElement =
    document.getElementById("premiumRejectedCount");

const searchElement =
    document.getElementById("premiumPaymentSearch");

const statusFilterElement =
    document.getElementById("premiumPaymentStatusFilter");

const planFilterElement =
    document.getElementById("premiumPaymentPlanFilter");

const paymentsListElement =
    document.getElementById("premiumPaymentsList");

const refreshButton =
    document.getElementById("refreshPremiumPayments");

const adminMessage =
    document.getElementById("adminMessage");


/* =========================================================
   VÉRIFIER QUE LES ÉLÉMENTS EXISTENT
   ========================================================= */

const premiumElementsExist =
    pendingCountElement &&
    approvedCountElement &&
    rejectedCountElement &&
    searchElement &&
    statusFilterElement &&
    planFilterElement &&
    paymentsListElement &&
    refreshButton;


/* =========================================================
   MESSAGE ADMIN
   ========================================================= */

function showAdminMessage(message, type = "success") {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent = message;

    adminMessage.className =
        `admin-message ${type}`;

    adminMessage.hidden = false;

    clearTimeout(showAdminMessage.timer);

    showAdminMessage.timer = setTimeout(() => {

        adminMessage.hidden = true;

    }, 5000);
}


/* =========================================================
   ÉCHAPPER LE HTML
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "Date inconnue";
    }

    try {

        let date;

        if (typeof timestamp.toDate === "function") {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        if (Number.isNaN(date.getTime())) {
            return "Date inconnue";
        }

        return date.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    } catch (error) {

        console.error(
            "Erreur formatage date :",
            error
        );

        return "Date inconnue";
    }
}


/* =========================================================
   NOM DU PLAN
   ========================================================= */

function getPlanName(plan) {

    switch (plan) {

        case "weekly":
            return "Premium hebdomadaire";

        case "monthly":
            return "Premium mensuel";

        case "yearly":
            return "Premium annuel";

        default:
            return plan || "Formule inconnue";
    }
}


/* =========================================================
   DURÉE DU PLAN
   ========================================================= */

function getPlanDuration(plan) {

    switch (plan) {

        case "weekly":
            return "1 semaine";

        case "monthly":
            return "1 mois";

        case "yearly":
            return "1 an";

        default:
            return "";
    }
}


/* =========================================================
   MONTANT DU PLAN
   ========================================================= */

function getPlanAmount(plan) {

    switch (plan) {

        case "weekly":
            return 4;

        case "monthly":
            return 11;

        case "yearly":
            return 90;

        default:
            return 0;
    }
}


/* =========================================================
   NOM DU MOYEN DE PAIEMENT
   ========================================================= */

function getPaymentMethodName(method) {

    switch (method) {

        case "mpesa":
            return "M-Pesa";

        case "airtel":
            return "Airtel Money";

        default:
            return method || "Inconnu";
    }
}


/* =========================================================
   CLASSE DU STATUT
   ========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "pending":
            return "pending";

        case "approved":
            return "approved";

        case "rejected":
            return "rejected";

        default:
            return "";
    }
}


/* =========================================================
   NOM DU STATUT
   ========================================================= */

function getStatusName(status) {

    switch (status) {

        case "pending":
            return "En attente";

        case "approved":
            return "Approuvé";

        case "rejected":
            return "Refusé";

        default:
            return status || "Inconnu";
    }
}


/* =========================================================
   CALCUL DE LA DATE DE FIN PREMIUM
   ========================================================= */

function calculateEndDate(plan) {

    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (plan) {

        case "weekly":

            endDate.setDate(
                endDate.getDate() + 7
            );

            break;


        case "monthly":

            endDate.setMonth(
                endDate.getMonth() + 1
            );

            break;


        case "yearly":

            endDate.setFullYear(
                endDate.getFullYear() + 1
            );

            break;


        default:

            throw new Error(
                "Formule Premium inconnue."
            );
    }

    return {
        startDate,
        endDate
    };
}


/* =========================================================
   CHARGER LES PAIEMENTS
   ========================================================= */

async function loadPremiumPayments() {

    if (!premiumElementsExist) {
        console.warn(
            "Éléments Premium introuvables dans admin.html."
        );
        return;
    }

    paymentsListElement.innerHTML = `
        <div class="admin-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Chargement des paiements Premium...
            </span>

        </div>
    `;


    try {

        const snapshot = await getDocs(
            collection(db, PAYMENTS_COLLECTION)
        );


        allPremiumPayments = [];


        snapshot.forEach((paymentDoc) => {

            allPremiumPayments.push({
                id: paymentDoc.id,
                ...paymentDoc.data()
            });

        });


        /* =================================================
           TRI : PLUS RÉCENT EN PREMIER
        ================================================= */

        allPremiumPayments.sort((a, b) => {

            const dateA =
                a.createdAt?.toMillis?.() || 0;

            const dateB =
                b.createdAt?.toMillis?.() || 0;

            return dateB - dateA;

        });


        updatePremiumCounters();

        applyPremiumFilters();


    } catch (error) {

        console.error(
            "Erreur chargement paiements Premium :",
            error
        );


        paymentsListElement.innerHTML = `
            <div class="admin-empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Impossible de charger les paiements
                </h3>

                <p>
                    Vérifiez votre connexion et les règles
                    Firestore.
                </p>

            </div>
        `;


        showAdminMessage(
            "Impossible de charger les paiements Premium.",
            "error"
        );
    }
}


/* =========================================================
   COMPTEURS
   ========================================================= */

function updatePremiumCounters() {

    if (!premiumElementsExist) {
        return;
    }


    const pending =
        allPremiumPayments.filter(
            payment => payment.status === "pending"
        ).length;


    const approved =
        allPremiumPayments.filter(
            payment => payment.status === "approved"
        ).length;


    const rejected =
        allPremiumPayments.filter(
            payment => payment.status === "rejected"
        ).length;


    pendingCountElement.textContent = pending;

    approvedCountElement.textContent = approved;

    rejectedCountElement.textContent = rejected;
}


/* =========================================================
   FILTRES
   ========================================================= */

function applyPremiumFilters() {

    if (!premiumElementsExist) {
        return;
    }


    const search =
        searchElement.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilterElement.value;


    const selectedPlan =
        planFilterElement.value;


    const filtered =
        allPremiumPayments.filter((payment) => {


            /* =============================================
               RECHERCHE
            ============================================= */

            const searchText = [

                payment.userName,

                payment.userEmail,

                payment.paymentReference,

                payment.receiverNumber,

                payment.paymentMethod,

                payment.plan

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchText.includes(search);


            /* =============================================
               STATUT
            ============================================= */

            const matchesStatus =
                selectedStatus === "all" ||
                payment.status === selectedStatus;


            /* =============================================
               FORMULE
            ============================================= */

            const matchesPlan =
                selectedPlan === "all" ||
                payment.plan === selectedPlan;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPlan
            );

        });


    renderPremiumPayments(filtered);
}


/* =========================================================
   AFFICHER LES PAIEMENTS
   ========================================================= */

function renderPremiumPayments(payments) {

    if (!paymentsListElement) {
        return;
    }


    if (!payments.length) {

        paymentsListElement.innerHTML = `
            <div class="admin-empty">

                <i class="fa-solid fa-receipt"></i>

                <h3>
                    Aucun paiement trouvé
                </h3>

                <p>
                    Aucun paiement Premium ne correspond
                    aux critères sélectionnés.
                </p>

            </div>
        `;

        return;
    }


    paymentsListElement.innerHTML =
        payments.map(
            payment => createPaymentCard(payment)
        ).join("");


    attachPaymentActions();
}


/* =========================================================
   CARTE PAIEMENT
   ========================================================= */

function createPaymentCard(payment) {

    const statusClass =
        getStatusClass(payment.status);

    const statusName =
        getStatusName(payment.status);

    const planName =
        getPlanName(payment.plan);

    const amount =
        payment.amount ??
        getPlanAmount(payment.plan);


    const paymentMethod =
        getPaymentMethodName(
            payment.paymentMethod
        );


    const userName =
        escapeHTML(
            payment.userName || "Utilisateur"
        );


    const userEmail =
        escapeHTML(
            payment.userEmail || "Email non disponible"
        );


    const reference =
        escapeHTML(
            payment.paymentReference ||
            "Référence non renseignée"
        );


    const receiverNumber =
        escapeHTML(
            payment.receiverNumber || "-"
        );


    const createdAt =
        formatDate(payment.createdAt);


    const validatedAt =
        payment.validatedAt
            ? formatDate(payment.validatedAt)
            : "";


    let actionHTML = "";


    /* =====================================================
       ACTIONS
    ===================================================== */

    if (payment.status === "pending") {

        actionHTML = `

            <div class="premium-payment-actions">

                <button
                    type="button"
                    class="premium-action-button approve"
                    data-action="approve"
                    data-payment-id="${escapeHTML(payment.id)}"
                >

                    <i class="fa-solid fa-circle-check"></i>

                    Approuver

                </button>


                <button
                    type="button"
                    class="premium-action-button reject"
                    data-action="reject"
                    data-payment-id="${escapeHTML(payment.id)}"
                >

                    <i class="fa-solid fa-circle-xmark"></i>

                    Refuser

                </button>

            </div>

        `;

    } else if (payment.status === "approved") {

        actionHTML = `

            <div class="premium-payment-validated">

                <i class="fa-solid fa-circle-check"></i>

                Paiement validé

                ${
                    validatedAt
                        ? `<small>${escapeHTML(validatedAt)}</small>`
                        : ""
                }

            </div>

        `;

    } else if (payment.status === "rejected") {

        actionHTML = `

            <div class="premium-payment-validated rejected">

                <i class="fa-solid fa-circle-xmark"></i>

                Paiement refusé

                ${
                    validatedAt
                        ? `<small>${escapeHTML(validatedAt)}</small>`
                        : ""
                }

            </div>

        `;
    }


    return `

        <article
            class="premium-payment-card"
            data-payment-id="${escapeHTML(payment.id)}"
        >


            <div class="premium-payment-card-header">


                <div class="premium-payment-user">


                    <div class="premium-payment-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>


                    <div>

                        <h3>
                            ${userName}
                        </h3>

                        <p>
                            ${userEmail}
                        </p>

                    </div>


                </div>


                <span
                    class="premium-payment-status ${statusClass}"
                >

                    ${
                        payment.status === "pending"
                            ? '<i class="fa-solid fa-clock"></i>'
                            : payment.status === "approved"
                                ? '<i class="fa-solid fa-circle-check"></i>'
                                : '<i class="fa-solid fa-circle-xmark"></i>'
                    }

                    ${statusName}

                </span>


            </div>



            <div class="premium-payment-details">


                <div class="premium-payment-detail">

                    <span>
                        Formule
                    </span>

                    <strong>
                        <i class="fa-solid fa-crown"></i>
                        ${escapeHTML(planName)}
                    </strong>

                </div>



                <div class="premium-payment-detail">

                    <span>
                        Montant
                    </span>

                    <strong>
                        $${escapeHTML(amount)}
                    </strong>

                </div>



                <div class="premium-payment-detail">

                    <span>
                        Durée
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.duration ||
                            getPlanDuration(payment.plan)
                        )}
                    </strong>

                </div>



                <div class="premium-payment-detail">

                    <span>
                        Moyen de paiement
                    </span>

                    <strong>
                        ${escapeHTML(paymentMethod)}
                    </strong>

                </div>



                <div class="premium-payment-detail">

                    <span>
                        Numéro destinataire
                    </span>

                    <strong>
                        ${receiverNumber}
                    </strong>

                </div>



                <div class="premium-payment-detail">

                    <span>
                        Date
                    </span>

                    <strong>
                        ${escapeHTML(createdAt)}
                    </strong>

                </div>


            </div>



            <div class="premium-payment-reference">


                <div>

                    <span>
                        Référence de transaction
                    </span>

                    <strong>
                        ${reference}
                    </strong>

                </div>


                <button
                    type="button"
                    class="premium-copy-reference"
                    data-reference="${reference}"
                    title="Copier la référence"
                >

                    <i class="fa-regular fa-copy"></i>

                </button>


            </div>



            ${actionHTML}


        </article>

    `;
}


/* =========================================================
   ATTACHER LES ACTIONS
   ========================================================= */

function attachPaymentActions() {


    const actionButtons =
        document.querySelectorAll(
            "[data-action][data-payment-id]"
        );


    actionButtons.forEach(button => {

        button.addEventListener(
            "click",
            handlePaymentAction
        );

    });


    const copyButtons =
        document.querySelectorAll(
            ".premium-copy-reference"
        );


    copyButtons.forEach(button => {

        button.addEventListener(
            "click",
            handleCopyReference
        );

    });
}


/* =========================================================
   COPIER RÉFÉRENCE
   ========================================================= */

async function handleCopyReference(event) {

    const button =
        event.currentTarget;


    const reference =
        button.dataset.reference;


    if (!reference) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            reference
        );


        const oldHTML =
            button.innerHTML;


        button.innerHTML =
            '<i class="fa-solid fa-check"></i>';


        setTimeout(() => {

            button.innerHTML =
                oldHTML;

        }, 1500);


    } catch (error) {

        console.error(
            "Impossible de copier la référence :",
            error
        );

    }
}


/* =========================================================
   ACTION PAIEMENT
   ========================================================= */

async function handlePaymentAction(event) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const paymentId =
        button.dataset.paymentId;


    if (!paymentId) {
        return;
    }


    const payment =
        allPremiumPayments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        showAdminMessage(
            "Paiement introuvable.",
            "error"
        );

        return;
    }


    if (payment.status !== "pending") {

        showAdminMessage(
            "Ce paiement a déjà été traité.",
            "error"
        );

        return;
    }


    /* =====================================================
       CONFIRMATION
    ===================================================== */

    if (action === "approve") {

        const confirmed =
            window.confirm(
                `Voulez-vous vraiment approuver le paiement de ${payment.userName || "cet utilisateur"} pour ${payment.amount ?? getPlanAmount(payment.plan)} $ ?`
            );


        if (!confirmed) {
            return;
        }


        await approvePayment(
            payment,
            button
        );


    } else if (action === "reject") {

        const confirmed =
            window.confirm(
                `Voulez-vous vraiment refuser le paiement de ${payment.userName || "cet utilisateur"} ?`
            );


        if (!confirmed) {
            return;
        }


        await rejectPayment(
            payment,
            button
        );
    }
}


/* =========================================================
   BOUTON CHARGEMENT
   ========================================================= */

function setButtonLoading(button, loading = true) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.originalHTML =
            button.innerHTML;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Traitement...
        `;

    } else {

        button.disabled = false;

        if (button.dataset.originalHTML) {

            button.innerHTML =
                button.dataset.originalHTML;
        }
    }
}


/* =========================================================
   APPROUVER PAIEMENT
   ========================================================= */

async function approvePayment(payment, button) {

    setButtonLoading(
        button,
        true
    );


    try {

        /* ================================================
           VÉRIFIER L'UTILISATEUR
        ================================================= */

        const userRef =
            doc(
                db,
                USERS_COLLECTION,
                payment.userId
            );


        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            throw new Error(
                "Utilisateur introuvable dans la collection users."
            );
        }


        /* ================================================
           VÉRIFIER LA FORMULE
        ================================================= */

        const validPlans = [
            "weekly",
            "monthly",
            "yearly"
        ];


        if (!validPlans.includes(payment.plan)) {

            throw new Error(
                "Formule Premium invalide."
            );
        }


        /* ================================================
           VÉRIFIER LE MONTANT
        ================================================= */

        const expectedAmount =
            getPlanAmount(payment.plan);


        const paymentAmount =
            Number(payment.amount);


        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount !== expectedAmount
        ) {

            throw new Error(
                `Le montant du paiement ne correspond pas à la formule. Montant attendu : ${expectedAmount} $.`
            );
        }


        /* ================================================
           CALCUL ABONNEMENT
        ================================================= */

        const {
            startDate,
            endDate
        } = calculateEndDate(
            payment.plan
        );


        /* ================================================
           METTRE À JOUR UTILISATEUR
        ================================================= */

        await updateDoc(
            userRef,
            {

                plan: "premium",

                subscriptionStatus: "active",

                subscriptionStart: startDate,

                subscriptionEnd: endDate,

                updatedAt: serverTimestamp()

            }
        );


        /* ================================================
           METTRE À JOUR PAIEMENT
        ================================================= */

        const paymentRef =
            doc(
                db,
                PAYMENTS_COLLECTION,
                payment.id
            );


        await updateDoc(
            paymentRef,
            {

                status: "approved",

                validatedAt: serverTimestamp(),

                validatedBy:
                    currentAdmin?.uid || ""

            }
        );


        /* ================================================
           METTRE À JOUR LOCAL
        ================================================= */

        payment.status =
            "approved";

        payment.validatedAt =
            {
                toDate: () => new Date()
            };

        payment.validatedBy =
            currentAdmin?.uid || "";


        updatePremiumCounters();

        applyPremiumFilters();


        showAdminMessage(
            `Le paiement de ${payment.userName || "l'utilisateur"} a été approuvé. Premium activé.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Erreur approbation paiement :",
            error
        );


        showAdminMessage(
            error.message ||
            "Impossible d'approuver le paiement.",
            "error"
        );


        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   REFUSER PAIEMENT
   ========================================================= */

async function rejectPayment(payment, button) {

    setButtonLoading(
        button,
        true
    );


    try {

        const paymentRef =
            doc(
                db,
                PAYMENTS_COLLECTION,
                payment.id
            );


        await updateDoc(
            paymentRef,
            {

                status: "rejected",

                validatedAt:
                    serverTimestamp(),

                validatedBy:
                    currentAdmin?.uid || ""

            }
        );


        /* ================================================
           METTRE À JOUR LOCAL
        ================================================= */

        payment.status =
            "rejected";

        payment.validatedAt =
            {
                toDate: () => new Date()
            };

        payment.validatedBy =
            currentAdmin?.uid || "";


        updatePremiumCounters();

        applyPremiumFilters();


        showAdminMessage(
            `Le paiement de ${payment.userName || "l'utilisateur"} a été refusé.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Erreur refus paiement :",
            error
        );


        showAdminMessage(
            error.message ||
            "Impossible de refuser le paiement.",
            "error"
        );


        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   ÉVÉNEMENTS FILTRES
   ========================================================= */

if (premiumElementsExist) {

    searchElement.addEventListener(
        "input",
        applyPremiumFilters
    );


    statusFilterElement.addEventListener(
        "change",
        applyPremiumFilters
    );


    planFilterElement.addEventListener(
        "change",
        applyPremiumFilters
    );


    refreshButton.addEventListener(
        "click",
        async () => {

            const oldHTML =
                refreshButton.innerHTML;


            refreshButton.disabled =
                true;


            refreshButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Actualisation...
            `;


            await loadPremiumPayments();


            refreshButton.disabled =
                false;


            refreshButton.innerHTML =
                oldHTML;
        }
    );
}


/* =========================================================
   AUTHENTIFICATION ADMIN
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            console.warn(
                "Aucun utilisateur connecté."
            );

            return;
        }


        currentAdmin = user;


        /* =================================================
           VÉRIFICATION ADMIN
        ================================================= */

        if (
            user.email?.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            console.warn(
                "Accès Premium refusé : utilisateur non administrateur."
            );

            return;
        }


        console.log(
            "Administration Premium autorisée."
        );


        /* =================================================
           CHARGER PAIEMENTS
        ================================================= */

        if (premiumElementsExist) {

            await loadPremiumPayments();

        }

    }
);


/* =========================================================
   EXPORT POUR DEBUG
   ========================================================= */

window.CAMU_ADMIN_PREMIUM = {

    reload: loadPremiumPayments,

    filter: applyPremiumFilters

};
