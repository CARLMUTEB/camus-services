// ============================================================
// CAMU SERVICES
// publier.js
// Publication d'annonces
// Firebase Auth + Firestore + Cloudinary Upload Widget
// ============================================================


// ============================================================
// FIREBASE AUTH
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIRESTORE
// ============================================================

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONFIGURATION FIREBASE
// ============================================================

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
// VARIABLES GLOBALES
// ============================================================

let currentUser = null;

let selectedImages = [];

let uploadWidget = null;


// ============================================================
// ELEMENTS HTML
// ============================================================

const publishForm =
    document.getElementById("publishForm");

const photosInput =
    document.getElementById("publishPhotos");

const photoPreview =
    document.getElementById("photoPreview");

const titleInput =
    document.getElementById("publishTitle");

const priceInput =
    document.getElementById("publishPrice");

const currencyInput =
    document.getElementById("publishCurrency");

const categoryInput =
    document.getElementById("publishCategory");

const descriptionInput =
    document.getElementById("publishDescription");

const cityInput =
    document.getElementById("publishCity");

const neighborhoodInput =
    document.getElementById("publishNeighborhood");

const whatsappInput =
    document.getElementById("publishWhatsapp");

const termsInput =
    document.getElementById("publishTerms");

const publishButton =
    document.getElementById("publishButton");

const publishMessage =
    document.getElementById("publishMessage");


// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "CAMU SERVICES - publier.js chargé"
        );

        initializePage();

    }
);


// ============================================================
// INITIALISER LA PAGE
// ============================================================

async function initializePage() {

    console.log(
        "Initialisation de la page de publication..."
    );


    // --------------------------------------------------------
    // Vérifier l'utilisateur connecté
    // --------------------------------------------------------

    onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                currentUser = null;

                showMessage(
                    "Vous devez être connecté pour publier une annonce.",
                    "error"
                );

                console.warn(
                    "Aucun utilisateur connecté."
                );

                return;
            }


            // ------------------------------------------------
            // Utilisateur connecté
            // ------------------------------------------------

            currentUser = user;

            console.log(
                "Utilisateur connecté :",
                currentUser.uid
            );


            // ------------------------------------------------
            // Charger les catégories
            // ------------------------------------------------

            await loadCategories();


            // ------------------------------------------------
            // Initialiser Cloudinary
            // ------------------------------------------------

            initializeCloudinaryWidget();


            console.log(
                "Page de publication prête."
            );

        }
    );

}


// ============================================================
// CHARGER LES CATEGORIES DEPUIS FIRESTORE
// Collection : categories
// ============================================================

async function loadCategories() {

    if (!categoryInput) {

        console.error(
            "L'élément #publishCategory est introuvable."
        );

        return;
    }


    try {

        categoryInput.innerHTML = `
            <option value="">
                Chargement des catégories...
            </option>
        `;


        console.log(
            "Chargement des catégories Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        // ----------------------------------------------------
        // Réinitialiser le select
        // ----------------------------------------------------

        categoryInput.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;


        const categories = [];


        // ----------------------------------------------------
        // Parcourir les catégories
        // ----------------------------------------------------

        snapshot.forEach(
            (categoryDoc) => {

                const category =
                    categoryDoc.data();


                // Seulement les catégories actives
                if (
                    category.active !== true
                ) {
                    return;
                }


                // Nom obligatoire
                if (
                    !category.name ||
                    typeof category.name !== "string"
                ) {
                    return;
                }


                const name =
                    category.name.trim();


                if (!name) {
                    return;
                }


                const icon =
                    category.icon &&
                    typeof category.icon === "string"
                        ? category.icon.trim()
                        : "";


                categories.push({

                    id: categoryDoc.id,

                    name: name,

                    icon: icon

                });

            }
        );


        // ----------------------------------------------------
        // Trier alphabétiquement
        // ----------------------------------------------------

        categories.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "fr"
                )
        );


        // ----------------------------------------------------
        // Ajouter les options
        // ----------------------------------------------------

        categories.forEach(
            (category) => {

                const option =
                    document.createElement("option");


                option.value =
                    category.name;


                option.textContent =
                    `${category.icon} ${category.name}`.trim();


                categoryInput.appendChild(
                    option
                );

            }
        );


        // ----------------------------------------------------
        // Aucune catégorie
        // ----------------------------------------------------

        if (
            categories.length === 0
        ) {

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

    }
    catch (error) {

        console.error(
            "Erreur lors du chargement des catégories :",
            error
        );


        console.error(
            "Code Firebase :",
            error.code
        );


        console.error(
            "Message Firebase :",
            error.message
        );


        categoryInput.innerHTML = `
            <option value="">
                Erreur de chargement des catégories
            </option>
        `;


        showMessage(
            "Impossible de charger les catégories.",
            "error"
        );

    }

}


// ============================================================
// INITIALISER CLOUDINARY UPLOAD WIDGET
// ============================================================

function initializeCloudinaryWidget() {

    // --------------------------------------------------------
    // Vérifier si le script Cloudinary est chargé
    // --------------------------------------------------------

    if (
        typeof cloudinary === "undefined"
    ) {

        console.error(
            "Cloudinary Upload Widget n'est pas chargé."
        );


        showMessage(
            "Le système d'envoi des images n'est pas disponible.",
            "error"
        );


        return;
    }


    console.log(
        "Initialisation de Cloudinary..."
    );


    // --------------------------------------------------------
    // Créer le Widget
    // --------------------------------------------------------

    uploadWidget =
        cloudinary.createUploadWidget(

            {

                cloudName:
                    CLOUDINARY_CLOUD_NAME,


                uploadPreset:
                    CLOUDINARY_UPLOAD_PRESET,


                // --------------------------------------------
                // Source
                // --------------------------------------------

                sources: [
                    "local"
                ],


                // --------------------------------------------
                // Plusieurs fichiers
                // --------------------------------------------

                multiple: true,


                // --------------------------------------------
                // Maximum 8 images
                // --------------------------------------------

                maxFiles: 8,


                // --------------------------------------------
                // Maximum 5 MB par image
                // --------------------------------------------

                maxFileSize:
                    5 * 1024 * 1024,


                // --------------------------------------------
                // Formats autorisés
                // --------------------------------------------

                clientAllowedFormats: [
                    "jpg",
                    "jpeg",
                    "png",
                    "webp"
                ],


                // --------------------------------------------
                // Dossier Cloudinary
                // --------------------------------------------

                folder:
                    "camu-services",


                // --------------------------------------------
                // Pas de recadrage obligatoire
                // --------------------------------------------

                cropping: false,


                // --------------------------------------------
                // Miniatures
                // --------------------------------------------

                thumbnails: true,


                // --------------------------------------------
                // Bouton ajouter plus
                // --------------------------------------------

                showUploadMoreButton: true,


                // --------------------------------------------
                // Options avancées masquées
                // --------------------------------------------

                showAdvancedOptions: false,


                // --------------------------------------------
                // Responsive
                // --------------------------------------------

                responsive: true

            },


            // =================================================
            // CALLBACK CLOUDINARY
            // =================================================

            (error, result) => {

                // ------------------------------------------------
                // ERREUR
                // ------------------------------------------------

                if (error) {

                    console.error(
                        "Erreur Cloudinary :",
                        error
                    );


                    showMessage(
                        "Erreur lors de l'envoi de l'image.",
                        "error"
                    );


                    return;
                }


                // ------------------------------------------------
                // IMAGE ENVOYÉE
                // ------------------------------------------------

                if (
                    result &&
                    result.event === "success"
                ) {

                    const image =
                        result.info;


                    console.log(
                        "Image Cloudinary envoyée :",
                        image
                    );


                    // --------------------------------------------
                    // Vérifier secure_url
                    // --------------------------------------------

                    if (
                        !image ||
                        !image.secure_url
                    ) {

                        console.error(
                            "Cloudinary n'a pas retourné secure_url."
                        );


                        return;
                    }


                    // --------------------------------------------
                    // Vérifier doublon
                    // --------------------------------------------

                    const alreadyExists =
                        selectedImages.some(
                            (item) =>
                                item.secure_url ===
                                image.secure_url
                        );


                    if (
                        alreadyExists
                    ) {

                        console.log(
                            "Image déjà ajoutée."
                        );


                        return;
                    }


                    // --------------------------------------------
                    // Ajouter l'image
                    // --------------------------------------------

                    selectedImages.push({

                        secure_url:
                            image.secure_url,

                        public_id:
                            image.public_id || "",

                        width:
                            image.width || null,

                        height:
                            image.height || null

                    });


                    // --------------------------------------------
                    // Mettre à jour aperçu
                    // --------------------------------------------

                    updatePhotoPreview();


                    console.log(
                        "Nombre d'images :",
                        selectedImages.length
                    );

                }

            }

        );


    console.log(
        "Cloudinary Upload Widget prêt."
    );

}


// ============================================================
// OUVRIR CLOUDINARY
// ============================================================

if (photosInput) {

    photosInput.addEventListener(
        "click",
        (event) => {

            // --------------------------------------------
            // Empêcher le sélecteur natif
            // --------------------------------------------

            event.preventDefault();


            // --------------------------------------------
            // Vérifier connexion
            // --------------------------------------------

            if (!currentUser) {

                showMessage(
                    "Veuillez vous connecter avant de publier.",
                    "error"
                );


                return;
            }


            // --------------------------------------------
            // Vérifier Widget
            // --------------------------------------------

            if (!uploadWidget) {

                showMessage(
                    "Le système d'envoi des images n'est pas encore prêt. Réessayez dans quelques secondes.",
                    "error"
                );


                console.error(
                    "uploadWidget non initialisé."
                );


                return;
            }


            // --------------------------------------------
            // Vérifier limite
            // --------------------------------------------

            if (
                selectedImages.length >= 8
            ) {

                showMessage(
                    "Vous avez déjà ajouté 8 images maximum.",
                    "error"
                );


                return;
            }


            // --------------------------------------------
            // Ouvrir Cloudinary
            // --------------------------------------------

            uploadWidget.open();

        }
    );

}


// ============================================================
// APERÇU DES PHOTOS
// ============================================================

function updatePhotoPreview() {

    if (!photoPreview) {
        return;
    }


    photoPreview.innerHTML = "";


    // --------------------------------------------------------
    // Aucune image
    // --------------------------------------------------------

    if (
        selectedImages.length === 0
    ) {

        photoPreview.innerHTML = `
            <p class="photo-empty">
                Aucune image sélectionnée
            </p>
        `;


        return;
    }


    // --------------------------------------------------------
    // Afficher chaque image
    // --------------------------------------------------------

    selectedImages.forEach(
        (image, index) => {

            const wrapper =
                document.createElement("div");


            wrapper.className =
                "photo-preview-item";


            // --------------------------------------------
            // Image
            // --------------------------------------------

            const img =
                document.createElement("img");


            img.src =
                image.secure_url;


            img.alt =
                `Image ${index + 1}`;


            img.loading =
                "lazy";


            // --------------------------------------------
            // Bouton supprimer
            // --------------------------------------------

            const removeButton =
                document.createElement("button");


            removeButton.type =
                "button";


            removeButton.className =
                "remove-photo";


            removeButton.innerHTML =
                "&times;";


            removeButton.setAttribute(
                "aria-label",
                `Supprimer l'image ${index + 1}`
            );


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


            // --------------------------------------------
            // Numéro image
            // --------------------------------------------

            const number =
                document.createElement("span");


            number.className =
                "photo-number";


            number.textContent =
                index + 1;


            // --------------------------------------------
            // Ajouter au DOM
            // --------------------------------------------

            wrapper.appendChild(
                img
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


// ============================================================
// SOUMISSION DU FORMULAIRE
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            console.log(
                "Soumission du formulaire..."
            );


            // =================================================
            // UTILISATEUR
            // =================================================

            if (!currentUser) {

                showMessage(
                    "Vous devez être connecté pour publier une annonce.",
                    "error"
                );


                return;
            }


            // =================================================
            // RÉCUPÉRER LES DONNÉES
            // =================================================

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


            // =================================================
            // VALIDATION TITRE
            // =================================================

            if (!title) {

                showMessage(
                    "Veuillez entrer le titre de l'annonce.",
                    "error"
                );


                titleInput?.focus();


                return;
            }


            // =================================================
            // VALIDATION PRIX
            // =================================================

            if (!price) {

                showMessage(
                    "Veuillez entrer le prix.",
                    "error"
                );


                priceInput?.focus();


                return;
            }


            const numericPrice =
                Number(price);


            if (
                Number.isNaN(numericPrice) ||
                numericPrice < 0
            ) {

                showMessage(
                    "Veuillez entrer un prix valide.",
                    "error"
                );


                priceInput?.focus();


                return;
            }


            // =================================================
            // VALIDATION CATEGORIE
            // =================================================

            if (!category) {

                showMessage(
                    "Veuillez sélectionner une catégorie.",
                    "error"
                );


                categoryInput?.focus();


                return;
            }


            // =================================================
            // VALIDATION DESCRIPTION
            // =================================================

            if (!description) {

                showMessage(
                    "Veuillez entrer une description.",
                    "error"
                );


                descriptionInput?.focus();


                return;
            }


            // =================================================
            // VALIDATION VILLE
            // =================================================

            if (!city) {

                showMessage(
                    "Veuillez sélectionner une ville.",
                    "error"
                );


                cityInput?.focus();


                return;
            }


            // =================================================
            // VALIDATION WHATSAPP
            // =================================================

            if (!whatsapp) {

                showMessage(
                    "Veuillez entrer votre numéro WhatsApp.",
                    "error"
                );


                whatsappInput?.focus();


                return;
            }


            // =================================================
            // CONDITIONS
            // =================================================

            if (
                termsInput &&
                !termsInput.checked
            ) {

                showMessage(
                    "Vous devez accepter les conditions d'utilisation.",
                    "error"
                );


                return;
            }


            // =================================================
            // IMAGES
            // =================================================

            if (
                selectedImages.length === 0
            ) {

                showMessage(
                    "Veuillez ajouter au moins une image.",
                    "error"
                );


                return;
            }


            if (
                selectedImages.length > 8
            ) {

                showMessage(
                    "Vous pouvez ajouter maximum 8 images.",
                    "error"
                );


                return;
            }


            // =================================================
            // DÉSACTIVER LE BOUTON
            // =================================================

            const originalButtonHTML =
                publishButton
                    ? publishButton.innerHTML
                    : "";


            if (publishButton) {

                publishButton.disabled =
                    true;


                publishButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Publication...
                `;

            }


            // =================================================
            // CONSTRUIRE LES URLS DES IMAGES
            // =================================================

            const imageURLs =
                selectedImages.map(
                    (image) =>
                        image.secure_url
                );


            // =================================================
            // DONNÉES DE L'ANNONCE
            // =================================================

            const annonceData = {

                // ---------------------------------------------
                // Informations principales
                // ---------------------------------------------

                title:
                    title,

                price:
                    numericPrice,

                currency:
                    currency,

                category:
                    category,

                description:
                    description,


                // ---------------------------------------------
                // Localisation
                // ---------------------------------------------

                city:
                    city,

                neighborhood:
                    neighborhood,


                // ---------------------------------------------
                // Contact
                // ---------------------------------------------

                whatsapp:
                    whatsapp,


                // ---------------------------------------------
                // Images
                // ---------------------------------------------

                images:
                    imageURLs,

                imageURL:
                    imageURLs[0] || "",

                imageCount:
                    imageURLs.length,


                // ---------------------------------------------
                // Utilisateur
                // ---------------------------------------------

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


                // ---------------------------------------------
                // Statut
                // ---------------------------------------------

                status:
                    "active",


                // ---------------------------------------------
                // Dates
                // ---------------------------------------------

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            // =================================================
            // ENREGISTRER DANS FIRESTORE
            // Collection : annonces
            // =================================================

            try {

                console.log(
                    "Création de l'annonce dans Firestore..."
                );


                const annonceRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        annonceData
                    );


                console.log(
                    "Annonce créée avec succès :",
                    annonceRef.id
                );


                // =================================================
                // SUCCÈS
                // =================================================

                showMessage(
                    "Votre annonce a été publiée avec succès !",
                    "success"
                );


                if (publishButton) {

                    publishButton.innerHTML = `
                        <i class="fa-solid fa-check"></i>
                        Publiée
                    `;

                }


                // -------------------------------------------------
                // Redirection
                // -------------------------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1000
                );

            }
            catch (error) {

                console.error(
                    "Erreur lors de la publication :",
                    error
                );


                console.error(
                    "Code erreur :",
                    error.code
                );


                console.error(
                    "Message erreur :",
                    error.message
                );


                showMessage(
                    "Erreur lors de la publication : " +
                    error.message,
                    "error"
                );


                // -------------------------------------------------
                // Réactiver bouton
                // -------------------------------------------------

                if (publishButton) {

                    publishButton.disabled =
                        false;


                    publishButton.innerHTML =
                        originalButtonHTML;

                }

            }

        }
    );

}


// ============================================================
// AFFICHER UN MESSAGE
// ============================================================

function showMessage(
    message,
    type = "info"
) {

    if (!publishMessage) {

        // Si l'élément n'existe pas,
        // utiliser simplement alert pour les erreurs importantes
        console.log(
            `[${type}] ${message}`
        );

        return;
    }


    publishMessage.textContent =
        message;


    publishMessage.className =
        "auth-message";


    publishMessage.classList.add(
        `message-${type}`
    );


    publishMessage.style.display =
        "block";


    // --------------------------------------------------------
    // Faire défiler vers le message
    // --------------------------------------------------------

    try {

        publishMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
    catch (error) {

        console.log(
            "Scroll message impossible."
        );

    }

}


// ============================================================
// STYLE POUR L'APERÇU DES IMAGES
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
    background: #f1f1f1;
}

.photo-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.remove-photo {
    position: absolute;
    top: 5px;
    right: 5px;

    width: 28px;
    height: 28px;

    border: none;
    border-radius: 50%;

    background: rgba(0, 0, 0, 0.75);
    color: white;

    font-size: 20px;
    line-height: 20px;

    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 5;
}

.remove-photo:hover {
    background: rgba(200, 0, 0, 0.9);
}

.photo-number {
    position: absolute;
    left: 5px;
    bottom: 5px;

    min-width: 24px;
    height: 24px;

    padding: 0 6px;

    border-radius: 12px;

    background: rgba(0, 0, 0, 0.65);
    color: white;

    font-size: 12px;
    font-weight: 700;

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 4;
}

.photo-empty {
    opacity: 0.7;
    padding: 10px;
}

.message-error {
    color: #b42318;
}

.message-success {
    color: #067647;
}

.message-info {
    color: #175cd3;
}

@media (max-width: 600px) {

    .photo-preview-item {
        width: 90px;
        height: 90px;
    }

    .remove-photo {
        width: 25px;
        height: 25px;
        font-size: 18px;
    }

}

`;


document.head.appendChild(
    previewStyle
);


// ============================================================
// FIN
// ============================================================

console.log(
    "CAMU SERVICES - publier.js terminé."
);
