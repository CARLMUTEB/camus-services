// ============================================================
// CAMU SERVICES
// publier.js
// Publication d'une annonce
// Catégories depuis Firestore : categories
// Villes depuis Firestore : villes
// Champ ville : name
// Images : Cloudinary
// Annonces : annonces
// ============================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";

const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;

let selectedFiles = [];


// ============================================================
// ELEMENTS HTML
// ============================================================

const publishForm =
    document.getElementById("publishForm");

const publishButton =
    document.getElementById("publishButton");

const publishMessage =
    document.getElementById("publishMessage");

const publishPhotos =
    document.getElementById("publishPhotos");

const photoPreview =
    document.getElementById("photoPreview");

const publishCategory =
    document.getElementById("publishCategory");

const publishCity =
    document.getElementById("publishCity");


// ============================================================
// MESSAGE
// ============================================================

function showMessage(message, type = "error") {

    if (!publishMessage) return;

    publishMessage.textContent = message;

    publishMessage.className =
        `auth-message ${type}`;

    publishMessage.style.display = "block";
}


function clearMessage() {

    if (!publishMessage) return;

    publishMessage.textContent = "";

    publishMessage.className =
        "auth-message";

    publishMessage.style.display = "none";
}


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    if (!user) {

        showMessage(
            "Vous devez être connecté pour publier une annonce.",
            "error"
        );

        if (publishButton) {
            publishButton.disabled = true;
        }

        return;
    }

    if (publishButton) {
        publishButton.disabled = false;
    }

    console.log(
        "✅ Utilisateur connecté :",
        user.uid
    );
});


// ============================================================
// CHARGER LES CATÉGORIES
// COLLECTION : categories
// ============================================================

async function loadCategories() {

    if (!publishCategory) {

        console.error(
            "❌ Élément #publishCategory introuvable."
        );

        return;
    }

    try {

        publishCategory.innerHTML = `
            <option value="">
                Chargement des catégories...
            </option>
        `;

        console.log(
            "🔄 Chargement de la collection : categories"
        );

        const snapshot =
            await getDocs(
                collection(db, "categories")
            );

        console.log(
            "📦 Nombre de catégories :",
            snapshot.size
        );

        const categories = [];

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            console.log(
                "📁 Catégorie :",
                docSnap.id,
                data
            );

            // Ignorer les catégories désactivées
            if (data.active === false) {
                return;
            }

            // Champ attendu : name
            if (
                !data.name ||
                String(data.name).trim() === ""
            ) {
                return;
            }

            categories.push({

                id: docSnap.id,

                name:
                    String(data.name).trim(),

                icon:
                    data.icon || ""

            });

        });


        // ====================================================
        // SUPPRIMER LES DOUBLONS
        // ====================================================

        const uniqueCategories = [
            ...new Map(
                categories.map(category => [
                    category.name.toLowerCase(),
                    category
                ])
            ).values()
        ];


        // ====================================================
        // TRI ALPHABÉTIQUE
        // ====================================================

        uniqueCategories.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "fr",
                {
                    sensitivity: "base"
                }
            )
        );


        // ====================================================
        // RESET SELECT
        // ====================================================

        publishCategory.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;


        if (uniqueCategories.length === 0) {

            publishCategory.innerHTML = `
                <option value="">
                    Aucune catégorie disponible
                </option>
            `;

            console.warn(
                "⚠️ Aucune catégorie disponible."
            );

            return;
        }


        // ====================================================
        // AJOUTER LES CATÉGORIES
        // ====================================================

        uniqueCategories.forEach((category) => {

            const option =
                document.createElement("option");

            option.value =
                category.name;

            option.textContent =
                `${category.icon ? category.icon + " " : ""}${category.name}`;

            publishCategory.appendChild(option);

        });


        console.log(
            "✅ Catégories affichées :",
            uniqueCategories.length
        );

    } catch (error) {

        console.error(
            "❌ Erreur chargement catégories :",
            error
        );

        publishCategory.innerHTML = `
            <option value="">
                Erreur de chargement des catégories
            </option>
        `;
    }
}


// ============================================================
// CHARGER LES VILLES
// COLLECTION : villes
// CHAMP : name
// ============================================================

async function loadCities() {

    if (!publishCity) {

        console.error(
            "❌ Élément #publishCity introuvable dans le HTML."
        );

        return;
    }


    try {

        publishCity.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;


        console.log(
            "🔄 Chargement de la collection : villes"
        );


        // ====================================================
        // RÉCUPÉRATION FIRESTORE
        // ====================================================

        const snapshot =
            await getDocs(
                collection(db, "villes")
            );


        console.log(
            "📦 Nombre de documents dans villes :",
            snapshot.size
        );


        const cities = [];


        // ====================================================
        // LECTURE DES DOCUMENTS
        // ====================================================

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();


            console.log(
                "🏙️ Document ville :",
                docSnap.id,
                data
            );


            // ==================================================
            // VILLE DÉSACTIVÉE
            // ==================================================

            if (data.active === false) {

                console.log(
                    "⛔ Ville désactivée :",
                    data.name
                );

                return;
            }


            // ==================================================
            // CHAMP NAME
            // ==================================================

            if (
                !data.name ||
                String(data.name).trim() === ""
            ) {

                console.warn(
                    "⚠️ Document sans champ 'name' :",
                    docSnap.id
                );

                return;
            }


            // ==================================================
            // AJOUT DE LA VILLE
            // ==================================================

            cities.push({

                id:
                    docSnap.id,

                name:
                    String(data.name).trim()

            });

        });


        // ====================================================
        // SUPPRIMER LES DOUBLONS
        // ====================================================

        const uniqueCities = [
            ...new Map(
                cities.map(city => [
                    city.name.toLowerCase(),
                    city
                ])
            ).values()
        ];


        // ====================================================
        // TRI ALPHABÉTIQUE
        // ====================================================

        uniqueCities.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "fr",
                {
                    sensitivity: "base"
                }
            )
        );


        // ====================================================
        // RESET DU SELECT
        // ====================================================

        publishCity.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


        // ====================================================
        // AUCUNE VILLE
        // ====================================================

        if (uniqueCities.length === 0) {

            publishCity.innerHTML = `
                <option value="">
                    Aucune ville disponible
                </option>
            `;

            console.warn(
                "⚠️ Aucun document exploitable trouvé dans la collection 'villes'."
            );

            return;
        }


        // ====================================================
        // AJOUTER LES VILLES AU SELECT
        // ====================================================

        uniqueCities.forEach((city) => {

            const option =
                document.createElement("option");


            option.value =
                city.name;


            option.textContent =
                city.name;


            // ID Firestore disponible si nécessaire
            option.dataset.cityId =
                city.id;


            publishCity.appendChild(option);

        });


        console.log(
            "✅ Villes affichées :",
            uniqueCities.length
        );


        console.table(
            uniqueCities
        );

    } catch (error) {

        console.error(
            "❌ Erreur chargement villes :",
            error
        );


        publishCity.innerHTML = `
            <option value="">
                Erreur de chargement des villes
            </option>
        `;
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


function handlePhotoSelection(event) {

    const files =
        Array.from(
            event.target.files || []
        );


    if (files.length === 0) {
        return;
    }


    clearMessage();


    const MAX_SIZE =
        5 * 1024 * 1024;


    const MAX_IMAGES =
        8;


    for (const file of files) {

        // ==================================================
        // TYPE
        // ==================================================

        if (!file.type.startsWith("image/")) {

            showMessage(
                `Le fichier "${file.name}" n'est pas une image.`,
                "error"
            );

            continue;
        }


        // ==================================================
        // TAILLE
        // ==================================================

        if (file.size > MAX_SIZE) {

            showMessage(
                `L'image "${file.name}" dépasse 5 MB.`,
                "error"
            );

            continue;
        }


        // ==================================================
        // DOUBLON
        // ==================================================

        const alreadyExists =
            selectedFiles.some(
                (existingFile) =>
                    existingFile.name === file.name &&
                    existingFile.size === file.size
            );


        if (alreadyExists) {
            continue;
        }


        // ==================================================
        // MAXIMUM 8 IMAGES
        // ==================================================

        if (
            selectedFiles.length >= MAX_IMAGES
        ) {

            showMessage(
                "Vous pouvez sélectionner maximum 8 images.",
                "error"
            );

            break;
        }


        selectedFiles.push(file);
    }


    renderPhotoPreview();


    // Permet de sélectionner à nouveau
    // le même fichier après suppression.
    event.target.value = "";
}


// ============================================================
// APERÇU DES PHOTOS
// ============================================================

function renderPhotoPreview() {

    if (!photoPreview) return;


    photoPreview.innerHTML = "";


    selectedFiles.forEach(
        (file, index) => {

            const reader =
                new FileReader();


            reader.onload = (event) => {

                const item =
                    document.createElement("div");


                item.className =
                    "publish-photo-item";


                item.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="Aperçu ${index + 1}"
                    >

                    <button
                        type="button"
                        class="publish-photo-remove"
                        data-index="${index}"
                        aria-label="Supprimer cette photo"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <span class="publish-photo-number">
                        ${index + 1}
                    </span>
                `;


                const removeButton =
                    item.querySelector(
                        ".publish-photo-remove"
                    );


                if (removeButton) {

                    removeButton.addEventListener(
                        "click",
                        () => {

                            removePhoto(index);

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

function removePhoto(index) {

    selectedFiles.splice(
        index,
        1
    );

    renderPhotoPreview();
}


// ============================================================
// UPLOAD CLOUDINARY
// ============================================================

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


    let result = null;


    try {

        result =
            await response.json();

    } catch (jsonError) {

        throw new Error(
            "Cloudinary a retourné une réponse invalide."
        );

    }


    if (!response.ok) {

        const cloudinaryError =
            result?.error?.message ||
            `Erreur Cloudinary (${response.status})`;


        throw new Error(
            cloudinaryError
        );

    }


    if (!result.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné l'URL de l'image."
        );

    }


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
        document.getElementById(
            "publishTitle"
        )?.value.trim();


    const price =
        document.getElementById(
            "publishPrice"
        )?.value;


    const category =
        publishCategory?.value.trim();


    const description =
        document.getElementById(
            "publishDescription"
        )?.value.trim();


    const city =
        publishCity?.value.trim();


    const whatsapp =
        document.getElementById(
            "publishWhatsapp"
        )?.value.trim();


    const terms =
        document.getElementById(
            "publishTerms"
        )?.checked;


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
        Number.isNaN(Number(price)) ||
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
// SOUMISSION DU FORMULAIRE
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        handlePublish
    );
}


async function handlePublish(event) {

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

    if (!validateForm()) {
        return;
    }


    // ========================================================
    // IMAGES
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
    // DÉSACTIVER BOUTON
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
            document.getElementById(
                "publishTitle"
            ).value.trim();


        const price =
            Number(
                document.getElementById(
                    "publishPrice"
                ).value
            );


        const currency =
            document.getElementById(
                "publishCurrency"
            ).value;


        const category =
            publishCategory.value.trim();


        const description =
            document.getElementById(
                "publishDescription"
            ).value.trim();


        const city =
            publishCity.value.trim();


        const neighborhood =
            document.getElementById(
                "publishNeighborhood"
            )?.value.trim() || "";


        const whatsapp =
            document.getElementById(
                "publishWhatsapp"
            ).value.trim();


        // ====================================================
        // NOM UTILISATEUR
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

            userId:
                currentUser.uid,

            ownerId:
                currentUser.uid,

            ownerName:
                ownerName,

            ownerEmail:
                ownerEmail,

            images:
                imageURLs,

            imageURL:
                imageURLs[0] || "",

            imageCount:
                imageURLs.length,

            status:
                "active",

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
            "✅ Annonce créée :",
            annonceRef.id
        );


        // ====================================================
        // SUCCÈS
        // ====================================================

        showMessage(
            "Votre annonce a été publiée avec succès !",
            "success"
        );


        // Nettoyage
        publishForm.reset();

        selectedFiles = [];

        renderPhotoPreview();


        // ====================================================
        // REDIRECTION
        // ====================================================

        setTimeout(() => {

            window.location.href =
                "compte.html";

        }, 1500);


    } catch (error) {

        console.error(
            "❌ Erreur publication :",
            error
        );


        let message =
            "Une erreur est survenue lors de la publication.";


        if (error?.message) {

            message =
                error.message;
        }


        showMessage(
            message,
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

    console.log(
        "🚀 Initialisation de la page de publication..."
    );


    try {

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
// LANCEMENT
// ============================================================

initializePublishPage();
