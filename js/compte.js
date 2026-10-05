/* =========================================================
   CAMU SERVICES — MON COMPTE
   Gestion :
   - Profil utilisateur
   - CAMU TAXI
   - Annonces
   - Abonnement
   - Photo
   - Disponibilité chauffeur
   - Géolocalisation chauffeur
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
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
   VARIABLES
========================================================= */

let currentUser = null;
let currentUserData = null;
let currentTaxiData = null;


/* =========================================================
   DOM
========================================================= */

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const accountAvatarImage =
    document.getElementById("accountAvatarImage");

const accountAvatarDefault =
    document.getElementById("accountAvatarDefault");

const accountStatusText =
    document.getElementById("accountStatusText");

const accountTypeLabel =
    document.getElementById("accountTypeLabel");

const accountSpaceTitle =
    document.getElementById("accountSpaceTitle");

const accountSpaceDescription =
    document.getElementById("accountSpaceDescription");

const accountSpaceIcon =
    document.getElementById("accountSpaceIcon");

const accountVille =
    document.getElementById("accountVille");

const accountCommune =
    document.getElementById("accountCommune");

const accountQuartier =
    document.getElementById("accountQuartier");

const accountQuartierCard =
    document.getElementById("accountQuartierCard");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profilePhone =
    document.getElementById("profilePhone");

const profileWhatsapp =
    document.getElementById("profileWhatsapp");

const profileDescription =
    document.getElementById("profileDescription");


/* =========================================================
   TYPES DE COMPTE
========================================================= */

const ACCOUNT_TYPES = {

    client: {
        name: "Client",
        icon: "fa-solid fa-user",
        description:
            "Votre espace personnel pour rechercher et utiliser les services CAMU."
    },

    immobilier: {
        name: "CAMU IMMO",
        icon: "fa-solid fa-house",
        description:
            "Votre espace professionnel immobilier."
    },

    commerce: {
        name: "CAMU COMMERCE",
        icon: "fa-solid fa-store",
        description:
            "Votre espace professionnel pour présenter votre commerce."
    },

    taxi: {
        name: "CAMU TAXI",
        icon: "fa-solid fa-taxi",
        description:
            "Votre espace chauffeur pour être visible par les clients CAMU et recevoir des demandes de transport."
    },

    hotels: {
        name: "CAMU HÔTELS",
        icon: "fa-solid fa-hotel",
        description:
            "Votre espace professionnel pour présenter votre établissement."
    }

};


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "connexion.html"
            );

            return;
        }

        currentUser = user;

        await loadAccount();

    }
);


/* =========================================================
   CHARGER LE COMPTE
========================================================= */

async function loadAccount() {

    try {

        console.log(
            "CAMU COMPTE — chargement du compte :",
            currentUser.uid
        );

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const userSnapshot =
            await getDoc(userRef);

        if (!userSnapshot.exists()) {

            console.warn(
                "CAMU COMPTE — document users introuvable."
            );

            currentUserData = {

                uid:
                    currentUser.uid,

                name:
                    currentUser.displayName ||
                    "Utilisateur",

                email:
                    currentUser.email ||
                    "",

                phone:
                    "",

                whatsapp:
                    "",

                accountType:
                    "client"

            };

        } else {

            currentUserData =
                userSnapshot.data();

        }

        renderAccount();

        await loadMyAds();

        await loadSubscription();

        if (
            currentUserData.accountType ===
            "taxi"
        ) {

            await loadTaxiProfile();

        }

        console.log(
            "CAMU COMPTE — compte chargé."
        );

    }

    catch (error) {

        console.error(
            "CAMU COMPTE — erreur chargement :",
            error
        );

        showAccountMessage(
            "Impossible de charger toutes les informations du compte.",
            "error"
        );

    }

}


/* =========================================================
   AFFICHER COMPTE
========================================================= */

function renderAccount() {

    const data =
        currentUserData;

    const accountType =
        data.accountType ||
        "client";

    const info =
        ACCOUNT_TYPES[accountType] ||
        ACCOUNT_TYPES.client;

    const name =
        data.name ||
        data.fullName ||
        currentUser.displayName ||
        "Utilisateur";

    const email =
        data.email ||
        currentUser.email ||
        "";


    /* ---------------------------------------------
       IDENTITÉ
    --------------------------------------------- */

    setText(
        accountName,
        name
    );

    setText(
        accountEmail,
        email
    );

    setText(
        profileName,
        name
    );

    setText(
        profileEmail,
        email
    );

    setText(
        profilePhone,
        data.phone || "—"
    );

    setText(
        profileWhatsapp,
        data.whatsapp ||
        data.WhatsApp ||
        data.phone ||
        "—"
    );

    setText(
        profileDescription,
        data.description ||
        "Aucune description renseignée."
    );


    /* ---------------------------------------------
       ESPACE
    --------------------------------------------- */

    setText(
        accountTypeLabel,
        info.name
    );

    setText(
        accountSpaceTitle,
        info.name
    );

    setText(
        accountSpaceDescription,
        info.description
    );

    if (accountSpaceIcon) {

        accountSpaceIcon.className =
            info.icon;

    }


    /* ---------------------------------------------
       LOCALISATION
    --------------------------------------------- */

    setText(
        accountVille,
        data.ville || "—"
    );

    setText(
        accountCommune,
        data.commune || "—"
    );

    if (data.quartier) {

        setText(
            accountQuartier,
            data.quartier
        );

        if (accountQuartierCard) {
            accountQuartierCard.hidden =
                false;
        }

    } else {

        if (accountQuartierCard) {
            accountQuartierCard.hidden =
                true;
        }

    }


    /* ---------------------------------------------
       PHOTO
    --------------------------------------------- */

    const photoURL =
        data.photoURL ||
        currentUser.photoURL ||
        "";

    displayAvatar(
        photoURL
    );


    /* ---------------------------------------------
       STATUT
    --------------------------------------------- */

    const status =
        data.accountStatus ||
        "active";

    if (
        status ===
        "pending"
    ) {

        setText(
            accountStatusText,
            "Profil en attente de validation"
        );

    } else {

        setText(
            accountStatusText,
            "Compte actif"
        );

    }


    /* ---------------------------------------------
       ADAPTATION TAXI
    --------------------------------------------- */

    if (
        accountType ===
        "taxi"
    ) {

        activateTaxiAccountContent();

    } else {

        deactivateTaxiAccountContent();

    }

}


/* =========================================================
   CONTENU NON TAXI
========================================================= */

function deactivateTaxiAccountContent() {

    const taxiSection =
        document.getElementById(
            "taxiAccountSection"
        );

    if (taxiSection) {

        taxiSection.hidden =
            true;

    }

    setText(
        document.getElementById(
            "quickAdsTitle"
        ),
        "Mes annonces"
    );

    setText(
        document.getElementById(
            "quickAdsDescription"
        ),
        "Gérer mes publications"
    );

    setText(
        document.getElementById(
            "quickPublishTitle"
        ),
        "Publier une annonce"
    );

    setText(
        document.getElementById(
            "quickPublishDescription"
        ),
        "Créer une nouvelle publication"
    );


    const quickAds =
        document.getElementById(
            "quickAdsAction"
        );

    if (quickAds) {

        quickAds.href =
            "#mes-annonces";

    }


    const quickPublish =
        document.getElementById(
            "quickPublishAction"
        );

    if (quickPublish) {

        quickPublish.href =
            "publier.html";

    }


    const publishButton =
        document.getElementById(
            "publishAdsButton"
        );

    if (publishButton) {

        publishButton.href =
            "publier.html";

        publishButton.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            Publier une annonce
        `;

    }

}


/* =========================================================
   CONTENU CAMU TAXI
========================================================= */

function activateTaxiAccountContent() {

    const taxiSection =
        document.getElementById(
            "taxiAccountSection"
        );

    if (taxiSection) {

        taxiSection.hidden =
            false;

    }

    setText(
        document.getElementById(
            "quickAdsTitle"
        ),
        "Mon profil chauffeur"
    );

    setText(
        document.getElementById(
            "quickAdsDescription"
        ),
        "Gérer mon profil CAMU TAXI"
    );

    const quickAds =
        document.getElementById(
            "quickAdsAction"
        );

    if (quickAds) {

        quickAds.href =
            "#taxiAccountSection";

    }

    setText(
        document.getElementById(
            "quickPublishTitle"
        ),
        "CAMU TAXI"
    );

    setText(
        document.getElementById(
            "quickPublishDescription"
        ),
        "Trouver les clients et gérer ma disponibilité"
    );

    const quickPublish =
        document.getElementById(
            "quickPublishAction"
        );

    if (quickPublish) {

        quickPublish.href =
            "camu-taxi.html";

    }

    const publishButton =
        document.getElementById(
            "publishAdsButton"
        );

    if (publishButton) {

        publishButton.href =
            "camu-taxi.html";

        publishButton.innerHTML = `
            <i class="fa-solid fa-taxi"></i>
            CAMU TAXI
        `;

    }

    const servicePublishCard =
        document.getElementById(
            "servicePublishCard"
        );

    if (servicePublishCard) {

        servicePublishCard.href =
            "camu-taxi.html";

        servicePublishCard.innerHTML = `
            <i class="fa-solid fa-taxi"></i>

            <strong>
                CAMU TAXI
            </strong>

            <span>
                Accéder à mon espace chauffeur
            </span>
        `;

    }

}


/* =========================================================
   CHARGER PROFIL CHAUFFEUR
========================================================= */

async function loadTaxiProfile() {

    const taxiSection =
        document.getElementById(
            "taxiAccountSection"
        );

    if (!taxiSection) {
        return;
    }

    try {

        const taxiRef =
            doc(
                db,
                "chauffeurs",
                currentUser.uid
            );

        const taxiSnapshot =
            await getDoc(
                taxiRef
            );

        if (!taxiSnapshot.exists()) {

            console.warn(
                "CAMU TAXI — profil chauffeur introuvable."
            );

            currentTaxiData = null;

            showTaxiNotConfigured();

            return;

        }

        currentTaxiData =
            taxiSnapshot.data();

        renderTaxiProfile();

    }

    catch (error) {

        console.error(
            "CAMU TAXI — erreur profil chauffeur :",
            error
        );

        showTaxiNotConfigured();

    }

}


/* =========================================================
   AFFICHER PROFIL TAXI
========================================================= */

function renderTaxiProfile() {

    const taxi =
        currentTaxiData;

    if (!taxi) {
        return;
    }


    setText(
        document.getElementById(
            "taxiVehicleType"
        ),
        taxi.typeVehicule ||
        taxi.typeVehicle ||
        "—"
    );

    setText(
        document.getElementById(
            "taxiVehicleBrand"
        ),
        taxi.marqueVehicule ||
        taxi.vehicleBrand ||
        "—"
    );

    setText(
        document.getElementById(
            "taxiVehiclePlate"
        ),
        taxi.plaque ||
        taxi.plate ||
        "—"
    );

    setText(
        document.getElementById(
            "taxiWhatsapp"
        ),
        taxi.WhatsApp ||
        taxi.whatsapp ||
        taxi.phone ||
        "—"
    );

    setText(
        document.getElementById(
            "taxiDescription"
        ),
        taxi.description ||
        "Aucune présentation renseignée."
    );


    if (taxi.quartier) {

        setText(
            accountQuartier,
            taxi.quartier
        );

        if (accountQuartierCard) {
            accountQuartierCard.hidden =
                false;
        }

    }


    setText(
        document.getElementById(
            "taxiDriverPhotoStatus"
        ),
        taxi.photoURL
            ? "Photo enregistrée"
            : "Aucune photo"
    );

    setText(
        document.getElementById(
            "taxiVehiclePhotoStatus"
        ),
        taxi.photoVehicule ||
        taxi.photoVehicle
            ? "Photo enregistrée"
            : "Aucune photo"
    );


    renderTaxiAvailability();

    renderTaxiLocation();

}


/* =========================================================
   STATUT TAXI SANS PROFIL
========================================================= */

function showTaxiNotConfigured() {

    setText(
        document.getElementById(
            "taxiStatus"
        ),
        "Profil en attente"
    );

    setText(
        document.getElementById(
            "taxiStatusInfo"
        ),
        "Votre profil chauffeur CAMU TAXI n'est pas encore disponible."
    );

    setText(
        document.getElementById(
            "taxiLocationText"
        ),
        "Position non enregistrée"
    );

}


/* =========================================================
   DISPONIBILITÉ TAXI
========================================================= */

function renderTaxiAvailability() {

    const available =
        currentTaxiData?.disponible === true;

    const status =
        document.getElementById(
            "taxiStatus"
        );

    const statusInfo =
        document.getElementById(
            "taxiStatusInfo"
        );

    const button =
        document.getElementById(
            "taxiAvailabilityButton"
        );

    if (available) {

        setText(
            status,
            "Disponible"
        );

        setText(
            statusInfo,
            "Les clients peuvent voir votre disponibilité."
        );

        if (button) {

            button.innerHTML = `
                <i class="fa-solid fa-toggle-on"></i>
                Passer indisponible
            `;

        }

    } else {

        setText(
            status,
            "Indisponible"
        );

        setText(
            statusInfo,
            "Vous n'êtes actuellement pas disponible pour les clients."
        );

        if (button) {

            button.innerHTML = `
                <i class="fa-solid fa-toggle-off"></i>
                Devenir disponible
            `;

        }

    }

}


/* =========================================================
   CHANGER DISPONIBILITÉ
========================================================= */

const taxiAvailabilityButton =
    document.getElementById(
        "taxiAvailabilityButton"
    );

if (taxiAvailabilityButton) {

    taxiAvailabilityButton.addEventListener(
        "click",
        toggleTaxiAvailability
    );

}


async function toggleTaxiAvailability() {

    if (
        !currentUser ||
        !currentTaxiData
    ) {
        return;
    }

    const newStatus =
        currentTaxiData.disponible !== true;

    try {

        taxiAvailabilityButton.disabled =
            true;

        await updateDoc(

            doc(
                db,
                "chauffeurs",
                currentUser.uid
            ),

            {
                disponible:
                    newStatus,

                updatedAt:
                    serverTimestamp()
            }

        );

        currentTaxiData.disponible =
            newStatus;

        renderTaxiAvailability();

        showAccountMessage(
            newStatus
                ? "Vous êtes maintenant disponible sur CAMU TAXI."
                : "Vous êtes maintenant indisponible sur CAMU TAXI.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "CAMU TAXI — erreur disponibilité :",
            error
        );

        showAccountMessage(
            "Impossible de modifier votre disponibilité.",
            "error"
        );

    }

    finally {

        taxiAvailabilityButton.disabled =
            false;

    }

}


/* =========================================================
   GÉOLOCALISATION TAXI
========================================================= */

const taxiLocationButton =
    document.getElementById(
        "taxiLocationButton"
    );

if (taxiLocationButton) {

    taxiLocationButton.addEventListener(
        "click",
        updateTaxiLocation
    );

}


function updateTaxiLocation() {

    if (
        !currentUser ||
        !currentTaxiData
    ) {
        return;
    }

    if (!navigator.geolocation) {

        showAccountMessage(
            "La géolocalisation n'est pas disponible sur cet appareil.",
            "error"
        );

        return;

    }

    taxiLocationButton.disabled =
        true;

    setText(
        document.getElementById(
            "taxiLocationText"
        ),
        "Recherche de votre position..."
    );

    navigator.geolocation.getCurrentPosition(

        async position => {

            try {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                await updateDoc(

                    doc(
                        db,
                        "chauffeurs",
                        currentUser.uid
                    ),

                    {
                        latitude,
                        longitude,

                        lastLocationUpdate:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }

                );

                currentTaxiData.latitude =
                    latitude;

                currentTaxiData.longitude =
                    longitude;

                renderTaxiLocation();

                showAccountMessage(
                    "Votre position a été mise à jour.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    "CAMU TAXI — erreur mise à jour position :",
                    error
                );

                showAccountMessage(
                    "Impossible d'enregistrer votre position.",
                    "error"
                );

            }

            finally {

                taxiLocationButton.disabled =
                    false;

            }

        },

        error => {

            console.error(
                "CAMU TAXI — géolocalisation :",
                error
            );

            setText(
                document.getElementById(
                    "taxiLocationText"
                ),
                "Position non disponible"
            );

            showAccountMessage(
                getGeolocationErrorMessage(
                    error
                ),
                "error"
            );

            taxiLocationButton.disabled =
                false;

        },

        {
            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                60000
        }

    );

}


/* =========================================================
   AFFICHER POSITION
========================================================= */

function renderTaxiLocation() {

    const text =
        document.getElementById(
            "taxiLocationText"
        );

    if (!text) {
        return;
    }

    const latitude =
        currentTaxiData?.latitude;

    const longitude =
        currentTaxiData?.longitude;

    if (
        typeof latitude === "number" &&
        typeof longitude === "number"
    ) {

        text.textContent =
            `Position enregistrée : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    } else {

        text.textContent =
            "Position non enregistrée";

    }

}


/* =========================================================
   PHOTO DE PROFIL
========================================================= */

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        uploadProfilePhoto
    );

}


async function uploadProfilePhoto() {

    const file =
        profilePhotoInput?.files?.[0];

    if (!file) {
        return;
    }

    if (
        ![
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.type)
    ) {

        showAccountMessage(
            "Utilisez une image JPG, PNG ou WEBP.",
            "error"
        );

        profilePhotoInput.value =
            "";

        return;

    }

    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showAccountMessage(
            "La photo ne doit pas dépasser 5 MB.",
            "error"
        );

        profilePhotoInput.value =
            "";

        return;

    }

    try {

        showAccountMessage(
            "Téléversement de la photo...",
            "info"
        );

        const photoURL =
            await uploadImage(
                file,
                "camu-services/profiles"
            );

        await updateProfile(
            currentUser,
            {
                photoURL
            }
        );

        await updateDoc(

            doc(
                db,
                "users",
                currentUser.uid
            ),

            {
                photoURL,

                updatedAt:
                    serverTimestamp()
            }

        );

        currentUserData.photoURL =
            photoURL;

        displayAvatar(
            photoURL
        );

        showAccountMessage(
            "Photo de profil mise à jour.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "CAMU COMPTE — photo :",
            error
        );

        showAccountMessage(
            "Impossible de mettre à jour la photo.",
            "error"
        );

    }

    finally {

        profilePhotoInput.value =
            "";

    }

}


/* =========================================================
   UPLOAD CLOUDINARY
========================================================= */

async function uploadImage(
    file,
    folder
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
        folder
    );

    const response =
        await fetch(
            CLOUDINARY_UPLOAD_URL,
            {
                method:
                    "POST",

                body:
                    formData
            }
        );

    const result =
        await response.json();

    if (
        !response.ok ||
        !result.secure_url
    ) {

        throw new Error(
            "Échec Cloudinary."
        );

    }

    return result.secure_url;

}


/* =========================================================
   AFFICHER AVATAR
========================================================= */

function displayAvatar(
    photoURL
) {

    if (
        photoURL &&
        isValidImageURL(
            photoURL
        )
    ) {

        if (accountAvatarImage) {

            accountAvatarImage.src =
                photoURL;

            accountAvatarImage.style.display =
                "block";

        }

        if (accountAvatarDefault) {

            accountAvatarDefault.style.display =
                "none";

        }

    } else {

        if (accountAvatarImage) {

            accountAvatarImage.src =
                "";

            accountAvatarImage.style.display =
                "none";

        }

        if (accountAvatarDefault) {

            accountAvatarDefault.style.display =
                "flex";

        }

    }

}


/* =========================================================
   MES ANNONCES
========================================================= */

async function loadMyAds() {

    const container =
        document.getElementById(
            "myAdsContainer"
        );

    const empty =
        document.getElementById(
            "myAdsEmpty"
        );

    const count =
        document.getElementById(
            "myAdsCount"
        );

    if (!container) {
        return;
    }

    try {

        container.innerHTML = `

            <div class="loading-state">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Chargement...

            </div>

        `;


        const adsQuery =
            query(

                collection(
                    db,
                    "annonces"
                ),

                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(50)

            );


        const snapshot =
            await getDocs(
                adsQuery
            );


        const ads = [];


        snapshot.forEach(
            item => {

                ads.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        if (count) {

            count.textContent =
                ads.length;

        }


        if (!ads.length) {

            container.innerHTML =
                "";

            if (empty) {

                empty.hidden =
                    false;

            }

            return;

        }


        if (empty) {

            empty.hidden =
                true;

        }


        container.innerHTML =
            ads
                .map(
                    renderAdCard
                )
                .join("");


    }

    catch (error) {

        console.error(
            "CAMU COMPTE — annonces :",
            error
        );

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Impossible de charger vos annonces
                </h3>

                <p>
                    Réessayez plus tard.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   CARTE ANNONCE
   CORRECTION :
   - carte compacte
   - carte entièrement cliquable
   - ouverture des détails
   - image
   - ville
   - commune
   - statut
========================================================= */

function renderAdCard(ad) {

    const title =
        escapeHtml(
            ad.title ||
            ad.nom ||
            ad.name ||
            "Annonce sans titre"
        );


    const city =
        escapeHtml(
            ad.ville ||
            ad.city ||
            ""
        );


    const commune =
        escapeHtml(
            ad.commune ||
            ""
        );


    const image =
        getValidImage(
            ad.imageURL ||
            ad.imageUrl ||
            ad.photoURL ||
            ad.image ||
            ad.images?.[0]
        );


    const status =
        escapeHtml(
            ad.status ||
            "active"
        );


    const location =
        [city, commune]
            .filter(Boolean)
            .join(" • ");


    /*
       IMPORTANT :
       On ouvre l'annonce avec son ID Firestore.
       La page explorer.html?id=... doit ensuite
       charger les détails de cette annonce.
    */

    const detailsUrl =
        `explorer.html?id=${encodeURIComponent(ad.id)}`;


    return `

        <a
            href="${detailsUrl}"
            class="my-ad-card"
            aria-label="Voir les détails de ${title}"
        >

            ${
                image

                    ? `

                        <div class="my-ad-image">

                            <img
                                src="${escapeAttribute(image)}"
                                alt="${title}"
                                loading="lazy"
                            >

                        </div>

                    `

                    : `

                        <div class="my-ad-image my-ad-image-empty">

                            <i class="fa-solid fa-image"></i>

                        </div>

                    `
            }


            <div class="my-ad-content">

                <h3>
                    ${title}
                </h3>


                ${
                    location

                        ? `

                            <p class="my-ad-location">

                                <i class="fa-solid fa-location-dot"></i>

                                ${location}

                            </p>

                        `

                        : ""
                }


                <div class="my-ad-footer">

                    <span class="my-ad-status">

                        ${status}

                    </span>


                    <span class="my-ad-details">

                        Voir les détails

                        <i class="fa-solid fa-arrow-right"></i>

                    </span>

                </div>

            </div>

        </a>

    `;

}


/* =========================================================
   ABONNEMENT
========================================================= */

async function loadSubscription() {

    const plan =
        document.getElementById(
            "subscriptionPlan"
        );

    const info =
        document.getElementById(
            "subscriptionInfo"
        );

    const days =
        document.getElementById(
            "subscriptionDays"
        );

    if (!plan) {
        return;
    }

    try {

        const snapshot =
            await getDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                )

            );

        const data =
            snapshot.exists()
                ? snapshot.data()
                : {};

        const currentPlan =
            data.plan ||
            "Gratuit";

        const subscriptionStatus =
            data.subscriptionStatus ||
            "active";

        setText(
            plan,
            currentPlan
        );

        setText(
            info,
            getSubscriptionText(
                subscriptionStatus,
                data
            )
        );

        if (
            days &&
            data.subscriptionEnd
        ) {

            const endDate =
                convertFirestoreDate(
                    data.subscriptionEnd
                );

            if (endDate) {

                const remaining =
                    Math.ceil(
                        (
                            endDate.getTime() -
                            Date.now()
                        ) /
                        86400000
                    );

                if (remaining > 0) {

                    days.textContent =
                        `${remaining} jour(s) restant(s)`;

                } else {

                    days.textContent =
                        "Abonnement expiré";

                }

            }

        }

    }

    catch (error) {

        console.error(
            "CAMU COMPTE — abonnement :",
            error
        );

        setText(
            plan,
            "Gratuit"
        );

        setText(
            info,
            "Aucune information d'abonnement disponible."
        );

    }

}


/* =========================================================
   MODIFICATION PROFIL
========================================================= */

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const profileEditSection =
    document.getElementById(
        "profileEditSection"
    );

const cancelEditProfileButton =
    document.getElementById(
        "cancelEditProfileButton"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );


editProfileButton?.addEventListener(
    "click",
    () => {

        fillEditForm();

        profileEditSection?.classList.remove(
            "hidden"
        );

        profileEditSection?.scrollIntoView({
            behavior:
                "smooth"
        });

    }
);


cancelEditProfileButton?.addEventListener(
    "click",
    () => {

        profileEditSection?.classList.add(
            "hidden"
        );

    }
);


function fillEditForm() {

    setInputValue(
        "editName",
        currentUserData?.name ||
        currentUser.displayName ||
        ""
    );

    setInputValue(
        "editPhone",
        currentUserData?.phone ||
        ""
    );

    setInputValue(
        "editWhatsapp",
        currentUserData?.whatsapp ||
        currentUserData?.WhatsApp ||
        ""
    );

    setInputValue(
        "editDescription",
        currentUserData?.description ||
        ""
    );

}


/* =========================================================
   ENREGISTRER PROFIL
========================================================= */

profileForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const name =
            getInputValue(
                "editName"
            );

        const phone =
            getInputValue(
                "editPhone"
            );

        const whatsapp =
            getInputValue(
                "editWhatsapp"
            );

        const description =
            getInputValue(
                "editDescription"
            );

        if (!name) {

            showAccountMessage(
                "Veuillez renseigner votre nom.",
                "error"
            );

            return;

        }

        try {

            const button =
                profileForm.querySelector(
                    "button[type='submit']"
                );

            if (button) {

                button.disabled =
                    true;

            }


            await updateProfile(
                currentUser,
                {
                    displayName:
                        name
                }
            );


            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {

                    name,

                    phone,

                    whatsapp,

                    description,

                    updatedAt:
                        serverTimestamp()

                }

            );


            currentUserData.name =
                name;

            currentUserData.phone =
                phone;

            currentUserData.whatsapp =
                whatsapp;

            currentUserData.description =
                description;


            /* -----------------------------------------
               SI TAXI : synchroniser chauffeurs
            ----------------------------------------- */

            if (
                currentUserData.accountType ===
                "taxi"
            ) {

                try {

                    await updateDoc(

                        doc(
                            db,
                            "chauffeurs",
                            currentUser.uid
                        ),

                        {

                            name,

                            phone,

                            WhatsApp:
                                whatsapp,

                            description,

                            updatedAt:
                                serverTimestamp()

                        }

                    );

                }

                catch (taxiError) {

                    console.warn(
                        "CAMU TAXI — synchronisation profil impossible :",
                        taxiError
                    );

                }


                if (currentTaxiData) {

                    currentTaxiData.name =
                        name;

                    currentTaxiData.phone =
                        phone;

                    currentTaxiData.WhatsApp =
                        whatsapp;

                    currentTaxiData.description =
                        description;

                }

            }


            renderAccount();


            if (
                currentUserData.accountType ===
                "taxi"
            ) {

                renderTaxiProfile();

            }


            profileEditSection?.classList.add(
                "hidden"
            );


            showAccountMessage(
                "Votre profil a été mis à jour.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "CAMU COMPTE — modification :",
                error
            );

            showAccountMessage(
                "Impossible de mettre à jour votre profil.",
                "error"
            );

        }

        finally {

            const button =
                profileForm.querySelector(
                    "button[type='submit']"
                );

            if (button) {

                button.disabled =
                    false;

            }

        }

    }
);


/* =========================================================
   DÉCONNEXION
========================================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            logoutButton.disabled =
                true;

            await signOut(
                auth
            );

            window.location.replace(
                "connexion.html"
            );

        }

        catch (error) {

            console.error(
                "CAMU COMPTE — déconnexion :",
                error
            );

            logoutButton.disabled =
                false;

            showAccountMessage(
                "Impossible de vous déconnecter.",
                "error"
            );

        }

    }
);


/* =========================================================
   ANNÉE
========================================================= */

const accountYear =
    document.getElementById(
        "accountYear"
    );

if (accountYear) {

    accountYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   UTILITAIRES
========================================================= */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }

    element.textContent =
        value ??
        "—";

}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.value =
            value ?? "";

    }

}


function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );

    return String(
        element?.value ||
        ""
    ).trim();

}


function isValidImageURL(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );

        return (
            parsed.protocol ===
                "http:" ||

            parsed.protocol ===
                "https:"
        );

    }

    catch {

        return false;

    }

}


function getValidImage(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }

    const url =
        value.trim();

    return isValidImageURL(
        url
    )
        ? url
        : "";

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


function convertFirestoreDate(
    value
) {

    if (!value) {
        return null;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }

    if (
        value instanceof Date
    ) {

        return value;

    }

    const date =
        new Date(
            value
        );

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


/* =========================================================
   TEXTE ABONNEMENT
========================================================= */

function getSubscriptionText(
    status,
    data
) {

    if (
        status ===
        "active"
    ) {

        return "Votre abonnement est actuellement actif.";

    }

    if (
        status ===
        "pending"
    ) {

        return "Votre demande d'abonnement est en attente de validation.";

    }

    if (
        status ===
        "expired"
    ) {

        return "Votre abonnement est arrivé à expiration.";

    }

    return "Votre formule actuelle est disponible dans votre espace.";

}


/* =========================================================
   ERREUR GÉOLOCALISATION
========================================================= */

function getGeolocationErrorMessage(
    error
) {

    if (
        error?.code ===
        1
    ) {

        return "Autorisez l'accès à votre position pour utiliser cette fonction.";

    }

    if (
        error?.code ===
        2
    ) {

        return "Votre position n'a pas pu être déterminée.";

    }

    if (
        error?.code ===
        3
    ) {

        return "La recherche de votre position a pris trop de temps.";

    }

    return "Impossible d'obtenir votre position.";

}


/* =========================================================
   MESSAGE COMPTE
========================================================= */

function showAccountMessage(
    message,
    type = "info"
) {

    let element =
        document.getElementById(
            "accountDynamicMessage"
        );

    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "accountDynamicMessage";

        element.className =
            "signup-message show";

        document
            .querySelector(
                ".account-container"
            )
            ?.prepend(
                element
            );

    }

    element.textContent =
        message;

    element.className =
        `signup-message show ${type}`;

    setTimeout(
        () => {

            element.classList.remove(
                "show"
            );

        },
        4000
    );

}


/* =========================================================
   FIN
========================================================= */

console.log(
    "CAMU COMPTE — module initialisé."
);
