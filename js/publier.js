import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("publier.js CHARGÉ");

let currentUser = null;

const form = document.getElementById("publishForm");
const button = document.getElementById("publishButton");
const message = document.getElementById("publishMessage");

console.log("FORMULAIRE :", form);
console.log("BOUTON :", button);
console.log("MESSAGE :", message);


// =====================================================
// AUTHENTIFICATION
// =====================================================

onAuthStateChanged(auth, (user) => {

    console.log("AUTH :", user);

    if (!user) {

        currentUser = null;

        if (message) {
            message.textContent =
                "Vous devez être connecté pour publier.";
        }

        return;
    }

    currentUser = user;

    console.log(
        "UTILISATEUR CONNECTÉ :",
        user.email
    );

});


// =====================================================
// PUBLICATION
// =====================================================

if (form) {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        console.log("=================================");
        console.log("SUBMIT DÉCLENCHÉ");
        console.log("=================================");


        if (!currentUser) {

            alert(
                "Vous devez être connecté pour publier."
            );

            return;
        }


        // ---------------------------------------------
        // RÉCUPÉRATION DES CHAMPS
        // ---------------------------------------------

        const title =
            document.getElementById("publishTitle")?.value.trim();

        const price =
            document.getElementById("publishPrice")?.value.trim();

        const currency =
            document.getElementById("publishCurrency")?.value;

        const category =
            document.getElementById("publishCategory")?.value;

        const description =
            document.getElementById("publishDescription")?.value.trim();

        const city =
            document.getElementById("publishCity")?.value;

        const neighborhood =
            document.getElementById("publishNeighborhood")?.value.trim();

        const whatsapp =
            document.getElementById("publishWhatsapp")?.value.trim();

        const terms =
            document.getElementById("publishTerms")?.checked;


        console.log("TITLE :", title);
        console.log("PRICE :", price);
        console.log("CURRENCY :", currency);
        console.log("CATEGORY :", category);
        console.log("DESCRIPTION :", description);
        console.log("CITY :", city);
        console.log("NEIGHBORHOOD :", neighborhood);
        console.log("WHATSAPP :", whatsapp);
        console.log("TERMS :", terms);


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!title) {
            alert("Veuillez saisir le titre.");
            return;
        }

        if (!price) {
            alert("Veuillez saisir le prix.");
            return;
        }

        if (!category) {
            alert("Veuillez choisir une catégorie.");
            return;
        }

        if (!description) {
            alert("Veuillez saisir une description.");
            return;
        }

        if (!city) {
            alert("Veuillez choisir une ville.");
            return;
        }

        if (!whatsapp) {
            alert("Veuillez saisir votre numéro WhatsApp.");
            return;
        }

        if (!terms) {
            alert("Veuillez accepter les conditions.");
            return;
        }


        // ---------------------------------------------
        // BOUTON
        // ---------------------------------------------

        if (button) {

            button.disabled = true;

            button.textContent =
                "Publication...";

        }


        try {

            console.log(
                "Création de l'annonce dans Firestore..."
            );


            // ==========================================
            // IMPORTANT :
            // ON UTILISE "annonces"
            // ==========================================

            const listingRef = await addDoc(
                collection(db, "annonces"),
                {

                    title: title,

                    price: Number(price),

                    currency: currency,

                    category: category,

                    description: description,

                    city: city,

                    neighborhood: neighborhood,

                    whatsapp: whatsapp,

                    userId: currentUser.uid,

                    ownerId: currentUser.uid,

                    ownerName:
                        currentUser.displayName ||
                        "Utilisateur",

                    ownerEmail:
                        currentUser.email ||
                        "",

                    images: [],

                    imageURL: "",

                    status: "active",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            console.log(
                "ANNONCE CRÉÉE AVEC SUCCÈS :",
                listingRef.id
            );


            if (message) {

                message.textContent =
                    "Votre annonce a été publiée avec succès !";

                message.className =
                    "auth-message success";

            }


            if (button) {

                button.textContent =
                    "Annonce publiée";

            }


            // -----------------------------------------
            // REDIRECTION
            // -----------------------------------------

            setTimeout(() => {

                window.location.href =
                    "compte.html";

            }, 1500);


        } catch (error) {

            console.error(
                "ERREUR FIRESTORE :",
                error
            );

            alert(
                "Erreur lors de la publication : " +
                error.message
            );


            if (button) {

                button.disabled = false;

                button.textContent =
                    "Publier l'annonce";

            }

        }

    });

} else {

    console.error(
        "ERREUR : #publishForm INTROUVABLE !"
    );

}
