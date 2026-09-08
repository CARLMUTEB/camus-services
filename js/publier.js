// ============================================================
// CAMU SERVICES — publier.js
// Publication d'une annonce
// Firebase Auth + Firestore + Cloudinary
// ============================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";


// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;
let selectedFiles = [];


// ============================================================
// ELEMENTS HTML
// ============================================================

const publishForm = document.getElementById("publishForm");
const publishButton = document.getElementById("publishButton");
const publishMessage = document.getElementById("publishMessage");
const publishPhotos = document.getElementById("publishPhotos");
const photoPreview = document.getElementById("photoPreview");


// ============================================================
// UTILITAIRES
// ============================================================

function showMessage(message, type = "info") {

    if (!publishMessage) return;

    publishMessage.textContent = message;

    publishMessage.className = "";
    publishMessage.classList.add(type);

}


function setButtonLoading(loading) {

    if (!publishButton) return;

    if (loading) {

        publishButton.disabled = true;

        publishButton.dataset.originalText =
            publishButton.textContent;

        publishButton.textContent = "Publication en cours...";

    } else {

        publishButton.disabled = false;

        publishButton.textContent =
            publishButton.dataset.originalText || "Publier";

    }

}


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        currentUser = null;

        console.log(
            "Aucun utilisateur connecté."
        );

        showMessage(
            "Vous devez être connecté pour publier une annonce.",
            "error"
        );

        if (publishButton) {
            publishButton.disabled = true;
        }

        return;
    }

    currentUser = user;

    console.log(
        "Utilisateur connecté :",
        currentUser.email
    );

    if (publishButton) {
        publishButton.disabled = false;
    }

});


// ============================================================
// APERÇU DES PHOTOS
// ============================================================

if (publishPhotos) {

    publishPhotos.addEventListener("change", (event) => {

        selectedFiles = Array.from(event.target.files || []);

        renderPhotoPreview();

    });

}


function renderPhotoPreview() {

    if (!photoPreview) return;

    photoPreview.innerHTML = "";

    if (selectedFiles.length === 0) {
        return;
    }

    selectedFiles.forEach((file) => {

        const reader = new FileReader();

        reader.onload = (event) => {

            const wrapper = document.createElement("div");

            wrapper.className = "photo-preview-item";

            wrapper.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="Aperçu"
                >
            `;

            photoPreview.appendChild(wrapper);

        };

        reader.readAsDataURL(file);

    });

}


// ============================================================
// UPLOAD CLOUDINARY
// ============================================================

async function uploadImageToCloudinary(file, listingId) {

    const url =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    // On garde la structure actuelle Cloudinary
    formData.append(
        "folder",
        `camu-services/services/${currentUser.uid}/${listingId}`
    );

    formData.append(
        "context",
        `listing_id=${listingId}|owner_id=${currentUser.uid}`
    );


    const response = await fetch(url, {
        method: "POST",
        body: formData
    });


    if (!response.ok) {

        const errorText = await response.text();

        console.error(
            "Erreur Cloudinary :",
            errorText
        );

        throw new Error(
            "Échec de l'envoi de l'image."
        );

    }


    const data = await response.json();

    return data.secure_url;

}


// ============================================================
// FORMULAIRE DE PUBLICATION
// ============================================================

if (publishForm) {

    publishForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        // ----------------------------------------------------
        // Vérification utilisateur
        // ----------------------------------------------------

        if (!currentUser) {

            showMessage(
                "Vous devez être connecté pour publier une annonce.",
                "error"
            );

            return;
        }


        // ----------------------------------------------------
        // Récupération des champs
        // ----------------------------------------------------

        const title =
            document.getElementById("title")?.value.trim() || "";

        const price =
            document.getElementById("price")?.value.trim() || "";

        const currency =
            document.getElementById("currency")?.value || "USD";

        const category =
            document.getElementById("category")?.value || "";

        const description =
            document.getElementById("description")?.value.trim() || "";

        const city =
            document.getElementById("city")?.value || "";

        const neighborhood =
            document.getElementById("neighborhood")?.value.trim() || "";

        const whatsapp =
            document.getElementById("whatsapp")?.value.trim() || "";

        const terms =
            document.getElementById("terms")?.checked || false;


        // ----------------------------------------------------
        // Validation
        // ----------------------------------------------------

        if (!title) {

            showMessage(
                "Veuillez entrer le titre de l'annonce.",
                "error"
            );

            return;
        }


        if (!price) {

            showMessage(
                "Veuillez entrer le prix.",
                "error"
            );

            return;
        }


        if (!category) {

            showMessage(
                "Veuillez sélectionner une catégorie.",
                "error"
            );

            return;
        }


        if (!description) {

            showMessage(
                "Veuillez entrer une description.",
                "error"
            );

            return;
        }


        if (!city) {

            showMessage(
                "Veuillez sélectionner une ville.",
                "error"
            );

            return;
        }


        if (!whatsapp) {

            showMessage(
                "Veuillez entrer votre numéro WhatsApp.",
                "error"
            );

            return;
        }


        if (!terms) {

            showMessage(
                "Vous devez accepter les conditions.",
                "error"
            );

            return;
        }


        // ----------------------------------------------------
        // Validation des photos
        // ----------------------------------------------------

        const files = selectedFiles;


        // ----------------------------------------------------
        // Début publication
        // ----------------------------------------------------

        setButtonLoading(true);

        showMessage(
            "Publication de votre annonce...",
            "info"
        );


        try {

            // =================================================
            // CRÉATION DE L'ANNONCE
            // IMPORTANT :
            // collection = "annonces"
            // =================================================

            const listingRef = await addDoc(
                collection(db, "annonces"),
                {

                    title: title,

                    description: description,

                    price: price,

                    currency: currency,

                    category: category,

                    city: city,

                    neighborhood: neighborhood,

                    whatsapp: whatsapp,


                    // Propriétaire
                    userId: currentUser.uid,

                    ownerId: currentUser.uid,

                    ownerName:
                        currentUser.displayName ||
                        "Utilisateur",

                    ownerEmail:
                        currentUser.email ||
                        "",


                    // Images
                    images: [],

                    imageURL: "",


                    // Statut
                    status: "active",


                    // Dates
                    createdAt: serverTimestamp(),

                    updatedAt: serverTimestamp()

                }
            );


            console.log(
                "Annonce créée :",
                listingRef.id
            );


            // =================================================
            // UPLOAD DES PHOTOS
            // =================================================

            const uploadedImages = [];


            if (files.length > 0) {

                showMessage(
                    "Envoi des photos...",
                    "info"
                );


                for (const file of files) {

                    try {

                        const imageUrl =
                            await uploadImageToCloudinary(
                                file,
                                listingRef.id
                            );

                        if (imageUrl) {

                            uploadedImages.push(
                                imageUrl
                            );

                        }

                    } catch (imageError) {

                        console.error(
                            "Erreur upload photo :",
                            imageError
                        );

                    }

                }

            }


            // =================================================
            // MISE À JOUR DE L'ANNONCE AVEC LES IMAGES
            // =================================================

            await updateDoc(
                doc(
                    db,
                    "annonces",
                    listingRef.id
                ),
                {

                    images: uploadedImages,

                    imageURL:
                        uploadedImages.length > 0
                            ? uploadedImages[0]
                            : "",

                    updatedAt:
                        serverTimestamp()

                }
            );


            console.log(
                "Annonce mise à jour avec les photos."
            );


            // =================================================
            // SUCCÈS
            // =================================================

            showMessage(
                "Votre annonce a été publiée avec succès !",
                "success"
            );


            // Réinitialiser le formulaire
            publishForm.reset();

            selectedFiles = [];

            if (photoPreview) {
                photoPreview.innerHTML = "";
            }


            // =================================================
            // REDIRECTION
            // =================================================

            setTimeout(() => {

                window.location.href =
                    "compte.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Erreur lors de la publication :",
                error
            );


            showMessage(
                "Une erreur est survenue lors de la publication. Veuillez réessayer.",
                "error"
            );

        } finally {

            setButtonLoading(false);

        }

    });

}


// ============================================================
// FIN
// ============================================================

console.log(
    "CAMU SERVICES — publier.js chargé correctement."
);
