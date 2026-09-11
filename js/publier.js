// ============================================================
// CAMU SERVICES
// publier.js
// Publication d'une annonce
//
// Catégories : Firestore → categories
// Villes      : Firestore → villes
// Annonces    : Firestore → annonces
// Images      : Cloudinary
// Firebase   : 12.1.0
// ============================================================


import { auth, db } from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



console.log(
    "CAMU SERVICES — publier.js chargé."
);



// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME =
    "lc9jiidc";


const CLOUDINARY_UPLOAD_PRESET =
    "camu_services";


const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;



// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;

let selectedFiles = [];

let pageInitialized = false;



// ============================================================
// ELEMENTS HTML
// ============================================================

const publishForm =
    document.getElementById(
        "publishForm"
    );


const publishButton =
    document.getElementById(
        "publishButton"
    );


const publishMessage =
    document.getElementById(
        "publishMessage"
    );


const publishPhotos =
    document.getElementById(
        "publishPhotos"
    );


const photoPreview =
    document.getElementById(
        "photoPreview"
    );


const publishCategory =
    document.getElementById(
        "publishCategory"
    );


const publishCity =
    document.getElementById(
        "publishCity"
    );



// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    type = "error"
) {

    if (!publishMessage) {
        return;
    }


    publishMessage.textContent =
        text;


    publishMessage.className =
        `auth-message ${type}`;


    publishMessage.style.display =
        "block";
}



function clearMessage() {

    if (!publishMessage) {
        return;
    }


    publishMessage.textContent =
        "";


    publishMessage.className =
        "auth-message";


    publishMessage.style.display =
        "none";
}



// ============================================================
// CHARGER LES CATÉGORIES
// COLLECTION : categories
//
// Champs utilisés :
// name
// icon
// active
// ============================================================

async function loadCategories() {

    if (!publishCategory) {

        console.error(
            "❌ #publishCategory introuvable."
        );

        return;
    }


    try {

        publishCategory.disabled =
            true;


        publishCategory.innerHTML = `
            <option value="">
                Chargement des catégories...
            </option>
        `;


        console.log(
            "🔄 Lecture de Firestore : categories"
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        console.log(
            "📦 Nombre de documents categories :",
            snapshot.size
        );


        const categories = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                console.log(
                    "📁 Catégorie :",
                    docSnap.id,
                    data
                );


                // ------------------------------------------
                // Catégorie inactive
                // ------------------------------------------

                if (
                    data.active === false
                ) {

                    return;
                }


                // ------------------------------------------
                // Nom obligatoire
                // ------------------------------------------

                if (
                    !data.name ||
                    String(data.name).trim() === ""
                ) {

                    console.warn(
                        "⚠️ Catégorie sans nom :",
                        docSnap.id
                    );

                    return;
                }


                categories.push({

                    id:
                        docSnap.id,

                    name:
                        String(
                            data.name
                        ).trim(),

                    icon:
                        data.icon
                            ? String(
                                data.icon
                            ).trim()
                            : "",

                    description:
                        data.description
                            ? String(
                                data.description
                            ).trim()
                            : ""

                });

            }
        );


        // ====================================================
        // SUPPRIMER LES DOUBLONS
        // ====================================================

        const uniqueCategories =
            [
                ...new Map(
                    categories.map(
                        category => [
                            category.name.toLowerCase(),
                            category
                        ]
                    )
                ).values()
            ];


        // ====================================================
        // TRI ALPHABÉTIQUE
        // ====================================================

        uniqueCategories.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                )
        );


        // ====================================================
        // RESET
        // ====================================================

        publishCategory.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;


        // ====================================================
        // AUCUNE CATÉGORIE
        // ====================================================

        if (
            uniqueCategories.length === 0
        ) {

            publishCategory.innerHTML = `
                <option value="">
                    Aucune catégorie disponible
                </option>
            `;


            publishCategory.disabled =
                true;


            console.warn(
                "⚠️ Aucune catégorie active."
            );


            return;
        }


        // ====================================================
        // AJOUTER LES CATÉGORIES
        // ====================================================

        uniqueCategories.forEach(
            (category) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.name;


                option.textContent =
                    category.icon
                        ? `${category.icon} ${category.name}`
                        : category.name;


                // ID Firestore disponible
                option.dataset.categoryId =
                    category.id;


                // Description disponible
                option.dataset.description =
                    category.description;


                publishCategory.appendChild(
                    option
                );

            }
        );


        publishCategory.disabled =
            false;


        console.log(
            "✅ Catégories affichées :",
            uniqueCategories.length
        );


    } catch (error) {

        console.error(
            "❌ ERREUR CATEGORIES"
        );


        console.error(
            "Code :",
            error?.code
        );


        console.error(
            "Message :",
            error?.message
        );


        publishCategory.innerHTML = `
            <option value="">
                Erreur de chargement des catégories
            </option>
        `;


        publishCategory.disabled =
            true;


        // Message plus précis dans la console
        if (
            error?.code ===
            "permission-denied"
        ) {

            console.error(
                "🚫 Firestore refuse la lecture de categories."
            );

        }

    }

}



// ============================================================
// CHARGER LES VILLES
// COLLECTION : villes
//
// Champs utilisés :
// name
// active
// ============================================================

async function loadCities() {

    if (!publishCity) {

        console.error(
            "❌ #publishCity introuvable."
        );

        return;
    }


    try {

        publishCity.disabled =
            true;


        publishCity.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;


        console.log(
            "🔄 Lecture de Firestore : villes"
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        console.log(
            "📦 Nombre de documents villes :",
            snapshot.size
        );


        const cities = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                console.log(
                    "🏙️ Ville :",
                    docSnap.id,
                    data
                );


                // ------------------------------------------
                // Ville inactive
                // ------------------------------------------

                if (
                    data.active === false
                ) {

                    return;
                }


                // ------------------------------------------
                // Nom obligatoire
                // ------------------------------------------

                if (
                    !data.name ||
                    String(data.name).trim() === ""
                ) {

                    console.warn(
                        "⚠️ Ville sans nom :",
                        docSnap.id
                    );

                    return;
                }


                cities.push({

                    id:
                        docSnap.id,

                    name:
                        String(
                            data.name
                        ).trim()

                });

            }
        );


        // ====================================================
        // SUPPRIMER LES DOUBLONS
        // ====================================================

        const uniqueCities =
            [
                ...new Map(
                    cities.map(
                        city => [
                            city.name.toLowerCase(),
                            city
                        ]
                    )
                ).values()
            ];


        // ====================================================
        // TRI ALPHABÉTIQUE
        // ====================================================

        uniqueCities.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                )
        );


        // ====================================================
        // RESET
        // ====================================================

        publishCity.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


        // ====================================================
        // AUCUNE VILLE
        // ====================================================

        if (
            uniqueCities.length === 0
        ) {

            publishCity.innerHTML = `
                <option value="">
                    Aucune ville disponible
                </option>
            `;


            publishCity.disabled =
                true;


            console.warn(
                "⚠️ Aucune ville active."
            );


            return;
        }


        // ====================================================
        // AJOUTER LES VILLES
        // ====================================================

        uniqueCities.forEach(
            (city) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city.name;


                option.textContent =
                    city.name;


                option.dataset.cityId =
                    city.id;


                publishCity.appendChild(
                    option
                );

            }
        );


        publishCity.disabled =
            false;


        console.log(
            "✅ Villes affichées :",
            uniqueCities.length
        );


    } catch (error) {

        console.error(
            "❌ ERREUR VILLES"
        );


        console.error(
            "Code :",
            error?.code
        );


        console.error(
            "Message :",
            error?.message
        );


        publishCity.innerHTML = `
            <option value="">
                Erreur de chargement des villes
            </option>
        `;


        publishCity.disabled =
            true;

    }

}



// ============================================================
// GESTION DES PHOTOS
// ============================================================

if (publishPhotos) {

    publishPhotos.addEventListener(
        "change",
        handlePhotoSelection
    );

}



function handlePhotoSelection(
    event
) {

    const files =
        Array.from(
            event.target.files || []
        );


    if (
        files.length === 0
    ) {
        return;
    }


    clearMessage();


    const MAX_SIZE =
        5 * 1024 * 1024;


    const MAX_IMAGES =
        8;


    for (
        const file of files
    ) {

        // ------------------------------------------
        // TYPE
        // ------------------------------------------

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showMessage(
                `Le fichier "${file.name}" n'est pas une image.`,
                "error"
            );

            continue;
        }


        // ------------------------------------------
        // TAILLE
        // ------------------------------------------

        if (
            file.size > MAX_SIZE
        ) {

            showMessage(
                `L'image "${file.name}" dépasse 5 MB.`,
                "error"
            );

            continue;
        }


        // ------------------------------------------
        // DOUBLON
        // ------------------------------------------

        const alreadyExists =
            selectedFiles.some(
                (existingFile) =>
                    existingFile.name ===
                        file.name &&
                    existingFile.size ===
                        file.size
            );


        if (
            alreadyExists
        ) {
            continue;
        }


        // ------------------------------------------
        // MAXIMUM
        // ------------------------------------------

        if (
            selectedFiles.length >=
            MAX_IMAGES
        ) {

            showMessage(
                "Vous pouvez sélectionner maximum 8 images.",
                "error"
            );

            break;
        }


        selectedFiles.push(
            file
        );

    }


    renderPhotoPreview();


    // Permet de sélectionner
    // à nouveau le même fichier.

    event.target.value =
        "";

}



// ============================================================
// APERÇU DES PHOTOS
// ============================================================

function renderPhotoPreview() {

    if (!photoPreview) {
        return;
    }


    photoPreview.innerHTML =
        "";


    selectedFiles.forEach(
        (file, index) => {

            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "publish-photo-item";


                    item.innerHTML = `
                        <img
                            src="${event.target.result}"
                            alt="Aperçu ${index + 1}"
                            class="publish-photo-image"
                        >

                        <button
                            type="button"
                            class="publish-photo-remove"
                            aria-label="Supprimer cette photo"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>

                        <span
                            class="publish-photo-number"
                        >
                            ${
                                index === 0
                                    ? "Principale"
                                    : index + 1
                            }
                        </span>
                    `;


                    const removeButton =
                        item.querySelector(
                            ".publish-photo-remove"
                        );


                    if (
                        removeButton
                    ) {

                        removeButton.addEventListener(
                            "click",
                            () => {

                                removePhoto(
                                    index
                                );

                            }
                        );

                    }


                    photoPreview.appendChild(
                        item
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}



// ============================================================
// SUPPRIMER UNE PHOTO
// ============================================================

function removePhoto(
    index
) {

    selectedFiles.splice(
        index,
        1
    );


    renderPhotoPreview();

}



// ============================================================
// UPLOAD CLOUDINARY
// ============================================================

async function uploadImageToCloudinary(
    file
) {

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


    console.log(
        "☁️ Cloudinary :",
        file.name,
        file.size,
        file.type
    );


    let response;


    // ========================================================
    // REQUÊTE CLOUDINARY
    // ========================================================

    try {

        response =
            await fetch(
                CLOUDINARY_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
                }
            );

    } catch (error) {

        console.error(
            "❌ Erreur réseau Cloudinary :",
            error
        );


        throw new Error(
            "Impossible de contacter Cloudinary. Vérifiez votre connexion Internet."
        );

    }


    // ========================================================
    // LIRE LA RÉPONSE
    // ========================================================

    let result = null;


    const responseText =
        await response.text();


    try {

        result =
            JSON.parse(
                responseText
            );

    } catch (error) {

        console.error(
            "Réponse Cloudinary non JSON :",
            responseText
        );

        throw new Error(
            `Cloudinary a retourné une réponse invalide (${response.status}).`
        );

    }


    // ========================================================
    // ERREUR CLOUDINARY
    // ========================================================

    if (
        !response.ok
    ) {

        const cloudinaryMessage =
            result?.error?.message ||
            response.headers.get(
                "X-Cld-Error"
            ) ||
            `Erreur Cloudinary (${response.status})`;


        console.error(
            "❌ Cloudinary :",
            response.status,
            cloudinaryMessage
        );


        throw new Error(
            `Cloudinary (${response.status}) : ${cloudinaryMessage}`
        );

    }


    // ========================================================
    // VÉRIFIER URL
    // ========================================================

    if (
        !result?.secure_url
    ) {

        throw new Error(
            "Cloudinary n'a pas retourné l'URL de l'image."
        );

    }


    console.log(
        "✅ Image Cloudinary :",
        result.secure_url
    );


    return result.secure_url;

}



// ============================================================
// UPLOAD DE TOUTES LES IMAGES
// ============================================================

async function uploadAllImages() {

    const imageURLs = [];


    for (
        let i = 0;
        i < selectedFiles.length;
        i++
    ) {

        const file =
            selectedFiles[i];


        showMessage(
            `Envoi de l'image ${i + 1} sur ${selectedFiles.length}...`,
            "info"
        );


        console.log(
            `☁️ Upload ${i + 1}/${selectedFiles.length}`,
            file.name
        );


        const url =
            await uploadImageToCloudinary(
                file
            );


        imageURLs.push(
            url
        );

    }


    return imageURLs;

}



// ============================================================
// VALIDATION
// ============================================================

function validateForm() {

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
            ?.value;


    const category =
        publishCategory
            ?.value
            .trim();


    const description =
        document
            .getElementById(
                "publishDescription"
            )
            ?.value
            .trim();


    const city =
        publishCity
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


    // ========================================================
    // TITRE
    // ========================================================

    if (!title) {

        showMessage(
            "Veuillez saisir le titre de l'annonce.",
            "error"
        );

        return false;
    }


    // ========================================================
    // PRIX
    // ========================================================

    if (
        price === "" ||
        price === null ||
        Number.isNaN(
            Number(price)
        ) ||
        Number(price) < 0
    ) {

        showMessage(
            "Veuillez saisir un prix valide.",
            "error"
        );

        return false;
    }


    // ========================================================
    // CATÉGORIE
    // ========================================================

    if (!category) {

        showMessage(
            "Veuillez sélectionner une catégorie.",
            "error"
        );

        return false;
    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (!description) {

        showMessage(
            "Veuillez saisir une description.",
            "error"
        );

        return false;
    }


    // ========================================================
    // VILLE
    // ========================================================

    if (!city) {

        showMessage(
            "Veuillez sélectionner une ville.",
            "error"
        );

        return false;
    }


    // ========================================================
    // WHATSAPP
    // ========================================================

    if (!whatsapp) {

        showMessage(
            "Veuillez saisir votre numéro WhatsApp.",
            "error"
        );

        return false;
    }


    // ========================================================
    // CONDITIONS
    // ========================================================

    if (!terms) {

        showMessage(
            "Vous devez accepter les conditions d'utilisation.",
            "error"
        );

        return false;
    }


    return true;

}



// ============================================================
// SOUMISSION
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        handlePublish
    );

}



async function handlePublish(
    event
) {

    event.preventDefault();


    clearMessage();


    // ========================================================
    // UTILISATEUR
    // ========================================================

    if (!currentUser) {

        showMessage(
            "Vous devez être connecté pour publier une annonce.",
            "error"
        );

        return;
    }


    // ========================================================
    // VALIDATION
    // ========================================================

    if (
        !validateForm()
    ) {

        return;
    }


    // ========================================================
    // PHOTOS
    // ========================================================

    if (
        selectedFiles.length === 0
    ) {

        showMessage(
            "Veuillez ajouter au moins une photo.",
            "error"
        );

        return;
    }


    // ========================================================
    // BOUTON
    // ========================================================

    if (publishButton) {

        publishButton.disabled =
            true;


        publishButton.dataset.originalText =
            publishButton.innerHTML;


        publishButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Publication en cours...
        `;

    }


    try {

        // ====================================================
        // RÉCUPÉRATION DES INFORMATIONS
        // ====================================================

        const title =
            document
                .getElementById(
                    "publishTitle"
                )
                .value
                .trim();


        const price =
            Number(
                document
                    .getElementById(
                        "publishPrice"
                    )
                    .value
            );


        const currency =
            document
                .getElementById(
                    "publishCurrency"
                )
                .value;


        const category =
            publishCategory
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "publishDescription"
                )
                .value
                .trim();


        const city =
            publishCity
                .value
                .trim();


        const neighborhood =
            document
                .getElementById(
                    "publishNeighborhood"
                )
                ?.value
                .trim() ||
            "";


        const whatsapp =
            document
                .getElementById(
                    "publishWhatsapp"
                )
                .value
                .trim();


        // ====================================================
        // PROPRIÉTAIRE
        // ====================================================

        const ownerName =
            currentUser.displayName ||
            currentUser.email ||
            "Utilisateur";


        const ownerEmail =
            currentUser.email ||
            "";



        // ====================================================
        // CLOUDINARY
        // ====================================================

        showMessage(
            "Préparation des images...",
            "info"
        );


        const imageURLs =
            await uploadAllImages();


        if (
            !imageURLs ||
            imageURLs.length === 0
        ) {

            throw new Error(
                "Aucune image n'a pu être envoyée."
            );

        }


        console.log(
            "✅ Toutes les images sont sur Cloudinary :",
            imageURLs
        );


        // ====================================================
        // FIRESTORE
        // COLLECTION : annonces
        // ====================================================

        showMessage(
            "Enregistrement de votre annonce...",
            "info"
        );


        const annonceData = {

            title:
                title,


            price:
                price,


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


            // ----------------------------------------------
            // PROPRIÉTAIRE
            // ----------------------------------------------

            userId:
                currentUser.uid,


            ownerId:
                currentUser.uid,


            ownerName:
                ownerName,


            ownerEmail:
                ownerEmail,


            // ----------------------------------------------
            // IMAGES
            // ----------------------------------------------

            images:
                imageURLs,


            imageURL:
                imageURLs[0] ||
                "",


            imageCount:
                imageURLs.length,


            // ----------------------------------------------
            // STATUT
            // ----------------------------------------------

            status:
                "active",


            // ----------------------------------------------
            // DATES
            // ----------------------------------------------

            createdAt:
                serverTimestamp(),


            updatedAt:
                serverTimestamp()

        };


        const annonceRef =
            await addDoc(
                collection(
                    db,
                    "annonces"
                ),
                annonceData
            );


        console.log(
            "✅ ANNONCE CRÉÉE :",
            annonceRef.id
        );


        // ====================================================
        // SUCCÈS
        // ====================================================

        showMessage(
            "Votre annonce a été publiée avec succès !",
            "success"
        );


        // Nettoyer le formulaire

        publishForm.reset();


        selectedFiles =
            [];


        renderPhotoPreview();


        // ====================================================
        // REDIRECTION
        // ====================================================

        setTimeout(
            () => {

                window.location.href =
                    "compte.html";

            },
            1500
        );


    } catch (error) {

        console.error(
            "======================================"
        );


        console.error(
            "❌ ERREUR PUBLICATION"
        );


        console.error(
            "Code :",
            error?.code
        );


        console.error(
            "Message :",
            error?.message
        );


        console.error(
            "Erreur complète :",
            error
        );


        console.error(
            "======================================"
        );


        showMessage(
            error?.message ||
            "Une erreur est survenue lors de la publication.",
            "error"
        );


    } finally {

        if (publishButton) {

            publishButton.disabled =
                false;


            publishButton.innerHTML =
                publishButton.dataset.originalText ||
                `
                    <i class="fa-solid fa-paper-plane"></i>
                    Publier l'annonce
                `;

        }

    }

}



// ============================================================
// INITIALISATION
// ============================================================

async function initializePublishPage() {

    if (pageInitialized) {
        return;
    }


    pageInitialized =
        true;


    console.log(
        "🚀 Initialisation de la page de publication..."
    );


    try {

        // Les deux sont chargés
        // après authentification.

        await Promise.all([
            loadCategories(),
            loadCities()
        ]);


        console.log(
            "✅ Catégories et villes chargées."
        );


    } catch (error) {

        console.error(
            "❌ Erreur initialisation :",
            error
        );

    }

}



// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser =
            user;


        console.log(
            "🔐 État authentification :",
            user
                ? `Connecté (${user.uid})`
                : "Non connecté"
        );


        // ====================================================
        // PAS CONNECTÉ
        // ====================================================

        if (!user) {

            showMessage(
                "Vous devez être connecté pour publier une annonce.",
                "error"
            );


            if (publishButton) {

                publishButton.disabled =
                    true;

            }


            return;
        }


        // ====================================================
        // CONNECTÉ
        // ====================================================

        if (publishButton) {

            publishButton.disabled =
                false;

        }


        console.log(
            "✅ Utilisateur connecté :",
            user.uid
        );


        // ====================================================
        // CHARGER CATÉGORIES + VILLES
        // APRÈS AUTHENTIFICATION
        // ====================================================

        await initializePublishPage();

    }
);



// ============================================================
// FIN
// ============================================================

console.log(
    "CAMU SERVICES : publier.js prêt."
);
