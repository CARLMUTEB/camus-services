// =========================================================
// CAMU SERVICES — COMPTE.JS
// Gestion des annonces de l'utilisateur connecté
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENTS HTML
// =========================================================

const myAdsContainer = document.getElementById("myAdsContainer");
const myAdsEmpty = document.getElementById("myAdsEmpty");
const myAdsCount = document.getElementById("myAdsCount");


// =========================================================
// PROTECTION
// =========================================================

if (!myAdsContainer) {
    console.warn("CAMU SERVICES : myAdsContainer introuvable.");
}


// =========================================================
// ÉCHAPPER LE HTML
// =========================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// FORMAT DU PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Prix à discuter";
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
        return `${escapeHtml(price)} ${escapeHtml(currency)}`;
    }

    const formattedPrice = new Intl.NumberFormat("fr-FR").format(
        numericPrice
    );

    return `${formattedPrice} ${escapeHtml(currency)}`;
}


// =========================================================
// RÉCUPÉRER L'IMAGE
// =========================================================

function getAdImage(ad) {

    // Si plusieurs images existent
    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0 &&
        ad.images[0]
    ) {
        return ad.images[0];
    }

    // Ancien format
    if (ad.imageURL) {
        return ad.imageURL;
    }

    // Image de secours
    return "logo.png";
}


// =========================================================
// TRIER LES ANNONCES
// =========================================================

function sortAdsByDate(ads) {

    return ads.sort((a, b) => {

        let dateA = 0;
        let dateB = 0;

        if (
            a.createdAt &&
            typeof a.createdAt.toMillis === "function"
        ) {
            dateA = a.createdAt.toMillis();
        }

        if (
            b.createdAt &&
            typeof b.createdAt.toMillis === "function"
        ) {
            dateB = b.createdAt.toMillis();
        }

        return dateB - dateA;
    });
}


// =========================================================
// AFFICHER L'ÉTAT VIDE
// =========================================================

function showEmptyState() {

    if (myAdsContainer) {
        myAdsContainer.innerHTML = "";
    }

    if (myAdsEmpty) {
        myAdsEmpty.style.display = "block";
    }

    if (myAdsCount) {
        myAdsCount.textContent = "0";
    }
}


// =========================================================
// AFFICHER LES ANNONCES
// =========================================================

function displayMyAds(ads) {

    if (!myAdsContainer) {
        return;
    }

    if (!ads || ads.length === 0) {
        showEmptyState();
        return;
    }

    if (myAdsEmpty) {
        myAdsEmpty.style.display = "none";
    }

    if (myAdsCount) {
        myAdsCount.textContent = ads.length;
    }

    myAdsContainer.innerHTML = "";

    ads.forEach((ad) => {

        const image = getAdImage(ad);

        const title =
            ad.title ||
            "Annonce sans titre";

        const price = formatPrice(
            ad.price,
            ad.currency || "USD"
        );

        const city =
            ad.city ||
            "Ville non précisée";

        const neighborhood =
            ad.neighborhood ||
            "";

        const status =
            ad.status ||
            "active";

        const card = document.createElement("article");

        card.className = "account-ad-card";

        card.innerHTML = `
            <div class="account-ad-image">
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                    onerror="this.src='logo.png'"
                >
            </div>

            <div class="account-ad-content">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <div class="account-ad-price">
                    ${price}
                </div>

                <p class="account-ad-location">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHtml(city)}
                    ${
                        neighborhood
                            ? ` — ${escapeHtml(neighborhood)}`
                            : ""
                    }
                </p>

                <p class="account-ad-status">
                    <i class="fa-solid fa-circle-check"></i>
                    ${escapeHtml(status)}
                </p>

                <div class="account-ad-actions">

                    <a
                        href="explorer.html?id=${encodeURIComponent(ad.id)}"
                        class="account-ad-edit"
                    >
                        <i class="fa-solid fa-eye"></i>
                        Voir
                    </a>

                    <button
                        type="button"
                        class="account-ad-delete"
                        data-ad-id="${escapeHtml(ad.id)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Supprimer
                    </button>

                </div>

            </div>
        `;

        myAdsContainer.appendChild(card);
    });

    // Activer les boutons supprimer
    attachDeleteButtons();
}


// =========================================================
// SUPPRESSION D'UNE ANNONCE
// =========================================================

function attachDeleteButtons() {

    const deleteButtons =
        document.querySelectorAll(".account-ad-delete");

    deleteButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const adId = button.dataset.adId;

            if (!adId) {
                return;
            }

            const confirmation = confirm(
                "Voulez-vous vraiment supprimer cette annonce ?"
            );

            if (!confirmation) {
                return;
            }

            try {

                button.disabled = true;
                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Suppression...
                `;

                /*
                 * Pour l'instant, la suppression est désactivée
                 * ici afin de ne pas supprimer accidentellement
                 * une annonce pendant les tests.
                 */

                console.log(
                    "Annonce sélectionnée pour suppression :",
                    adId
                );

                alert(
                    "La fonction de suppression sera activée dans la prochaine étape."
                );

                button.disabled = false;

                button.innerHTML = `
                    <i class="fa-solid fa-trash"></i>
                    Supprimer
                `;

            } catch (error) {

                console.error(
                    "Erreur suppression :",
                    error
                );

                button.disabled = false;

                button.innerHTML = `
                    <i class="fa-solid fa-trash"></i>
                    Supprimer
                `;
            }
        });
    });
}


// =========================================================
// CHARGER LES ANNONCES
// =========================================================

async function loadMyAds(user) {

    if (!user) {
        showEmptyState();
        return;
    }

    if (!myAdsContainer) {
        return;
    }

    // Message temporaire
    myAdsContainer.innerHTML = `
        <div class="account-empty">
            <div class="account-empty-icon">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>

            <h3>Chargement...</h3>

            <p>
                Nous récupérons vos annonces.
            </p>
        </div>
    `;

    try {

        console.log(
            "CAMU SERVICES : récupération des annonces de",
            user.uid
        );

        /*
         * On utilise ownerId car publier.js
         * enregistre l'identifiant de l'utilisateur
         * dans le champ ownerId.
         */

        const servicesRef =
            collection(db, "services");

        const q = query(
            servicesRef,
            where("ownerId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const ads = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));

        console.log(
            "CAMU SERVICES : annonces trouvées :",
            ads.length
        );

        // Trier de la plus récente à la plus ancienne
        sortAdsByDate(ads);

        displayMyAds(ads);

    } catch (error) {

        console.error(
            "CAMU SERVICES : erreur lors du chargement des annonces :",
            error
        );

        if (myAdsContainer) {

            myAdsContainer.innerHTML = `
                <div class="account-empty">

                    <div class="account-empty-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <h3>Impossible de charger les annonces</h3>

                    <p>
                        Une erreur est survenue lors de la récupération
                        de vos annonces.
                    </p>

                    <p style="font-size: 13px;">
                        Vérifiez la console du navigateur pour plus de détails.
                    </p>

                </div>
            `;
        }
    }
}


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        console.log(
            "CAMU SERVICES — utilisateur connecté :",
            user.email
        );

        loadMyAds(user);

    } else {

        console.log(
            "CAMU SERVICES — aucun utilisateur connecté."
        );

        showEmptyState();
    }
});


// =========================================================
// MESSAGE DE CHARGEMENT DU SCRIPT
// =========================================================

console.log(
    "CAMU SERVICES — compte.js chargé correctement."
);
