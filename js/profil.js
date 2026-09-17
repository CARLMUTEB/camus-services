import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   PARAMÈTRE URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const profileId =
    cleanValue(
        params.get("id")
    );


/* =========================================================
   CONFIG
========================================================= */

const FALLBACK_IMAGE =
    "assets/logo/camu-services-logo.png";


let profileData = null;

let profileAds = [];


/* =========================================================
   DOM
========================================================= */

const profileLoading =
    document.getElementById(
        "profileLoading"
    );


const profileError =
    document.getElementById(
        "profileError"
    );


const profileErrorMessage =
    document.getElementById(
        "profileErrorMessage"
    );


const profilePage =
    document.getElementById(
        "profilePage"
    );


const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


const profileAccountType =
    document.getElementById(
        "profileAccountType"
    );


const profileLocation =
    document.getElementById(
        "profileLocation"
    );


const profileWhatsapp =
    document.getElementById(
        "profileWhatsapp"
    );


const profilePhone =
    document.getElementById(
        "profilePhone"
    );


const informationLocation =
    document.getElementById(
        "informationLocation"
    );


const informationActivity =
    document.getElementById(
        "informationActivity"
    );


const informationAds =
    document.getElementById(
        "informationAds"
    );


const profileDescription =
    document.getElementById(
        "profileDescription"
    );


const profileAdsGrid =
    document.getElementById(
        "profileAdsGrid"
    );


const adsLoading =
    document.getElementById(
        "adsLoading"
    );


const noAds =
    document.getElementById(
        "noAds"
    );


const adsCount =
    document.getElementById(
        "adsCount"
    );


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "CAMU PROFIL — initialisation..."
        );


        if (!profileId) {

            showError(
                "Aucun profil n'a été sélectionné."
            );

            return;

        }


        loadProfile();

    }
);


/* =========================================================
   CHARGER PROFIL
========================================================= */

async function loadProfile() {

    showLoading();


    try {

        const userRef =
            doc(
                db,
                "users",
                profileId
            );


        const snapshot =
            await getDoc(
                userRef
            );


        if (
            snapshot.exists()
        ) {

            profileData = {

                id:
                    snapshot.id,

                ...snapshot.data()

            };

        } else {

            /*
             * Si le profil users n'existe pas,
             * on cherche directement un profil
             * professionnel.
             */

            profileData =
                await findProfessionalProfile();

        }


        if (!profileData) {

            showError(
                "Impossible de trouver ce profil."
            );

            return;

        }


        renderProfile();


        await loadProfileAds();


        showPage();


    } catch (error) {

        console.error(
            "CAMU PROFIL — erreur :",
            error
        );


        showError(
            "Impossible de charger le profil."
        );

    }

}


/* =========================================================
   CHERCHER PROFIL PROFESSIONNEL
========================================================= */

async function findProfessionalProfile() {

    const collections = [

        "agents_immobiliers",

        "etablissements_commerciaux",

        "chauffeurs",

        "agences_automobiles",

        "etablissements_hoteliers"

    ];


    for (
        const collectionName of collections
    ) {

        try {

            const ref =
                doc(
                    db,
                    collectionName,
                    profileId
                );


            const snapshot =
                await getDoc(
                    ref
                );


            if (
                snapshot.exists()
            ) {

                return {

                    id:
                        snapshot.id,

                    ...snapshot.data(),

                    profileCollection:
                        collectionName

                };

            }

        } catch (error) {

            console.warn(
                `CAMU PROFIL — ${collectionName}:`,
                error
            );

        }

    }


    /*
     * Dernière possibilité :
     * rechercher par uid.
     */

    for (
        const collectionName of collections
    ) {

        try {

            const ref =
                collection(
                    db,
                    collectionName
                );


            const q =
                query(
                    ref,
                    where(
                        "uid",
                        "==",
                        profileId
                    )
                );


            const snapshot =
                await getDocs(q);


            if (
                !snapshot.empty
            ) {

                const result =
                    snapshot.docs[0];


                return {

                    id:
                        result.id,

                    ...result.data(),

                    profileCollection:
                        collectionName

                };

            }

        } catch (error) {

            console.warn(
                `CAMU PROFIL — recherche ${collectionName}:`,
                error
            );

        }

    }


    return null;

}


/* =========================================================
   RENDRE PROFIL
========================================================= */

function renderProfile() {

    const name =
        cleanValue(
            profileData.name ||
            profileData.displayName ||
            profileData.ownerName ||
            profileData.nom ||
            "Utilisateur"
        );


    profileName.textContent =
        name;


    document.title =
        `${name} — CAMU SERVICES`;


    /* TYPE DE COMPTE */

    const accountType =
        getAccountType(
            profileData
        );


    profileAccountType.textContent =
        accountType;


    informationActivity.textContent =
        accountType;


    /* LOCALISATION */

    const city =
        cleanValue(
            profileData.ville ||
            profileData.city
        );


    const commune =
        cleanValue(
            profileData.commune
        );


    const address =
        cleanValue(
            profileData.adresse
        );


    const locationParts =
        [
            city,
            commune
        ].filter(Boolean);


    if (address) {

        locationParts.push(
            address
        );

    }


    const location =
        locationParts.length
            ? locationParts.join(" • ")
            : "Localisation non précisée";


    profileLocation.innerHTML = `

        <i class="fa-solid fa-location-dot"></i>

        ${escapeHtml(location)}

    `;


    informationLocation.textContent =
        location;


    /* DESCRIPTION */

    profileDescription.textContent =
        cleanValue(
            profileData.description ||
            profileData.bio
        ) ||
        "Aucune description disponible.";


    /* PHOTO */

    renderAvatar(
        profileData,
        name
    );


    /* CONTACT */

    renderContact();


    /* VÉRIFICATION */

    const verifiedBadge =
        document.getElementById(
            "verifiedBadge"
        );


    const isVerified =
        profileData.verified === true ||
        profileData.active === true ||
        profileData.accountStatus === "active";


    verifiedBadge.style.display =
        isVerified
            ? "inline-flex"
            : "none";

}


/* =========================================================
   AVATAR
========================================================= */

function renderAvatar(
    profile,
    name
) {

    const photo =
        cleanValue(
            profile.photoURL ||
            profile.photoUrl ||
            profile.logoURL ||
            profile.logoUrl ||
            profile.imageURL ||
            profile.imageUrl ||
            profile.photo
        );


    if (
        isValidImageUrl(photo)
    ) {

        profileAvatar.innerHTML = `

            <img
                src="${escapeHtml(photo)}"
                alt="${escapeHtml(name)}"
            >

        `;


        const image =
            profileAvatar.querySelector(
                "img"
            );


        image.onerror =
            () => {

                profileAvatar.innerHTML =
                    `<i class="fa-solid fa-user"></i>`;

            };

    } else {

        profileAvatar.innerHTML =
            `<i class="fa-solid fa-user"></i>`;

    }

}


/* =========================================================
   CONTACT
========================================================= */

function renderContact() {

    const whatsapp =
        cleanPhone(
            profileData.whatsapp ||
            profileData.WhatsApp ||
            profileData.ownerWhatsapp ||
            profileData.ownerWhatsApp
        );


    const phone =
        cleanPhone(
            profileData.phone ||
            profileData.telephone ||
            profileData.ownerPhone
        );


    if (whatsapp) {

        const message =
            `Bonjour ${cleanValue(profileData.name || profileData.nom)}, je vous contacte via CAMU SERVICES.`;


        profileWhatsapp.href =
            `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;


        profileWhatsapp.style.display =
            "inline-flex";

    } else {

        profileWhatsapp.style.display =
            "none";

    }


    if (phone) {

        profilePhone.href =
            `tel:${phone}`;


        profilePhone.style.display =
            "inline-flex";

    } else {

        profilePhone.style.display =
            "none";

    }

}


/* =========================================================
   CHARGER ANNONCES DU VENDEUR
========================================================= */

async function loadProfileAds() {

    adsLoading.classList.remove(
        "hidden"
    );


    profileAdsGrid.innerHTML =
        "";


    noAds.classList.add(
        "hidden"
    );


    try {

        const adsRef =
            collection(
                db,
                "annonces"
            );


        const snapshot =
            await getDocs(
                adsRef
            );


        profileAds = [];


        snapshot.forEach(
            documentSnapshot => {

                const ad =
                    {
                        id:
                            documentSnapshot.id,

                        ...documentSnapshot.data()

                    };


                const ownerId =
                    cleanValue(
                        ad.ownerId
                    );


                const userId =
                    cleanValue(
                        ad.userId
                    );


                if (
                    ownerId === profileId ||
                    userId === profileId
                ) {

                    const status =
                        cleanValue(
                            ad.status
                        ).toLowerCase();


                    if (
                        !status ||
                        [
                            "active",
                            "approved"
                        ].includes(status)
                    ) {

                        profileAds.push(
                            ad
                        );

                    }

                }

            }
        );


        /*
         * Trier les annonces
         * de la plus récente à la plus ancienne
         */

        profileAds.sort(
            (a, b) => {

                const dateA =
                    getTimestampValue(
                        a.createdAt
                    );


                const dateB =
                    getTimestampValue(
                        b.createdAt
                    );


                return dateB - dateA;

            }
        );


        console.log(
            `CAMU PROFIL — ${profileAds.length} annonce(s).`
        );


        renderAds();


    } catch (error) {

        console.error(
            "CAMU PROFIL — erreur annonces :",
            error
        );


        adsLoading.classList.add(
            "hidden"
        );


        noAds.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   AFFICHER ANNONCES
========================================================= */

function renderAds() {

    adsLoading.classList.add(
        "hidden"
    );


    const count =
        profileAds.length;


    adsCount.textContent =
        count === 1
            ? "1 annonce"
            : `${count} annonces`;


    informationAds.textContent =
        count;


    if (!count) {

        noAds.classList.remove(
            "hidden"
        );

        return;

    }


    noAds.classList.add(
        "hidden"
    );


    profileAdsGrid.innerHTML =
        profileAds
            .map(
                createAdCard
            )
            .join("");

}


/* =========================================================
   CARTE ANNONCE
========================================================= */

function createAdCard(
    ad
) {

    const title =
        cleanValue(
            ad.title ||
            "Annonce"
        );


    const category =
        cleanValue(
            ad.category ||
            ad.publicationType
        ) ||
        "Annonce";


    const price =
        formatPrice(
            ad.price,
            ad.currency
        );


    const city =
        cleanValue(
            ad.city ||
            ad.ville
        );


    const commune =
        cleanValue(
            ad.commune
        );


    const location =
        [
            city,
            commune
        ]
        .filter(Boolean)
        .join(" • ") ||
        "Localisation non précisée";


    const image =
        getFirstImage(
            ad
        );


    return `

        <a
            href="explorer.html?id=${encodeURIComponent(ad.id)}"
            class="profile-ad-card"
        >

            <div class="profile-ad-image">

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                >

            </div>


            <div class="profile-ad-content">

                <span class="profile-ad-category">

                    ${escapeHtml(category)}

                </span>


                <h3 class="profile-ad-title">

                    ${escapeHtml(title)}

                </h3>


                <div class="profile-ad-price">

                    ${escapeHtml(price)}

                </div>


                <div class="profile-ad-location">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHtml(location)}
                    </span>

                </div>

            </div>

        </a>

    `;

}


/* =========================================================
   PREMIÈRE IMAGE
========================================================= */

function getFirstImage(
    ad
) {

    let images = [];


    if (
        Array.isArray(ad.images)
    ) {

        images =
            ad.images;

    }


    else if (
        typeof ad.images === "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    ad.images
                );


            if (
                Array.isArray(parsed)
            ) {

                images =
                    parsed;

            } else {

                images = [
                    ad.images
                ];

            }

        } catch {

            images = [
                ad.images
            ];

        }

    }


    const alternatives = [

        ...images,

        ad.imageURL,

        ad.imageUrl,

        ad.image,

        ad.photoURL,

        ad.photoUrl

    ];


    for (
        const image of alternatives
    ) {

        const value =
            cleanValue(image);


        if (
            isValidImageUrl(value)
        ) {

            return value;

        }

    }


    return FALLBACK_IMAGE;

}


/* =========================================================
   TYPE COMPTE
========================================================= */

function getAccountType(
    profile
) {

    const accountType =
        cleanValue(
            profile.accountType
        ).toLowerCase();


    const collectionName =
        cleanValue(
            profile.profileCollection
        );


    const map = {

        client:
            "Client",

        immobilier:
            "CAMU IMMO",

        commerce:
            "CAMU COMMERCE",

        vehicules:
            "Véhicules & Transport",

        "véhicules":
            "Véhicules & Transport",

        hotels:
            "Hôtels & Hébergement",

        hotel:
            "Hôtels & Hébergement"

    };


    if (
        map[accountType]
    ) {

        return map[accountType];

    }


    if (
        collectionName ===
        "agents_immobiliers"
    ) {

        return "CAMU IMMO";

    }


    if (
        collectionName ===
        "etablissements_commerciaux"
    ) {

        return "CAMU COMMERCE";

    }


    if (
        collectionName ===
        "chauffeurs" ||
        collectionName ===
        "agences_automobiles"
    ) {

        return "Véhicules & Transport";

    }


    if (
        collectionName ===
        "etablissements_hoteliers"
    ) {

        return "Hôtels & Hébergement";

    }


    return "Membre CAMU SERVICES";

}


/* =========================================================
   PRIX
========================================================= */

function formatPrice(
    price,
    currency
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "Prix sur demande";

    }


    const number =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(",", ".")
        );


    if (
        Number.isNaN(number)
    ) {

        return (
            cleanValue(price) ||
            "Prix sur demande"
        );

    }


    const formatted =
        new Intl.NumberFormat(
            "fr-FR",
            {
                maximumFractionDigits: 2
            }
        ).format(number);


    const currencyValue =
        cleanValue(currency);


    return currencyValue
        ? `${formatted} ${currencyValue}`
        : formatted;

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestampValue(
    timestamp
) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds
    ) {

        return (
            timestamp.seconds * 1000
        );

    }


    const date =
        new Date(timestamp);


    const value =
        date.getTime();


    return Number.isNaN(value)
        ? 0
        : value;

}


/* =========================================================
   TÉLÉPHONE
========================================================= */

function cleanPhone(
    value
) {

    let phone =
        cleanValue(value);


    if (!phone) {
        return "";
    }


    phone =
        phone.replace(
            /[\s().-]/g,
            ""
        );


    if (
        phone.startsWith("+")
    ) {

        phone =
            phone.substring(1);

    }


    if (
        phone.startsWith("0")
    ) {

        phone =
            "243" +
            phone.substring(1);

    }


    return phone;

}


/* =========================================================
   IMAGE VALIDE
========================================================= */

function isValidImageUrl(
    url
) {

    if (!url) {
        return false;
    }


    const value =
        cleanValue(url)
            .toLowerCase();


    if (
        [
            "url1",
            "url2",
            "url3",
            "image",
            "photo",
            "1",
            "logo/photo"
        ].includes(value)
    ) {

        return false;

    }


    return (

        value.startsWith(
            "https://"
        )

        ||

        value.startsWith(
            "http://"
        )

        ||

        value.startsWith(
            "assets/"
        )

        ||

        value.startsWith(
            "./"
        )

        ||

        value.startsWith(
            "/"
        )

    );

}


/* =========================================================
   AFFICHAGE
========================================================= */

function showLoading() {

    profileLoading.classList.remove(
        "hidden"
    );


    profileError.classList.add(
        "hidden"
    );


    profilePage.classList.add(
        "hidden"
    );

}


function showPage() {

    profileLoading.classList.add(
        "hidden"
    );


    profileError.classList.add(
        "hidden"
    );


    profilePage.classList.remove(
        "hidden"
    );

}


function showError(
    message
) {

    profileLoading.classList.add(
        "hidden"
    );


    profilePage.classList.add(
        "hidden"
    );


    profileError.classList.remove(
        "hidden"
    );


    profileErrorMessage.textContent =
        message;

}


/* =========================================================
   HELPERS
========================================================= */

function cleanValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).trim();

}


function escapeHtml(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
