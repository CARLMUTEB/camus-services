// ============================================================
// CAMU SERVICES
// ADMIN - GESTION DES PAIEMENTS PREMIUM
// ============================================================

import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// CONFIGURATION
// ============================================================

const PAYMENT_COLLECTION = "premiumPayments";
const USERS_COLLECTION = "users";


// ============================================================
// VARIABLES
// ============================================================

let currentAdmin = null;
let allPayments = [];


// ============================================================
// ELEMENTS HTML
// ============================================================

const paymentsList =
    document.getElementById("premiumPaymentsList");

const searchInput =
    document.getElementById("premiumPaymentSearch");

const statusFilter =
    document.getElementById("premiumPaymentStatusFilter");

const planFilter =
    document.getElementById("premiumPaymentPlanFilter");

const refreshButton =
    document.getElementById("refreshPremiumPayments");

const pendingCount =
    document.getElementById("premiumPendingCount");

const approvedCount =
    document.getElementById("premiumApprovedCount");

const rejectedCount =
    document.getElementById("premiumRejectedCount");


// ============================================================
// INITIALISATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.warn(
            "Aucun utilisateur connecté."
        );

        return;
    }

    currentAdmin = user;

    await loadPremiumPayments();

});


// ============================================================
// CHARGER LES PAIEMENTS
// ============================================================

async function loadPremiumPayments() {

    if (!paymentsList) {
        return;
    }

    paymentsList.innerHTML = `
        <div class="admin-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Chargement des paiements Premium...
            </span>

        </div>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    PAYMENT_COLLECTION
                )
            );

        allPayments = [];

        snapshot.forEach((documentSnapshot) => {

            const data = documentSnapshot.data();

            allPayments.push({

                id: documentSnapshot.id,

                ...data

            });

        });


        // Plus récents en premier

        allPayments.sort((a, b) => {

            const dateA =
                getDateValue(a.createdAt);

            const dateB =
                getDateValue(b.createdAt);

            return dateB - dateA;

        });


        updatePaymentCounters();

        applyFilters();

    } catch (error) {

        console.error(
            "Erreur chargement paiements Premium :",
            error
        );

        paymentsList.innerHTML = `
            <div class="premium-empty-state error">

                <div class="premium-empty-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Impossible de charger les paiements
                </h3>

                <p>
                    Vérifiez votre connexion et les règles
                    de sécurité Firebase.
                </p>

                <button
                    type="button"
                    class="premium-action-button refresh"
                    id="retryPremiumPayments"
                >
                    <i class="fa-solid fa-rotate"></i>
                    Réessayer
                </button>

            </div>
        `;


        const retryButton =
            document.getElementById(
                "retryPremiumPayments"
            );

        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadPremiumPayments
            );

        }

    }

}


// ============================================================
// COMPTEURS
// ============================================================

function updatePaymentCounters() {

    const pending =
        allPayments.filter(
            payment =>
                payment.status === "pending"
        ).length;


    const approved =
        allPayments.filter(
            payment =>
                payment.status === "approved"
        ).length;


    const rejected =
        allPayments.filter(
            payment =>
                payment.status === "rejected"
        ).length;


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    if (approvedCount) {

        approvedCount.textContent =
            approved;

    }


    if (rejectedCount) {

        rejectedCount.textContent =
            rejected;

    }

}


// ============================================================
// FILTRES
// ============================================================

function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const selectedPlan =
        planFilter
            ? planFilter.value
            : "all";


    const filtered =
        allPayments.filter((payment) => {

            const name =
                String(
                    payment.userName || ""
                ).toLowerCase();


            const email =
                String(
                    payment.userEmail || ""
                ).toLowerCase();


            const reference =
                String(
                    payment.paymentReference || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                reference.includes(search);


            const matchesStatus =
                selectedStatus === "all" ||
                payment.status === selectedStatus;


            const matchesPlan =
                selectedPlan === "all" ||
                payment.plan === selectedPlan;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPlan
            );

        });


    displayPayments(filtered);

}


// ============================================================
// AFFICHER LES PAIEMENTS
// ============================================================

function displayPayments(payments) {

    if (!paymentsList) {
        return;
    }


    if (!payments.length) {

        paymentsList.innerHTML = `

            <div class="premium-empty-state">

                <div class="premium-empty-icon">

                    <i class="fa-solid fa-receipt"></i>

                </div>

                <h3>
                    Aucun paiement trouvé
                </h3>

                <p>
                    Aucun paiement ne correspond
                    aux critères sélectionnés.
                </p>

            </div>

        `;

        return;

    }


    paymentsList.innerHTML =
        payments
            .map(
                payment =>
                    createPaymentCard(payment)
            )
            .join("");


    attachPaymentActions();

}


// ============================================================
// CARTE PAIEMENT
// ============================================================

function createPaymentCard(payment) {

    const status =
        payment.status || "pending";


    const plan =
        getPlanName(payment.plan);


    const amount =
        formatAmount(payment.amount);


    const paymentMethod =
        getPaymentMethodName(
            payment.paymentMethod
        );


    const date =
        formatDate(payment.createdAt);


    const reference =
        escapeHTML(
            payment.paymentReference || "—"
        );


    const userName =
        escapeHTML(
            payment.userName || "Utilisateur"
        );


    const userEmail =
        escapeHTML(
            payment.userEmail || "—"
        );


    const receiverNumber =
        escapeHTML(
            payment.receiverNumber || "—"
        );


    const statusLabel =
        getStatusLabel(status);


    const statusClass =
        getStatusClass(status);


    const isPending =
        status === "pending";


    return `

        <article
            class="premium-payment-card"
            data-payment-id="${payment.id}"
        >


            <!-- EN-TÊTE -->

            <div class="premium-payment-card-header">


                <div class="premium-payment-user">


                    <div class="premium-payment-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>


                    <div>

                        <strong>
                            ${userName}
                        </strong>

                        <span>
                            ${userEmail}
                        </span>

                    </div>


                </div>


                <span
                    class="premium-payment-status ${statusClass}"
                >

                    ${statusLabel}

                </span>


            </div>


            <!-- INFORMATIONS -->

            <div class="premium-payment-details">


                <div class="premium-payment-detail">

                    <span>
                        <i class="fa-solid fa-crown"></i>
                        Formule
                    </span>

                    <strong>
                        ${plan}
                    </strong>

                </div>


                <div class="premium-payment-detail">

                    <span>
                        <i class="fa-solid fa-money-bill-wave"></i>
                        Montant
                    </span>

                    <strong>
                        $${amount}
                    </strong>

                </div>


                <div class="premium-payment-detail">

                    <span>
                        <i class="fa-solid fa-mobile-screen"></i>
                        Réseau
                    </span>

                    <strong>
                        ${paymentMethod}
                    </strong>

                </div>


                <div class="premium-payment-detail">

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Numéro destinataire
                    </span>

                    <strong>
                        ${receiverNumber}
                    </strong>

                </div>


                <div class="premium-payment-detail reference">

                    <span>
                        <i class="fa-solid fa-hashtag"></i>
                        Référence
                    </span>

                    <strong>
                        ${reference}
                    </strong>

                </div>


                <div class="premium-payment-detail">

                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        Date
                    </span>

                    <strong>
                        ${date}
                    </strong>

                </div>


            </div>


            <!-- ACTIONS -->

            ${
                isPending
                    ? `

                    <div class="premium-payment-actions">


                        <button
                            type="button"
                            class="premium-action-button approve"
                            data-action="approve"
                            data-payment-id="${payment.id}"
                        >

                            <i class="fa-solid fa-circle-check"></i>

                            Valider

                        </button>


                        <button
                            type="button"
                            class="premium-action-button reject"
                            data-action="reject"
                            data-payment-id="${payment.id}"
                        >

                            <i class="fa-solid fa-circle-xmark"></i>

                            Refuser

                        </button>


                    </div>

                    `
                    : `

                    <div class="premium-payment-processed">

                        <i class="fa-solid fa-shield-check"></i>

                        Paiement déjà traité

                    </div>

                    `
            }


        </article>

    `;

}


// ============================================================
// ACTIONS
// ============================================================

function attachPaymentActions() {

    const buttons =
        document.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const action =
                    button.dataset.action;

                const paymentId =
                    button.dataset.paymentId;


                if (
                    action === "approve"
                ) {

                    await approvePayment(
                        paymentId,
                        button
                    );

                }


                if (
                    action === "reject"
                ) {

                    await rejectPayment(
                        paymentId,
                        button
                    );

                }

            }
        );

    });

}


// ============================================================
// APPROUVER UN PAIEMENT
// ============================================================

async function approvePayment(
    paymentId,
    button
) {

    const payment =
        allPayments.find(
            item =>
                item.id === paymentId
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
            "warning"
        );

        return;

    }


    const confirmation =
        window.confirm(
            `Voulez-vous vraiment VALIDER ce paiement de ${payment.userName || "cet utilisateur"} pour ${formatAmount(payment.amount)} $ ?`
        );


    if (!confirmation) {
        return;
    }


    setButtonLoading(
        button,
        true,
        "Validation..."
    );


    try {

        // ====================================================
        // 1. VERIFIER L'UTILISATEUR
        // ====================================================

        if (!payment.userId) {

            throw new Error(
                "L'identifiant de l'utilisateur est absent."
            );

        }


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
                "Le compte utilisateur associé à ce paiement n'existe pas."
            );

        }


        // ====================================================
        // 2. CALCULER L'ABONNEMENT
        // ====================================================

        const now =
            new Date();


        const subscriptionEnd =
            calculateSubscriptionEnd(
                now,
                payment.plan
            );


        // ====================================================
        // 3. ACTIVER PREMIUM
        // ====================================================

        await updateDoc(
            userRef,
            {

                plan: "premium",

                subscriptionStatus: "active",

                subscriptionStart: now,

                subscriptionEnd: subscriptionEnd,

                updatedAt: serverTimestamp()

            }
        );


        // ====================================================
        // 4. MARQUER LE PAIEMENT APPROUVÉ
        // ====================================================

        const paymentRef =
            doc(
                db,
                PAYMENT_COLLECTION,
                paymentId
            );


        await updateDoc(
            paymentRef,
            {

                status: "approved",

                validatedAt:
                    serverTimestamp(),

                validatedBy:
                    currentAdmin
                        ? currentAdmin.uid
                        : ""

            }
        );


        // ====================================================
        // 5. MESSAGE
        // ====================================================

        showAdminMessage(
            `Paiement validé. Premium activé pour ${payment.userName || "l'utilisateur"}.`,
            "success"
        );


        // ====================================================
        // 6. RECHARGER
        // ====================================================

        await loadPremiumPayments();


    } catch (error) {

        console.error(
            "Erreur validation paiement :",
            error
        );


        showAdminMessage(
            error.message ||
            "Impossible de valider le paiement.",
            "error"
        );


        setButtonLoading(
            button,
            false,
            "Valider"
        );

    }

}


// ============================================================
// REFUSER UN PAIEMENT
// ============================================================

async function rejectPayment(
    paymentId,
    button
) {

    const payment =
        allPayments.find(
            item =>
                item.id === paymentId
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
            "warning"
        );

        return;

    }


    const confirmation =
        window.confirm(
            `Voulez-vous vraiment REFUSER le paiement de ${payment.userName || "cet utilisateur"} ?`
        );


    if (!confirmation) {
        return;
    }


    setButtonLoading(
        button,
        true,
        "Refus..."
    );


    try {

        const paymentRef =
            doc(
                db,
                PAYMENT_COLLECTION,
                paymentId
            );


        await updateDoc(
            paymentRef,
            {

                status: "rejected",

                validatedAt:
                    serverTimestamp(),

                validatedBy:
                    currentAdmin
                        ? currentAdmin.uid
                        : ""

            }
        );


        showAdminMessage(
            "Le paiement a été refusé.",
            "success"
        );


        await loadPremiumPayments();


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
            false,
            "Refuser"
        );

    }

}


// ============================================================
// CALCUL DE LA DATE D'EXPIRATION
// ============================================================

function calculateSubscriptionEnd(
    startDate,
    plan
) {

    const end =
        new Date(startDate);


    switch (plan) {

        case "weekly":

            end.setDate(
                end.getDate() + 7
            );

            break;


        case "monthly":

            end.setMonth(
                end.getMonth() + 1
            );

            break;


        case "yearly":

            end.setFullYear(
                end.getFullYear() + 1
            );

            break;


        default:

            throw new Error(
                "Formule Premium inconnue."
            );

    }


    return end;

}


// ============================================================
// NOM FORMULE
// ============================================================

function getPlanName(plan) {

    switch (plan) {

        case "weekly":
            return "Premium hebdomadaire";

        case "monthly":
            return "Premium mensuel";

        case "yearly":
            return "Premium annuel";

        default:
            return "Premium";

    }

}


// ============================================================
// MÉTHODE DE PAIEMENT
// ============================================================

function getPaymentMethodName(method) {

    switch (method) {

        case "mpesa":
            return "M-Pesa";

        case "airtel":
            return "Airtel Money";

        default:
            return method || "—";

    }

}


// ============================================================
// STATUT
// ============================================================

function getStatusLabel(status) {

    switch (status) {

        case "pending":
            return "En attente";

        case "approved":
            return "Approuvé";

        case "rejected":
            return "Refusé";

        default:
            return "Inconnu";

    }

}


function getStatusClass(status) {

    switch (status) {

        case "pending":
            return "pending";

        case "approved":
            return "approved";

        case "rejected":
            return "rejected";

        default:
            return "unknown";

    }

}


// ============================================================
// DATE
// ============================================================

function getDateValue(timestamp) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis === "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    if (
        timestamp.seconds
    ) {

        return (
            timestamp.seconds * 1000
        );

    }


    return 0;

}


function formatDate(timestamp) {

    const value =
        getDateValue(timestamp);


    if (!value) {
        return "Date inconnue";
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(value)
    );

}


// ============================================================
// MONTANT
// ============================================================

function formatAmount(amount) {

    const number =
        Number(amount);


    if (
        Number.isNaN(number)
    ) {

        return "0";

    }


    return number.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    );

}


// ============================================================
// LOADING BOUTON
// ============================================================

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            ${text}

        `;

    } else {

        button.disabled = false;

        button.innerHTML = `

            <i class="fa-solid fa-circle-check"></i>

            ${text}

        `;

    }

}


// ============================================================
// MESSAGE ADMIN
// ============================================================

function showAdminMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "adminMessage"
        );


    if (!element) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    element.hidden = false;

    element.textContent = message;

    element.className =
        `admin-message ${type}`;


    clearTimeout(
        showAdminMessage.timeout
    );


    showAdminMessage.timeout =
        setTimeout(() => {

            element.hidden = true;

        }, 5000);

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

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


// ============================================================
// RECHERCHE
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


// ============================================================
// FILTRE STATUT
// ============================================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );

}


// ============================================================
// FILTRE FORMULE
// ============================================================

if (planFilter) {

    planFilter.addEventListener(
        "change",
        applyFilters
    );

}


// ============================================================
// ACTUALISER
// ============================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadPremiumPayments
    );

}


// ============================================================
// FIN
// ============================================================

console.log(
    "CAMU SERVICES - Admin Premium chargé."
);
