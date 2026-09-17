import { auth, db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    addDoc,
    setDoc,
    deleteDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const FALLBACK_IMAGE =
    "assets/logo/camu-services-logo.png";

const params =
    new URLSearchParams(
        window.location.search
    );

const annonceId =
    cleanValue(
        params.get("id")
    );

let currentAd = null;
let currentUser = null;

let images = [];
let currentImageIndex = 0;


/* =========================================================
   ZOOM PHOTO
========================================================= */

let viewerZoom = 1;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;


/* =========================================================
   DOM
========================================================= */

const explorerLoading =
    document.getElementById(
        "explorerLoading"
    );

const explorerError =
    document.getElementById(
        "explorerError"
    );

const explorerErrorMessage =
    document.getElementById(
        "explorerErrorMessage"
    );

const explorerPage =
    document.getElementById(
        "explorerPage"
    );


const adMainImageContainer =
    document.getElementById(
        "adMainImageContainer"
    );

const adMainImage =
    document.getElementById(
        "adMainImage"
    );

const adThumbnails =
    document.getElementById(
        "adThumbnails"
    );

const galleryPrev =
    document.getElementById(
        "galleryPrev"
    );

const galleryNext =
    document.getElementById(
        "galleryNext"
    );

const imageCounter =
    document.getElementById(
        "imageCounter"
    );


const adCategory =
    document.getElementById(
        "adCategory"
    );

const adTitle =
    document.getElementById(
        "adTitle"
    );

const adPrice =
    document.getElementById(
        "adPrice"
    );

const adLocation =
    document.getElementById(
        "adLocation"
    );

const adDescription =
    document.getElementById(
        "adDescription"
    );

const adDetails =
    document.getElementById(
        "adDetails"
    );


const sellerAvatar =
    document.getElementById(
        "sellerAvatar"
    );

const sellerName =
    document.getElementById(
        "sellerName"
    );

const sellerLocation =
    document.getElementById(
        "sellerLocation"
    );

const sellerProfileButton =
    document.getElementById(
        "sellerProfileButton"
    );


const whatsappButton =
    document.getElementById(
        "whatsappButton"
    );

const phoneButton =
    document.getElementById(
        "phoneButton"
    );

const favoriteButton =
    document.getElementById(
        "favoriteButton"
    );

const reportButton =
    document.getElementById(
        "reportButton"
    );

const adReference =
    document.getElementById(
        "adReference"
    );


/* =========================================================
   PHOTO VIEWER DOM
========================================================= */

const photoViewer =
    document.getElementById(
        "photoViewer"
    );

const photoViewerStage =
    document.getElementById(
        "photoViewerStage"
    );

const viewerImage =
    document.getElementById(
        "viewerImage"
    );

const viewerCounter =
    document.getElementById(
        "viewerCounter"
    );

const viewerPrev =
    document.getElementById(
        "viewerPrev"
    );

const viewerNext =
    document.getElementById(
        "viewerNext"
    );

const viewerClose =
    document.getElementById(
        "viewerClose"
    );

const viewerZoomIn =
    document.getElementById(
        "viewerZoomIn"
    );

const viewerZoomOut =
    document.getElementById(
        "viewerZoomOut"
    );

const viewerZoomReset =
    document.getElementById(
        "viewerZoomReset"
    );


/* =========================================================
   REPORT DOM
========================================================= */

const reportModal =
    document.getElementById(
        "reportModal"
    );

const reportModalClose =
    document.getElementById(
        "reportModalClose"
    );

const reportCancel =
    document.getElementById(
        "reportCancel"
    );

const reportSubmit =
    document.getElementById(
        "reportSubmit"
    );

const reportMessage =
    document.getElementById(
        "reportMessage"
    );


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "CAMU EXPLORER — initialisation..."
        );


        if (!annonceId) {

            showError(
                "Aucune annonce n'a été sélectionnée."
            );

            return;
        }


        setupEvents();

        loadAd();

    }
);


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        currentUser =
            user || null;


        if (
            currentUser &&
            currentAd
        ) {

            loadFavoriteState();

        }

    }
);


/* =========================================================
   CHARGER ANNONCE
========================================================= */

async function loadAd() {

    showLoading();


    try {

        const annonceRef =
            doc(
                db,
                "annonces",
                annonceId
            );


        const snapshot =
            await getDoc(
                annonceRef
            );


        if (
            !snapshot.exists()
        ) {

            showError(
                "Cette annonce n'existe pas ou n'est plus disponible."
            );

            return;
        }


        currentAd = {

            id:
                snapshot.id,

            ...snapshot.data()

        };


        console.log(
            "CAMU EXPLORER — annonce chargée :",
            currentAd
        );


        const status =
            cleanValue(
                currentAd.status
            ).toLowerCase();


        if (
            status &&
            ![
                "active",
                "approved",
                "pending"
            ].includes(status)
        ) {

            showError(
                "Cette annonce n'est plus disponible."
            );

            return;
        }


        renderAd();

        showPage();


        if (currentUser) {

            await loadFavoriteState();

        }


    } catch (error) {

        console.error(
            "CAMU EXPLORER — erreur chargement :",
            error
        );


        showError(
            "Impossible de charger cette annonce."
        );

    }

}


/* =========================================================
   RENDRE ANNONCE
========================================================= */

function renderAd() {

    if (!currentAd) {
        return;
    }


    /* TITRE */

    const title =
        cleanValue(
            currentAd.title ||
            currentAd.name ||
            "Annonce"
        );


    adTitle.textContent =
        title;


    document.title =
        `${title} — CAMU SERVICES`;


    /* CATÉGORIE */

    const category =
        cleanValue(
            currentAd.category ||
            currentAd.commerceCategory ||
            currentAd.typeVehicule ||
            currentAd.hotelType ||
            currentAd.propertyType
        );


    adCategory.textContent =
        category || "Annonce";


    /* PRIX */

    adPrice.textContent =
        formatPrice(
            currentAd.price,
            currentAd.currency
        );


    /* LOCALISATION */

    const city =
        cleanValue(
            currentAd.city ||
            currentAd.ville
        );


    const commune =
        cleanValue(
            currentAd.commune
        );


    const neighborhood =
        cleanValue(
            currentAd.neighborhood ||
            currentAd.quartier
        );


    const locations =
        [
            city,
            commune,
            neighborhood
        ].filter(Boolean);


    adLocation.textContent =
        locations.length
            ? locations.join(" • ")
            : "Localisation non précisée";


    /* DESCRIPTION */

    adDescription.textContent =
        cleanValue(
            currentAd.description
        ) ||
        "Aucune description disponible.";


    /* RÉFÉRENCE */

    adReference.textContent =
        currentAd.id;


    /* IMAGES */

    images =
        extractImages(
            currentAd
        );


    if (!images.length) {

        images = [
            FALLBACK_IMAGE
        ];

    }


    currentImageIndex = 0;


    renderGallery();


    /* DÉTAILS */

    renderDetails();


    /* VENDEUR */

    renderSeller();


    /* CONTACT */

    renderContact();

}


/* =========================================================
   GALERIE
========================================================= */

function renderGallery() {

    if (!images.length) {

        images = [
            FALLBACK_IMAGE
        ];

    }


    renderMainImage();

    renderThumbnails();

    updateGalleryControls();

}


function renderMainImage() {

    const image =
        images[currentImageIndex] ||
        FALLBACK_IMAGE;


    adMainImage.src =
        image;


    adMainImage.alt =
        cleanValue(
            currentAd?.title
        ) ||
        "Photo de l'annonce";


    adMainImage.onerror =
        () => {

            if (
                adMainImage.src.includes(
                    FALLBACK_IMAGE
                )
            ) {

                return;

            }


            adMainImage.src =
                FALLBACK_IMAGE;

        };


    imageCounter.textContent =
        `${currentImageIndex + 1} / ${images.length}`;

}


function renderThumbnails() {

    adThumbnails.innerHTML =
        "";


    images.forEach(
        (image, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "ad-thumbnail";


            if (
                index === currentImageIndex
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.setAttribute(
                "aria-label",
                `Afficher la photo ${index + 1}`
            );


            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image;


            img.alt =
                `Photo ${index + 1}`;


            img.loading =
                "lazy";


            img.onerror =
                () => {

                    img.src =
                        FALLBACK_IMAGE;

                };


            button.appendChild(
                img
            );


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    currentImageIndex =
                        index;

                    renderGallery();

                }
            );


            adThumbnails.appendChild(
                button
            );

        }
    );

}


function updateGalleryControls() {

    const multiple =
        images.length > 1;


    galleryPrev.style.display =
        multiple
            ? "flex"
            : "none";


    galleryNext.style.display =
        multiple
            ? "flex"
            : "none";


    imageCounter.style.display =
        images.length
            ? "flex"
            : "none";

}


function previousImage() {

    if (
        images.length <= 1
    ) {

        return;

    }


    currentImageIndex--;


    if (
        currentImageIndex < 0
    ) {

        currentImageIndex =
            images.length - 1;

    }


    renderGallery();


    if (
        isViewerOpen()
    ) {

        updateViewer();

    }

}


function nextImage() {

    if (
        images.length <= 1
    ) {

        return;

    }


    currentImageIndex++;


    if (
        currentImageIndex >=
        images.length
    ) {

        currentImageIndex = 0;

    }


    renderGallery();


    if (
        isViewerOpen()
    ) {

        updateViewer();

    }

}


/* =========================================================
   EXTRAIRE IMAGES
========================================================= */

function extractImages(ad) {

    let result = [];


    if (
        Array.isArray(ad.images)
    ) {

        result =
            [...ad.images];

    }


    else if (
        typeof ad.images === "string"
    ) {

        const value =
            ad.images.trim();


        if (value) {

            try {

                const parsed =
                    JSON.parse(value);


                if (
                    Array.isArray(parsed)
                ) {

                    result =
                        [...parsed];

                } else {

                    result = [
                        value
                    ];

                }

            } catch {

                result = [
                    value
                ];

            }

        }

    }


    const alternatives = [

        "imageURL",
        "imageUrl",
        "image",
        "photoURL",
        "photoUrl"

    ];


    alternatives.forEach(
        field => {

            const value =
                cleanValue(
                    ad[field]
                );


            if (
                value &&
                !result.includes(value)
            ) {

                result.push(value);

            }

        }
    );


    result =
        result
            .map(
                value =>
                    cleanValue(value)
            )
            .filter(
                isValidImageUrl
            );


    return [
        ...new Set(result)
    ];

}


function isValidImageUrl(url) {

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
            "photo"
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
            "/"
        )

        ||

        value.startsWith(
            "./"
        )

        ||

        value.startsWith(
            "assets/"
        )

    );

}


/* =========================================================
   DÉTAILS
========================================================= */

function renderDetails() {

    const details = [];


    addDetail(
        details,
        "Type de publication",
        currentAd.publicationType
    );


    addDetail(
        details,
        "Type de transaction",
        currentAd.transactionType
    );


    addDetail(
        details,
        "Type de bien",
        currentAd.propertyType
    );


    addDetail(
        details,
        "Catégorie commerce",
        currentAd.commerceCategory
    );


    addDetail(
        details,
        "Type de véhicule",
        currentAd.vehicleType
    );


    addDetail(
        details,
        "Marque",
        currentAd.marque ||
        currentAd.marqueVehicule
    );


    addDetail(
        details,
        "Modèle",
        currentAd.modele
    );


    addDetail(
        details,
        "Année",
        currentAd.annee
    );


    addDetail(
        details,
        "Type d'hébergement",
        currentAd.hotelType
    );


    addDetail(
        details,
        "Devise",
        currentAd.currency
    );


    addDetail(
        details,
        "Nombre de photos",
        currentAd.imageCount
    );


    addDetail(
        details,
        "Vues",
        currentAd.views
    );


    if (!details.length) {

        adDetails.innerHTML = `

            <div class="ad-detail">

                <span class="ad-detail-label">
                    Informations
                </span>

                <strong class="ad-detail-value">
                    Voir la description de l'annonce
                </strong>

            </div>

        `;

        return;
    }


    adDetails.innerHTML =
        details.join("");

}


function addDetail(
    array,
    label,
    value
) {

    const cleaned =
        cleanValue(value);


    if (!cleaned) {
        return;
    }


    array.push(`

        <div class="ad-detail">

            <span class="ad-detail-label">
                ${escapeHtml(label)}
            </span>

            <strong class="ad-detail-value">
                ${escapeHtml(cleaned)}
            </strong>

        </div>

    `);

}


/* =========================================================
   VENDEUR
========================================================= */

function renderSeller() {

    const name =
        cleanValue(
            currentAd.ownerName ||
            currentAd.sellerName ||
            currentAd.name ||
            "Vendeur"
        );


    const city =
        cleanValue(
            currentAd.city ||
            currentAd.ville
        );


    const commune =
        cleanValue(
            currentAd.commune
        );


    sellerName.textContent =
        name;


    sellerLocation.textContent =
        [
            city,
            commune
        ]
        .filter(Boolean)
        .join(" • ") ||
        "Localisation non précisée";


    /* PHOTO VENDEUR */

    const sellerPhoto =
        cleanValue(
            currentAd.ownerPhotoURL ||
            currentAd.ownerPhoto ||
            currentAd.photoURL
        );


    if (
        isValidImageUrl(
            sellerPhoto
        )
    ) {

        sellerAvatar.innerHTML = `

            <img
                src="${escapeHtml(sellerPhoto)}"
                alt="${escapeHtml(name)}"
            >

        `;


        const image =
            sellerAvatar.querySelector(
                "img"
            );


        image.onerror =
            () => {

                sellerAvatar.innerHTML =
                    `<i class="fa-solid fa-user"></i>`;

            };

    } else {

        sellerAvatar.innerHTML =
            `<i class="fa-solid fa-user"></i>`;

    }


    /* =====================================================
       VOIR LE PROFIL
    ===================================================== */

    const sellerId =
        cleanValue(
            currentAd.ownerId ||
            currentAd.userId
        );


    if (sellerId) {

        sellerProfileButton.href =
            `profil.html?id=${encodeURIComponent(sellerId)}`;


        sellerProfileButton.style.display =
            "inline-flex";

    } else {

        sellerProfileButton.removeAttribute(
            "href"
        );


        sellerProfileButton.style.display =
            "none";

    }

}


/* =========================================================
   CONTACT
========================================================= */

function renderContact() {

    const whatsapp =
        cleanPhone(
            currentAd.whatsapp ||
            currentAd.WhatsApp ||
            currentAd.ownerWhatsapp ||
            currentAd.ownerWhatsApp
        );


    const phone =
        cleanPhone(
            currentAd.phone ||
            currentAd.telephone ||
            currentAd.ownerPhone
        );


    if (whatsapp) {

        const message =
            `Bonjour, je suis intéressé(e) par votre annonce "${cleanValue(currentAd.title)}" sur CAMU SERVICES.`;


        whatsappButton.href =
            `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;


        whatsappButton.style.display =
            "flex";

    } else {

        whatsappButton.style.display =
            "none";

    }


    if (phone) {

        phoneButton.href =
            `tel:${phone}`;


        phoneButton.style.display =
            "flex";

    } else {

        phoneButton.style.display =
            "none";

    }

}


/* =========================================================
   FAVORIS
========================================================= */

async function loadFavoriteState() {

    if (
        !currentUser ||
        !currentAd
    ) {

        return;
    }


    try {

        const favoriteId =
            `${currentUser.uid}_${currentAd.id}`;


        const favoriteRef =
            doc(
                db,
                "favorites",
                favoriteId
            );


        const snapshot =
            await getDoc(
                favoriteRef
            );


        setFavoriteActive(
            snapshot.exists()
        );


    } catch (error) {

        console.warn(
            "CAMU EXPLORER — erreur vérification favori :",
            error
        );

    }

}


async function toggleFavorite() {

    if (!currentUser) {

        alert(
            "Connectez-vous pour ajouter cette annonce à vos favoris."
        );


        window.location.href =
            `connexion.html?redirect=${encodeURIComponent(window.location.href)}`;


        return;
    }


    if (!currentAd) {
        return;
    }


    try {

        const favoriteId =
            `${currentUser.uid}_${currentAd.id}`;


        const favoriteRef =
            doc(
                db,
                "favorites",
                favoriteId
            );


        const snapshot =
            await getDoc(
                favoriteRef
            );


        if (
            snapshot.exists()
        ) {

            await deleteDoc(
                favoriteRef
            );


            setFavoriteActive(
                false
            );

        } else {

            await setDoc(
                favoriteRef,
                {

                    userId:
                        currentUser.uid,

                    annonceId:
                        currentAd.id,

                    title:
                        cleanValue(
                            currentAd.title
                        ),

                    imageURL:
                        images[0] || "",

                    createdAt:
                        serverTimestamp()

                }
            );


            setFavoriteActive(
                true
            );

        }


    } catch (error) {

        console.error(
            "CAMU EXPLORER — erreur favori :",
            error
        );


        alert(
            "Impossible de modifier vos favoris."
        );

    }

}


function setFavoriteActive(
    active
) {

    favoriteButton.classList.toggle(
        "active",
        active
    );


    if (active) {

        favoriteButton.innerHTML =
            `<i class="fa-solid fa-heart"></i>`;

        favoriteButton.setAttribute(
            "aria-label",
            "Retirer des favoris"
        );

    } else {

        favoriteButton.innerHTML =
            `<i class="fa-regular fa-heart"></i>`;

        favoriteButton.setAttribute(
            "aria-label",
            "Ajouter aux favoris"
        );

    }

}


/* =========================================================
   PHOTO VIEWER
========================================================= */

function openPhotoViewer() {

    if (
        !images.length
    ) {

        return;
    }


    viewerZoom = 1;

    updateViewer();


    photoViewer.classList.remove(
        "hidden"
    );


    photoViewer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "viewer-open"
    );

}


function closePhotoViewer() {

    photoViewer.classList.add(
        "hidden"
    );


    photoViewer.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "viewer-open"
    );


    viewerZoom = 1;

    updateViewerZoom();

}


function updateViewer() {

    const image =
        images[currentImageIndex] ||
        FALLBACK_IMAGE;


    viewerImage.src =
        image;


    viewerImage.alt =
        cleanValue(
            currentAd?.title
        ) ||
        "Photo de l'annonce";


    viewerCounter.textContent =
        `${currentImageIndex + 1} / ${images.length}`;


    viewerPrev.style.display =
        images.length > 1
            ? "flex"
            : "none";


    viewerNext.style.display =
        images.length > 1
            ? "flex"
            : "none";


    updateViewerZoom();


    viewerImage.onerror =
        () => {

            viewerImage.src =
                FALLBACK_IMAGE;

        };

}


function updateViewerZoom() {

    viewerImage.style.transform =
        `scale(${viewerZoom})`;

}


function zoomIn() {

    viewerZoom =
        Math.min(
            MAX_ZOOM,
            viewerZoom + ZOOM_STEP
        );


    updateViewerZoom();

}


function zoomOut() {

    viewerZoom =
        Math.max(
            MIN_ZOOM,
            viewerZoom - ZOOM_STEP
        );


    updateViewerZoom();

}


function resetZoom() {

    viewerZoom =
        MIN_ZOOM;


    updateViewerZoom();

}


function isViewerOpen() {

    return !photoViewer.classList.contains(
        "hidden"
    );

}


/* =========================================================
   SIGNALER
========================================================= */

function openReportModal() {

    if (!currentAd) {
        return;
    }


    reportModal.classList.remove(
        "hidden"
    );

}


function closeReportModal() {

    reportModal.classList.add(
        "hidden"
    );

}


async function submitReport() {

    if (!currentAd) {
        return;
    }


    if (!currentUser) {

        alert(
            "Connectez-vous pour signaler une annonce."
        );


        closeReportModal();


        window.location.href =
            `connexion.html?redirect=${encodeURIComponent(window.location.href)}`;


        return;
    }


    const selected =
        document.querySelector(
            'input[name="reportReason"]:checked'
        );


    if (!selected) {

        alert(
            "Veuillez sélectionner un motif."
        );

        return;
    }


    const reason =
        cleanValue(
            selected.value
        );


    const message =
        cleanValue(
            reportMessage.value
        );


    try {

        reportSubmit.disabled =
            true;


        reportSubmit.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Envoi...

        `;


        await addDoc(
            collection(
                db,
                "reports"
            ),
            {

                annonceId:
                    currentAd.id,

                userId:
                    currentUser.uid,

                ownerId:
                    cleanValue(
                        currentAd.ownerId ||
                        currentAd.userId
                    ),

                reason,

                message,

                status:
                    "pending",

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Votre signalement a bien été envoyé."
        );


        reportMessage.value =
            "";


        document
            .querySelectorAll(
                'input[name="reportReason"]'
            )
            .forEach(
                input => {

                    input.checked =
                        false;

                }
            );


        closeReportModal();


    } catch (error) {

        console.error(
            "CAMU EXPLORER — erreur signalement :",
            error
        );


        alert(
            "Impossible d'envoyer le signalement."
        );


    } finally {

        reportSubmit.disabled =
            false;


        reportSubmit.innerHTML = `

            <i class="fa-solid fa-flag"></i>

            Envoyer le signalement

        `;

    }

}


/* =========================================================
   AFFICHAGE
========================================================= */

function showLoading() {

    explorerLoading.classList.remove(
        "hidden"
    );


    explorerError.classList.add(
        "hidden"
    );


    explorerPage.classList.add(
        "hidden"
    );

}


function showPage() {

    explorerLoading.classList.add(
        "hidden"
    );


    explorerError.classList.add(
        "hidden"
    );


    explorerPage.classList.remove(
        "hidden"
    );

}


function showError(message) {

    explorerLoading.classList.add(
        "hidden"
    );


    explorerPage.classList.add(
        "hidden"
    );


    explorerError.classList.remove(
        "hidden"
    );


    explorerErrorMessage.textContent =
        message;

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    /* GALERIE */

    galleryPrev?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            previousImage();

        }
    );


    galleryNext?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            nextImage();

        }
    );


    /*
     * Cliquer sur la photo principale
     * ouvre la visionneuse.
     */

    adMainImageContainer?.addEventListener(
        "click",
        event => {

            /*
             * Les flèches sont déjà gérées
             * séparément.
             */

            if (
                event.target.closest(
                    ".gallery-prev"
                ) ||
                event.target.closest(
                    ".gallery-next"
                )
            ) {

                return;

            }


            openPhotoViewer();

        }
    );


    adMainImageContainer?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openPhotoViewer();

            }

        }
    );


    /* FAVORIS */

    favoriteButton?.addEventListener(
        "click",
        toggleFavorite
    );


    /* SIGNALEMENT */

    reportButton?.addEventListener(
        "click",
        openReportModal
    );


    reportModalClose?.addEventListener(
        "click",
        closeReportModal
    );


    reportCancel?.addEventListener(
        "click",
        closeReportModal
    );


    reportSubmit?.addEventListener(
        "click",
        submitReport
    );


    reportModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === reportModal
            ) {

                closeReportModal();

            }

        }
    );


    /* =====================================================
       PHOTO VIEWER
    ====================================================== */

    viewerClose?.addEventListener(
        "click",
        closePhotoViewer
    );


    viewerPrev?.addEventListener(
        "click",
        previousImage
    );


    viewerNext?.addEventListener(
        "click",
        nextImage
    );


    viewerZoomIn?.addEventListener(
        "click",
        zoomIn
    );


    viewerZoomOut?.addEventListener(
        "click",
        zoomOut
    );


    viewerZoomReset?.addEventListener(
        "click",
        resetZoom
    );


    photoViewer?.addEventListener(
        "click",
        event => {

            /*
             * Cliquer sur le fond ferme
             * la visionneuse.
             */

            if (
                event.target === photoViewer ||
                event.target === photoViewerStage
            ) {

                closePhotoViewer();

            }

        }
    );


    /*
     * Molette = zoom.
     */

    photoViewerStage?.addEventListener(
        "wheel",
        event => {

            event.preventDefault();


            if (
                event.deltaY < 0
            ) {

                zoomIn();

            } else {

                zoomOut();

            }

        },
        {
            passive: false
        }
    );


    /*
     * Double clic = zoom.
     */

    viewerImage?.addEventListener(
        "dblclick",
        event => {

            event.preventDefault();


            if (
                viewerZoom === 1
            ) {

                viewerZoom = 2;

            } else {

                viewerZoom = 1;

            }


            updateViewerZoom();

        }
    );


    /*
     * Clavier.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                isViewerOpen()
            ) {

                if (
                    event.key === "Escape"
                ) {

                    closePhotoViewer();

                    return;

                }


                if (
                    event.key === "ArrowLeft"
                ) {

                    previousImage();

                    return;

                }


                if (
                    event.key === "ArrowRight"
                ) {

                    nextImage();

                    return;

                }


                if (
                    event.key === "+"
                    ||
                    event.key === "="
                ) {

                    zoomIn();

                    return;

                }


                if (
                    event.key === "-"
                ) {

                    zoomOut();

                    return;

                }

            }


            if (
                event.key === "Escape" &&
                !isViewerOpen()
            ) {

                closeReportModal();

            }

        }
    );

}


/* =========================================================
   FORMAT PRIX
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


    const numericPrice =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(",", ".")
        );


    if (
        Number.isNaN(
            numericPrice
        )
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
        ).format(
            numericPrice
        );


    const currencyValue =
        cleanValue(currency);


    return currencyValue
        ? `${formatted} ${currencyValue}`
        : formatted;

}


/* =========================================================
   TÉLÉPHONE
========================================================= */

function cleanPhone(value) {

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
   HELPERS
========================================================= */

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).trim();

}


function escapeHtml(value) {

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
