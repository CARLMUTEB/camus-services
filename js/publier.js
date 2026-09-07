import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CLOUDINARY
========================================================= */

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   ÉLÉMENTS
========================================================= */

const publishForm = document.getElementById("publishForm");
const publishButton = document.getElementById("publishButton");
const publishMessage = document.getElementById("publishMessage");

const publishPhotos = document.getElementById("publishPhotos");
const photoPreview = document.getElementById("photoPreview");


/* =========================================================
   UTILISATEUR CONNECTÉ
========================================================= */

let currentUser = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "info") {

    if (!publishMessage) return;

    publishMessage.textContent = message;

    publishMessage.className = "auth-message";

    if (type === "success") {
        publishMessage.classList.add("success");
    }

    if (type === "error") {
        publishMessage.classList.add("error");
    }

    publishMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   VÉRIFICATION DE CONNEXION
========================================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        currentUser = null;

        showMessage(
            "Vous devez être connecté pour publier une annonce.",
            "error"
        );

        setTimeout(() => {
            window.location.href = "connexion.html";
        }, 1500);

        return;
    }

    currentUser = user;

    console.log(
        "Utilisateur autorisé à publier :",
        user.email
    );
});


/* =========================================================
   APERÇU DES PHOTOS
========================================================= */

if (publishPhotos) {

    publishPhotos.addEventListener("change", () => {

        if (!photoPreview) return;

        photoPreview.innerHTML = "";

        const files = Array.from(publishPhotos.files);

        if (files.length === 0) {
            return;
        }

        files.forEach((file) => {

            if (!file.type.startsWith("image/")) {
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {

                const preview = document.createElement("div");

                preview.className = "photo-preview-item";

                preview.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="Aperçu de la photo"
                    >
                `;

                photoPreview.appendChild(preview);
            };

            reader.readAsDataURL(file);

        });

    });

}


/* =========================================================
   UPLOAD CLOUDINARY
========================================================= */

async function uploadToCloudinary(file, serviceId, index) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    /*
       Organisation des photos dans Cloudinary :
       camu-services/services/UID/SERVICE_ID
    */
    formData.append(
        "folder",
        `camu-services/services/${currentUser.uid}/${serviceId}`
    );

    /*
       Nom du fichier
    */
    formData.append(
        "context",
        `service_id=${serviceId}|owner_id=${currentUser.uid}|photo_index=${index + 1}`
    );

    const response = await fetch(
        CLOUDINARY_UPLOAD_URL,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok) {

        console.error(
            "Erreur Cloudinary :",
            data
        );

        throw new Error(
            data.error?.message ||
            "Cloudinary a refusé l'envoi de la photo."
        );
    }

    return data.secure_url;
}


/* =========================================================
   PUBLICATION
========================================================= */

if (publishForm) {

    publishForm.addEventListener("submit", async (event) => {
        console.log("SUBMIT DÉCLENCHÉ");

        event.preventDefault();


        /* -----------------------------------------
           Vérification utilisateur
        ----------------------------------------- */

        if (!currentUser) {

            showMessage(
                "Vous devez être connecté pour publier une annonce.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           Récupération des champs
        ----------------------------------------- */

        const title =
            document.getElementById("publishTitle").value.trim();

        const price =
            document.getElementById("publishPrice").value.trim();

        const currency =
            document.getElementById("publishCurrency").value;

        const category =
            document.getElementById("publishCategory").value;

        const description =
            document.getElementById("publishDescription").value.trim();

        const city =
            document.getElementById("publishCity").value;

        const neighborhood =
            document.getElementById("publishNeighborhood").value.trim();

        const whatsapp =
            document.getElementById("publishWhatsapp").value.trim();

        const terms =
            document.getElementById("publishTerms").checked;

        const files =
            publishPhotos
                ? Array.from(publishPhotos.files)
                : [];


        /* -----------------------------------------
           Validation
        ----------------------------------------- */

        if (!title) {
            showMessage(
                "Veuillez saisir le titre de l'annonce.",
                "error"
            );
            return;
        }

        if (!price || Number(price) < 0) {
            showMessage(
                "Veuillez saisir un prix valide.",
                "error"
            );
            return;
        }

        if (!category) {
            showMessage(
                "Veuillez choisir une catégorie.",
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
                "Veuillez choisir une ville.",
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

        if (!terms) {
            showMessage(
                "Vous devez accepter les conditions d'utilisation.",
                "error"
            );
            return;
        }


        /* -----------------------------------------
           Limite des photos
        ----------------------------------------- */

        if (files.length > 8) {

            showMessage(
                "Vous pouvez ajouter au maximum 8 photos.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           Vérification des fichiers
        ----------------------------------------- */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        for (const file of files) {

            if (!allowedTypes.includes(file.type)) {

                showMessage(
                    "Format de photo non autorisé. Utilisez JPG, PNG ou WEBP.",
                    "error"
                );

                return;
            }


            /* Maximum 5 MB par photo */

            if (file.size > 5 * 1024 * 1024) {

                showMessage(
                    "Chaque photo doit faire moins de 5 MB.",
                    "error"
                );

                return;
            }
        }


        /* -----------------------------------------
           Désactiver le bouton
        ----------------------------------------- */

        publishButton.disabled = true;

        publishButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Publication...
        `;

        showMessage(
            "Publication de votre annonce en cours...",
            "info"
        );


        try {

            /* =====================================
               1. CRÉER L'ANNONCE DANS FIRESTORE
            ===================================== */

            const serviceRef = await addDoc(
                collection(db, "services"),
                {
                    title: title,

                    description: description,

                    price: Number(price),

                    currency: currency,

                    category: category,

                    city: city,

                    neighborhood: neighborhood,

                    whatsapp: whatsapp,

                    userId: currentUser.uid,

                    ownerId: currentUser.uid,

                    ownerName:
                        currentUser.displayName || "Utilisateur",

                    ownerEmail:
                        currentUser.email || "",

                    images: [],

                    imageURL: "",

                    status: "active",

                    createdAt: serverTimestamp(),

                    updatedAt: serverTimestamp()
                }
            );


            console.log(
                "Annonce créée :",
                serviceRef.id
            );


            /* =====================================
               2. UPLOAD DES PHOTOS → CLOUDINARY
            ===================================== */

            const imageUrls = [];


            for (let i = 0; i < files.length; i++) {

                const file = files[i];

                showMessage(
                    `Téléchargement des photos : ${i + 1}/${files.length}`,
                    "info"
                );


                const imageUrl =
                    await uploadToCloudinary(
                        file,
                        serviceRef.id,
                        i
                    );


                imageUrls.push(imageUrl);


                console.log(
                    `Photo ${i + 1} envoyée sur Cloudinary :`,
                    imageUrl
                );
            }


            /* =====================================
               3. METTRE À JOUR L'ANNONCE
            ===================================== */

            await updateDoc(
                doc(db, "services", serviceRef.id),
                {
                    images: imageUrls,

                    imageURL:
                        imageUrls[0] || "",

                    updatedAt:
                        serverTimestamp()
                }
            );


            /* =====================================
               4. SUCCÈS
            ===================================== */

            showMessage(
                "Votre annonce a été publiée avec succès !",
                "success"
            );


            publishButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Annonce publiée
            `;


            /* =====================================
               5. REDIRECTION
            ===================================== */

            setTimeout(() => {

                window.location.href = "compte.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Erreur lors de la publication :",
                error
            );


            let message =
                "Une erreur est survenue lors de la publication.";


            /* Erreur Firestore */

            if (error.code === "permission-denied") {

                message =
                    "Vous n'avez pas l'autorisation de publier cette annonce. Vérifiez les règles Firebase.";
            }


            /* Erreur Cloudinary */

            else if (
                error.message &&
                error.message.toLowerCase().includes("cloudinary")
            ) {

                message =
                    "Impossible d'envoyer les photos vers Cloudinary. Vérifiez le preset d'upload.";
            }


            showMessage(
                message,
                "error"
            );


            publishButton.disabled = false;

            publishButton.innerHTML = `
                <i class="fa-solid fa-paper-plane"></i>
                Publier l'annonce
            `;

        }

    });

}


console.log(
    "CAMU SERVICES — publier.js avec Cloudinary chargé."
);
