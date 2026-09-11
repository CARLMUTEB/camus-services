// ============================================================
// CAMU SERVICES
// publier.js
// Publication d'une annonce
// Firebase + Firestore + Cloudinary
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


// ============================================================
// VERIFICATION DES ELEMENTS
// ============================================================

console.log("=== CAMU SERVICES : publier.js ===");

console.log("publishForm :", publishForm);
console.log("publishPhotos :", photosInput);
console.log("photoPreview :", photoPreview);
console.log("publishTitle :", titleInput);
console.log("publishPrice :", priceInput);
console.log("publishCurrency :", currencyInput);
console.log("publishCategory :", categoryInput);
console.log("publishDescription :", descriptionInput);
console.log("publishCity :", cityInput);
console.log("publishNeighborhood :", neighborhoodInput);
console.log("publishWhatsapp :", whatsappInput);
console.log("publishTerms :", termsInput);


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    console.log(
        "Etat authentification :",
        user ? "connecté" : "non connecté"
    );

    if (!user) {

        currentUser = null;

        alert(
            "Vous devez être connecté pour publier une annonce."
        );

        window.location.href =
            "connexion.html";

        return;
    }

    currentUser = user;

    console.log(
        "Utilisateur connecté :",
        currentUser.uid
    );

    console.log(
        "Email :",
        currentUser.email
    );


    // ========================================================
    // CHARGEMENT DES DONNEES
    // ========================================================

    await Promise.all([
        loadCategories(),
        loadCities()
    ]);


    // ========================================================
    // INITIALISATION CLOUDINARY
    // ========================================================

    initializeCloudinaryWidget();

});


// ============================================================
// CHARGER LES CATEGORIES
// COLLECTION FIRESTORE : categories
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


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        const categories = [];


        snapshot.forEach((categoryDoc) => {

            const data =
                categoryDoc.data();


            // ------------------------------------------------
            // CATÉGORIE ACTIVE UNIQUEMENT
            // ------------------------------------------------

            if (data.active !== true) {
                return;
            }


            // ------------------------------------------------
            // NOM OBLIGATOIRE
            // ------------------------------------------------

            if (
                !data.name ||
                !data.name.trim()
            ) {
                return;
            }


            categories.push({

                id:
                    categoryDoc.id,

                name:
                    data.name.trim(),

                icon:
                    data.icon
                        ? data.icon.trim()
                        : "",

                description:
                    data.description || "",

                order:
                    Number(data.order) || 0

            });

        });


        // ------------------------------------------------
        // TRI PAR ORDRE
        // ------------------------------------------------

        categories.sort(
            (a, b) =>
                a.order - b.order
        );


        // ------------------------------------------------
        // RESET DU SELECT
        // ------------------------------------------------

        categoryInput.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;


        // ------------------------------------------------
        // AJOUT DES CATEGORIES
        // ------------------------------------------------

        categories.forEach((category) => {

            const option =
                document.createElement("option");


            option.value =
                category.name;


            option.textContent =
                category.name;


            // Conserver l'icône
            // pour une utilisation future
            option.dataset.icon =
                category.icon;


            categoryInput.appendChild(
                option
            );

        });


        // ------------------------------------------------
        // AUCUNE CATEGORIE
        // ------------------------------------------------

        if (categories.length === 0) {

            categoryInput.innerHTML = `
                <option value="">
                    Aucune catégorie disponible
                </option>
            `;

        }


        console.log(
            "Catégories chargées :",
            categories
        );

        console.log(
            "Nombre de catégories :",
            categories.length
        );


    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
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

    }

}


// ============================================================
// CHARGER LES VILLES
// COLLECTION FIRESTORE : villes
// ============================================================

async function loadCities() {

    if (!cityInput) {

        console.error(
            "L'élément #publishCity est introuvable."
        );

        return;
    }

    try {

        cityInput.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach((cityDoc) => {

            const data =
                cityDoc.data();


            // ------------------------------------------------
            // VILLE ACTIVE UNIQUEMENT
            // ------------------------------------------------

            if (data.active !== true) {
                return;
            }


            // ------------------------------------------------
            // NOM OBLIGATOIRE
            // ------------------------------------------------

            if (
                !data.name ||
                !data.name.trim()
            ) {
                return;
            }


            cities.push({

                id:
                    cityDoc.id,

                name:
                    data.name.trim(),

                province:
                    data.province
                        ? data.province.trim()
                        : "",

                order:
                    Number(data.order) || 0

            });

        });


        // ------------------------------------------------
        // TRI PAR ORDRE
        // ------------------------------------------------

        cities.sort(
            (a, b) =>
                a.order - b.order
        );


        // ------------------------------------------------
        // RESET DU SELECT
        // ------------------------------------------------

        cityInput.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


        // ------------------------------------------------
        // AJOUT DES VILLES
        // ------------------------------------------------

        cities.forEach((city) => {

            const option =
                document.createElement("option");


            option.value =
                city.name;


            option.textContent =
                city.province
                    ? `${city.name} — ${city.province}`
                    : city.name;


            option.dataset.province =
                city.province;


            cityInput.appendChild(
                option
            );

        });


        // ------------------------------------------------
        // AUCUNE VILLE
        // ------------------------------------------------

        if (cities.length === 0) {

            cityInput.innerHTML = `
                <option value="">
                    Aucune ville disponible
                </option>
            `;

        }


        console.log(
            "Villes chargées :",
            cities
        );

        console.log(
            "Nombre de villes :",
            cities.length
        );


    } catch (error) {

        console.error(
            "Erreur chargement villes :",
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


        cityInput.innerHTML = `
            <option value="">
                Erreur de chargement des villes
            </option>
        `;

    }

}


// ============================================================
// INITIALISER CLOUDINARY UPLOAD WIDGET
// ============================================================

function initializeCloudinaryWidget() {

    // --------------------------------------------------------
    // Vérifier si Cloudinary est disponible
    // --------------------------------------------------------

    if (
        typeof cloudinary ===
        "undefined"
    ) {

        console.error(
            "Cloudinary Upload Widget n'est pas chargé."
        );

        return;
    }


    console.log(
        "Initialisation Cloudinary..."
    );


    uploadWidget =
        cloudinary.createUploadWidget(

            {

                cloudName:
                    CLOUDINARY_CLOUD_NAME,

                uploadPreset:
                    CLOUDINARY_UPLOAD_PRESET,


                // ------------------------------------------------
                // SOURCE
                // ------------------------------------------------

                sources: [
                    "local"
                ],


                // ------------------------------------------------
                // MULTIPLE
                // ------------------------------------------------

                multiple: true,


                // ------------------------------------------------
                // MAXIMUM 8 IMAGES
                // ------------------------------------------------

                maxFiles: 8,


                // ------------------------------------------------
                // MAXIMUM 5 MB PAR IMAGE
                // ------------------------------------------------

                maxFileSize:
                    5 * 1024 * 1024,


                // ------------------------------------------------
                // FORMATS
                // ------------------------------------------------

                clientAllowedFormats: [
                    "jpg",
                    "jpeg",
                    "png",
                    "webp"
                ],


                // ------------------------------------------------
                // DOSSIER CLOUDINARY
                // ------------------------------------------------

                folder:
                    "camu-services",


                // ------------------------------------------------
                // PAS DE CROP
                // ------------------------------------------------

                cropping:
                    false,


                // ------------------------------------------------
                // MINIATURES
                // ------------------------------------------------

                thumbnails:
                    true,


                // ------------------------------------------------
                // PERMETTRE D'AJOUTER PLUS
                // ------------------------------------------------

                showUploadMoreButton:
                    true,


                // ------------------------------------------------
                // OPTIONS AVANCEES DESACTIVEES
                // ------------------------------------------------

                showAdvancedOptions:
                    false,


                // ------------------------------------------------
                // MODE RESPONSIVE
                // ------------------------------------------------

                responsive:
                    true,


                // ------------------------------------------------
                // LANGUE
                // ------------------------------------------------

                language:
                    "fr"

            },


            // ====================================================
            // CALLBACK CLOUDINARY
            // ====================================================

            (error, result) => {


                // ------------------------------------------------
                // ERREUR
                // ------------------------------------------------

                if (error) {

                    console.error(
                        "Erreur Cloudinary :",
                        error
                    );


                    alert(
                        "Une erreur est survenue pendant l'envoi de l'image."
                    );


                    return;
                }


                // ------------------------------------------------
                // UPLOAD REUSSI
                // ------------------------------------------------

                if (
                    result &&
                    result.event ===
                    "success"
                ) {

                    const image =
                        result.info;


                    console.log(
                        "Image envoyée avec succès :",
                        image
                    );


                    // ------------------------------------------------
                    // SECURE URL
                    // ------------------------------------------------

                    if (
                        !image.secure_url
                    ) {

                        console.error(
                            "URL Cloudinary absente."
                        );

                        return;
                    }


                    // ------------------------------------------------
                    // EVITER DOUBLONS
                    // ------------------------------------------------

                    const exists =
                        selectedImages.some(
                            item =>
                                item.secure_url ===
                                image.secure_url
                        );


                    if (!exists) {

                        selectedImages.push({

                            secure_url:
                                image.secure_url,

                            public_id:
                                image.public_id ||
                                "",

                            width:
                                image.width ||
                                null,

                            height:
                                image.height ||
                                null

                        });

                    }


                    console.log(
                        "Images sélectionnées :",
                        selectedImages
                    );


                    updatePhotoPreview();

                }

            }

        );


    console.log(
        "Cloudinary Widget prêt."
    );

}


// ============================================================
// OUVERTURE DU WIDGET CLOUDINARY
// ============================================================

if (photosInput) {

    photosInput.addEventListener(
        "click",
        (event) => {

            // Empêcher le sélecteur
            // de fichiers HTML classique
            event.preventDefault();


            // ------------------------------------------------
            // VERIFICATION AUTH
            // ------------------------------------------------

            if (!currentUser) {

                alert(
                    "Veuillez vous connecter avant de publier."
                );

                return;
            }


            // ------------------------------------------------
            // VERIFICATION WIDGET
            // ------------------------------------------------

            if (!uploadWidget) {

                alert(
                    "Le système d'envoi des images n'est pas encore prêt."
                );

                console.error(
                    "uploadWidget est null."
                );

                return;
            }


            // ------------------------------------------------
            // OUVRIR CLOUDINARY
            // ------------------------------------------------

            uploadWidget.open();

        }
    );

}


// ============================================================
// APERCU DES PHOTOS
// ============================================================

function updatePhotoPreview() {

    if (!photoPreview) {
        return;
    }


    photoPreview.innerHTML = "";


    // --------------------------------------------------------
    // AUCUNE IMAGE
    // --------------------------------------------------------

    if (
        selectedImages.length ===
        0
    ) {

        photoPreview.innerHTML = `
            <p class="photo-empty">
                Aucune image sélectionnée
            </p>
        `;

        return;
    }


    // --------------------------------------------------------
    // CREATION DES APERCUS
    // --------------------------------------------------------

    selectedImages.forEach(
        (image, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "photo-preview-item";


            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image.secure_url;


            img.alt =
                `Image ${index + 1}`;


            // ------------------------------------------------
            // BOUTON SUPPRIMER
            // ------------------------------------------------

            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "remove-photo";


            removeButton.innerHTML =
                "&times;";


            removeButton.title =
                "Supprimer cette image";


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


            wrapper.appendChild(
                img
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
// PUBLICATION DE L'ANNONCE
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            console.log(
                "Début publication annonce..."
            );


            // =================================================
            // VERIFICATION UTILISATEUR
            // =================================================

            if (!currentUser) {

                alert(
                    "Vous devez être connecté pour publier."
                );

                return;
            }


            // =================================================
            // RECUPERATION DES CHAMPS
            // =================================================

            const title =
                titleInput
                    ? titleInput.value.trim()
                    : "";


            const price =
                priceInput
                    ? priceInput.value.trim()
                    : "";


            const currency =
                currencyInput
                    ? currencyInput.value
                    : "USD";


            const category =
                categoryInput
                    ? categoryInput.value.trim()
                    : "";


            const description =
                descriptionInput
                    ? descriptionInput.value.trim()
                    : "";


            const city =
                cityInput
                    ? cityInput.value.trim()
                    : "";


            const neighborhood =
                neighborhoodInput
                    ? neighborhoodInput.value.trim()
                    : "";


            const whatsapp =
                whatsappInput
                    ? whatsappInput.value.trim()
                    : "";


            // =================================================
            // VALIDATION TITRE
            // =================================================

            if (!title) {

                alert(
                    "Veuillez entrer le titre de l'annonce."
                );

                titleInput?.focus();

                return;
            }


            // =================================================
            // VALIDATION PRIX
            // =================================================

            if (!price) {

                alert(
                    "Veuillez entrer le prix."
                );

                priceInput?.focus();

                return;
            }


            const numericPrice =
                Number(
                    price.replace(
                        /,/g,
                        ""
                    )
                );


            if (
                Number.isNaN(
                    numericPrice
                )
            ) {

                alert(
                    "Veuillez entrer un prix valide."
                );

                priceInput?.focus();

                return;
            }


            // =================================================
            // VALIDATION CATEGORIE
            // =================================================

            if (!category) {

                alert(
                    "Veuillez sélectionner une catégorie."
                );

                categoryInput?.focus();

                return;
            }


            // =================================================
            // VALIDATION DESCRIPTION
            // =================================================

            if (!description) {

                alert(
                    "Veuillez entrer une description."
                );

                descriptionInput?.focus();

                return;
            }


            // =================================================
            // VALIDATION VILLE
            // =================================================

            if (!city) {

                alert(
                    "Veuillez sélectionner une ville."
                );

                cityInput?.focus();

                return;
            }


            // =================================================
            // VALIDATION WHATSAPP
            // =================================================

            if (!whatsapp) {

                alert(
                    "Veuillez entrer votre numéro WhatsApp."
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

                alert(
                    "Vous devez accepter les conditions."
                );

                return;
            }


            // =================================================
            // VALIDATION IMAGES
            // =================================================

            if (
                selectedImages.length ===
                0
            ) {

                alert(
                    "Veuillez ajouter au moins une image."
                );

                return;
            }


            if (
                selectedImages.length >
                8
            ) {

                alert(
                    "Vous pouvez ajouter maximum 8 images."
                );

                return;
            }


            // =================================================
            // BOUTON SUBMIT
            // =================================================

            const submitButton =
                publishForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;


                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Publication...
                `;

            }


            // =================================================
            // ENREGISTREMENT FIRESTORE
            // =================================================

            try {

                // ------------------------------------------------
                // RECUPERATION URL IMAGES
                // ------------------------------------------------

                const imageURLs =
                    selectedImages.map(
                        image =>
                            image.secure_url
                    );


                console.log(
                    "URLs des images :",
                    imageURLs
                );


                // ------------------------------------------------
                // DONNEES ANNONCE
                // ------------------------------------------------

                const annonceData = {

                    // ============================================
                    // INFORMATIONS PRINCIPALES
                    // ============================================

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


                    // ============================================
                    // LOCALISATION
                    // ============================================

                    city:
                        city,

                    neighborhood:
                        neighborhood,


                    // ============================================
                    // CONTACT
                    // ============================================

                    whatsapp:
                        whatsapp,


                    // ============================================
                    // IMAGES
                    // ============================================

                    images:
                        imageURLs,

                    imageURL:
                        imageURLs[0] || "",

                    imageCount:
                        imageURLs.length,


                    // ============================================
                    // PROPRIETAIRE
                    // ============================================

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


                    // ============================================
                    // STATUT
                    // ============================================

                    status:
                        "active",


                    // ============================================
                    // DATES
                    // ============================================

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                };


                console.log(
                    "Données annonce :",
                    annonceData
                );


                // ------------------------------------------------
                // AJOUT DANS annonces
                // ------------------------------------------------

                const annonceRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        annonceData
                    );


                console.log(
                    "Annonce créée avec succès."
                );


                console.log(
                    "ID annonce :",
                    annonceRef.id
                );


                // =================================================
                // SUCCES
                // =================================================

                alert(
                    "✅ Votre annonce a été publiée avec succès !"
                );


                // ------------------------------------------------
                // REDIRECTION
                // ------------------------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Erreur lors de la publication :",
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


                // ------------------------------------------------
                // REACTIVER BOUTON
                // ------------------------------------------------

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
// STYLE APERCU DES PHOTOS
// ============================================================

const previewStyle =
    document.createElement(
        "style"
    );


previewStyle.textContent = `

.photo-preview-item {
    position: relative;
    width: 110px;
    height: 110px;
    border-radius: 10px;
    overflow: hidden;
    margin: 5px;
    display: inline-block;
    vertical-align: top;
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
    z-index: 2;
}

.remove-photo:hover {
    background: rgba(220, 0, 0, 0.9);
}

.photo-empty {
    opacity: 0.7;
    padding: 10px;
}

`;

document.head.appendChild(
    previewStyle
);
