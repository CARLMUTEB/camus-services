import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENTS
// =========================================================

const profileLoading =
    document.getElementById("profileLoading");

const profileError =
    document.getElementById("profileError");

const publicProfile =
    document.getElementById("publicProfile");

const profilePhoto =
    document.getElementById("profilePhoto");

const defaultProfileIcon =
    document.getElementById("defaultProfileIcon");

const profileName =
    document.getElementById("profileName");

const profileDescription =
    document.getElementById("profileDescription");

const profileAdsCount =
    document.getElementById("profileAdsCount");

const profileAds =
    document.getElementById("profileAds");

const profileAdsEmpty =
    document.getElementById("profileAdsEmpty");


// =========================================================
// ID UTILISATEUR
// =========================================================

const params =
    new URLSearchParams(window.location.search);

const userId =
    params.get("id");


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
        new Intl.NumberFormat("fr-FR")
            .format(number)
        + " "
        + currency
    );
}


// =========================================================
// PHOTOS
// =========================================================

function getAdImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {
        return ad.images[0];
    }

    if (ad.imageURL) {
        return ad.imageURL;
    }

    if (ad.imageUrl) {
        return ad.imageUrl;
    }

    if (ad.image) {
        return ad.image;
    }

    return "";
}


// =========================================================
// CHARGER LE PROFIL
// =========================================================

async function loadProfile() {

    if (!userId) {

        showError();

        return;
    }


    try {

        // ==============================================
        // RÉCUPÉRER LES ANNONCES
        // ==============================================

        const servicesQuery =
            query(
                collection(db, "services"),
                where("ownerId", "==", userId)
            );

        const snapshot =
            await getDocs(servicesQuery);


        const ads = [];

        snapshot.forEach((document) => {

            ads.push({
                id: document.id,
                ...document.data()
            });

        });


        // ==============================================
        // SI AUCUNE ANNONCE
        // ==============================================

        if (ads.length === 0) {

            // On affiche quand même un profil générique.
            profileName.textContent =
                "Annonceur CAMU SERVICES";

            profileDescription.textContent =
                "Membre de CAMU SERVICES.";

            profilePhoto.style.display =
                "none";

            defaultProfileIcon.style.display =
                "flex";

            profileAdsCount.textContent =
                "0";

            profileAds.innerHTML = "";

            profileAdsEmpty.classList.remove(
                "hidden"
            );

            showProfile();

            return;
        }


        // ==============================================
        // INFOS VENDEUR
        // ==============================================

        const firstAd = ads[0];

        profileName.textContent =
            firstAd.ownerName ||
            "Annonceur CAMU SERVICES";

        profileDescription.textContent =
            firstAd.ownerDescription ||
            "Membre de CAMU SERVICES.";


        // ==============================================
        // PHOTO DU PROFIL
        // ==============================================

        if (firstAd.ownerPhotoURL) {

            profilePhoto.src =
                firstAd.ownerPhotoURL;

            profilePhoto.style.display =
                "block";

            defaultProfileIcon.style.display =
                "none";

        } else {

            profilePhoto.style.display =
                "none";

            defaultProfileIcon.style.display =
                "flex";

        }


        // ==============================================
        // NOMBRE D'ANNONCES
        // ==============================================

        profileAdsCount.textContent =
            ads.length;


        // ==============================================
        // TRI PAR DATE
        // ==============================================

        ads.sort((a, b) => {

            const dateA =
                a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : 0;

            const dateB =
                b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : 0;

            return dateB - dateA;

        });


        // ==============================================
        // AFFICHER LES ANNONCES
        // ==============================================

        renderAds(ads);

        showProfile();


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );

        showError();

    }
}


// =========================================================
// AFFICHER LES ANNONCES
// =========================================================

function renderAds(ads) {

    profileAds.innerHTML = "";

    profileAdsEmpty.classList.add(
        "hidden"
    );


    ads.forEach((ad) => {

        const card =
            document.createElement("article");

        card.className =
            "profile-ad-card";


        const image =
            getAdImage(ad);


        const city =
            ad.city ||
            ad.ville ||
            "Ville non précisée";


        card.innerHTML = `

            ${
                image
                ? `
                    <img
                        class="profile-ad-image"
                        src="${image}"
                        alt="${escapeHtml(ad.title || "Annonce")}"
                        loading="lazy"
                    >
                  `
                : `
                    <div
                        class="profile-ad-image"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                        "
                    >
                        <i class="fa-solid fa-image"
                           style="font-size:35px; opacity:.4;">
                        </i>
                    </div>
                  `
            }

            <div class="profile-ad-content">

                <h3>
                    ${escapeHtml(
                        ad.title ||
                        "Annonce sans titre"
                    )}
                </h3>

                <div class="profile-ad-price">
                    ${formatPrice(
                        ad.price,
                        ad.currency || "USD"
                    )}
                </div>

                <div class="profile-ad-location">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHtml(city)}
                    </span>

                </div>

            </div>

        `;


        card.addEventListener(
            "click",
            () => {

                window.location.href =
                    `explorer.html?id=${ad.id}`;

            }
        );


        profileAds.appendChild(card);

    });

}


// =========================================================
// PROTECTION HTML
// =========================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// AFFICHER PROFIL
// =========================================================

function showProfile() {

    profileLoading.classList.add(
        "hidden"
    );

    profileError.classList.add(
        "hidden"
    );

    publicProfile.classList.remove(
        "hidden"
    );

    document.title =
        `${profileName.textContent} — CAMU SERVICES`;
}


// =========================================================
// ERREUR
// =========================================================

function showError() {

    profileLoading.classList.add(
        "hidden"
    );

    publicProfile.classList.add(
        "hidden"
    );

    profileError.classList.remove(
        "hidden"
    );

}


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

loadProfile();

console.log(
    "CAMU SERVICES — profil.js chargé."
);
