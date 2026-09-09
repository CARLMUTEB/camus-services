// =====================================================
// CAMU SERVICES
// PUBLICATION D'ANNONCE AVEC IMAGES
// Firebase + Cloudinary
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


console.log("CAMU SERVICES — publier.js chargé.");


// =====================================================
// CONFIGURATION CLOUDINARY
// =====================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let selectedImages = [];


// =====================================================
// ÉLÉMENTS HTML
// =====================================================

const form =
    document.getElementById("publishForm");

const button =
    document.getElementById("publishButton");

const message =
    document.getElementById("publishMessage");

const photosInput =
    document.getElementById("publishPhotos");

const photoPreview =
    document.getElementById("photoPreview");


// =====================================================
// AUTHENTIFICATION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        console.log("AUTH :", user);

        if (!user) {

            currentUser = null;

            if (message) {

                message.textContent =
                    "Vous devez être connecté pour publier.";

                message.className =
                    "auth-message error";
            }

            return;
        }

        currentUser = user;

        console.log(
            "UTILISATEUR CONNECTÉ :",
            user.email
        );

    }
);


// =====================================================
// SÉLECTION DES IMAGES
// =====================================================

if (photosInput) {

    photosInput.addEventListener(
        "change",
        (event) => {

            const files =
                Array.from(
                    event.target.files || []
                );


            if (files.length === 0) {
                return;
            }


            // ---------------------------------------------
            // Vérification des images
            // ---------------------------------------------

            for (const file of files) {

                if (!file.type.startsWith("image/")) {

                    alert(
                        `${file.name} n'est pas une image valide.`
                    );

                    continue;
                }


                // Maximum 5 MB par image
                if (file.size > 5 * 1024 * 1024) {

                    alert(
                        `${file.name} dépasse la limite de 5 MB.`
                    );

                    continue;
                }


                // Éviter les doublons
                const alreadyExists =
                    selectedImages.some(
                        (existingFile) =>
                            existingFile.name === file.name &&
                            existingFile.size === file.size
                    );


                if (!alreadyExists) {

                    selectedImages.push(file);
                }

            }


            // Maximum 8 images
            if (selectedImages.length > 8) {

                alert(
                    "Vous pouvez sélectionner au maximum 8 images."
                );

                selectedImages =
                    selectedImages.slice(0, 8);
            }


            renderPhotoPreview();


            // Permet de sélectionner à nouveau les mêmes fichiers
            photosInput.value = "";

        }
    );

}


// =====================================================
// AFFICHER L'APERÇU DES IMAGES
// =====================================================

function renderPhotoPreview() {

    if (!photoPreview) {
        return;
    }


    photoPreview.innerHTML = "";


    if (selectedImages.length === 0) {
        return;
    }


    selectedImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "publish-photo-item";


            const image =
                document.createElement("img");

            image.className =
                "publish-photo-image";


            image.alt =
                `Photo ${index + 1}`;


            const objectURL =
                URL.createObjectURL(file);

            image.src =
                objectURL;


            image.onload = () => {

                URL.revokeObjectURL(
                    objectURL
                );

            };


            // ---------------------------------------------
            // Numéro de la photo
            // ---------------------------------------------

            const number =
                document.createElement("span");

            number.className =
                "publish-photo-number";

            number.textContent =
                index === 0
                    ? "Principale"
                    : `${index + 1}`;


            // ---------------------------------------------
            // Bouton supprimer
            // ---------------------------------------------

            const removeButton =
                document.createElement("button");

            removeButton.type =
                "button";

            removeButton.className =
                "publish-photo-remove";

            removeButton.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';

            removeButton.title =
                "Supprimer cette photo";


            removeButton.addEventListener(
                "click",
                () => {

                    selectedImages.splice(
                        index,
                        1
                    );

                    renderPhotoPreview();

                }
            );


            wrapper.appendChild(
                image
            );

            wrapper.appendChild(
                number
            );

            wrapper.appendChild(
                removeButton
            );


            photoPreview.appendChild(
                wrapper
            );

        }
    );

}


// =====================================================
// UPLOAD IMAGE CLOUDINARY
// =====================================================

async function uploadImageToCloudinary(file) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    formData.append(
        "folder",
        "camu-services"
    );


    const response =
        await fetch(
            CLOUDINARY_UPLOAD_URL,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Erreur Cloudinary :",
            errorText
        );

        throw new Error(
            "Impossible d'envoyer une image vers Cloudinary."
        );
    }


    const data =
        await response.json();


    if (!data.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné l'adresse de l'image."
        );
    }


    return data.secure_url;
}


// =====================================================
// UPLOAD DE TOUTES LES IMAGES
// =====================================================

async function uploadAllImages() {

    const imageURLs = [];


    for (
        let i = 0;
        i < selectedImages.length;
        i++
    ) {

        const file =
            selectedImages[i];


        if (message) {

            message.textContent =
                `Envoi de la photo ${i + 1} sur ${selectedImages.length}...`;

            message.className =
                "auth-message";
        }


        console.log(
            `Upload image ${i + 1}/${selectedImages.length} :`,
            file.name
        );


        const imageURL =
            await uploadImageToCloudinary(
                file
            );


        imageURLs.push(
            imageURL
        );

    }


    return imageURLs;
}


// =====================================================
// PUBLICATION
// =====================================================

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            console.log(
                "================================="
            );

            console.log(
                "SUBMIT DÉCLENCHÉ"
            );

            console.log(
                "================================="
            );


            // ---------------------------------------------
            // Vérifier connexion
            // ---------------------------------------------

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
                document
                    .getElementById("publishTitle")
                    ?.value
                    .trim();


            const price =
                document
                    .getElementById("publishPrice")
                    ?.value
                    .trim();


            const currency =
                document
                    .getElementById("publishCurrency")
                    ?.value;


            const category =
                document
                    .getElementById("publishCategory")
                    ?.value;


            const description =
                document
                    .getElementById("publishDescription")
                    ?.value
                    .trim();


            const city =
                document
                    .getElementById("publishCity")
                    ?.value;


            const neighborhood =
                document
                    .getElementById("publishNeighborhood")
                    ?.value
                    .trim();


            const whatsapp =
                document
                    .getElementById("publishWhatsapp")
                    ?.value
                    .trim();


            const terms =
                document
                    .getElementById("publishTerms")
                    ?.checked;


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (!title) {

                alert(
                    "Veuillez saisir le titre."
                );

                return;
            }


            if (!price) {

                alert(
                    "Veuillez saisir le prix."
                );

                return;
            }


            if (!category) {

                alert(
                    "Veuillez choisir une catégorie."
                );

                return;
            }


            if (!description) {

                alert(
                    "Veuillez saisir une description."
                );

                return;
            }


            if (!city) {

                alert(
                    "Veuillez choisir une ville."
                );

                return;
            }


            if (!whatsapp) {

                alert(
                    "Veuillez saisir votre numéro WhatsApp."
                );

                return;
            }


            if (!terms) {

                alert(
                    "Veuillez accepter les conditions."
                );

                return;
            }


            // ---------------------------------------------
            // Validation des images
            // ---------------------------------------------

            if (selectedImages.length === 0) {

                alert(
                    "Veuillez ajouter au moins une photo à votre annonce."
                );

                return;
            }


            // ---------------------------------------------
            // Désactiver bouton
            // ---------------------------------------------

            if (button) {

                button.disabled =
                    true;

                button.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Préparation...';
            }


            try {

                // =========================================
                // 1. ENVOYER LES IMAGES À CLOUDINARY
                // =========================================

                console.log(
                    "Envoi des images vers Cloudinary..."
                );


                const imageURLs =
                    await uploadAllImages();


                console.log(
                    "Images Cloudinary :",
                    imageURLs
                );


                if (imageURLs.length === 0) {

                    throw new Error(
                        "Aucune image n'a pu être envoyée."
                    );
                }


                // =========================================
                // 2. CRÉER L'ANNONCE FIRESTORE
                // =========================================

                if (message) {

                    message.textContent =
                        "Enregistrement de votre annonce...";

                    message.className =
                        "auth-message";
                }


                console.log(
                    "Création de l'annonce dans Firestore..."
                );


                const listingRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        {

                            title: title,

                            price:
                                Number(price),

                            currency:
                                currency,

                            category:
                                category,

                            description:
                                description,

                            city:
                                city,

                            neighborhood:
                                neighborhood,

                            whatsapp:
                                whatsapp,

                            // ---------------------------------
                            // PROPRIÉTAIRE
                            // ---------------------------------

                            userId:
                                currentUser.uid,

                            ownerId:
                                currentUser.uid,

                            ownerName:
                                currentUser.displayName ||
                                "Utilisateur",

                            ownerEmail:
                                currentUser.email ||
                                "",

                            // ---------------------------------
                            // IMAGES
                            // ---------------------------------

                            images:
                                imageURLs,

                            imageURL:
                                imageURLs[0] || "",

                            imageCount:
                                imageURLs.length,

                            // ---------------------------------
                            // STATUT
                            // ---------------------------------

                            status:
                                "active",

                            // ---------------------------------
                            // DATES
                            // ---------------------------------

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


                // =========================================
                // SUCCÈS
                // =========================================

                if (message) {

                    message.textContent =
                        "Votre annonce a été publiée avec succès !";

                    message.className =
                        "auth-message success";
                }


                if (button) {

                    button.innerHTML =
                        '<i class="fa-solid fa-check"></i> Annonce publiée';

                }


                // =========================================
                // REDIRECTION
                // =========================================

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "ERREUR PUBLICATION :",
                    error
                );


                alert(
                    "Erreur lors de la publication : " +
                    error.message
                );


                if (message) {

                    message.textContent =
                        "La publication a échoué.";

                    message.className =
                        "auth-message error";
                }


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML =
                        '<i class="fa-solid fa-paper-plane"></i> Publier l\'annonce';
                }

            }

        }
    );

} else {

    console.error(
        "ERREUR : #publishForm INTROUVABLE !"
    );

}
