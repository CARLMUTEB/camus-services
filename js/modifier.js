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

let currentService = null;
let serviceId = null;
let existingImages = [];


// =========================================================
// ÉLÉMENTS
// =========================================================

const form = document.getElementById("editForm");
const saveButton = document.getElementById("saveButton");
const editMessage = document.getElementById("editMessage");

const existingPhotos = document.getElementById("existingPhotos");
const newPhotos = document.getElementById("newPhotos");
const newPhotosPreview = document.getElementById("newPhotosPreview");


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message, type = "error") {

    if (!editMessage) return;

    editMessage.textContent = message;
    editMessage.className = `edit-message ${type}`;
    editMessage.hidden = false;

    editMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function hideMessage() {

    if (!editMessage) return;

    editMessage.hidden = true;
}


// =========================================================
// ID DE L'ANNONCE
// =========================================================

const params = new URLSearchParams(window.location.search);

serviceId = params.get("id");


if (!serviceId) {

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

async function loadService(user) {

    try {

        const serviceRef = doc(
            db,
            "services",
            serviceId
        );

        const serviceSnap = await getDoc(serviceRef);


        if (!serviceSnap.exists()) {

            showMessage(
                "Cette annonce n'existe plus.",
                "error"
            );

            saveButton.disabled = true;

            return;
        }


        const data = serviceSnap.data();

        currentService = data;


        // -------------------------------------------------
        // SÉCURITÉ
        // -------------------------------------------------

        if (data.ownerId !== user.uid) {

            showMessage(
                "Vous n'êtes pas autorisé à modifier cette annonce.",
                "error"
            );

            saveButton.disabled = true;

            return;
        }


        // -------------------------------------------------
        // PHOTOS
        // -------------------------------------------------

        existingImages = Array.isArray(data.images)
            ? [...data.images]
            : [];

        if (
            existingImages.length === 0 &&
            data.imageURL
        ) {
            existingImages = [data.imageURL];
        }


        // -------------------------------------------------
        // FORMULAIRE
        // -------------------------------------------------

        document.getElementById("title").value =
            data.title || "";

        document.getElementById("price").value =
            data.price ?? "";

        document.getElementById("currency").value =
            data.currency || "USD";

        document.getElementById("category").value =
            data.category || "";

        document.getElementById("description").value =
            data.description || "";

        document.getElementById("city").value =
            data.city || "";

        document.getElementById("neighborhood").value =
            data.neighborhood || "";

        document.getElementById("whatsapp").value =
            data.whatsapp || "";


        renderExistingPhotos();

    } catch (error) {

        console.error(
            "Erreur chargement annonce :",
            error
        );

        showMessage(
            "Impossible de charger l'annonce.",
            "error"
        );

        saveButton.disabled = true;
    }
}


// =========================================================
// AFFICHER PHOTOS EXISTANTES
// =========================================================

function renderExistingPhotos() {

    if (!existingPhotos) return;

    existingPhotos.innerHTML = "";


    if (existingImages.length === 0) {

        existingPhotos.innerHTML = `
            <p style="color:#777;">
                Aucune photo.
            </p>
        `;

        return;
    }


    existingImages.forEach((url, index) => {

        const item = document.createElement("div");

        item.className = "photo-item";

        item.innerHTML = `
            <img
                src="${escapeHTML(url)}"
                alt="Photo ${index + 1}"
            >

            <span class="photo-number">
                Photo ${index + 1}
            </span>
        `;

        existingPhotos.appendChild(item);

    });
}


// =========================================================
// PRÉVISUALISATION NOUVELLES PHOTOS
// =========================================================

if (newPhotos) {

    newPhotos.addEventListener(
        "change",
        () => {

            newPhotosPreview.innerHTML = "";

            const files = Array.from(
                newPhotos.files || []
            );


            if (files.length === 0) {
                return;
            }


            const totalPhotos =
                existingImages.length + files.length;


            if (totalPhotos > 8) {

                showMessage(
                    "Vous pouvez avoir maximum 8 photos au total.",
                    "error"
                );

                newPhotos.value = "";

                return;
            }


            for (const file of files) {

                if (!file.type.startsWith("image/")) {

                    showMessage(
                        "Tous les fichiers doivent être des images.",
                        "error"
                    );

                    newPhotos.value = "";

                    return;
                }


                if (file.size > 5 * 1024 * 1024) {

                    showMessage(
                        "Chaque photo doit faire maximum 5 Mo.",
                        "error"
                    );

                    newPhotos.value = "";

                    return;
                }


                const reader = new FileReader();


                reader.onload = event => {

                    const item =
                        document.createElement("div");

                    item.className = "photo-item";

                    item.innerHTML = `
                        <img
                            src="${event.target.result}"
                            alt="Nouvelle photo"
                        >
                    `;

                    newPhotosPreview.appendChild(item);

                };


                reader.readAsDataURL(file);

            }

        }
    );

}


// =========================================================
// UPLOAD CLOUDINARY
// =========================================================

async function uploadToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    formData.append(
        "folder",
        "camu-services/annonces"
    );


    const response = await fetch(
        CLOUDINARY_UPLOAD_URL,
        {
            method: "POST",
            body: formData
        }
    );


    if (!response.ok) {

        throw new Error(
            "Erreur pendant l'envoi de la photo."
        );
    }


    const result = await response.json();


    if (!result.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné l'image."
        );
    }


    return result.secure_url;
}


// =========================================================
// ENREGISTRER
// =========================================================

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();


            const user = auth.currentUser;


            if (!user) {

                showMessage(
                    "Vous devez être connecté.",
                    "error"
                );

                return;
            }


            if (!currentService) {

                showMessage(
                    "Annonce introuvable.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // SÉCURITÉ
            // ------------------------------------------------

            if (
                currentService.ownerId !== user.uid
            ) {

                showMessage(
                    "Vous n'êtes pas autorisé à modifier cette annonce.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // VALEURS
            // ------------------------------------------------

            const title =
                document.getElementById("title").value.trim();

            const price =
                Number(
                    document.getElementById("price").value
                );

            const currency =
                document.getElementById("currency").value;

            const category =
                document.getElementById("category").value;

            const description =
                document.getElementById("description")
                    .value.trim();

            const city =
                document.getElementById("city").value;

            const neighborhood =
                document.getElementById("neighborhood")
                    .value.trim();

            const whatsapp =
                document.getElementById("whatsapp")
                    .value.trim();


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (!title) {

                showMessage(
                    "Veuillez saisir le titre.",
                    "error"
                );

                return;
            }


            if (!price || price < 0) {

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


            // ------------------------------------------------
            // BOUTON
            // ------------------------------------------------

            saveButton.disabled = true;

            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enregistrement...
            `;


            try {

                // --------------------------------------------
                // PHOTOS
                // --------------------------------------------

                let finalImages = [...existingImages];


                const files = Array.from(
                    newPhotos?.files || []
                );


                if (
                    finalImages.length + files.length > 8
                ) {

                    throw new Error(
                        "Maximum 8 photos autorisées."
                    );
                }


                for (const file of files) {

                    const imageURL =
                        await uploadToCloudinary(file);

                    finalImages.push(imageURL);

                }


                // --------------------------------------------
                // FIRESTORE
                // --------------------------------------------

                const serviceRef =
                    doc(
                        db,
                        "services",
                        serviceId
                    );


                await updateDoc(
                    serviceRef,
                    {
                        title,
                        price,
                        currency,
                        category,
                        description,
                        city,
                        neighborhood,
                        whatsapp,
                        images: finalImages,
                        imageURL: finalImages[0] || "",
                        updatedAt: new Date()
                    }
                );


                // --------------------------------------------
                // SUCCÈS
                // --------------------------------------------

                showMessage(
                    "Votre annonce a été modifiée avec succès.",
                    "success"
                );


                saveButton.innerHTML = `
                    <i class="fa-solid fa-check"></i>
                    Modifications enregistrées
                `;


                setTimeout(
                    () => {
                        window.location.href =
                            "compte.html";
                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Erreur modification :",
                    error
                );


                showMessage(
                    error.message ||
                    "Une erreur est survenue.",
                    "error"
                );


                saveButton.disabled = false;

                saveButton.innerHTML = `
                    <i class="fa-solid fa-check"></i>
                    Enregistrer les modifications
                `;

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


        if (serviceId) {

            await loadService(user);

        }

    }
);


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// FIN
// =========================================================

console.log(
    "CAMU SERVICES : modifier.js chargé correctement."
);
