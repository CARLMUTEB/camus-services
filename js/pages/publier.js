import { auth, db, storage } from "../config/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";


let currentUser = null;


/* =========================================
   ELEMENTS
========================================= */

const form = document.getElementById("publish-form");
const publishButton = document.getElementById("publish-btn");
const messageBox = document.getElementById("publish-message");

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const imagePreviewContainer =
    document.getElementById("image-preview-container");


/* =========================================
   AUTHENTIFICATION
========================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        showMessage(
            "Vous devez être connecté pour publier une annonce.",
            "error"
        );

        setTimeout(() => {
            window.location.href = "connexion.html";
        }, 1500);

        return;
    }

    currentUser = user;

});


/* =========================================
   APERCU IMAGE
========================================= */

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) {

        imagePreviewContainer.style.display = "none";

        return;
    }


    if (!file.type.startsWith("image/")) {

        showMessage(
            "Veuillez sélectionner une image.",
            "error"
        );

        imageInput.value = "";

        return;
    }


    if (file.size > 5 * 1024 * 1024) {

        showMessage(
            "L'image ne doit pas dépasser 5 MB.",
            "error"
        );

        imageInput.value = "";

        return;
    }


    const reader = new FileReader();

    reader.onload = (event) => {

        imagePreview.src = event.target.result;

        imagePreviewContainer.style.display = "block";

    };

    reader.readAsDataURL(file);

});


/* =========================================
   PUBLICATION
========================================= */

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    if (!currentUser) {

        showMessage(
            "Vous devez être connecté.",
            "error"
        );

        return;
    }


    const title =
        document.getElementById("title").value.trim();

    const category =
        document.getElementById("category").value;

    const city =
        document.getElementById("city").value.trim();

    const commune =
        document.getElementById("commune").value.trim();

    const price =
        Number(document.getElementById("price").value);

    const currency =
        document.getElementById("currency").value;

    const description =
        document.getElementById("description").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const image =
        imageInput.files[0];


    /* VALIDATION */

    if (!title || !category || !city || !description) {

        showMessage(
            "Veuillez remplir tous les champs obligatoires.",
            "error"
        );

        return;
    }


    if (!price || price < 0) {

        showMessage(
            "Veuillez entrer un prix valide.",
            "error"
        );

        return;
    }


    publishButton.disabled = true;

    publishButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Publication...';


    try {

        let imageURL = "";


        /* =====================================
           UPLOAD IMAGE
        ===================================== */

        if (image) {

            const extension =
                image.name.split(".").pop();

            const fileName =
                `${Date.now()}_${currentUser.uid}.${extension}`;


            const storageReference =
                ref(
                    storage,
                    `annonces/${currentUser.uid}/${fileName}`
                );


            await uploadBytes(
                storageReference,
                image
            );


            imageURL =
                await getDownloadURL(
                    storageReference
                );

        }


        /* =====================================
           FIRESTORE
        ===================================== */

        const annonceData = {

            title,

            category,

            city,

            commune,

            price,

            currency,

            description,

            phone,

            imageURL,

            professionalUid: currentUser.uid,

            ownerUid: currentUser.uid,

            status: "pending",

            isActive: true,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()

        };


        const annonceRef =
            await addDoc(
                collection(db, "annonces"),
                annonceData
            );


        console.log(
            "Annonce créée :",
            annonceRef.id
        );


        showMessage(
            "Votre annonce a été envoyée avec succès. Elle est maintenant en attente de validation.",
            "success"
        );


        form.reset();

        imagePreviewContainer.style.display = "none";


        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 2500);


    } catch (error) {

        console.error(
            "Erreur publication :",
            error
        );


        showMessage(
            getFirebaseError(error),
            "error"
        );

    } finally {

        publishButton.disabled = false;

        publishButton.innerHTML =
            '<i class="fas fa-paper-plane"></i> Publier';

    }

});


/* =========================================
   BOUTONS
========================================= */

document
    .getElementById("back-btn")
    .addEventListener("click", () => {

        window.history.back();

    });


document
    .getElementById("home-btn")
    .addEventListener("click", () => {

        window.location.href =
            "index.html";

    });


document
    .getElementById("cancel-btn")
    .addEventListener("click", () => {

        window.location.href =
            "index.html";

    });


/* =========================================
   MESSAGE
========================================= */

function showMessage(text, type) {

    messageBox.textContent = text;

    messageBox.className =
        `publish-message ${type}`;

}


/* =========================================
   ERREURS FIREBASE
========================================= */

function getFirebaseError(error) {

    if (!error) {
        return "Une erreur inconnue est survenue.";
    }


    switch (error.code) {

        case "permission-denied":
            return "Vous n'avez pas l'autorisation de publier cette annonce.";

        case "storage/unauthorized":
            return "Vous n'avez pas l'autorisation d'envoyer cette image.";

        case "storage/size-limit-exceeded":
            return "L'image est trop volumineuse.";

        case "storage/invalid-format":
            return "Format d'image non valide.";

        case "network-request-failed":
            return "Problème de connexion Internet.";

        default:
            return error.message ||
                "Une erreur est survenue.";

    }

}
