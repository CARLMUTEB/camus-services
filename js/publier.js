// ============================================================
// CAMU SERVICES
// PUBLICATION D'ANNONCE
// BASIC + PREMIUM
// PC + MOBILE
// CLOUDINARY + FIRESTORE
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


// ============================================================
// CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";

const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// ============================================================
// LIMITES BASIC / PREMIUM
// ============================================================

const BASIC_MAX_ADS = 5;

const PREMIUM_MAX_ADS = 30;

const BASIC_MAX_IMAGES = 5;

const PREMIUM_MAX_IMAGES = 10;


// ============================================================
// TAILLE MAXIMALE D'UNE IMAGE
// ============================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024;


// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;

let currentUserData = null;

let currentPlan = "basic";

let currentSubscriptionStatus = "active";

let selectedImages = [];

let currentAdCount = 0;


// ============================================================
// ELEMENTS
// ============================================================

const publishForm =
    document.getElementById("publishForm");

const publishPhotos =
    document.getElementById("publishPhotos");

const photoPreview =
    document.getElementById("photoPreview");

const categorySelect =
    document.getElementById("publishCategory");

const citySelect =
    document.getElementById("publishCity");

const publishMessage =
    document.getElementById("publishMessage");


// ============================================================
// MESSAGE
// ============================================================

function showMessage(message, type = "error") {

    if (!publishMessage) {

        alert(message);

        return;
    }

    publishMessage.textContent = message;

    publishMessage.style.display = "block";

    publishMessage.style.background =
        type === "success"
            ? "#e8f7ec"
            : "#fff1f1";

    publishMessage.style.color =
        type === "success"
            ? "#15803d"
            : "#dc2626";

    publishMessage.style.border =
        type === "success"
            ? "1px solid #bbebc8"
            : "1px solid #fecaca";
}


// ============================================================
// MASQUER MESSAGE
// ============================================================

function hideMessage() {

    if (!publishMessage) return;

    publishMessage.style.display = "none";
}


// ============================================================
// UTILISATEUR PREMIUM ?
/*
    Premium actif :
    plan = premium
    ET
    subscriptionStatus = active OU trial

    Si l'abonnement est expiré, on repasse automatiquement
    sur les limites Basic.
*/
// ============================================================

function isPremiumUser() {

    if (!currentUserData) {
        return false;
    }

    const plan =
        String(
            currentUserData.plan || ""
        ).toLowerCase().trim();

    const status =
        String(
            currentUserData.subscriptionStatus || ""
        ).toLowerCase().trim();


    // Essai Premium
    if (
        plan === "premium" &&
        status === "trial"
    ) {
        return true;
    }


    // Premium payé
    if (
        plan === "premium" &&
        status === "active"
    ) {

        // Vérifier éventuellement la date
        if (
            currentUserData.subscriptionEnd
        ) {

            const end =
                convertFirestoreDate(
                    currentUserData.subscriptionEnd
                );

            if (
                end &&
                end.getTime() < Date.now()
            ) {

                console.warn(
                    "Abonnement Premium expiré."
                );

                return false;
            }
        }

        return true;
    }


    return false;
}


// ============================================================
// CONVERSION DATE FIRESTORE
// ============================================================

function convertFirestoreDate(value) {

    if (!value) {
        return null;
    }


    // Timestamp Firestore
    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate();
    }


    // Date JavaScript
    if (
        value instanceof Date
    ) {

        return value;
    }


    // String / nombre
    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;
    }


    return date;
}


// ============================================================
// CHARGER LE PROFIL UTILISATEUR
// ============================================================

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }


    try {

        const usersQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "uid",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                usersQuery
            );


        if (
            !snapshot.empty
        ) {

            currentUserData =
                snapshot.docs[0].data();

        } else {

            /*
                Certains comptes peuvent avoir le UID
                uniquement dans l'ID du document.
            */

            const allUsers =
                await getDocs(
                    collection(
                        db,
                        "users"
                    )
                );


            let found = null;


            allUsers.forEach(
                docSnap => {

                    if (
                        docSnap.id ===
                        currentUser.uid
                    ) {

                        found =
                            docSnap.data();

                    }

                }
            );


            currentUserData =
                found || {
                    plan: "basic",
                    subscriptionStatus: "active"
                };
        }


        currentPlan =
            isPremiumUser()
                ? "premium"
                : "basic";


        currentSubscriptionStatus =
            currentUserData.subscriptionStatus ||
            "active";


        console.log(
            "Profil utilisateur :",
            currentUserData
        );


        console.log(
            "Plan actuel :",
            currentPlan
        );


    } catch (error) {

        console.error(
            "Erreur chargement profil utilisateur :",
            error
        );


        /*
            En cas d'erreur, on applique Basic
            par sécurité.
        */

        currentUserData = {
            plan: "basic",
            subscriptionStatus: "active"
        };

        currentPlan = "basic";
    }
}


// ============================================================
// NOMBRE MAXIMUM D'ANNONCES
// ============================================================

function getMaxAds() {

    return isPremiumUser()
        ? PREMIUM_MAX_ADS
        : BASIC_MAX_ADS;
}


// ============================================================
// NOMBRE MAXIMUM DE PHOTOS
// ============================================================

function getMaxImages() {

    return isPremiumUser()
        ? PREMIUM_MAX_IMAGES
        : BASIC_MAX_IMAGES;
}


// ============================================================
// COMPTER LES ANNONCES DE L'UTILISATEUR
// ============================================================

async function countUserAds() {

    if (!currentUser) {
        return 0;
    }


    try {

        const adsQuery =
            query(
                collection(
                    db,
                    "annonces"
                ),
                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                adsQuery
            );


        currentAdCount =
            snapshot.size;


        console.log(
            "Nombre d'annonces :",
            currentAdCount
        );


        return currentAdCount;


    } catch (error) {

        console.error(
            "Erreur comptage annonces :",
            error
        );


        /*
            On arrête la publication si le compteur
            ne peut pas être vérifié.
        */

        throw new Error(
            "Impossible de vérifier le nombre de vos annonces."
        );
    }
}


// ============================================================
// VÉRIFIER LA LIMITE D'ANNONCES
// ============================================================

async function checkAdLimit() {

    const maxAds =
        getMaxAds();


    const count =
        await countUserAds();


    if (
        count >= maxAds
    ) {

        if (
            isPremiumUser()
        ) {

            showMessage(
                `Vous avez atteint votre limite Premium de ${PREMIUM_MAX_ADS} annonces.`
            );

        } else {

            showMessage(
                `Vous avez atteint la limite Basic de ${BASIC_MAX_ADS} annonces. Passez à CAMU PREMIUM pour publier jusqu'à ${PREMIUM_MAX_ADS} annonces.`
            );

            showPremiumButton();
        }


        return false;
    }


    return true;
}


// ============================================================
// BOUTON PREMIUM
// ============================================================

function showPremiumButton() {

    if (!publishMessage) {
        return;
    }


    let button =
        document.getElementById(
            "goPremiumButton"
        );


    if (button) {
        return;
    }


    button =
        document.createElement(
            "a"
        );


    button.id =
        "goPremiumButton";


    button.href =
        "premium.html";


    button.innerHTML =
        `<i class="fa-solid fa-crown"></i> Passer à Premium`;


    button.style.display =
        "inline-flex";


    button.style.alignItems =
        "center";


    button.style.gap =
        "8px";


    button.style.marginTop =
        "12px";


    button.style.padding =
        "10px 15px";


    button.style.borderRadius =
        "10px";


    button.style.background =
        "#d4a017";


    button.style.color =
        "#ffffff";


    button.style.textDecoration =
        "none";


    button.style.fontWeight =
        "700";


    publishMessage.appendChild(
        document.createElement("br")
    );


    publishMessage.appendChild(
        button
    );
}


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showMessage(
                "Vous devez être connecté pour publier une annonce."
            );


            setTimeout(() => {

                window.location.href =
                    "connexion.html";

            }, 1500);


            return;
        }


        currentUser =
            user;


        console.log(
            "Utilisateur connecté :",
            currentUser.uid
        );


        try {

            // ------------------------------------------
            // PROFIL
            // ------------------------------------------

            await loadUserProfile();


            // ------------------------------------------
            // COMPTER LES ANNONCES
            // ------------------------------------------

            await countUserAds();


            // ------------------------------------------
            // CATÉGORIES
            // ------------------------------------------

            await loadCategories();


            // ------------------------------------------
            // VILLES
            // ------------------------------------------

            await loadCities();


            // ------------------------------------------
            // AFFICHAGE LIMITE PHOTOS
            // ------------------------------------------

            updatePhotoCount();


        } catch (error) {

            console.error(
                "Erreur initialisation publication :",
                error
            );


            showMessage(
                error.message ||
                "Impossible de préparer la publication."
            );

        }

    }
);


// ============================================================
// CATÉGORIES FIRESTORE
// ============================================================

async function loadCategories() {

    if (!categorySelect) return;


    try {

        categorySelect.innerHTML = `
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


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                if (
                    data.active !== true ||
                    !data.name
                ) {

                    return;
                }


                categories.push({

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

                    order:
                        Number(
                            data.order || 0
                        )

                });

            }
        );


        categories.sort(
            (a, b) =>
                a.order - b.order
        );


        categorySelect.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;


        categories.forEach(
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


                categorySelect.appendChild(
                    option
                );

            }
        );


        console.log(
            "Catégories chargées :",
            categories
        );


    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );


        categorySelect.innerHTML = `
            <option value="">
                Impossible de charger les catégories
            </option>
        `;
    }
}


// ============================================================
// VILLES FIRESTORE
// ============================================================

async function loadCities() {

    if (!citySelect) return;


    try {

        citySelect.innerHTML = `
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


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                if (
                    data.active !== true ||
                    !data.name
                ) {

                    return;
                }


                cities.push({

                    name:
                        String(
                            data.name
                        ).trim(),

                    province:
                        data.province
                            ? String(
                                data.province
                            ).trim()
                            : "",

                    order:
                        Number(
                            data.order || 0
                        )

                });

            }
        );


        cities.sort(
            (a, b) =>
                a.order - b.order
        );


        citySelect.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


        cities.forEach(
            (city) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city.name;


                option.textContent =
                    city.province
                        ? `${city.name} — ${city.province}`
                        : city.name;


                citySelect.appendChild(
                    option
                );

            }
        );


        console.log(
            "Villes chargées :",
            cities
        );


    } catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );


        citySelect.innerHTML = `
            <option value="">
                Impossible de charger les villes
            </option>
        `;
    }
}


// ============================================================
// SÉLECTION DES PHOTOS
// ============================================================

if (publishPhotos) {

    publishPhotos.addEventListener(
        "change",
        async (event) => {

            const files =
                Array.from(
                    event.target.files || []
                );


            if (!files.length) {
                return;
            }


            await processImages(
                files
            );


            // Permet de sélectionner
            // à nouveau la même photo

            publishPhotos.value = "";

        }
    );

}


// ============================================================
// TRAITEMENT DES PHOTOS
// ============================================================

async function processImages(files) {

    if (!currentUser) {

        showMessage(
            "Vous devez être connecté."
        );

        return;
    }


    const maxImages =
        getMaxImages();


    const remaining =
        maxImages -
        selectedImages.length;


    // --------------------------------------------------------
    // LIMITE
    // --------------------------------------------------------

    if (
        remaining <= 0
    ) {

        if (
            isPremiumUser()
        ) {

            showMessage(
                `Vous avez atteint la limite Premium de ${PREMIUM_MAX_IMAGES} photos par annonce.`
            );

        } else {

            showMessage(
                `La formule Basic autorise ${BASIC_MAX_IMAGES} photos maximum par annonce. Passez à Premium pour utiliser jusqu'à ${PREMIUM_MAX_IMAGES} photos.`
            );

            showPremiumButton();
        }


        return;
    }


    const filesToProcess =
        files.slice(
            0,
            remaining
        );


    if (
        files.length >
        remaining
    ) {

        if (
            isPremiumUser()
        ) {

            showMessage(
                `Votre formule Premium autorise ${PREMIUM_MAX_IMAGES} photos maximum par annonce.`
            );

        } else {

            showMessage(
                `La formule Basic autorise ${BASIC_MAX_IMAGES} photos maximum par annonce. Passez à Premium pour utiliser jusqu'à ${PREMIUM_MAX_IMAGES} photos.`
            );

            showPremiumButton();
        }
    }


    // --------------------------------------------------------
    // UPLOAD DES IMAGES
    // --------------------------------------------------------

    for (
        const file
        of filesToProcess
    ) {

        // --------------------------------------------
        // TYPE
        // --------------------------------------------

        if (
            !file.type ||
            !file.type.startsWith(
                "image/"
            )
        ) {

            showMessage(
                `${file.name} n'est pas une image.`
            );

            continue;
        }


        // --------------------------------------------
        // TAILLE
        // --------------------------------------------

        if (
            file.size >
            MAX_FILE_SIZE
        ) {

            showMessage(
                `${file.name} dépasse la limite de 5 MB.`
            );

            continue;
        }


        // --------------------------------------------
        // APERÇU
        // --------------------------------------------

        const preview =
            addImagePreview(
                file
            );


        try {

            // ----------------------------------------
            // CLOUDINARY
            // ----------------------------------------

            const uploaded =
                await uploadToCloudinary(
                    file
                );


            if (!uploaded) {

                throw new Error(
                    "Cloudinary n'a pas retourné les informations de l'image."
                );
            }


            selectedImages.push(
                uploaded
            );


            // ----------------------------------------
            // PREVIEW ENVOYÉ
            // ----------------------------------------

            if (preview) {

                preview.dataset.uploaded =
                    "true";
            }


            updatePhotoCount();


            console.log(
                "Image uploadée :",
                uploaded
            );


        } catch (error) {

            console.error(
                "Erreur Cloudinary :",
                error
            );


            if (preview) {

                preview.remove();
            }


            showMessage(
                `Impossible d'envoyer ${file.name} : ${error.message}`
            );
        }

    }


    updatePhotoCount();
}


// ============================================================
// CLOUDINARY
// ============================================================

async function uploadToCloudinary(file) {

    console.log(
        "Début upload Cloudinary :",
        file.name
    );


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


    let response;


    try {

        response =
            await fetch(
                CLOUDINARY_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
                }
            );

    } catch (networkError) {

        console.error(
            "Erreur réseau Cloudinary :",
            networkError
        );


        throw new Error(
            "Connexion impossible à Cloudinary. Vérifiez votre connexion Internet."
        );
    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (jsonError) {

        console.error(
            "Réponse Cloudinary invalide :",
            jsonError
        );


        throw new Error(
            `Cloudinary a répondu avec le statut ${response.status}.`
        );
    }


    console.log(
        "Réponse Cloudinary :",
        data
    );


    if (
        !response.ok
    ) {

        throw new Error(
            data?.error?.message ||
            `Erreur Cloudinary ${response.status}`
        );
    }


    if (
        !data ||
        !data.secure_url
    ) {

        throw new Error(
            "Cloudinary n'a pas retourné l'URL de l'image."
        );
    }


    return {

        secure_url:
            data.secure_url,

        public_id:
            data.public_id || "",

        width:
            data.width || null,

        height:
            data.height || null

    };
}


// ============================================================
// APERÇU PHOTO
// ============================================================

function addImagePreview(file) {

    if (!photoPreview) {

        return null;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "photo-preview-item";


    wrapper.dataset.fileName =
        file.name;


    const img =
        document.createElement(
            "img"
        );


    img.alt =
        file.name;


    img.loading =
        "lazy";


    const objectURL =
        URL.createObjectURL(
            file
        );


    img.src =
        objectURL;


    img.onload =
        () => {

            URL.revokeObjectURL(
                objectURL
            );

        };


    wrapper.appendChild(
        img
    );


    photoPreview.appendChild(
        wrapper
    );


    return wrapper;
}


// ============================================================
// COMPTEUR PHOTOS
// ============================================================

function updatePhotoCount() {

    const help =
        document.querySelector(
            ".photo-help"
        );


    const maxImages =
        getMaxImages();


    if (help) {

        help.textContent =
            `${selectedImages.length}/${maxImages} image(s) sélectionnée(s)`;
    }
}


// ============================================================
// PUBLICATION FIRESTORE
// ============================================================

if (publishForm) {

    publishForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            hideMessage();


            if (!currentUser) {

                showMessage(
                    "Vous devez être connecté pour publier."
                );

                return;
            }


            // =================================================
            // VÉRIFICATION DU NOMBRE D'ANNONCES
            // =================================================

            let canPublish;


            try {

                canPublish =
                    await checkAdLimit();

            } catch (error) {

                console.error(
                    "Erreur vérification limite annonces :",
                    error
                );


                showMessage(
                    error.message
                );


                return;
            }


            if (!canPublish) {

                return;
            }


            // =================================================
            // CHAMPS
            // =================================================

            const title =
                document
                    .getElementById(
                        "publishTitle"
                    )
                    ?.value
                    .trim() || "";


            const price =
                document
                    .getElementById(
                        "publishPrice"
                    )
                    ?.value
                    .trim() || "";


            const currency =
                document
                    .getElementById(
                        "publishCurrency"
                    )
                    ?.value ||
                "USD";


            const category =
                categorySelect
                    ?.value
                    .trim() || "";


            const description =
                document
                    .getElementById(
                        "publishDescription"
                    )
                    ?.value
                    .trim() || "";


            const city =
                citySelect
                    ?.value
                    .trim() || "";


            const neighborhood =
                document
                    .getElementById(
                        "publishNeighborhood"
                    )
                    ?.value
                    .trim() || "";


            const whatsapp =
                document
                    .getElementById(
                        "publishWhatsapp"
                    )
                    ?.value
                    .trim() || "";


            const terms =
                document.getElementById(
                    "publishTerms"
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (!title) {

                showMessage(
                    "Veuillez entrer le titre de l'annonce."
                );

                return;
            }


            if (!price) {

                showMessage(
                    "Veuillez entrer le prix."
                );

                return;
            }


            if (
                Number(price) < 0
            ) {

                showMessage(
                    "Le prix ne peut pas être négatif."
                );

                return;
            }


            if (!category) {

                showMessage(
                    "Veuillez sélectionner une catégorie."
                );

                return;
            }


            if (!description) {

                showMessage(
                    "Veuillez entrer une description."
                );

                return;
            }


            if (!city) {

                showMessage(
                    "Veuillez sélectionner une ville."
                );

                return;
            }


            if (!whatsapp) {

                showMessage(
                    "Veuillez entrer votre numéro WhatsApp."
                );

                return;
            }


            if (
                terms &&
                !terms.checked
            ) {

                showMessage(
                    "Veuillez accepter les conditions."
                );

                return;
            }


            // =================================================
            // PHOTOS
            // =================================================

            const maxImages =
                getMaxImages();


            if (
                selectedImages.length === 0
            ) {

                showMessage(
                    "Veuillez ajouter au moins une photo."
                );

                return;
            }


            if (
                selectedImages.length >
                maxImages
            ) {

                showMessage(
                    `Votre formule autorise ${maxImages} photos maximum par annonce.`
                );

                return;
            }


            // =================================================
            // BOUTON
            // =================================================

            const button =
                document.getElementById(
                    "publishButton"
                );


            const originalText =
                button
                    ? button.innerHTML
                    : "";


            if (button) {

                button.disabled =
                    true;


                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Publication...
                `;
            }


            // =================================================
            // URLS CLOUDINARY
            // =================================================

            const imageURLs =
                selectedImages
                    .map(
                        image =>
                            image.secure_url
                    )
                    .filter(
                        url =>
                            typeof url === "string" &&
                            url.length > 0
                    );


            if (
                imageURLs.length === 0
            ) {

                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML =
                        originalText;
                }


                showMessage(
                    "Aucune image valide n'a été reçue par Cloudinary."
                );


                return;
            }


            // =================================================
            // DONNÉES ANNONCE
            // =================================================

            const annonce = {

                title,

                price:
                    Number(price),

                currency,

                category,

                description,

                city,

                neighborhood,

                whatsapp,


                // ------------------------------------------------
                // PHOTOS
                // ------------------------------------------------

                images:
                    imageURLs,

                imageURL:
                    imageURLs[0] || "",

                imageCount:
                    imageURLs.length,


                // ------------------------------------------------
                // PROPRIÉTAIRE
                // ------------------------------------------------

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


                // ------------------------------------------------
                // PLAN AU MOMENT DE LA PUBLICATION
                // ------------------------------------------------

                ownerPlan:
                    isPremiumUser()
                        ? "premium"
                        : "basic",


                // ------------------------------------------------
                // STATUT
                // ------------------------------------------------

                status:
                    "active",


                // ------------------------------------------------
                // DATES
                // ------------------------------------------------

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            // =================================================
            // FIRESTORE
            // =================================================

            try {

                console.log(
                    "Enregistrement de l'annonce :",
                    annonce
                );


                const docRef =
                    await addDoc(
                        collection(
                            db,
                            "annonces"
                        ),
                        annonce
                    );


                console.log(
                    "Annonce créée :",
                    docRef.id
                );


                // Mettre à jour le compteur local

                currentAdCount++;


                showMessage(
                    "Votre annonce a été publiée avec succès !",
                    "success"
                );


                // ------------------------------------------------
                // REDIRECTION
                // ------------------------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            `explorer.html?id=${encodeURIComponent(docRef.id)}`;

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Erreur Firestore :",
                    error
                );


                showMessage(
                    "L'image a été envoyée, mais l'annonce n'a pas pu être enregistrée : " +
                    error.message
                );


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML =
                        originalText;
                }

            }

        }
    );

}
