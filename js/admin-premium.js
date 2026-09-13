// ============================================================
// CAMU SERVICES — ADMIN PREMIUM
// Gestion : réception / vérification / validation / refus
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

const PREMIUM_PAYMENTS_COLLECTION = "premiumPayments";
const USERS_COLLECTION = "users";


// ============================================================
// PLANS PREMIUM
// ============================================================

const PREMIUM_PLANS = {
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
// ÉLÉMENTS DOM
// ============================================================

const premiumPaymentsList =
    document.getElementById("premiumPaymentsList");

const premiumPendingCount =
    document.getElementById("premiumPendingCount");

const premiumApprovedCount =
    document.getElementById("premiumApprovedCount");

const premiumRejectedCount =
    document.getElementById("premiumRejectedCount");

const premiumPaymentSearch =
    document.getElementById("premiumPaymentSearch");

const premiumPaymentStatusFilter =
    document.getElementById("premiumPaymentStatusFilter");

const premiumPaymentPlanFilter =
    document.getElementById("premiumPaymentPlanFilter");

const refreshPremiumPayments =
    document.getElementById("refreshPremiumPayments");


// ============================================================
// VARIABLES
// ============================================================

let allPremiumPayments = [];
let currentAdmin = null;


// ============================================================
// UTILITAIRES
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


// ------------------------------------------------------------

function formatAmount(amount) {

    const number = Number(amount) || 0;

    return `${number.toLocaleString("fr-FR")} $`;
}


// ------------------------------------------------------------

function formatDate(timestamp) {

    if (!timestamp) {
        return "Date inconnue";
    }

    try {

        let date;

        if (timestamp?.toDate) {
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


// ------------------------------------------------------------

function getStatusLabel(status) {

    switch (status) {

        case "pending":
            return "En attente";

        case "verified":
            return "Vérifié";

        case "approved":
            return "Approuvé";

        case "rejected":
            return "Refusé";

        default:
            return status || "Inconnu";
    }
}


// ------------------------------------------------------------

function getStatusClass(status) {

    switch (status) {

        case "pending":
            return "pending";

        case "verified":
            return "verified";

        case "approved":
            return "approved";

        case "rejected":
            return "rejected";

        default:
            return "pending";
    }
}


// ------------------------------------------------------------

function getPaymentMethodLabel(method) {

    switch (String(method || "").toLowerCase()) {

        case "mpesa":
        case "m-pesa":
            return "M-Pesa";

        case "airtel":
        case "airtel_money":
        case "airtel money":
            return "Airtel Money";

        default:
            return method || "Non précisé";
    }
}


// ------------------------------------------------------------

function getPlanName(plan) {

    return PREMIUM_PLANS[plan]?.name ||
           plan ||
           "Plan inconnu";
}


// ============================================================
// CHARGEMENT DES PAIEMENTS
// ============================================================

async function loadPremiumPayments() {

    if (!premiumPaymentsList) {
        return;
    }

    premiumPaymentsList.innerHTML = `
        <div class="premium-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Chargement des demandes Premium...</span>
        </div>
    `;

    try {

        const paymentsRef =
            collection(
                db,
                PREMIUM_PAYMENTS_COLLECTION
            );

        const snapshot =
            await getDocs(paymentsRef);

        allPremiumPayments = [];

        snapshot.forEach((paymentDoc) => {

            allPremiumPayments.push({
                id: paymentDoc.id,
                ...paymentDoc.data()
            });

        });


        // ----------------------------------------------------
        // Tri : plus récent en premier
        // ----------------------------------------------------

        allPremiumPayments.sort((a, b) => {

            const dateA =
                a.createdAt?.toDate?.() ||
                new Date(0);

            const dateB =
                b.createdAt?.toDate?.() ||
                new Date(0);

            return dateB - dateA;
        });


        updatePremiumCounters();

        applyPremiumFilters();

    } catch (error) {

        console.error(
            "Erreur chargement paiements Premium :",
            error
        );

        premiumPaymentsList.innerHTML = `
            <div class="premium-error">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Impossible de charger les demandes</h3>

                <p>
                    Une erreur s'est produite lors du chargement
                    des paiements Premium.
                </p>

                <button
                    type="button"
                    id="retryPremiumPayments"
                    class="admin-refresh-button"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Réessayer
                </button>
            </div>
        `;

        const retry =
            document.getElementById(
                "retryPremiumPayments"
            );

        if (retry) {
            retry.addEventListener(
                "click",
                loadPremiumPayments
            );
        }
    }
}


// ============================================================
// COMPTEURS
// ============================================================

function updatePremiumCounters() {

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


    if (premiumPendingCount) {
        premiumPendingCount.textContent = pending;
    }

    if (premiumApprovedCount) {
        premiumApprovedCount.textContent = approved;
    }

    if (premiumRejectedCount) {
        premiumRejectedCount.textContent = rejected;
    }
}


// ============================================================
// FILTRES
// ============================================================

function applyPremiumFilters() {

    let payments = [...allPremiumPayments];


    // --------------------------------------------------------
    // Recherche
    // --------------------------------------------------------

    const search =
        premiumPaymentSearch?.value
            ?.trim()
            .toLowerCase() || "";


    if (search) {

        payments = payments.filter(payment => {

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


    // --------------------------------------------------------
    // Filtre statut
    // --------------------------------------------------------

    const status =
        premiumPaymentStatusFilter?.value || "all";


    if (status !== "all") {

        payments = payments.filter(
            payment => payment.status === status
        );
    }


    // --------------------------------------------------------
    // Filtre plan
    // --------------------------------------------------------

    const plan =
        premiumPaymentPlanFilter?.value || "all";


    if (plan !== "all") {

        payments = payments.filter(
            payment => payment.plan === plan
        );
    }


    renderPremiumPayments(payments);
}


// ============================================================
// AFFICHAGE DES PAIEMENTS
// ============================================================

function renderPremiumPayments(payments) {

    if (!premiumPaymentsList) {
        return;
    }


    if (!payments.length) {

        premiumPaymentsList.innerHTML = `
            <div class="premium-empty">

                <div class="premium-empty-icon">
                    <i class="fa-solid fa-inbox"></i>
                </div>

                <h3>Aucune demande Premium</h3>

                <p>
                    Aucune demande ne correspond aux
                    critères sélectionnés.
                </p>

            </div>
        `;

        return;
    }


    premiumPaymentsList.innerHTML =
        payments.map(renderPaymentCard).join("");


    // --------------------------------------------------------
    // Boutons
    // --------------------------------------------------------

    document
        .querySelectorAll(".premium-verify-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const paymentId =
                        button.dataset.paymentId;

                    openVerification(paymentId);
                }
            );
        });


    document
        .querySelectorAll(".premium-approve-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const paymentId =
                        button.dataset.paymentId;

                    approvePayment(paymentId);
                }
            );
        });


    document
        .querySelectorAll(".premium-reject-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const paymentId =
                        button.dataset.paymentId;

                    rejectPayment(paymentId);
                }
            );
        });


    document
        .querySelectorAll(".premium-copy-reference")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const reference =
                        button.dataset.reference;

                    copyReference(
                        reference,
                        button
                    );
                }
            );
        });
}


// ============================================================
// CARTE PAIEMENT
// ============================================================

function renderPaymentCard(payment) {

    const status =
        payment.status || "pending";

    const statusLabel =
        getStatusLabel(status);

    const statusClass =
        getStatusClass(status);


    const planName =
        getPlanName(payment.plan);


    const paymentMethod =
        getPaymentMethodLabel(
            payment.paymentMethod
        );


    let actions = "";


    // --------------------------------------------------------
    // DEMANDE EN ATTENTE
    // --------------------------------------------------------

    if (status === "pending") {

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
    }


    // --------------------------------------------------------
    // VÉRIFIÉ
    // --------------------------------------------------------

    else if (status === "verified") {

        actions = `

            <div class="premium-payment-actions">

                <button
                    type="button"
                    class="premium-action-button premium-verify-button"
                    data-payment-id="${escapeHTML(payment.id)}"
                >
                    <i class="fa-solid fa-eye"></i>
                    Consulter
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
    }


    // --------------------------------------------------------
    // APPROUVÉ
    // --------------------------------------------------------

    else if (status === "approved") {

        actions = `

            <div class="premium-payment-result approved">

                <i class="fa-solid fa-circle-check"></i>

                <span>
                    Paiement validé — Premium activé
                </span>

            </div>
        `;
    }


    // --------------------------------------------------------
    // REFUSÉ
    // --------------------------------------------------------

    else if (status === "rejected") {

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
                    class="premium-payment-status ${statusClass}"
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>


            <div class="premium-payment-grid">

                <div class="premium-payment-item">

                    <span class="premium-item-label">
                        Formule
                    </span>

                    <strong>
                        <i class="fa-solid fa-crown"></i>
                        ${escapeHTML(planName)}
                    </strong>

                </div>


                <div class="premium-payment-item">

                    <span class="premium-item-label">
                        Montant
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatAmount(payment.amount)
                        )}
                    </strong>

                </div>


                <div class="premium-payment-item">

                    <span class="premium-item-label">
                        Réseau
                    </span>

                    <strong>
                        ${escapeHTML(paymentMethod)}
                    </strong>

                </div>


                <div class="premium-payment-item">

                    <span class="premium-item-label">
                        Numéro destinataire
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.receiverNumber ||
                            "Non précisé"
                        )}
                    </strong>

                </div>


                <div class="premium-payment-item">

                    <span class="premium-item-label">
                        Date de demande
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(payment.createdAt)
                        )}
                    </strong>

                </div>


                <div class="premium-payment-item">

                    <span class="premium-item-label">
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
                                        title="Copier la référence"
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
        allPremiumPayments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        alert(
            "Cette demande Premium est introuvable."
        );

        return;
    }


    // --------------------------------------------------------
    // Création du modal
    // --------------------------------------------------------

    const oldModal =
        document.getElementById(
            "premiumVerificationModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


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
                        Vérifier la demande Premium
                    </h2>

                </div>

                <button
                    type="button"
                    class="premium-modal-close"
                    id="closePremiumVerification"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div class="premium-verification-body">

                <div class="premium-verification-alert">

                    <i class="fa-solid fa-circle-info"></i>

                    <p>
                        Vérifiez cette transaction dans
                        l'application ou le service du réseau
                        concerné avant d'approuver le Premium.
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
                                getPlanName(payment.plan)
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Montant attendu</span>
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
                                getPaymentMethodLabel(
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

                        <span>
                            Date de demande
                        </span>

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
                        Contrôle à effectuer
                    </h3>

                    <label>
                        <input
                            type="checkbox"
                            id="checkPaymentReference"
                        >
                        La référence existe réellement.
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="checkPaymentAmount"
                        >
                        Le montant reçu correspond au montant demandé.
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="checkPaymentReceiver"
                        >
                        Le paiement a été envoyé au bon numéro.
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            id="checkPaymentNetwork"
                        >
                        Le réseau de paiement correspond à la demande.
                    </label>

                </div>


                <div
                    id="premiumVerificationMessage"
                    class="premium-modal-message"
                ></div>

            </div>


            <div class="premium-modal-footer">

                <button
                    type="button"
                    class="premium-modal-secondary"
                    id="closePremiumVerificationBottom"
                >
                    Fermer
                </button>


                ${
                    payment.status === "pending" ||
                    payment.status === "verified"

                        ? `
                            <button
                                type="button"
                                class="premium-action-button premium-approve-button"
                                id="modalApprovePremium"
                            >
                                <i class="fa-solid fa-circle-check"></i>
                                Approuver et activer Premium
                            </button>
                          `

                        : ""
                }

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    // --------------------------------------------------------
    // Fermeture
    // --------------------------------------------------------

    const closeModal = () => {
        modal.remove();
    };


    document
        .getElementById(
            "closePremiumVerification"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "closePremiumVerificationBottom"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        }
    );


    // --------------------------------------------------------
    // Approbation depuis le modal
    // --------------------------------------------------------

    document
        .getElementById(
            "modalApprovePremium"
        )
        ?.addEventListener(
            "click",
            async () => {

                const checks = [

                    document.getElementById(
                        "checkPaymentReference"
                    ),

                    document.getElementById(
                        "checkPaymentAmount"
                    ),

                    document.getElementById(
                        "checkPaymentReceiver"
                    ),

                    document.getElementById(
                        "checkPaymentNetwork"
                    )

                ];


                const allChecked =
                    checks.every(
                        checkbox =>
                            checkbox?.checked
                    );


                const message =
                    document.getElementById(
                        "premiumVerificationMessage"
                    );


                if (!allChecked) {

                    if (message) {

                        message.className =
                            "premium-modal-message error";

                        message.textContent =
                            "Veuillez confirmer les quatre contrôles avant d'approuver le paiement.";
                    }

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
// APPROUVER LE PAIEMENT
// ============================================================

async function approvePayment(paymentId) {

    const payment =
        allPremiumPayments.find(
            item => item.id === paymentId
        );


    if (!payment) {

        alert(
            "Demande Premium introuvable."
        );

        return;
    }


    if (
        payment.status !== "pending" &&
        payment.status !== "verified"
    ) {

        alert(
            "Cette demande a déjà été traitée."
        );

        return;
    }


    const confirmed =
        confirm(
            `Confirmer l'approbation du paiement de ${payment.userName || "ce client"} ?\n\nLe compte sera automatiquement activé en Premium.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const plan =
            PREMIUM_PLANS[payment.plan];


        if (!plan) {

            throw new Error(
                "Plan Premium invalide."
            );
        }


        // ----------------------------------------------------
        // Vérification du montant
        // ----------------------------------------------------

        const paidAmount =
            Number(payment.amount);

        const expectedAmount =
            Number(plan.amount);


        if (
            paidAmount !== expectedAmount
        ) {

            throw new Error(
                `Montant incorrect. Montant attendu : ${expectedAmount}$, montant enregistré : ${paidAmount}$.`
            );
        }


        // ----------------------------------------------------
        // Récupération utilisateur
        // ----------------------------------------------------

        if (!payment.userId) {

            throw new Error(
                "Cette demande ne contient aucun userId."
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
                "Le compte utilisateur est introuvable."
            );
        }


        // ----------------------------------------------------
        // Dates Premium
        // ----------------------------------------------------

        const startDate =
            new Date();


        const endDate =
            new Date(startDate);


        endDate.setDate(
            endDate.getDate() + plan.days
        );


        // ----------------------------------------------------
        // BATCH FIRESTORE
        // ----------------------------------------------------
        // Les deux opérations sont effectuées ensemble :
        // 1. activation utilisateur
        // 2. validation paiement
        // ----------------------------------------------------

        const batch =
            writeBatch(db);


        batch.update(
            userRef,
            {

                plan: "premium",

                subscriptionStatus:
                    "active",

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
                PREMIUM_PAYMENTS_COLLECTION,
                paymentId
            );


        batch.update(
            paymentRef,
            {

                status: "approved",

                validated
