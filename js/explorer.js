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
const sellerProfileButton = document.getElementById("sellerProfileButton");

const whatsappButton = document.getElementById("whatsappButton");
const favoriteButton = document.getElementById("favoriteButton");
const reportButton = document.getElementById("reportButton");


// =========================================================
// ID DE L'ANNONCE
// =========================================================

const params = new URLSearchParams(window.location.search);
const serviceId = params.get("id");

let currentAd = null;
let photos = [];
let currentPhotoIndex = 0;


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (price === undefined || price === null || price === "") {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${price} ${currency}`;
    }

    return new Intl.NumberFormat("fr-FR").format(number)
        + " "
        + currency;
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

        return "Date inconnue";
    }
}


// =========================================================
// PHOTOS
// =========================================================

function preparePhotos(ad) {

    let result = [];

    if (Array.isArray(ad.images)) {
        result = ad.images.filter(Boolean);
    }

    if (
        result.length === 0 &&
        ad.imageURL
    ) {
        result.push(ad.imageURL);
    }

    if (
        result.length === 0 &&
        ad.imageUrl
    ) {
        result.push(ad.imageUrl);
    }

    if (
        result.length === 0 &&
        ad.image
    ) {
        result.push(ad.image);
    }

    return result;
}


function displayPhoto(index) {

    if (!photos.length) {
        mainPhoto.style.display = "none";
        return;
    }

    if (index < 0) {
        index = photos.length - 1;
    }

    if (index >= photos.length) {
        index = 0;
    }

    currentPhotoIndex = index;

    mainPhoto.src = photos[index];

    mainPhoto.alt = currentAd?.title || "Photo de l'annonce";

    document.querySelectorAll(".photo-thumbnail").forEach((thumb, i) => {

        thumb.classList.toggle(
            "active",
            i === currentPhotoIndex
        );

    });
}


function createThumbnails() {

    photoThumbnails.innerHTML = "";

    if (photos.length <= 1) {
        prevPhoto.style.display = "none";
        nextPhoto.style.display = "none";
    } else {
        prevPhoto.style.display = "flex";
        nextPhoto.style.display = "flex";
    }

    photos.forEach((photo, index) => {

        const button = document.createElement("button");

        button.type = "button";

        button.className =
            "photo-thumbnail"
            + (index === 0 ? " active" : "");

        button.innerHTML = `
            <img
                src="${photo}"
                alt="Photo ${index + 1}"
                loading="lazy"
            >
        `;

        button.addEventListener("click", () => {
            displayPhoto(index);
        });

        photoThumbnails.appendChild(button);

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

    let number = String(currentAd.whatsapp)
        .replace(/[^\d]/g, "");

    if (!number) {
        alert("Numéro WhatsApp invalide.");
        return;
    }

    const message =
        `Bonjour, je viens de voir votre annonce "${currentAd.title || ""}" sur CAMU SERVICES. Je suis intéressé(e). Est-elle toujours disponible ?`;

    const url =
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
}


// =========================================================
// FAVORIS
// =========================================================

function favoriteStorageKey() {

    return `camu_favorite_${serviceId}`;
}


function updateFavoriteButton() {

    const active =
        localStorage.getItem(favoriteStorageKey()) === "true";

    favoriteButton.classList.toggle("active", active);

    favoriteButton.innerHTML = active
        ? `<i class="fa-solid fa-heart"></i> Retirer des favoris`
        : `<i class="fa-regular fa-heart"></i> Ajouter aux favoris`;
}


function toggleFavorite() {

    const active =
        localStorage.getItem(favoriteStorageKey()) === "true";

    if (active) {

        localStorage.removeItem(favoriteStorageKey());

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

    if (!currentAd || !serviceId) {
        return;
    }

    const reason = prompt(
        "Pourquoi souhaitez-vous signaler cette annonce ?"
    );

    if (!reason || !reason.trim()) {
        return;
    }

    try {

        await addDoc(
            collection(db, "reports"),
            {
                serviceId: serviceId,

                serviceTitle:
                    currentAd.title || "",

                ownerId:
                    currentAd.ownerId ||
                    currentAd.userId ||
                    "",

                reason:
                    reason.trim(),

                reporterId:
                    auth.currentUser?.uid || null,

                status: "pending",

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

    if (!serviceId) {

        loadingState.classList.add("hidden");
        errorState.classList.remove("hidden");

        return;
    }

    try {

        const adRef =
            doc(db, "services", serviceId);

        const snapshot =
            await getDoc(adRef);

        if (!snapshot.exists()) {

            loadingState.classList.add("hidden");
            errorState.classList.remove("hidden");

            return;
        }

        currentAd = {
            id: snapshot.id,
            ...snapshot.data()
        };


        // ==============================
        // INFORMATIONS
        // ==============================

        adTitle.textContent =
            currentAd.title ||
            currentAd.titre ||
            "Annonce sans titre";


        adCategory.textContent =
            currentAd.category ||
            currentAd.categorie ||
            "Autres";


        adPrice.textContent =
            formatPrice(
                currentAd.price,
                currentAd.currency || "USD"
            );


        const city =
            currentAd.city ||
            currentAd.ville ||
            "";


        const neighborhood =
            currentAd.neighborhood ||
            currentAd.quartier ||
            "";


        if (city && neighborhood) {

            adLocation.textContent =
                `${neighborhood}, ${city}`;

        } else {

            adLocation.textContent =
                city ||
                neighborhood ||
                "Localisation non précisée";

        }


        adDate.textContent =
            formatDate(currentAd.createdAt);


        adDescription.textContent =
            currentAd.description ||
            "Aucune description disponible.";


        // ==============================
        // ANNONCEUR
        // ==============================

        sellerName.textContent =
            currentAd.ownerName ||
            "Annonceur CAMU SERVICES";


        if (currentAd.ownerId) {

            sellerProfileButton.href =
                `profil.html?id=${currentAd.ownerId}`;

        } else {

            sellerProfileButton.style.display =
                "none";

        }


        // ==============================
        // PHOTOS
        // ==============================

        photos =
            preparePhotos(currentAd);

        createThumbnails();
        displayPhoto(0);


        // ==============================
        // AFFICHAGE
        // ==============================

        loadingState.classList.add("hidden");

        adDetail.classList.remove("hidden");


        // ==============================
        // FAVORI
        // ==============================

        updateFavoriteButton();


        // ==============================
        // WHATSAPP
        // ==============================

        whatsappButton.addEventListener(
            "click",
            openWhatsApp
        );


        favoriteButton.addEventListener(
            "click",
            toggleFavorite
        );


        reportButton.addEventListener(
            "click",
            reportAd
        );


        document.title =
            `${currentAd.title || "Annonce"} — CAMU SERVICES`;


    } catch (error) {

        console.error(
            "Erreur chargement annonce :",
            error
        );

        loadingState.classList.add("hidden");

        errorState.classList.remove("hidden");

    }
}


// =========================================================
// NAVIGATION PHOTOS
// =========================================================

prevPhoto.addEventListener(
    "click",
    () => displayPhoto(currentPhotoIndex - 1)
);


nextPhoto.addEventListener(
    "click",
    () => displayPhoto(currentPhotoIndex + 1)
);


// =========================================================
// MENU MOBILE
// =========================================================

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");


if (menuToggle && sidebar) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


// =========================================================
// DÉMARRAGE
// =========================================================

loadAd();

console.log(
    "CAMU SERVICES — explorer.js chargé."
);
