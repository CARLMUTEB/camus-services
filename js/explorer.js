import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const auth = getAuth();


// =========================================================
// ÉLÉMENTS
// =========================================================

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const adDetail = document.getElementById("adDetail");

const mainPhoto = document.getElementById("mainPhoto");
const photoThumbnails = document.getElementById("photoThumbnails");

const prevPhoto = document.getElementById("prevPhoto");
const nextPhoto = document.getElementById("nextPhoto");

const adCategory = document.getElementById("adCategory");
const adTitle = document.getElementById("adTitle");
const adPrice = document.getElementById("adPrice");
const adLocation = document.getElementById("adLocation");
const adDate = document.getElementById("adDate");
const adDescription = document.getElementById("adDescription");

const sellerName = document.getElementById("sellerName");
const sellerProfileButton =
    document.getElementById("sellerProfileButton");

const whatsappButton =
    document.getElementById("whatsappButton");

const favoriteButton =
    document.getElementById("favoriteButton");

const reportButton =
    document.getElementById("reportButton");


// =========================================================
// ID DE L'ANNONCE
// =========================================================

const params =
    new URLSearchParams(window.location.search);

const annonceId =
    params.get("id");

let currentAd = null;
let photos = [];
let currentPhotoIndex = 0;


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${price} ${currency}`;
    }

    return (
        new Intl.NumberFormat("fr-FR").format(number)
        + " "
        + currency
    );
}


// =========================================================
// DATE
// =========================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "Date inconnue";
    }

    try {

        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(date);

    } catch (error) {

        console.error(
            "Erreur formatage date :",
            error
        );

        return "Date inconnue";
    }
}


// =========================================================
// PHOTOS
// =========================================================

function preparePhotos(ad) {

    let result = [];

    // Nouveau système : plusieurs photos
    if (Array.isArray(ad.images)) {

        result =
            ad.images.filter(Boolean);

    }

    // Ancien champ imageURL
    if (
        result.length === 0 &&
        ad.imageURL
    ) {

        result.push(ad.imageURL);

    }

    // Ancien champ imageUrl
    if (
        result.length === 0 &&
        ad.imageUrl
    ) {

        result.push(ad.imageUrl);

    }

    // Ancien champ image
    if (
        result.length === 0 &&
        ad.image
    ) {

        result.push(ad.image);

    }

    return result;
}


// =========================================================
// AFFICHER UNE PHOTO
// =========================================================

function displayPhoto(index) {

    if (!photos.length) {

        if (mainPhoto) {
            mainPhoto.style.display = "none";
        }

        return;
    }

    if (index < 0) {
        index = photos.length - 1;
    }

    if (index >= photos.length) {
        index = 0;
    }

    currentPhotoIndex = index;

    if (mainPhoto) {

        mainPhoto.style.display = "block";

        mainPhoto.src =
            photos[index];

        mainPhoto.alt =
            currentAd?.title ||
            "Photo de l'annonce";
    }

    document
        .querySelectorAll(".photo-thumbnail")
        .forEach((thumb, i) => {

            thumb.classList.toggle(
                "active",
                i === currentPhotoIndex
            );

        });
}


// =========================================================
// CRÉER LES MINIATURES
// =========================================================

function createThumbnails() {

    if (!photoThumbnails) {
        return;
    }

    photoThumbnails.innerHTML = "";


    // Aucune photo
    if (!photos.length) {

        if (prevPhoto) {
            prevPhoto.style.display = "none";
        }

        if (nextPhoto) {
            nextPhoto.style.display = "none";
        }

        return;
    }


    // Une seule photo
    if (photos.length <= 1) {

        if (prevPhoto) {
            prevPhoto.style.display = "none";
        }

        if (nextPhoto) {
            nextPhoto.style.display = "none";
        }

    } else {

        if (prevPhoto) {
            prevPhoto.style.display = "flex";
        }

        if (nextPhoto) {
            nextPhoto.style.display = "flex";
        }
    }


    // Créer chaque miniature
    photos.forEach((photo, index) => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "photo-thumbnail" +
            (index === 0 ? " active" : "");


        const image =
            document.createElement("img");

        image.src = photo;

        image.alt =
            `Photo ${index + 1}`;

        image.loading = "lazy";


        button.appendChild(image);


        button.addEventListener(
            "click",
            () => {

                displayPhoto(index);

            }
        );


        photoThumbnails.appendChild(
            button
        );

    });
}


// =========================================================
// WHATSAPP
// =========================================================

function openWhatsApp() {

    if (!currentAd?.whatsapp) {

        alert(
            "Le numéro WhatsApp de cet annonceur n'est pas disponible."
        );

        return;
    }


    const number =
        String(currentAd.whatsapp)
            .replace(/[^\d]/g, "");


    if (!number) {

        alert(
            "Numéro WhatsApp invalide."
        );

        return;
    }


    const message =
        `Bonjour, je viens de voir votre annonce "${currentAd.title || ""}" sur CAMU SERVICES. Je suis intéressé(e). Est-elle toujours disponible ?`;


    const url =
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );
}


// =========================================================
// FAVORIS
// =========================================================

function favoriteStorageKey() {

    return `camu_favorite_${annonceId}`;
}


function updateFavoriteButton() {

    if (!favoriteButton) {
        return;
    }


    const active =
        localStorage.getItem(
            favoriteStorageKey()
        ) === "true";


    favoriteButton.classList.toggle(
        "active",
        active
    );


    favoriteButton.innerHTML =
        active

            ? `<i class="fa-solid fa-heart"></i> Retirer des favoris`

            : `<i class="fa-regular fa-heart"></i> Ajouter aux favoris`;
}


function toggleFavorite() {

    const active =
        localStorage.getItem(
            favoriteStorageKey()
        ) === "true";


    if (active) {

        localStorage.removeItem(
            favoriteStorageKey()
        );

    } else {

        localStorage.setItem(
            favoriteStorageKey(),
            "true"
        );

    }


    updateFavoriteButton();
}


// =========================================================
// SIGNALEMENT
// =========================================================

async function reportAd() {

    if (!currentAd || !annonceId) {
        return;
    }


    const reason =
        prompt(
            "Pourquoi souhaitez-vous signaler cette annonce ?"
        );


    if (
        !reason ||
        !reason.trim()
    ) {
        return;
    }


    try {

        await addDoc(
            collection(db, "reports"),
            {

                annonceId:
                    annonceId,

                annonceTitle:
                    currentAd.title || "",

                ownerId:
                    currentAd.ownerId ||
                    currentAd.userId ||
                    "",

                reason:
                    reason.trim(),

                reporterId:
                    auth.currentUser?.uid ||
                    null,

                status:
                    "pending",

                createdAt:
                    serverTimestamp()
            }
        );


        alert(
            "Merci. Votre signalement a été envoyé."
        );


    } catch (error) {

        console.error(
            "Erreur signalement :",
            error
        );


        alert(
            "Impossible d'envoyer le signalement pour le moment."
        );
    }
}


// =========================================================
// CHARGEMENT DE L'ANNONCE
// =========================================================

async function loadAd() {

    // Aucun ID dans l'URL
    if (!annonceId) {

        if (loadingState) {
            loadingState.classList.add("hidden");
        }

        if (errorState) {
            errorState.classList.remove("hidden");
        }

        return;
    }


    try {

        // =================================================
        // IMPORTANT :
        // LES ANNONCES SONT DANS LA COLLECTION "annonces"
        // =================================================

        const adRef =
            doc(
                db,
                "annonces",
                annonceId
            );


        const snapshot =
            await getDoc(adRef);


        // =================================================
        // ANNONCE INTROUVABLE
        // =================================================

        if (!snapshot.exists()) {

            console.error(
                "Annonce introuvable dans annonces :",
                annonceId
            );


            if (loadingState) {
                loadingState.classList.add("hidden");
            }

            if (errorState) {
                errorState.classList.remove("hidden");
            }

            return;
        }


        // =================================================
        // RÉCUPÉRER LES DONNÉES
        // =================================================

        currentAd = {

            id:
                snapshot.id,

            ...snapshot.data()

        };


        console.log(
            "Annonce chargée :",
            currentAd
        );


        // =================================================
        // TITRE
        // =================================================

        if (adTitle) {

            adTitle.textContent =
                currentAd.title ||
                currentAd.titre ||
                "Annonce sans titre";

        }


        // =================================================
        // CATÉGORIE
        // =================================================

        if (adCategory) {

            adCategory.textContent =
                currentAd.category ||
                currentAd.categorie ||
                "Autres";

        }


        // =================================================
        // PRIX
        // =================================================

        if (adPrice) {

            adPrice.textContent =
                formatPrice(
                    currentAd.price,
                    currentAd.currency ||
                    "USD"
                );

        }


        // =================================================
        // LOCALISATION
        // =================================================

        const city =
            currentAd.city ||
            currentAd.ville ||
            "";


        const neighborhood =
            currentAd.neighborhood ||
            currentAd.quartier ||
            "";


        if (adLocation) {

            if (
                city &&
                neighborhood
            ) {

                adLocation.textContent =
                    `${neighborhood}, ${city}`;

            } else {

                adLocation.textContent =
                    city ||
                    neighborhood ||
                    "Localisation non précisée";

            }
        }


        // =================================================
        // DATE
        // =================================================

        if (adDate) {

            adDate.textContent =
                formatDate(
                    currentAd.createdAt
                );

        }


        // =================================================
        // DESCRIPTION
        // =================================================

        if (adDescription) {

            adDescription.textContent =
                currentAd.description ||
                "Aucune description disponible.";

        }


        // =================================================
        // ANNONCEUR
        // =================================================

        if (sellerName) {

            sellerName.textContent =
                currentAd.ownerName ||
                "Annonceur CAMU SERVICES";

        }


        if (
            sellerProfileButton &&
            currentAd.ownerId
        ) {

            sellerProfileButton.href =
                `profil.html?id=${encodeURIComponent(currentAd.ownerId)}`;

            sellerProfileButton.style.display =
                "inline-flex";

        } else if (sellerProfileButton) {

            sellerProfileButton.style.display =
                "none";

        }


        // =================================================
        // PHOTOS
        // =================================================

        photos =
            preparePhotos(currentAd);


        createThumbnails();

        displayPhoto(0);


        // =================================================
        // AFFICHAGE
        // =================================================

        if (loadingState) {

            loadingState.classList.add(
                "hidden"
            );

        }


        if (errorState) {

            errorState.classList.add(
                "hidden"
            );

        }


        if (adDetail) {

            adDetail.classList.remove(
                "hidden"
            );

        }


        // =================================================
        // FAVORIS
        // =================================================

        updateFavoriteButton();


        // =================================================
        // WHATSAPP
        // =================================================

        if (whatsappButton) {

            whatsappButton.onclick =
                openWhatsApp;

        }


        // =================================================
        // FAVORIS
        // =================================================

        if (favoriteButton) {

            favoriteButton.onclick =
                toggleFavorite;

        }


        // =================================================
        // SIGNALEMENT
        // =================================================

        if (reportButton) {

            reportButton.onclick =
                reportAd;

        }


        // =================================================
        // TITRE DU NAVIGATEUR
        // =================================================

        document.title =
            `${currentAd.title || "Annonce"} — CAMU SERVICES`;


    } catch (error) {

        console.error(
            "Erreur chargement annonce :",
            error
        );


        if (loadingState) {

            loadingState.classList.add(
                "hidden"
            );

        }


        if (errorState) {

            errorState.classList.remove(
                "hidden"
            );

        }
    }
}


// =========================================================
// NAVIGATION PHOTOS
// =========================================================

if (prevPhoto) {

    prevPhoto.addEventListener(
        "click",
        () => {

            displayPhoto(
                currentPhotoIndex - 1
            );

        }
    );

}


if (nextPhoto) {

    nextPhoto.addEventListener(
        "click",
        () => {

            displayPhoto(
                currentPhotoIndex + 1
            );

        }
    );

}


// =========================================================
// MENU MOBILE
// =========================================================

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const closeSidebar =
    document.getElementById("closeSidebar");


if (
    menuToggle &&
    sidebar
) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );


            if (sidebarOverlay) {

                sidebarOverlay.classList.toggle(
                    "active"
                );

            }

        }
    );

}


if (
    closeSidebar &&
    sidebar
) {

    closeSidebar.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "open"
            );


            if (sidebarOverlay) {

                sidebarOverlay.classList.remove(
                    "active"
                );

            }

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "open"
            );

            sidebarOverlay.classList.remove(
                "active"
            );

        }
    );

}


// =========================================================
// DÉMARRAGE
// =========================================================

loadAd();


console.log(
    "CAMU SERVICES — explorer.js chargé avec la collection annonces."
);
