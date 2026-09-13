// ============================================================
// CAMU SERVICES — ADMIN PREMIUM
// Réception • Vérification • Approbation • Refus
// ============================================================

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
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// CONFIGURATION
// ============================================================

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

const PAYMENTS_COLLECTION = "premiumPayments";
const USERS_COLLECTION = "users";


// ============================================================
// PLANS
// ============================================================

const PLANS = {
    weekly: {
        name: "Premium — 1 semaine",
        amount: 4,
        duration: "1 semaine",
        days: 7
    },

    monthly: {
        name: "Premium — 1 mois",
        amount: 11,
        duration: "1 mois",
        days: 30
    },

    yearly: {
        name: "Premium — 1 an",
        amount: 90,
        duration: "1 an",
        days: 365
    }
};


// ============================================================
// DOM
// ============================================================

const paymentsList =
    document.getElementById("premiumPaymentsList");

const pendingCount =
    document.getElementById("premiumPendingCount");

const approvedCount =
    document.getElementById("premiumApprovedCount");

const rejectedCount =
    document.getElementById("premiumRejectedCount");

const searchInput =
    document.getElementById("premiumPaymentSearch");

const statusFilter =
    document.getElementById("premiumPaymentStatusFilter");

const planFilter =
    document.getElementById("premiumPaymentPlanFilter");

const refreshButton =
    document.getElementById("refreshPremiumPayments");


// ============================================================
// VARIABLES
// ============================================================

let payments = [];
let currentAdmin = null;


// ============================================================
// PROTECTION HTML
// ============================================================

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


// ============================================================
// DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "Date inconnue";
    }

    try {

        let date;

        if (typeof value.toDate === "function") {
            date = value.toDate();
        } else if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value);
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

        return "Date inconnue";
    }
}


// ============================================================
// MONTANT
// ============================================================

function formatAmount(value) {

    const amount = Number(value) || 0;

    return `${amount.toLocaleString("fr-FR")} $`;
}


// ============================================================
// STATUT
// ============================================================

function statusLabel(status) {

    const labels = {
        pending: "En attente",
        verified: "Vérifié",
        approved: "Approuvé",
        rejected: "Refusé"
    };

    return labels[status] || "Inconnu";
}


function statusClass(status) {

    if (
        status === "pending" ||
        status === "verified" ||
        status === "approved" ||
        status === "rejected"
    ) {
        return status;
    }

    return "pending";
}


// ============================================================
// RÉSEAU
// ============================================================

function paymentMethodLabel(method) {

    const value =
        String(method || "").toLowerCase();

    if (
        value === "mpesa" ||
        value === "m-pesa"
    ) {
        return "M-Pesa";
    }

    if (
        value === "airtel" ||
        value === "airtel_money" ||
        value === "airtel money"
    ) {
        return "Airtel Money";
    }

    return method || "Non précisé";
}


// ============================================================
// PLAN
// ============================================================

function planLabel(plan) {

    return PLANS[plan]?.name ||
        plan ||
        "Plan inconnu";
}


// ============================================================
// CHARGER LES PAIEMENTS
// ============================================================

async function loadPayments() {

    if (!paymentsList) {
        return;
    }

    paymentsList.innerHTML = `
        <div class="premium-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Chargement des demandes Premium...</span>
        </div>
    `;

    try {

        const snapshot = await getDocs(
            collection(
                db,
                PAYMENTS_COLLECTION
            )
        );

        payments = [];

        snapshot.forEach(paymentDoc => {

            payments.push({
                id: paymentDoc.id,
                ...paymentDoc.data()
            });

        });


        payments.sort((a, b) => {

            const dateA =
                a.createdAt?.toDate?.()?.getTime() || 0;

            const dateB =
                b.createdAt?.toDate?.()?.getTime() || 0;

            return dateB - dateA;
        });


        updateCounters();
        applyFilters();

    } catch (error) {

        console.error(
            "Erreur chargement Premium :",
            error
        );

        paymentsList.innerHTML = `
            <div class="premium-error">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Erreur de chargement</h3>

                <p>
                    Impossible de charger les demandes Premium.
                </p>

                <button
                    type="button"
                    class="admin-refresh-button"
                    id="retryPremiumButton"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Réessayer
                </button>
            </div>
        `;

        document
            .getElementById("retryPremiumButton")
            ?.addEventListener(
                "click",
                loadPayments
            );
    }
}


// ============================================================
// COMPTEURS
// ============================================================

function updateCounters() {

    const pending =
        payments.filter(
            item => item.status === "pending"
        ).length;

    const approved =
        payments.filter(
            item => item.status === "approved"
        ).length;

    const rejected =
        payments.filter(
            item => item.status === "rejected"
        ).length;


    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    if (approvedCount) {
        approvedCount.textContent = approved;
    }

    if (rejectedCount) {
        rejectedCount.textContent = rejected;
    }
}


// ============================================================
// FILTRAGE
// ============================================================

function applyFilters() {

    let result = [...payments];


    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";


    if (search) {

        result = result.filter(payment => {

            const text = [

                payment.userName,
                payment.userEmail,
                payment.paymentReference,
                payment.paymentMethod,
                payment.receiverNumber,
                payment.plan

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }


    const status =
        statusFilter?.value || "all";


    if (status !== "all") {

        result = result.filter(
            payment =>
                payment.status === status
        );
    }


    const plan =
        planFilter?.value || "all";


    if (plan !== "all") {

        result = result.filter(
            payment =>
                payment.plan === plan
        );
    }


    renderPayments(result);
}


// ============================================================
// AFFICHAGE
// ============================================================

function renderPayments(list) {

    if (!paymentsList) {
        return;
    }


    if (!list.length) {

        paymentsList.innerHTML = `
            <div class="premium-empty">

                <div class="premium-empty-icon">
                    <i class="fa-solid fa-inbox"></i>
                </div>

                <h3>Aucune demande Premium</h3>

                <p>
                    Aucune demande ne correspond
                    aux critères sélectionnés.
                </p>

            </div>
        `;

        return;
    }


    paymentsList.innerHTML =
        list.map(renderPayment).join("");


    document
        .querySelectorAll(".premium-verify-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openVerification(
                    button.dataset.paymentId
                )
            );
        });


    document
        .querySelectorAll(".premium-approve-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => approvePayment(
                    button.dataset.paymentId
                )
            );
        });


    document
        .querySelectorAll(".premium-reject-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => rejectPayment(
                    button.dataset.paymentId
                )
            );
        });


    document
        .querySelectorAll(".premium-copy-reference")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => copyReference(
                    button.dataset.reference,
                    button
                )
            );
        });
}


// ============================================================
// CARTE
// ============================================================

function renderPayment(payment) {

    const status =
        payment.status || "pending";

    const plan =
        PLANS[payment.plan];


    let actions = "";


    if (
        status === "pending" ||
        status === "verified"
    ) {

        actions = `
            <div class="premium-payment-actions">

                <button
                    type="button"
                    class="premium-action-button premium-verify-button"
                    data-payment-id="${escapeHTML(payment.id)}"
                >
                    <i class="fa-solid fa-magnifying-glass"></i>
                    Vérifier
                </button>

                <button
                    type="button"
                    class="premium-action-button premium-approve-button"
                    data-payment-id="${escapeHTML(payment.id)}"
                >
                    <i class="fa-solid fa-circle-check"></i>
                    Approuver
                </button>

                <button
                    type="button"
                    class="premium-action-button premium-reject-button"
                    data-payment-id="${escapeHTML(payment.id)}"
                >
                    <i class="fa-solid fa-circle-xmark"></i>
                    Refuser
                </button>

            </div>
        `;

    } else if (status === "approved") {

        actions = `
            <div class="premium-payment-result approved">

                <i class="fa-solid fa-circle-check"></i>

                <span>
                    Paiement validé — Premium activé
                </span>

            </div>
        `;

    } else if (status === "rejected") {

        actions = `
            <div class="premium-payment-result rejected">

                <i class="fa-solid fa-circle-xmark"></i>

                <span>
                    Paiement refusé
                </span>

            </div>
        `;
    }


    return `
        <article
            class="premium-payment-card"
            data-payment-id="${escapeHTML(payment.id)}"
        >

            <div class="premium-payment-header">

                <div class="premium-payment-client">

                    <div class="premium-client-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                payment.userName ||
                                "Client inconnu"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                payment.userEmail ||
                                "Email non disponible"
                            )}
                        </p>

                    </div>

                </div>


                <span
                    class="premium-payment-status ${statusClass(status)}"
                >
                    ${escapeHTML(
                        statusLabel(status)
                    )}
                </span>

            </div>


            <div class="premium-payment-grid">

                <div class="premium-payment-item">
                    <span>Formule</span>

                    <strong>
                        <i class="fa-solid fa-crown"></i>
                        ${escapeHTML(
                            planLabel(payment.plan)
                        )}
                    </strong>
                </div>


                <div class="premium-payment-item">
                    <span>Montant</span>

                    <strong>
                        ${escapeHTML(
                            formatAmount(payment.amount)
                        )}
                    </strong>
                </div>


                <div class="premium-payment-item">
                    <span>Réseau</span>

                    <strong>
                        ${escapeHTML(
                            paymentMethodLabel(
                                payment.paymentMethod
                            )
                        )}
                    </strong>
                </div>


                <div class="premium-payment-item">
                    <span>Numéro destinataire</span>

                    <strong>
                        ${escapeHTML(
                            payment.receiverNumber ||
                            "Non précisé"
                        )}
                    </strong>
                </div>


                <div class="premium-payment-item">
                    <span>Date de demande</span>

                    <strong>
                        ${escapeHTML(
                            formatDate(
                                payment.createdAt
                            )
                        )}
                    </strong>
                </div>


                <div class="premium-payment-item">

                    <span>
                        Référence transaction
                    </span>

                    <strong class="premium-reference">

                        ${escapeHTML(
                            payment.paymentReference ||
                            "Non disponible"
                        )}

                        ${
                            payment.paymentReference
                                ? `
                                    <button
                                        type="button"
                                        class="premium-copy-reference"
                                        data-reference="${escapeHTML(
                                            payment.paymentReference
                                        )}"
                                        title="Copier"
                                    >
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                `
                                : ""
                        }

                    </strong>

                </div>

            </div>


            ${
                payment.rejectionReason
                    ? `
                        <div class="premium-rejection-reason">

                            <strong>
                                Motif du refus :
                            </strong>

                            <span>
                                ${escapeHTML(
                                    payment.rejectionReason
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${actions}

        </article>
    `;
}


// ============================================================
// VÉRIFICATION
// ============================================================

function openVerification(paymentId) {

    const payment =
        payments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        alert(
            "Demande Premium introuvable."
        );

        return;
    }


    document
        .getElementById(
            "premiumVerificationModal"
        )
        ?.remove();


    const modal =
        document.createElement("div");


    modal.id =
        "premiumVerificationModal";

    modal.className =
        "premium-modal-overlay";


    modal.innerHTML = `
        <div class="premium-modal">

            <div class="premium-modal-header">

                <div>

                    <span class="premium-modal-label">
                        VÉRIFICATION DU PAIEMENT
                    </span>

                    <h2>
                        Vérifier la transaction
                    </h2>

                </div>

                <button
                    type="button"
                    class="premium-modal-close"
                    id="closePremiumModal"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div class="premium-modal-body">

                <div class="premium-verification-alert">

                    <i class="fa-solid fa-circle-info"></i>

                    <p>
                        Vérifiez la transaction auprès du
                        réseau de paiement avant d'approuver
                        la demande.
                    </p>

                </div>


                <div class="premium-verification-grid">

                    <div>
                        <span>Client</span>

                        <strong>
                            ${escapeHTML(
                                payment.userName ||
                                "Non disponible"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Email</span>

                        <strong>
                            ${escapeHTML(
                                payment.userEmail ||
                                "Non disponible"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Formule</span>

                        <strong>
                            ${escapeHTML(
                                planLabel(payment.plan)
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Montant</span>

                        <strong>
                            ${escapeHTML(
                                formatAmount(payment.amount)
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Réseau</span>

                        <strong>
                            ${escapeHTML(
                                paymentMethodLabel(
                                    payment.paymentMethod
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Numéro destinataire</span>

                        <strong>
                            ${escapeHTML(
                                payment.receiverNumber ||
                                "Non disponible"
                            )}
                        </strong>
                    </div>


                    <div class="premium-verification-reference">

                        <span>
                            Référence de transaction
                        </span>

                        <strong>
                            ${escapeHTML(
                                payment.paymentReference ||
                                "Non disponible"
                            )}
                        </strong>

                    </div>


                    <div>
                        <span>Date</span>

                        <strong>
                            ${escapeHTML(
                                formatDate(
                                    payment.createdAt
                                )
                            )}
                        </strong>
                    </div>

                </div>


                <div class="premium-verification-checklist">

                    <h3>
                        <i class="fa-solid fa-list-check"></i>
                        Contrôle
                    </h3>

                    <label>
                        <input
                            type="checkbox"
                            id="verifyReference"
                        >
                        Référence vérifiée
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="verifyAmount"
                        >
                        Montant vérifié
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="verifyReceiver"
                        >
                        Numéro destinataire vérifié
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="verifyNetwork"
                        >
                        Réseau de paiement vérifié
                    </label>

                </div>

            </div>


            <div class="premium-modal-footer">

                <button
                    type="button"
                    class="premium-modal-secondary"
                    id="closePremiumModalBottom"
                >
                    Fermer
                </button>

                ${
                    statusCanBeProcessed(payment.status)
                        ? `
                            <button
                                type="button"
                                class="premium-action-button premium-approve-button"
                                id="modalApprovePremium"
                            >
                                <i class="fa-solid fa-circle-check"></i>
                                Approuver
                            </button>
                        `
                        : ""
                }

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    const closeModal = () => {
        modal.remove();
    };


    document
        .getElementById("closePremiumModal")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("closePremiumModalBottom")
        ?.addEventListener(
            "click",
            closeModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeModal();
            }
        }
    );


    document
        .getElementById("modalApprovePremium")
        ?.addEventListener(
            "click",
            async () => {

                const checks = [

                    document.getElementById(
                        "verifyReference"
                    ),

                    document.getElementById(
                        "verifyAmount"
                    ),

                    document.getElementById(
                        "verifyReceiver"
                    ),

                    document.getElementById(
                        "verifyNetwork"
                    )

                ];


                const valid =
                    checks.every(
                        checkbox =>
                            checkbox?.checked === true
                    );


                if (!valid) {

                    alert(
                        "Veuillez confirmer les quatre contrôles avant d'approuver."
                    );

                    return;
                }


                closeModal();

                await approvePayment(
                    paymentId
                );
            }
        );
}


// ============================================================
// STATUT TRAITABLE
// ============================================================

function statusCanBeProcessed(status) {

    return (
        status === "pending" ||
        status === "verified"
    );
}


// ============================================================
// APPROBATION
// ============================================================

async function approvePayment(paymentId) {

    const payment =
        payments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        alert(
            "Demande introuvable."
        );

        return;
    }


    if (
        !statusCanBeProcessed(
            payment.status
        )
    ) {

        alert(
            "Cette demande a déjà été traitée."
        );

        return;
    }


    const confirmation =
        confirm(
            `Approuver le paiement de ${payment.userName || "ce client"} ?\n\nLe compte sera activé automatiquement en Premium.`
        );


    if (!confirmation) {
        return;
    }


    try {

        const selectedPlan =
            PLANS[payment.plan];


        if (!selectedPlan) {

            throw new Error(
                "Plan Premium invalide."
            );
        }


        const amount =
            Number(payment.amount);


        if (
            amount !==
            Number(selectedPlan.amount)
        ) {

            throw new Error(
                `Montant incorrect. Attendu : ${selectedPlan.amount}$ — enregistré : ${amount}$.`
            );
        }


        if (!payment.userId) {

            throw new Error(
                "Le userId de cette demande est absent."
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
                "Le compte utilisateur n'existe pas."
            );
        }


        const startDate =
            new Date();


        const endDate =
            new Date(startDate);


        endDate.setDate(
            endDate.getDate() +
            selectedPlan.days
        );


        // ----------------------------------------------------
        // BATCH ATOMIQUE
        // ----------------------------------------------------

        const batch =
            writeBatch(db);


        batch.update(
            userRef,
            {
                plan: "premium",

                subscriptionStatus: "active",

                subscriptionStart:
                    startDate,

                subscriptionEnd:
                    endDate,

                updatedAt:
                    serverTimestamp()
            }
        );


        const paymentRef =
            doc(
                db,
                PAYMENTS_COLLECTION,
                paymentId
            );


        batch.update(
            paymentRef,
            {
                status: "approved",

                validatedAt:
                    serverTimestamp(),

                validatedBy:
                    currentAdmin?.uid || "",

                rejectionReason: ""
            }
        );


        await batch.commit();


        payment.status =
            "approved";


        payment.rejectionReason =
            "";


        updateCounters();
        applyFilters();


        alert(
            `✓ Paiement approuvé.\n\n${payment.userName || "Le client"} est maintenant Premium.\n\nExpiration : ${endDate.toLocaleDateString("fr-FR")}`
        );


    } catch (error) {

        console.error(
            "Erreur approbation Premium :",
            error
        );


        alert(
            `Impossible d'approuver la demande.\n\n${error.message}`
        );
    }
}


// ============================================================
// REFUS
// ============================================================

async function rejectPayment(paymentId) {

    const payment =
        payments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        alert(
            "Demande introuvable."
        );

        return;
    }


    if (
        !statusCanBeProcessed(
            payment.status
        )
    ) {

        alert(
            "Cette demande a déjà été traitée."
        );

        return;
    }


    const reason =
        prompt(
            "Motif du refus de la demande Premium :"
        );


    if (reason === null) {
        return;
    }


    const cleanReason =
        reason.trim();


    if (!cleanReason) {

        alert(
            "Le motif du refus est obligatoire."
        );

        return;
    }


    const confirmation =
        confirm(
            `Confirmer le refus ?\n\nMotif : ${cleanReason}`
        );


    if (!confirmation) {
        return;
    }


    try {

        const paymentRef =
            doc(
                db,
                PAYMENTS_COLLECTION,
                paymentId
            );


        await updateDoc(
            paymentRef,
            {
                status: "rejected",

                rejectionReason:
                    cleanReason,

                validatedAt:
                    serverTimestamp(),

                validatedBy:
                    currentAdmin?.uid || ""
            }
        );


        payment.status =
            "rejected";


        payment.rejectionReason =
            cleanReason;


        updateCounters();
        applyFilters();


        alert(
            "La demande Premium a été refusée."
        );


    } catch (error) {

        console.error(
            "Erreur refus Premium :",
            error
        );


        alert(
            `Impossible de refuser la demande.\n\n${error.message}`
        );
    }
}


// ============================================================
// COPIER RÉFÉRENCE
// ============================================================

async function copyReference(
    reference,
    button
) {

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
            `<i class="fa-solid fa-check"></i>`;


        setTimeout(() => {

            button.innerHTML =
                oldHTML;

        }, 1500);


    } catch (error) {

        console.error(
            "Erreur copie :",
            error
        );


        alert(
            `Référence : ${reference}`
        );
    }
}


// ============================================================
// ÉVÉNEMENTS
// ============================================================

searchInput?.addEventListener(
    "input",
    applyFilters
);


statusFilter?.addEventListener(
    "change",
    applyFilters
);


planFilter?.addEventListener(
    "change",
    applyFilters
);


refreshButton?.addEventListener(
    "click",
    loadPayments
);


// ============================================================
// AUTH ADMIN
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.warn(
                "Premium Admin : aucun utilisateur connecté."
            );

            return;
        }


        currentAdmin =
            user;


        if (
            user.email?.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            console.warn(
                "Premium Admin : accès refusé."
            );

            return;
        }


        console.log(
            "CAMU SERVICES : administrateur Premium connecté."
        );


        await loadPayments();
    }
);


// ============================================================
// API GLOBALE
// ============================================================

window.CAMU_ADMIN_PREMIUM = {

    reload: loadPayments,

    filter: applyFilters,

    verify: openVerification,

    approve: approvePayment,

    reject: rejectPayment

};


console.log(
    "CAMU SERVICES : admin-premium.js chargé correctement."
);
