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


            // =================================================
            // VÉRIFICATION DES IMAGES
            // =================================================

            for (const file of files) {

                // ---------------------------------------------
                // Vérifier le type
                // ---------------------------------------------

                if (
                    !file.type.startsWith("image/")
                ) {

                    alert(
                        `${file.name} n'est pas une image valide.`
                    );

                    continue;
                }


                // ---------------------------------------------
                // Maximum 5 MB
                // ---------------------------------------------

                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    alert(
                        `${file.name} dépasse la limite de 5 MB.`
                    );

                    continue;
                }


                // ---------------------------------------------
                // Éviter les doublons
                // ---------------------------------------------

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


            // =================================================
            // MAXIMUM 8 IMAGES
            // =================================================

            if (
                selectedImages.length >
                8
            ) {

                alert(
                    "Vous pouvez sélectionner au maximum 8 images."
                );


                selectedImages =
                    selectedImages.slice(
                        0,
                        8
                    );
            }


            // =================================================
            // APERÇU
            // =================================================

            renderPhotoPreview();


            // =================================================
            // PERMETTRE DE RESÉLECTIONNER LE MÊME FICHIER
            // =================================================

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


    photoPreview.innerHTML =
        "";


    if (
        selectedImages.length === 0
    ) {
        return;
    }


    selectedImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "publish-photo-item";


            // =================================================
            // IMAGE
            // =================================================

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "publish-photo-image";


            image.alt =
                `Photo ${index + 1}`;


            const objectURL =
                URL.createObjectURL(
                    file
                );


            image.src =
                objectURL;


            image.onload =
                () => {

                    URL.revokeObjectURL(
                        objectURL
                    );

                };


            // =================================================
            // NUMÉRO
            // =================================================

            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "publish-photo-number";


            number.textContent =
                index === 0
                    ? "Principale"
                    : `${index + 1}`;


            // =================================================
            // BOUTON SUPPRIMER
            // =================================================

            const removeButton =
                document.createElement(
                    "button"
                );


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


            // =================================================
            // AJOUT
            // =================================================

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

    console.log(
        "================================="
    );

    console.log(
        "CLOUDINARY — DÉBUT UPLOAD"
    );

    console.log(
        "================================="
    );


    console.log(
        "Cloud Name :",
        CLOUDINARY_CLOUD_NAME
    );


    console.log(
        "Upload Preset :",
        CLOUDINARY_UPLOAD_PRESET
    );


    console.log(
        "Fichier :",
        file.name
    );


    console.log(
        "Type :",
        file.type
    );


    console.log(
        "Taille :",
        file.size
    );


    console.log(
        "URL Cloudinary :",
        CLOUDINARY_UPLOAD_URL
    );


    // =================================================
    // FORM DATA
    // =================================================

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


    try {

        // =================================================
        // ENVOI CLOUDINARY
        // =================================================

        const response =
            await fetch(
                CLOUDINARY_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        console.log(
            "Cloudinary HTTP :",
            response.status,
            response.statusText
        );


        // =================================================
        // LIRE LA RÉPONSE
        // =================================================

        const responseText =
            await response.text();


        console.log(
            "Réponse Cloudinary :",
            responseText
        );


        // =================================================
        // ERREUR HTTP
        // =================================================

        if (!response.ok) {

            throw new Error(
                `Cloudinary ${response.status} : ${responseText}`
            );
        }


        // =================================================
        // CONVERTIR JSON
        // =================================================

        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch (jsonError) {

            console.error(
                "Réponse Cloudinary non JSON :",
                responseText
            );


            throw new Error(
                "Cloudinary a retourné une réponse invalide."
            );
        }


        // =================================================
        // VÉRIFIER URL
        // =================================================

        if (
            !data.secure_url
        ) {

            throw new Error(
                "Cloudinary n'a pas retourné l'adresse de l'image."
            );
        }


        console.log(
            "IMAGE CLOUDINARY ENREGISTRÉE :",
            data.secure_url
        );


        console.log(
            "================================="
        );


        return data.secure_url;


    } catch (error) {

        console.error(
            "================================="
        );


        console.error(
            "ERREUR CLOUDINARY"
        );


        console.error(
            error
        );


        console.error(
            "================================="
        );


        // =================================================
        // FAILED TO FETCH
        // =================================================

        if (
            error instanceof TypeError &&
            error.message === "Failed to fetch"
        ) {

            throw new Error(
                "Impossible de contacter Cloudinary. Vérifiez votre connexion Internet, le Cloud Name et le Upload Preset."
            );
        }


        throw error;

    }

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


        // =================================================
        // MESSAGE PROGRESSION
        // =================================================

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


        // =================================================
        // UPLOAD
        // =================================================

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


            // =================================================
            // VÉRIFIER CONNEXION
            // =================================================

            if (!currentUser) {

                alert(
                    "Vous devez être connecté pour publier."
                );

                return;
            }


            // =================================================
            // RÉCUPÉRATION DES CHAMPS
            // =================================================

            const title =
                document
                    .getElementById(
                        "publishTitle"
                    )
                    ?.value
                    .trim();


            const price =
                document
                    .getElementById(
                        "publishPrice"
                    )
                    ?.value
                    .trim();


            const currency =
                document
                    .getElementById(
                        "publishCurrency"
                    )
                    ?.value;


            const category =
                document
                    .getElementById(
                        "publishCategory"
                    )
                    ?.value;


            const description =
                document
                    .getElementById(
                        "publishDescription"
                    )
                    ?.value
                    .trim();


            const city =
                document
                    .getElementById(
                        "publishCity"
                    )
                    ?.value;


            const neighborhood =
                document
                    .getElementById(
                        "publishNeighborhood"
                    )
                    ?.value
                    .trim();


            const whatsapp =
                document
                    .getElementById(
                        "publishWhatsapp"
                    )
                    ?.value
                    .trim();


            const terms =
                document
                    .getElementById(
                        "publishTerms"
                    )
                    ?.checked;


            // =================================================
            // VALIDATION
            // =================================================

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


            // =================================================
            // VALIDATION IMAGES
            // =================================================

            if (
                selectedImages.length === 0
            ) {

                alert(
                    "Veuillez ajouter au moins une photo à votre annonce."
                );

                return;
            }


            // =================================================
            // DÉSACTIVER BOUTON
            // =================================================

            if (button) {

                button.disabled =
                    true;


                button.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Préparation...';
            }


            try {

                // =================================================
                // 1. CLOUDINARY
                // =================================================

                console.log(
                    "Envoi des images vers Cloudinary..."
                );


                const imageURLs =
                    await uploadAllImages();


                console.log(
                    "Images Cloudinary :",
                    imageURLs
                );


                if (
                    imageURLs.length === 0
                ) {

                    throw new Error(
                        "Aucune image n'a pu être envoyée."
                    );
                }


                // =================================================
                // 2. FIRESTORE
                // =================================================

                if (message) {

                    message.textContent =
                        "Enregistrement de votre annonce...";

                    message.className =
                        "auth-message";
                }


                console.log(
                    "Création de l'annonce dans Firestore..."
                );


                // =================================================
                // COLLECTION ANNONCES
                // =================================================

                const listingRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        {

                            // ---------------------------------
                            // INFORMATIONS
                            // ---------------------------------

                            title:
                                title,

                            price:
                                Number(price),

                            currency:
                                currency,

                            category:
                                category,

                            description:
                                description,


                            // ---------------------------------
                            // LOCALISATION
                            // ---------------------------------

                            city:
                                city,

                            neighborhood:
                                neighborhood,


                            // ---------------------------------
                            // CONTACT
                            // ---------------------------------

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
                                imageURLs[0] ||
                                "",

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


                // =================================================
                // SUCCÈS FIRESTORE
                // =================================================

                console.log(
                    "ANNONCE CRÉÉE AVEC SUCCÈS :",
                    listingRef.id
                );


                // =================================================
                // MESSAGE SUCCÈS
                // =================================================

                if (message) {

                    message.textContent =
                        "Votre annonce a été publiée avec succès !";

                    message.className =
                        "auth-message success";
                }


                // =================================================
                // BOUTON SUCCÈS
                // =================================================

                if (button) {

                    button.innerHTML =
                        '<i class="fa-solid fa-check"></i> Annonce publiée';

                }


                // =================================================
                // REDIRECTION
                // =================================================

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1500
                );


            } catch (error) {

                // =================================================
                // ERREUR
                // =================================================

                console.error(
                    "================================="
                );


                console.error(
                    "ERREUR PUBLICATION :",
                    error
                );


                console.error(
                    "Message :",
                    error?.message
                );


                console.error(
                    "================================="
                );


                alert(
                    "Erreur lors de la publication : " +
                    (
                        error?.message ||
                        "Erreur inconnue."
                    )
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


// =====================================================
// FIN
// =====================================================

console.log(
    "CAMU SERVICES : publier.js prêt."
);
