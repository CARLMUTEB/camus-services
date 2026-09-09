// =========================================================
// CAMU SERVICES
// PROFIL PUBLIC — V1
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENTS HTML
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

const profilePhone =
    document.getElementById("profilePhone");

const profileWhatsapp =
    document.getElementById("profileWhatsapp");

const profileLocation =
    document.getElementById("profileLocation");

const profileWhatsappButton =
    document.getElementById("profileWhatsappButton");

const profileAdsCount =
    document.getElementById("profileAdsCount");

const profileAds =
    document.getElementById("profileAds");

const profileAdsEmpty =
    document.getElementById("profileAdsEmpty");


// =========================================================
// RÉCUPÉRER L'ID DU PROFIL
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
// IMAGE D'UNE ANNONCE
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
// AFFICHER LA PHOTO DU PROFIL
// =========================================================

function displayProfilePhoto(photoURL) {

    if (!profilePhoto || !defaultProfileIcon) {
        return;
    }

    if (
        photoURL &&
        String(photoURL).trim() !== ""
    ) {

        profilePhoto.src = photoURL;

        profilePhoto.style.display =
            "block";

        defaultProfileIcon.style.display =
            "none";

    } else {

        profilePhoto.removeAttribute("src");

        profilePhoto.style.display =
            "none";

        defaultProfileIcon.style.display =
            "flex";
    }
}


// =========================================================
// NORMALISER LE NUMÉRO WHATSAPP
// =========================================================

function normalizeWhatsapp(number) {

    if (!number) {
        return "";
    }

    return String(number)
        .replace(/[^\d]/g, "");
}


// =========================================================
// AFFICHER LES CONTACTS
// =========================================================

function displayContactInformation(profileData) {

    const phone =
        profileData.ownerPhone ||
        profileData.phone ||
        profileData.telephone ||
        "";

    const whatsapp =
        profileData.ownerWhatsapp ||
        profileData.whatsapp ||
        profileData.ownerWhatsApp ||
        profileData.whatsApp ||
        phone ||
        "";

    const location =
        profileData.ownerLocation ||
        profileData.location ||
        profileData.localisation ||
        [
            profileData.neighborhood,
            profileData.city
        ]
            .filter(Boolean)
            .join(", ");

    // ---------------------------------------------
    // Téléphone
    // ---------------------------------------------

    if (profilePhone) {

        profilePhone.textContent =
            phone || "Non renseigné";
    }


    // ---------------------------------------------
    // WhatsApp
    // ---------------------------------------------

    if (profileWhatsapp) {

        profileWhatsapp.textContent =
            whatsapp || "Non renseigné";
    }


    // ---------------------------------------------
    // Localisation
    // ---------------------------------------------

    if (profileLocation) {

        profileLocation.textContent =
            location || "Non renseignée";
    }


    // ---------------------------------------------
    // Bouton WhatsApp
    // ---------------------------------------------

    if (profileWhatsappButton) {

        const whatsappNumber =
            normalizeWhatsapp(whatsapp);

        if (whatsappNumber) {

            profileWhatsappButton.href =
                `https://wa.me/${whatsappNumber}`;

            profileWhatsappButton.style.display =
                "inline-flex";

        } else {

            profileWhatsappButton.style.display =
                "none";
        }
    }
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

        // =================================================
        // RÉCUPÉRER LES ANNONCES
        // =================================================

        const annoncesQuery =
            query(
                collection(db, "annonces"),
                where("ownerId", "==", userId)
            );


        const snapshot =
            await getDocs(annoncesQuery);


        const ads = [];


        snapshot.forEach((document) => {

            ads.push({
                id: document.id,
                ...document.data()
            });

        });


        // =================================================
        // AUCUNE ANNONCE
        // =================================================

        if (ads.length === 0) {

            profileName.textContent =
                "Annonceur CAMU SERVICES";

            profileDescription.textContent =
                "Membre de CAMU SERVICES.";

            displayProfilePhoto("");

            if (profileAdsCount) {
                profileAdsCount.textContent = "0";
            }

            if (profileAds) {
                profileAds.innerHTML = "";
            }

            if (profileAdsEmpty) {
                profileAdsEmpty.classList.remove("hidden");
            }

            showProfile();

            return;
        }


        // =================================================
        // TRIER LES ANNONCES
        // =================================================

        ads.sort((a, b) => {

            const dateA =
                getTimestamp(a.createdAt);

            const dateB =
                getTimestamp(b.createdAt);

            return dateB - dateA;
        });


        // =================================================
        // INFORMATIONS DU PROFIL
        // =================================================

        const firstAd =
            ads[0];


        const name =
            firstAd.ownerName ||
            firstAd.ownerDisplayName ||
            firstAd.sellerName ||
            "Annonceur CAMU SERVICES";


        const description =
            firstAd.ownerDescription ||
            firstAd.descriptionOwner ||
            firstAd.ownerBio ||
            "Membre de CAMU SERVICES.";


        const photo =
            firstAd.ownerPhotoURL ||
            firstAd.ownerPhotoUrl ||
            firstAd.ownerPhoto ||
            firstAd.profilePhotoURL ||
            "";


        // =================================================
        // AFFICHAGE PROFIL
        // =================================================

        if (profileName) {

            profileName.textContent =
                name;
        }


        if (profileDescription) {

            profileDescription.textContent =
                description;
        }


        displayProfilePhoto(photo);


        // =================================================
        // CONTACT
        // =================================================

        displayContactInformation(firstAd);


        // =================================================
        // NOMBRE D'ANNONCES
        // =================================================

        if (profileAdsCount) {

            profileAdsCount.textContent =
                ads.length;
        }


        // =================================================
        // AFFICHER LES ANNONCES
        // =================================================

        renderAds(ads);


        // =================================================
        // AFFICHER LE PROFIL
        // =================================================

        showProfile();


        console.log(
            `CAMU SERVICES : profil chargé avec ${ads.length} annonce(s).`
        );

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

    if (!profileAds) {
        return;
    }


    profileAds.innerHTML = "";


    if (profileAdsEmpty) {

        profileAdsEmpty.classList.add(
            "hidden"
        );
    }


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
            ad.neighborhood ||
            "Ville non précisée";


        const title =
            ad.title ||
            "Annonce sans titre";


        const price =
            formatPrice(
                ad.price,
                ad.currency || "USD"
            );


        // =================================================
        // IMAGE
        // =================================================

        let imageHTML = "";


        if (image) {

            imageHTML = `
                <img
                    class="profile-ad-image"
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                >
            `;

        } else {

            imageHTML = `
                <div
                    class="profile-ad-image"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                    "
                >
                    <i
                        class="fa-solid fa-image"
                        style="
                            font-size:35px;
                            opacity:.4;
                        "
                    ></i>
                </div>
            `;
        }


        // =================================================
        // CARTE
        // =================================================

        card.innerHTML = `

            ${imageHTML}

            <div class="profile-ad-content">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <div class="profile-ad-price">
                    ${escapeHtml(price)}
                </div>

                <div class="profile-ad-location">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHtml(city)}
                    </span>

                </div>

            </div>
        `;


        // =================================================
        // OUVRIR L'ANNONCE
        // =================================================

        card.addEventListener(
            "click",
            () => {

                window.location.href =
                    `explorer.html?id=${encodeURIComponent(ad.id)}`;
            }
        );


        profileAds.appendChild(card);

    });
}


// =========================================================
// TIMESTAMP
// =========================================================

function getTimestamp(timestamp) {

    if (!timestamp) {
        return 0;
    }

    if (
        typeof timestamp.toMillis === "function"
    ) {
        return timestamp.toMillis();
    }

    if (
        typeof timestamp.seconds === "number"
    ) {
        return timestamp.seconds * 1000;
    }

    if (
        timestamp instanceof Date
    ) {
        return timestamp.getTime();
    }

    return 0;
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
// AFFICHER LE PROFIL
// =========================================================

function showProfile() {

    if (profileLoading) {

        profileLoading.classList.add(
            "hidden"
        );
    }


    if (profileError) {

        profileError.classList.add(
            "hidden"
        );
    }


    if (publicProfile) {

        publicProfile.classList.remove(
            "hidden"
        );
    }


    if (profileName) {

        document.title =
            `${profileName.textContent} — CAMU SERVICES`;
    }
}


// =========================================================
// AFFICHER ERREUR
// =========================================================

function showError() {

    if (profileLoading) {

        profileLoading.classList.add(
            "hidden"
        );
    }


    if (publicProfile) {

        publicProfile.classList.add(
            "hidden"
        );
    }


    if (profileError) {

        profileError.classList.remove(
            "hidden"
        );
    }
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
