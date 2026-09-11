// ============================================================
// CAMU SERVICES
// PUBLICATION D'ANNONCE
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
    serverTimestamp
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
// CONFIGURATION
// ============================================================

const MAX_IMAGES = 8;

const MAX_FILE_SIZE = 5 * 1024 * 1024;


// ============================================================
// VARIABLES
// ============================================================

let currentUser = null;

let selectedImages = [];


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
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

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


    currentUser = user;


    console.log(
        "Utilisateur connecté :",
        currentUser.uid
    );


    // Charger les catégories

    await loadCategories();


    // Charger les villes

    await loadCities();

});


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


        snapshot.forEach((docSnap) => {

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
                    String(data.name).trim(),

                icon:
                    data.icon
                        ? String(data.icon).trim()
                        : "",

                order:
                    Number(data.order || 0)

            });

        });


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


        snapshot.forEach((docSnap) => {

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
                    String(data.name).trim(),

                province:
                    data.province
                        ? String(
                            data.province
                        ).trim()
                        : "",

                order:
                    Number(data.order || 0)

            });

        });


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


            await processImages(files);


            // Permet de sélectionner à nouveau
            // la même photo

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


    const remaining =
        MAX_IMAGES -
        selectedImages.length;


    if (remaining <= 0) {

        showMessage(
            `Vous avez déjà atteint la limite de ${MAX_IMAGES} photos.`
        );

        return;
    }


    const filesToProcess =
        files.slice(0, remaining);


    if (
        files.length >
        remaining
    ) {

        showMessage(
            `Seulement ${MAX_IMAGES} photos maximum sont autorisées.`
        );

    }


    for (const file of filesToProcess) {

        // --------------------------------------------
        // TYPE
        // --------------------------------------------

        if (
            !file.type ||
            !file.type.startsWith("image/")
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
            addImagePreview(file);


        try {

            // ----------------------------------------
            // UPLOAD CLOUDINARY
            // ----------------------------------------

            const uploaded =
                await uploadToCloudinary(file);


            if (!uploaded) {

                throw new Error(
                    "Cloudinary n'a pas retourné les informations de l'image."
                );

            }


            selectedImages.push(
                uploaded
            );


            // Marquer le preview comme envoyé

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


    if (!response.ok) {

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


    if (help) {

        help.textContent =
            `${selectedImages.length}/${MAX_IMAGES} image(s) sélectionnée(s)`;

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


            if (!currentUser) {

                showMessage(
                    "Vous devez être connecté pour publier."
                );

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
                    ?.value || "USD";


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


            if (
                selectedImages.length === 0
            ) {

                showMessage(
                    "Veuillez ajouter au moins une photo."
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


                // PHOTOS

                images:
                    imageURLs,

                imageURL:
                    imageURLs[0] || "",

                imageCount:
                    imageURLs.length,


                // PROPRIÉTAIRE

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


                // STATUT

                status:
                    "active",


                // DATES

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


                showMessage(
                    "Votre annonce a été publiée avec succès !",
                    "success"
                );


                // Petit délai avant redirection

                setTimeout(() => {

                    window.location.href =
                        `explorer.html?id=${encodeURIComponent(docRef.id)}`;

                }, 1000);


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
