// =====================================================
// CAMU SERVICES
// MODIFICATION D'ANNONCE — V1
// Firebase + Cloudinary
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION CLOUDINARY
// =========================================================

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// =========================================================
// VARIABLES
// =========================================================

let currentAnnonce = null;
let annonceId = null;
let existingImages = [];


// =========================================================
// ÉLÉMENTS
// =========================================================

const form =
    document.getElementById("editForm");

const saveButton =
    document.getElementById("saveButton");

const editMessage =
    document.getElementById("editMessage");

const existingPhotos =
    document.getElementById("existingPhotos");

const newPhotos =
    document.getElementById("newPhotos");

const newPhotosPreview =
    document.getElementById("newPhotosPreview");


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type = "error"
) {

    if (!editMessage) {
        return;
    }

    editMessage.textContent =
        message;

    editMessage.className =
        `edit-message ${type}`;

    editMessage.hidden =
        false;

    editMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function hideMessage() {

    if (!editMessage) {
        return;
    }

    editMessage.hidden =
        true;
}


// =========================================================
// ID DE L'ANNONCE
// =========================================================

const params =
    new URLSearchParams(
        window.location.search
    );

annonceId =
    params.get("id");


if (!annonceId) {

    showMessage(
        "Impossible de trouver cette annonce.",
        "error"
    );

    if (saveButton) {
        saveButton.disabled = true;
    }
}


// =========================================================
// CHARGER L'ANNONCE
// =========================================================

async function loadAnnonce(user) {

    if (!annonceId) {
        return;
    }

    try {

        // =================================================
        // COLLECTION ANNONCES
        // =================================================

        const annonceRef =
            doc(
                db,
                "annonces",
                annonceId
            );


        const annonceSnap =
            await getDoc(
                annonceRef
            );


        // =================================================
        // VÉRIFIER EXISTENCE
        // =================================================

        if (!annonceSnap.exists()) {

            showMessage(
                "Cette annonce n'existe plus.",
                "error"
            );

            if (saveButton) {
                saveButton.disabled = true;
            }

            return;
        }


        // =================================================
        // DONNÉES
        // =================================================

        const data =
            annonceSnap.data();

        currentAnnonce =
            data;


        // =================================================
        // VÉRIFICATION PROPRIÉTAIRE
        // =================================================

        if (
            data.ownerId !==
            user.uid
        ) {

            showMessage(
                "Vous n'êtes pas autorisé à modifier cette annonce.",
                "error"
            );

            if (saveButton) {
                saveButton.disabled = true;
            }

            return;
        }


        // =================================================
        // PHOTOS EXISTANTES
        // =================================================

        existingImages =
            Array.isArray(data.images)
                ? [...data.images]
                : [];


        if (
            existingImages.length === 0 &&
            data.imageURL
        ) {

            existingImages =
                [data.imageURL];
        }


        // =================================================
        // REMPLIR LE FORMULAIRE
        // =================================================

        const titleInput =
            document.getElementById("title");

        const priceInput =
            document.getElementById("price");

        const currencyInput =
            document.getElementById("currency");

        const categoryInput =
            document.getElementById("category");

        const descriptionInput =
            document.getElementById("description");

        const cityInput =
            document.getElementById("city");

        const neighborhoodInput =
            document.getElementById("neighborhood");

        const whatsappInput =
            document.getElementById("whatsapp");


        if (titleInput) {

            titleInput.value =
                data.title || "";
        }


        if (priceInput) {

            priceInput.value =
                data.price ?? "";
        }


        if (currencyInput) {

            currencyInput.value =
                data.currency || "USD";
        }


        if (categoryInput) {

            categoryInput.value =
                data.category || "";
        }


        if (descriptionInput) {

            descriptionInput.value =
                data.description || "";
        }


        if (cityInput) {

            cityInput.value =
                data.city || "";
        }


        if (neighborhoodInput) {

            neighborhoodInput.value =
                data.neighborhood || "";
        }


        if (whatsappInput) {

            whatsappInput.value =
                data.whatsapp || "";
        }


        // =================================================
        // AFFICHER LES PHOTOS
        // =================================================

        renderExistingPhotos();


        console.log(
            "CAMU SERVICES : annonce chargée :",
            annonceId
        );

    } catch (error) {

        console.error(
            "Erreur chargement annonce :",
            error
        );

        showMessage(
            "Impossible de charger l'annonce.",
            "error"
        );

        if (saveButton) {
            saveButton.disabled = true;
        }
    }
}


// =========================================================
// AFFICHER PHOTOS EXISTANTES
// =========================================================

function renderExistingPhotos() {

    if (!existingPhotos) {
        return;
    }

    existingPhotos.innerHTML =
        "";


    if (
        existingImages.length === 0
    ) {

        existingPhotos.innerHTML = `
            <p style="color:#777;">
                Aucune photo.
            </p>
        `;

        return;
    }


    existingImages.forEach(
        (url, index) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "photo-item";


            item.innerHTML = `
                <img
                    src="${escapeHTML(url)}"
                    alt="Photo ${index + 1}"
                >

                <span class="photo-number">
                    Photo ${index + 1}
                </span>
            `;


            existingPhotos.appendChild(
                item
            );

        }
    );
}


// =========================================================
// PRÉVISUALISATION NOUVELLES PHOTOS
// =========================================================

if (newPhotos) {

    newPhotos.addEventListener(
        "change",
        () => {

            if (newPhotosPreview) {

                newPhotosPreview.innerHTML =
                    "";
            }


            const files =
                Array.from(
                    newPhotos.files || []
                );


            if (
                files.length === 0
            ) {
                return;
            }


            // =================================================
            // MAXIMUM 8 PHOTOS
            // =================================================

            const totalPhotos =
                existingImages.length +
                files.length;


            if (
                totalPhotos > 8
            ) {

                showMessage(
                    "Vous pouvez avoir maximum 8 photos au total.",
                    "error"
                );

                newPhotos.value =
                    "";

                return;
            }


            // =================================================
            // VÉRIFICATION DES FICHIERS
            // =================================================

            for (const file of files) {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    showMessage(
                        "Tous les fichiers doivent être des images.",
                        "error"
                    );

                    newPhotos.value =
                        "";

                    return;
                }


                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    showMessage(
                        "Chaque photo doit faire maximum 5 Mo.",
                        "error"
                    );

                    newPhotos.value =
                        "";

                    return;
                }


                // =================================================
                // APERÇU
                // =================================================

                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        if (!newPhotosPreview) {
                            return;
                        }


                        const item =
                            document.createElement(
                                "div"
                            );

                        item.className =
                            "photo-item";


                        item.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Nouvelle photo"
                            >
                        `;


                        newPhotosPreview.appendChild(
                            item
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }

        }
    );

}


// =========================================================
// UPLOAD CLOUDINARY
// =========================================================

async function uploadToCloudinary(
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
        "camu-services/annonces"
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
            "Erreur pendant l'envoi de la photo."
        );
    }


    const result =
        await response.json();


    if (
        !result.secure_url
    ) {

        throw new Error(
            "Cloudinary n'a pas retourné l'image."
        );
    }


    return result.secure_url;
}


// =========================================================
// ENREGISTRER LES MODIFICATIONS
// =========================================================

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();


            // =================================================
            // UTILISATEUR
            // =================================================

            const user =
                auth.currentUser;


            if (!user) {

                showMessage(
                    "Vous devez être connecté.",
                    "error"
                );

                return;
            }


            // =================================================
            // ANNONCE
            // =================================================

            if (!currentAnnonce) {

                showMessage(
                    "Annonce introuvable.",
                    "error"
                );

                return;
            }


            // =================================================
            // SÉCURITÉ
            // =================================================

            if (
                currentAnnonce.ownerId !==
                user.uid
            ) {

                showMessage(
                    "Vous n'êtes pas autorisé à modifier cette annonce.",
                    "error"
                );

                return;
            }


            // =================================================
            // RÉCUPÉRATION DES VALEURS
            // =================================================

            const title =
                document
                    .getElementById("title")
                    ?.value
                    .trim();


            const price =
                Number(
                    document
                        .getElementById("price")
                        ?.value
                );


            const currency =
                document
                    .getElementById("currency")
                    ?.value;


            const category =
                document
                    .getElementById("category")
                    ?.value;


            const description =
                document
                    .getElementById("description")
                    ?.value
                    .trim();


            const city =
                document
                    .getElementById("city")
                    ?.value;


            const neighborhood =
                document
                    .getElementById("neighborhood")
                    ?.value
                    .trim();


            const whatsapp =
                document
                    .getElementById("whatsapp")
                    ?.value
                    .trim();


            // =================================================
            // VALIDATION
            // =================================================

            if (!title) {

                showMessage(
                    "Veuillez saisir le titre.",
                    "error"
                );

                return;
            }


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showMessage(
                    "Veuillez saisir un prix valide.",
                    "error"
                );

                return;
            }


            if (!category) {

                showMessage(
                    "Veuillez sélectionner une catégorie.",
                    "error"
                );

                return;
            }


            if (!description) {

                showMessage(
                    "Veuillez saisir une description.",
                    "error"
                );

                return;
            }


            if (!city) {

                showMessage(
                    "Veuillez sélectionner une ville.",
                    "error"
                );

                return;
            }


            if (!whatsapp) {

                showMessage(
                    "Veuillez saisir votre numéro WhatsApp.",
                    "error"
                );

                return;
            }


            // =================================================
            // BOUTON
            // =================================================

            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Enregistrement...
                `;
            }


            try {

                // =================================================
                // PHOTOS
                // =================================================

                let finalImages =
                    [...existingImages];


                const files =
                    Array.from(
                        newPhotos?.files || []
                    );


                if (
                    finalImages.length +
                    files.length >
                    8
                ) {

                    throw new Error(
                        "Maximum 8 photos autorisées."
                    );
                }


                // =================================================
                // ENVOYER NOUVELLES PHOTOS
                // =================================================

                for (
                    const file of files
                ) {

                    const imageURL =
                        await uploadToCloudinary(
                            file
                        );


                    finalImages.push(
                        imageURL
                    );

                }


                // =================================================
                // FIRESTORE — COLLECTION ANNONCES
                // =================================================

                const annonceRef =
                    doc(
                        db,
                        "annonces",
                        annonceId
                    );


                await updateDoc(
                    annonceRef,
                    {

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

                        images:
                            finalImages,

                        imageURL:
                            finalImages[0] ||
                            "",

                        updatedAt:
                            new Date()

                    }
                );


                // =================================================
                // SUCCÈS
                // =================================================

                showMessage(
                    "Votre annonce a été modifiée avec succès.",
                    "success"
                );


                if (saveButton) {

                    saveButton.innerHTML = `
                        <i class="fa-solid fa-check"></i>
                        Modifications enregistrées
                    `;
                }


                console.log(
                    "CAMU SERVICES : annonce modifiée :",
                    annonceId
                );


                // =================================================
                // REDIRECTION
                // =================================================

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Erreur modification annonce :",
                    error
                );


                showMessage(
                    error.message ||
                    "Une erreur est survenue.",
                    "error"
                );


                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.innerHTML = `
                        <i class="fa-solid fa-check"></i>
                        Enregistrer les modifications
                    `;
                }

            }

        }
    );

}


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;
        }


        console.log(
            "CAMU SERVICES : utilisateur connecté :",
            user.email
        );


        if (annonceId) {

            await loadAnnonce(
                user
            );

        }

    }
);


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


// =========================================================
// FIN
// =========================================================

console.log(
    "CAMU SERVICES : modifier.js chargé correctement."
);
