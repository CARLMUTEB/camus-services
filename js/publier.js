// ============================================================
// CAMU SERVICES - PUBLICATION D'ANNONCE
// Cloudinary Upload Widget + Firebase Firestore
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";


// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;
let selectedImages = [];
let uploadWidget = null;


// ============================================================
// ELEMENTS HTML
// ============================================================

const publishForm = document.getElementById("publishForm");

const photosInput = document.getElementById("publishPhotos");
const photoPreview = document.getElementById("photoPreview");

const titleInput = document.getElementById("publishTitle");
const priceInput = document.getElementById("publishPrice");
const currencyInput = document.getElementById("publishCurrency");
const categoryInput = document.getElementById("publishCategory");
const descriptionInput = document.getElementById("publishDescription");
const cityInput = document.getElementById("publishCity");
const neighborhoodInput = document.getElementById("publishNeighborhood");
const whatsappInput = document.getElementById("publishWhatsapp");
const termsInput = document.getElementById("publishTerms");


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        currentUser = null;

        console.log("Utilisateur non connecté.");

        alert("Vous devez être connecté pour publier une annonce.");

        window.location.href = "connexion.html";

        return;
    }

    currentUser = user;

    console.log("Utilisateur connecté :", currentUser.uid);

    // Charger les catégories uniquement après authentification
    await loadCategories();

    // Initialiser Cloudinary
    initializeCloudinaryWidget();

});


// ============================================================
// CHARGER LES CATEGORIES FIRESTORE
// ============================================================

async function loadCategories() {

    if (!categoryInput) {
        console.error("Élément publishCategory introuvable.");
        return;
    }

    try {

        categoryInput.innerHTML = `
            <option value="">
                Chargement des catégories...
            </option>
        `;

        const snapshot = await getDocs(
            collection(db, "categories")
        );

        categoryInput.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;

        const categories = [];

        snapshot.forEach((categoryDoc) => {

            const category = categoryDoc.data();

            // Seulement les catégories actives
            if (category.active !== true) {
                return;
            }

            if (!category.name) {
                return;
            }

            categories.push({
                name: category.name.trim(),
                icon: category.icon
                    ? category.icon.trim()
                    : ""
            });

        });

        // Trier alphabétiquement
        categories.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        categories.forEach((category) => {

            const option = document.createElement("option");

            option.value = category.name;

            option.textContent =
                `${category.icon} ${category.name}`.trim();

            categoryInput.appendChild(option);

        });

        if (categories.length === 0) {

            categoryInput.innerHTML = `
                <option value="">
                    Aucune catégorie disponible
                </option>
            `;

            console.warn(
                "Aucune catégorie active trouvée."
            );

        }

        console.log(
            `${categories.length} catégorie(s) chargée(s).`
        );

    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );

        categoryInput.innerHTML = `
            <option value="">
                Erreur de chargement des catégories
            </option>
        `;

        // Affichage détaillé pour diagnostic
        console.error(
            "Code Firebase :",
            error.code
        );

        console.error(
            "Message Firebase :",
            error.message
        );

    }

}


// ============================================================
// INITIALISER CLOUDINARY UPLOAD WIDGET
// ============================================================

function initializeCloudinaryWidget() {

    if (typeof cloudinary === "undefined") {

        console.error(
            "Cloudinary Upload Widget n'est pas chargé."
        );

        return;
    }

    uploadWidget = cloudinary.createUploadWidget(

        {

            cloudName: CLOUDINARY_CLOUD_NAME,

            uploadPreset: CLOUDINARY_UPLOAD_PRESET,

            // Sources autorisées
            sources: [
                "local"
            ],

            // Plusieurs images
            multiple: true,

            // Maximum 8 images
            maxFiles: 8,

            // Taille maximale : 5 MB
            maxFileSize: 5 * 1024 * 1024,

            // Formats autorisés
            clientAllowedFormats: [
                "jpg",
                "jpeg",
                "png",
                "webp"
            ],

            // Dossier Cloudinary
            folder: "camu-services",

            // Affichage responsive
            showAdvancedOptions: false,

            cropping: false,

            // Thumbnails
            thumbnails: true,

            // Progression
            showUploadMoreButton: true,

            // Texte
            language: "fr"

        },

        (error, result) => {

            // ==================================================
            // ERREUR CLOUDINARY
            // ==================================================

            if (error) {

                console.error(
                    "Erreur Cloudinary :",
                    error
                );

                alert(
                    "Une erreur est survenue pendant l'envoi des images."
                );

                return;
            }


            // ==================================================
            // IMAGE ENVOYEE AVEC SUCCES
            // ==================================================

            if (
                result &&
                result.event === "success"
            ) {

                const image = result.info;

                console.log(
                    "Image Cloudinary envoyée :",
                    image
                );

                if (!image.secure_url) {

                    console.error(
                        "URL Cloudinary absente."
                    );

                    return;
                }

                // Eviter les doublons
                const alreadyExists =
                    selectedImages.some(
                        item =>
                            item.secure_url === image.secure_url
                    );

                if (!alreadyExists) {

                    selectedImages.push({
                        secure_url: image.secure_url,
                        public_id: image.public_id || "",
                        width: image.width || null,
                        height: image.height || null
                    });

                }

                updatePhotoPreview();

            }

        }

    );

}


// ============================================================
// OUVRIR CLOUDINARY LORS DU CLIC SUR LE CHAMP PHOTOS
// ============================================================

if (photosInput) {

    photosInput.addEventListener(
        "click",
        (event) => {

            // Empêche le sélecteur de fichiers
            event.preventDefault();

            if (!currentUser) {

                alert(
                    "Veuillez vous connecter avant de publier."
                );

                return;
            }

            if (!uploadWidget) {

                alert(
                    "Le système d'envoi des images n'est pas encore prêt."
                );

                return;
            }

            uploadWidget.open();

        }
    );

}


// ============================================================
// APERCU DES IMAGES
// ============================================================

function updatePhotoPreview() {

    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    if (selectedImages.length === 0) {

        photoPreview.innerHTML = `
            <p class="photo-empty">
                Aucune image sélectionnée
            </p>
        `;

        return;
    }


    selectedImages.forEach(
        (image, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "photo-preview-item";


            const img =
                document.createElement("img");

            img.src = image.secure_url;

            img.alt =
                `Image ${index + 1}`;


            // Bouton supprimer
            const removeButton =
                document.createElement("button");

            removeButton.type = "button";

            removeButton.className =
                "remove-photo";

            removeButton.innerHTML =
                "&times;";

            removeButton.addEventListener(
                "click",
                () => {

                    selectedImages.splice(
                        index,
                        1
                    );

                    updatePhotoPreview();

                }
            );


            wrapper.appendChild(img);

            wrapper.appendChild(
                removeButton
            );

            photoPreview.appendChild(
                wrapper
            );

        }
    );

}


// ============================================================
// PUBLICATION
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // ==================================================
            // VERIFICATION UTILISATEUR
            // ==================================================

            if (!currentUser) {

                alert(
                    "Vous devez être connecté pour publier."
                );

                return;
            }


            // ==================================================
            // RECUPERATION DES DONNEES
            // ==================================================

            const title =
                titleInput?.value.trim() || "";

            const price =
                priceInput?.value.trim() || "";

            const currency =
                currencyInput?.value || "USD";

            const category =
                categoryInput?.value.trim() || "";

            const description =
                descriptionInput?.value.trim() || "";

            const city =
                cityInput?.value.trim() || "";

            const neighborhood =
                neighborhoodInput?.value.trim() || "";

            const whatsapp =
                whatsappInput?.value.trim() || "";


            // ==================================================
            // VALIDATION
            // ==================================================

            if (!title) {

                alert(
                    "Veuillez entrer le titre de l'annonce."
                );

                titleInput?.focus();

                return;
            }


            if (!price) {

                alert(
                    "Veuillez entrer le prix."
                );

                priceInput?.focus();

                return;
            }


            if (!category) {

                alert(
                    "Veuillez sélectionner une catégorie."
                );

                categoryInput?.focus();

                return;
            }


            if (!description) {

                alert(
                    "Veuillez entrer une description."
                );

                descriptionInput?.focus();

                return;
            }


            if (!city) {

                alert(
                    "Veuillez sélectionner une ville."
                );

                cityInput?.focus();

                return;
            }


            if (!whatsapp) {

                alert(
                    "Veuillez entrer votre numéro WhatsApp."
                );

                whatsappInput?.focus();

                return;
            }


            if (
                termsInput &&
                !termsInput.checked
            ) {

                alert(
                    "Vous devez accepter les conditions."
                );

                return;
            }


            // ==================================================
            // VERIFICATION IMAGES
            // ==================================================

            if (selectedImages.length === 0) {

                alert(
                    "Veuillez ajouter au moins une image."
                );

                return;
            }


            if (selectedImages.length > 8) {

                alert(
                    "Vous pouvez ajouter maximum 8 images."
                );

                return;
            }


            // ==================================================
            // DESACTIVER BOUTON
            // ==================================================

            const submitButton =
                publishForm.querySelector(
                    'button[type="submit"]'
                );

            const originalText =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML =
                    `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Publication...
                    `;

            }


            // ==================================================
            // ENREGISTREMENT FIRESTORE
            // ==================================================

            try {

                console.log(
                    "Enregistrement de l'annonce..."
                );


                const imageURLs =
                    selectedImages.map(
                        image =>
                            image.secure_url
                    );


                const annonceData = {

                    // Informations annonce
                    title: title,

                    price: Number(price),

                    currency: currency,

                    category: category,

                    description: description,

                    city: city,

                    neighborhood: neighborhood,

                    whatsapp: whatsapp,


                    // Images
                    images: imageURLs,

                    imageURL:
                        imageURLs[0] || "",

                    imageCount:
                        imageURLs.length,


                    // Propriétaire
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


                    // Statut
                    status: "active",


                    // Dates
                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                };


                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        annonceData
                    );


                console.log(
                    "Annonce créée :",
                    docRef.id
                );


                // ==================================================
                // SUCCES
                // ==================================================

                alert(
                    "✅ Votre annonce a été publiée avec succès !"
                );


                // Redirection
                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Erreur publication :",
                    error
                );

                console.error(
                    "Code :",
                    error.code
                );

                console.error(
                    "Message :",
                    error.message
                );


                alert(
                    "Erreur lors de la publication : " +
                    error.message
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        originalText;

                }

            }

        }
    );

}


// ============================================================
// STYLE APERCU PHOTOS
// ============================================================

const previewStyle =
    document.createElement("style");

previewStyle.textContent = `

.photo-preview-item {
    position: relative;
    width: 110px;
    height: 110px;
    border-radius: 10px;
    overflow: hidden;
    margin: 5px;
    display: inline-block;
}

.photo-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-photo {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: rgba(0,0,0,.75);
    color: white;
    font-size: 20px;
    line-height: 20px;
    cursor: pointer;
}

.photo-empty {
    opacity: .7;
    padding: 10px;
}

`;

document.head.appendChild(
    previewStyle
);
