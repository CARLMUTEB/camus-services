/* =========================================================
   CAMU SERVICES — PREMIUM
   premium.js
   ========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   CONFIGURATION DES FORMULES
   ========================================================= */

const plans = {
    weekly: {
        name: "Premium hebdomadaire",
        price: 4,
        duration: "1 semaine"
    },

    monthly: {
        name: "Premium mensuel",
        price: 11,
        duration: "1 mois"
    },

    yearly: {
        name: "Premium annuel",
        price: 90,
        duration: "1 an"
    }
};


/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const planButtons = document.querySelectorAll(".plan-button");


/* =========================================================
   AFFICHER UN MESSAGE
   ========================================================= */

function showMessage(message, type = "info") {

    let existingMessage =
        document.getElementById("premiumMessage");

    if (!existingMessage) {

        existingMessage = document.createElement("div");

        existingMessage.id = "premiumMessage";

        document.body.appendChild(existingMessage);
    }

    existingMessage.textContent = message;

    existingMessage.className =
        `premium-message premium-message-${type}`;

}


/* =========================================================
   VÉRIFIER L'UTILISATEUR
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.log(
            "Aucun utilisateur connecté."
        );

        return;
    }


    console.log(
        "Utilisateur connecté :",
        user.uid
    );


    await loadSubscription(user.uid);

});


/* =========================================================
   CHARGER L'ABONNEMENT
   ========================================================= */

async function loadSubscription(uid) {

    try {

        const userRef =
            doc(db, "users", uid);

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


        const plan =
            profile.plan || "basic";

        const status =
            profile.subscriptionStatus || "none";


        console.log(
            "Plan actuel :",
            plan
        );

        console.log(
            "Statut abonnement :",
            status
        );


        /*
         * Si l'utilisateur est en essai Premium,
         * on vérifie la date de fin.
         */

        if (
            status === "trial" &&
            profile.trialEnd
        ) {

            const trialEnd =
                convertFirestoreDate(
                    profile.trialEnd
                );


            if (
                trialEnd &&
                new Date() > trialEnd
            ) {

                console.log(
                    "La période d'essai Premium est terminée."
                );

                return;
            }
        }


    } catch (error) {

        console.error(
            "Erreur lors du chargement de l'abonnement :",
            error
        );

    }
}


/* =========================================================
   CONVERTIR UNE DATE FIRESTORE
   ========================================================= */

function convertFirestoreDate(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date;

        }
    }


    return null;
}


/* =========================================================
   CLIQUER SUR UNE FORMULE
   ========================================================= */

planButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const selectedPlan =
                button.dataset.plan;


            const plan =
                plans[selectedPlan];


            if (!plan) {

                console.error(
                    "Formule inconnue :",
                    selectedPlan
                );

                return;
            }


            handlePlanSelection(
                selectedPlan,
                plan
            );

        }
    );

});


/* =========================================================
   TRAITEMENT DU CHOIX
   ========================================================= */

function handlePlanSelection(
    selectedPlan,
    plan
) {

    console.log(
        "Formule sélectionnée :",
        selectedPlan
    );


    /*
     * Pour le moment, aucun paiement
     * n'est encore effectué.
     */

    showMessage(
        `${plan.name} sélectionné — ${plan.price} $ / ${plan.duration}. Le paiement sera disponible prochainement.`,
        "info"
    );


    /*
     * Petite temporisation pour voir
     * le message avant la suite.
     */

    setTimeout(() => {

        console.log(
            "Paiement à intégrer pour :",
            plan
        );

    }, 500);

}
