/* =========================================================
   CAMU SERVICES — PREMIUM
   premium.js

   Paiement manuel :
   M-Pesa / Airtel Money
   ========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   NUMÉROS DE PAIEMENT
   ========================================================= */

const PAYMENT_NUMBERS = {

    mpesa: "+243 818 211 981",

    airtel: "+243 976 993 469"

};


/* =========================================================
   FORMULES PREMIUM
   ========================================================= */

const PLANS = {

    weekly: {

        name: "Premium hebdomadaire",

        shortName: "Hebdomadaire",

        amount: 4,

        duration: "1 semaine"

    },


    monthly: {

        name: "Premium mensuel",

        shortName: "Mensuel",

        amount: 11,

        duration: "1 mois"

    },


    yearly: {

        name: "Premium annuel",

        shortName: "Annuel",

        amount: 90,

        duration: "1 an"

    }

};


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;

let selectedPlan = null;

let selectedPaymentMethod = null;


/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const planButtons =
    document.querySelectorAll(".plan-button");

const paymentMethodInputs =
    document.querySelectorAll(
        'input[name="paymentMethod"]'
    );

const paymentSection =
    document.getElementById(
        "paymentSection"
    );

const paymentReference =
    document.getElementById(
        "paymentReference"
    );

const submitPaymentButton =
    document.getElementById(
        "submitPaymentButton"
    );

const paymentMessage =
    document.getElementById(
        "paymentMessage"
    );

const selectedPlanName =
    document.getElementById(
        "selectedPlanName"
    );

const selectedPlanAmount =
    document.getElementById(
        "selectedPlanAmount"
    );

const mpesaNumber =
    document.getElementById(
        "mpesaNumber"
    );

const airtelNumber =
    document.getElementById(
        "airtelNumber"
    );


/* =========================================================
   AFFICHER LES NUMÉROS
   ========================================================= */

if (mpesaNumber) {

    mpesaNumber.textContent =
        PAYMENT_NUMBERS.mpesa;

}


if (airtelNumber) {

    airtelNumber.textContent =
        PAYMENT_NUMBERS.airtel;

}


/* =========================================================
   UTILISATEUR CONNECTÉ
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            showMessage(
                "Vous devez être connecté à votre compte CAMU SERVICES pour effectuer une demande Premium.",
                "error"
            );

            return;
        }


        currentUser = user;


        console.log(
            "Utilisateur connecté :",
            user.uid
        );


        await checkCurrentSubscription(user.uid);

    }
);


/* =========================================================
   VÉRIFIER L'ABONNEMENT ACTUEL
   ========================================================= */

async function checkCurrentSubscription(uid) {

    try {

        const userRef =
            doc(
                db,
                "users",
                uid
            );


        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            console.log(
                "Profil utilisateur introuvable."
            );

            return;
        }


        const profile =
            snapshot.data();


        console.log(
            "Plan actuel :",
            profile.plan
        );

        console.log(
            "Statut actuel :",
            profile.subscriptionStatus
        );


    } catch (error) {

        console.error(
            "Erreur lors de la vérification de l'abonnement :",
            error
        );

    }

}


/* =========================================================
   CHOIX D'UNE FORMULE
   ========================================================= */

planButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const planId =
                    button.dataset.plan;


                if (
                    !PLANS[planId]
                ) {

                    console.error(
                        "Formule inconnue :",
                        planId
                    );

                    return;
                }


                selectedPlan =
                    planId;


                const plan =
                    PLANS[planId];


                /* Affichage du résumé */

                if (selectedPlanName) {

                    selectedPlanName.textContent =
                        plan.name;

                }


                if (selectedPlanAmount) {

                    selectedPlanAmount.textContent =
                        `${plan.amount} $ / ${plan.duration}`;

                }


                /*
                 * Faire apparaître visuellement
                 * la section de paiement.
                 */

                if (paymentSection) {

                    paymentSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }


                showMessage(
                    `Formule ${plan.shortName} sélectionnée. Choisissez maintenant M-Pesa ou Airtel Money.`,
                    "info"
                );


                console.log(
                    "Formule sélectionnée :",
                    selectedPlan
                );

            }
        );

    }
);


/* =========================================================
   CHOIX DU MOYEN DE PAIEMENT
   ========================================================= */

paymentMethodInputs.forEach(
    (input) => {

        input.addEventListener(
            "change",
            () => {

                selectedPaymentMethod =
                    input.value;


                console.log(
                    "Moyen de paiement :",
                    selectedPaymentMethod
                );


                /*
                 * Afficher le numéro correspondant
                 */

                if (
                    selectedPaymentMethod ===
                    "mpesa"
                ) {

                    showMessage(
                        `Envoyez le montant au numéro M-Pesa ${PAYMENT_NUMBERS.mpesa}.`,
                        "info"
                    );

                }


                if (
                    selectedPaymentMethod ===
                    "airtel"
                ) {

                    showMessage(
                        `Envoyez le montant au numéro Airtel Money ${PAYMENT_NUMBERS.airtel}.`,
                        "info"
                    );

                }

            }
        );

    }
);


/* =========================================================
   ENVOYER LA DEMANDE
   ========================================================= */

if (submitPaymentButton) {

    submitPaymentButton.addEventListener(
        "click",
        submitPaymentRequest
    );

}


/* =========================================================
   FONCTION PRINCIPALE
   ========================================================= */

async function submitPaymentRequest() {

    /* -----------------------------------------------------
       1. Vérifier connexion
    ----------------------------------------------------- */

    if (!currentUser) {

        showMessage(
            "Veuillez d'abord vous connecter à votre compte.",
            "error"
        );

        return;
    }


    /* -----------------------------------------------------
       2. Vérifier formule
    ----------------------------------------------------- */

    if (!selectedPlan) {

        showMessage(
            "Veuillez choisir une formule Premium.",
            "error"
        );

        return;
    }


    /* -----------------------------------------------------
       3. Vérifier moyen de paiement
    ----------------------------------------------------- */

    const checkedMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!checkedMethod) {

        showMessage(
            "Veuillez choisir M-Pesa ou Airtel Money.",
            "error"
        );

        return;
    }


    selectedPaymentMethod =
        checkedMethod.value;


    /* -----------------------------------------------------
       4. Vérifier référence
    ----------------------------------------------------- */

    const reference =
        paymentReference
            ? paymentReference.value.trim()
            : "";


    if (!reference) {

        showMessage(
            "Veuillez entrer le numéro de référence de votre paiement.",
            "error"
        );

        if (paymentReference) {

            paymentReference.focus();

        }

        return;
    }


    /* -----------------------------------------------------
       5. Vérifier longueur
    ----------------------------------------------------- */

    if (
        reference.length < 5
    ) {

        showMessage(
            "Le numéro de référence semble incorrect. Vérifiez votre reçu de paiement.",
            "error"
        );

        return;
    }


    /* -----------------------------------------------------
       6. Récupérer la formule
    ----------------------------------------------------- */

    const plan =
        PLANS[selectedPlan];


    if (!plan) {

        showMessage(
            "Une erreur est survenue avec la formule sélectionnée.",
            "error"
        );

        return;
    }


    /* -----------------------------------------------------
       7. Désactiver le bouton
    ----------------------------------------------------- */

    submitPaymentButton.disabled =
        true;


    submitPaymentButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Envoi de la demande...
    `;


    try {

        /* -------------------------------------------------
           8. Récupérer le profil Firestore
        ------------------------------------------------- */

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            throw new Error(
                "Profil utilisateur introuvable."
            );

        }


        const profile =
            userSnapshot.data();


        /* -------------------------------------------------
           9. Vérifier si cette référence existe déjà
        ------------------------------------------------- */

        const paymentsRef =
            collection(
                db,
                "premiumPayments"
            );


        const referenceQuery =
            query(
                paymentsRef,
                where(
                    "paymentReference",
                    "==",
                    reference
                )
            );


        const referenceSnapshot =
            await getDocs(
                referenceQuery
            );


        if (
            !referenceSnapshot.empty
        ) {

            showMessage(
                "Cette référence de paiement a déjà été enregistrée. Vérifiez votre référence.",
                "error"
            );

            resetSubmitButton();

            return;
        }


        /* -------------------------------------------------
           10. Numéro destinataire
        ------------------------------------------------- */

        const receiverNumber =
            PAYMENT_NUMBERS[
                selectedPaymentMethod
            ];


        /* -------------------------------------------------
           11. Enregistrer la demande
        ------------------------------------------------- */

        await addDoc(
            paymentsRef,
            {

                userId:
                    currentUser.uid,

                userName:
                    profile.name ||
                    currentUser.displayName ||
                    "Utilisateur CAMU",

                userEmail:
                    profile.email ||
                    currentUser.email ||
                    "",

                plan:
                    selectedPlan,

                amount:
                    plan.amount,

                duration:
                    plan.duration,

                paymentMethod:
                    selectedPaymentMethod,

                paymentReference:
                    reference,

                receiverNumber:
                    receiverNumber,

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),

                validatedAt:
                    null,

                validatedBy:
                    ""

            }
        );


        /* -------------------------------------------------
           12. Succès
        ------------------------------------------------- */

        showMessage(
            "Votre demande a été envoyée avec succès. Votre paiement sera vérifié par notre équipe avant l'activation de Premium.",
            "success"
        );


        /* Vider la référence */

        if (paymentReference) {

            paymentReference.value = "";

        }


        /* Désélectionner le réseau */

        paymentMethodInputs.forEach(
            (input) => {

                input.checked = false;

            }
        );


        selectedPaymentMethod =
            null;


        /*
         * Garder la formule sélectionnée
         * afin que l'utilisateur voie
         * ce qu'il a demandé.
         */


        console.log(
            "Demande Premium enregistrée."
        );


    } catch (error) {

        console.error(
            "Erreur lors de l'enregistrement du paiement :",
            error
        );


        showMessage(
            "Impossible d'envoyer votre demande. Vérifiez votre connexion et réessayez.",
            "error"
        );

    }


    resetSubmitButton();

}


/* =========================================================
   RÉINITIALISER LE BOUTON
   ========================================================= */

function resetSubmitButton() {

    if (!submitPaymentButton) {

        return;
    }


    submitPaymentButton.disabled =
        false;


    submitPaymentButton.innerHTML = `
        <i class="fa-solid fa-paper-plane"></i>
        Envoyer ma demande de paiement
    `;

}


/* =========================================================
   AFFICHER LES MESSAGES
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!paymentMessage) {

        console.log(
            `[${type}]`,
            message
        );

        return;
    }


    paymentMessage.textContent =
        message;


    paymentMessage.className =
        `payment-message payment-message-${type}`;


    paymentMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================================
   FIN
   ========================================================= */
