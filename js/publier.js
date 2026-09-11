// ============================================================
// CAMU SERVICES
// PUBLICATION D'ANNONCE
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
// VARIABLES
// ============================================================

let currentUser = null;

let selectedImages = [];

const MAX_IMAGES = 8;

const MAX_FILE_SIZE = 5 * 1024 * 1024;


// ============================================================
// ELEMENTS
// ============================================================

const publishForm =
    document.getElementById("publishForm");

const cameraButton =
    document.getElementById("cameraButton");

const galleryButton =
    document.getElementById("galleryButton");

const cameraInput =
    document.getElementById("cameraInput");

const galleryInput =
    document.getElementById("galleryInput");

const photoPreview =
    document.getElementById("photoPreview");

const categorySelect =
    document.getElementById("publishCategory");

const citySelect =
    document.getElementById("publishCity");


// ============================================================
// AUTHENTIFICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

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
        user.uid
    );

    await loadCategories();

    await loadCities();

});


// ============================================================
// CATEGORIES
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
                collection(db, "categories")
            );

        categorySelect.innerHTML = `
            <option value="">
                Sélectionner une catégorie
            </option>
        `;

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
                name: data.name.trim(),
                icon: data.icon || "",
                order:
                    Number(data.order || 0)
            });

        });


        categories.sort(
            (a, b) =>
                a.order - b.order
        );


        categories.forEach(
            (category) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    category.name;

                option.textContent =
                    category.name;

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
            "Erreur catégories :",
            error
        );

        categorySelect.innerHTML = `
            <option value="">
                Erreur de chargement
            </option>
        `;

    }

}


// ============================================================
// VILLES
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
                collection(db, "villes")
            );


        citySelect.innerHTML = `
            <option value="">
                Sélectionner une ville
            </option>
        `;


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
                        data.name.trim(),

                    province:
                        data.province
                        ? data.province.trim()
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
            "Erreur villes :",
            error
        );


        citySelect.innerHTML = `
            <option value="">
                Erreur de chargement
            </option>
        `;

    }

}


// ============================================================
// BOUTON CAMÉRA
// ============================================================

if (cameraButton) {

    cameraButton.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                alert(
                    "Veuillez vous connecter."
                );

                return;
            }

            cameraInput.click();

        }
    );

}


// ============================================================
// BOUTON GALERIE
// ============================================================

if (galleryButton) {

    galleryButton.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                alert(
                    "Veuillez vous connecter."
                );

                return;
            }

            galleryInput.click();

        }
    );

}


// ============================================================
// PHOTO PRISE AVEC CAMERA
// ============================================================

if (cameraInput) {

    cameraInput.addEventListener(
        "change",
        async (event) => {

            const files =
                Array.from(
                    event.target.files || []
                );

            await processImages(files);

            cameraInput.value = "";

        }
    );

}


// ============================================================
// PHOTOS DE LA GALERIE
// ============================================================

if (galleryInput) {

    galleryInput.addEventListener(
        "change",
        async (event) => {

            const files =
                Array.from(
                    event.target.files || []
                );

            await processImages(files);

            galleryInput.value = "";

        }
    );

}


// ============================================================
// TRAITER LES IMAGES
// ============================================================

async function processImages(files) {

    if (!files.length) {
        return;
    }


    if (
        selectedImages.length +
        files.length >
        MAX_IMAGES
    ) {

        alert(
            `Vous pouvez avoir maximum ${MAX_IMAGES} images.`
        );

        return;
    }


    for (const file of files) {

        // Vérifier type
        if (!file.type.startsWith("image/")) {

            alert(
                `${file.name} n'est pas une image.`
            );

            continue;
        }


        // Vérifier taille
        if (file.size > MAX_FILE_SIZE) {

            alert(
                `${file.name} dépasse 5 MB.`
            );

            continue;
        }


        // Aperçu immédiatement
        addImagePreview(
            file
        );


        // Upload
        try {

            const uploaded =
                await uploadToCloudinary(
                    file
                );


            if (uploaded) {

                selectedImages.push(
                    uploaded
                );

                updatePhotoCount();

            }


        } catch (error) {

            console.error(
                "Erreur upload :",
                error
            );

            // Retirer le dernier aperçu
            removeLastPreview();


            alert(
                `Impossible d'envoyer ${file.name}.`
            );

        }

    }

}


// ============================================================
// UPLOAD CLOUDINARY
// ============================================================

async function uploadToCloudinary(file) {

    console.log(
        "Upload :",
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


    const response =
        await fetch(
            CLOUDINARY_UPLOAD_URL,
            {
                method: "POST",
                body: formData
            }
        );


    // Lire la réponse
    const data =
        await response.json();


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


    if (!data.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné d'URL."
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
// APERCU
// ============================================================

function addImagePreview(file) {

    if (!photoPreview) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        (event) => {

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


            img.src =
                event.target.result;


            img.alt =
                file.name;


            wrapper.appendChild(
                img
            );


            photoPreview.appendChild(
                wrapper
            );

        };


    reader.readAsDataURL(
        file
    );

}


// ============================================================
// SUPPRIMER DERNIER APERCU
// ============================================================

function removeLastPreview() {

    if (!photoPreview) {
        return;
    }


    const items =
        photoPreview.querySelectorAll(
            ".photo-preview-item"
        );


    if (items.length) {

        items[
            items.length - 1
        ].remove();

    }

}


// ============================================================
// COMPTEUR
// ============================================================

function updatePhotoCount() {

    const help =
        document.querySelector(
            ".photo-help"
        );


    if (!help) return;


    help.textContent =
        `${selectedImages.length}/8 image(s) sélectionnée(s)`;

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

                alert(
                    "Vous devez être connecté."
                );

                return;
            }


            // ------------------------------------------------
            // CHAMPS
            // ------------------------------------------------

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
                document
                    .getElementById(
                        "publishTerms"
                    );


            // ------------------------------------------------
            // VALIDATIONS
            // ------------------------------------------------

            if (!title) {

                alert(
                    "Veuillez entrer le titre."
                );

                return;
            }


            if (!price) {

                alert(
                    "Veuillez entrer le prix."
                );

                return;
            }


            if (!category) {

                alert(
                    "Veuillez sélectionner une catégorie."
                );

                return;
            }


            if (!description) {

                alert(
                    "Veuillez entrer une description."
                );

                return;
            }


            if (!city) {

                alert(
                    "Veuillez sélectionner une ville."
                );

                return;
            }


            if (!whatsapp) {

                alert(
                    "Veuillez entrer votre numéro WhatsApp."
                );

                return;
            }


            if (
                terms &&
                !terms.checked
            ) {

                alert(
                    "Veuillez accepter les conditions."
                );

                return;
            }


            if (
                selectedImages.length === 0
            ) {

                alert(
                    "Veuillez ajouter au moins une image."
                );

                return;
            }


            // ------------------------------------------------
            // BOUTON
            // ------------------------------------------------

            const button =
                publishForm.querySelector(
                    'button[type="submit"]'
                );


            const oldText =
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


            // ------------------------------------------------
            // DONNÉES
            // ------------------------------------------------

            try {

                const imageURLs =
                    selectedImages.map(
                        image =>
                            image.secure_url
                    );


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


                    images:
                        imageURLs,

                    imageURL:
                        imageURLs[0] || "",

                    imageCount:
                        imageURLs.length,


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


                    status:
                        "active",


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
                        annonce
                    );


                console.log(
                    "Annonce créée :",
                    docRef.id
                );


                alert(
                    "✅ Votre annonce a été publiée avec succès !"
                );


                window.location.href =
                    "compte.html";


            } catch (error) {

                console.error(
                    "Erreur publication :",
                    error
                );


                alert(
                    "Erreur lors de la publication : " +
                    error.message
                );


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML =
                        oldText;

                }

            }

        }
    );

}
