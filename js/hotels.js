/* =========================================================
   CAMU HÔTELS — FICHE ÉTABLISSEMENT
========================================================= */

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


console.log("CAMU HÔTEL — fiche établissement initialisation...");


/* =========================================================
   PARAMÈTRE URL
========================================================= */

const params =
    new URLSearchParams(window.location.search);

const hotelId =
    params.get("id")?.trim() || "";


/* =========================================================
   ÉLÉMENTS DOM
========================================================= */

const hotelLoading =
    document.getElementById("hotelLoading");

const hotelError =
    document.getElementById("hotelError");

const hotelErrorTitle =
    document.getElementById("hotelErrorTitle");

const hotelErrorMessage =
    document.getElementById("hotelErrorMessage");

const hotelContent =
    document.getElementById("hotelContent");

const hotelGallery =
    document.getElementById("hotelGallery");

const hotelPhotosGrid =
    document.getElementById("hotelPhotosGrid");

const hotelName =
    document.getElementById("hotelName");

const hotelCategory =
    document.getElementById("hotelCategory");

const hotelCategoryDetail =
    document.getElementById("hotelCategoryDetail");

const hotelLocation =
    document.getElementById("hotelLocation");

const hotelDescription =
    document.getElementById("hotelDescription");

const hotelAddress =
    document.getElementById("hotelAddress");

const hotelCity =
    document.getElementById("hotelCity");

const hotelCommune =
    document.getElementById("hotelCommune");

const hotelContactName =
    document.getElementById("hotelContactName");

const hotelContactLocation =
    document.getElementById("hotelContactLocation");

const hotelPhone =
    document.getElementById("hotelPhone");

const hotelWhatsapp =
    document.getElementById("hotelWhatsapp");

const hotelPhoneWrapper =
    document.getElementById("hotelPhoneWrapper");

const hotelWhatsappWrapper =
    document.getElementById("hotelWhatsappWrapper");

const hotelPhoneButton =
    document.getElementById("hotelPhoneButton");

const hotelWhatsappButton =
    document.getElementById("hotelWhatsappButton");


/* =========================================================
   MODAL PHOTOS
========================================================= */

const hotelPhotoModal =
    document.getElementById("hotelPhotoModal");

const hotelModalImage =
    document.getElementById("hotelModalImage");

const hotelPhotoClose =
    document.getElementById("hotelPhotoClose");

const hotelPhotoPrev =
    document.getElementById("hotelPhotoPrev");

const hotelPhotoNext =
    document.getElementById("hotelPhotoNext");

const hotelPhotoCounter =
    document.getElementById("hotelPhotoCounter");


/* =========================================================
   VARIABLES
========================================================= */

let hotelPhotos = [];

let currentPhotoIndex = 0;


/* =========================================================
   UTILITAIRES
========================================================= */

function cleanValue(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }

    return String(value).trim();

}


function normalizePhone(phone) {

    let value =
        cleanValue(phone);

    if (!value) {
        return "";
    }

    value =
        value.replace(/[^\d+]/g, "");

    return value;

}


function whatsappUrl(phone) {

    const clean =
        normalizePhone(phone);

    if (!clean) {
        return "";
    }

    const number =
        clean.replace(/\+/g, "");

    return `https://wa.me/${number}`;

}


/* =========================================================
   EXTRAIRE LES PHOTOS
========================================================= */

function extractPhotos(data) {

    const photos = [];


    /* ---------------------------------------------
       photoURL
    --------------------------------------------- */

    const mainPhoto =
        cleanValue(
            data.photoURL
        );

    if (
        mainPhoto &&
        /^https?:\/\//i.test(mainPhoto)
    ) {

        photos.push(mainPhoto);

    }


    /* ---------------------------------------------
       images
    --------------------------------------------- */

    const images =
        data.images;


    if (Array.isArray(images)) {

        images.forEach(image => {

            if (
                typeof image === "string" &&
                /^https?:\/\//i.test(
                    image.trim()
                )
            ) {

                const url =
                    image.trim();

                if (
                    !photos.includes(url)
                ) {

                    photos.push(url);

                }

            }


            if (
                image &&
                typeof image === "object"
            ) {

                const url =
                    cleanValue(
                        image.url ||
                        image.src ||
                        image.secure_url
                    );

                if (
                    url &&
                    /^https?:\/\//i.test(url) &&
                    !photos.includes(url)
                ) {

                    photos.push(url);

                }

            }

        });

    }


    /* ---------------------------------------------
       images JSON string
    --------------------------------------------- */

    if (
        typeof images === "string" &&
        images.trim()
    ) {

        try {

            const parsed =
                JSON.parse(images);

            if (Array.isArray(parsed)) {

                parsed.forEach(image => {

                    const url =
                        typeof image === "string"
                            ? image.trim()
                            : cleanValue(
                                image?.url ||
                                image?.src ||
                                image?.secure_url
                            );

                    if (
                        url &&
                        /^https?:\/\//i.test(url) &&
                        !photos.includes(url)
                    ) {

                        photos.push(url);

                    }

                });

            }

        }

        catch (error) {

            console.warn(
                "CAMU HÔTEL — images JSON invalide :",
                error
            );

        }

    }


    /* ---------------------------------------------
       image1, image2, image3...
    --------------------------------------------- */

    Object.keys(data)
        .filter(key =>
            /^image\d+$/i.test(key)
        )
        .sort()
        .forEach(key => {

            const url =
                cleanValue(data[key]);

            if (
                url &&
                /^https?:\/\//i.test(url) &&
                !photos.includes(url)
            ) {

                photos.push(url);

            }

        });


    return photos;

}


/* =========================================================
   AFFICHER GALERIE PRINCIPALE
========================================================= */

function renderMainGallery() {

    if (!hotelGallery) {
        return;
    }


    hotelGallery.innerHTML = "";


    if (!hotelPhotos.length) {

        hotelGallery.innerHTML = `
            <div class="hotel-gallery-item"
                 style="grid-column:1 / -1; grid-row:1 / -1;">
                <div style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:#888;
                    font-size:15px;
                ">
                    <i class="fa-solid fa-hotel"
                       style="margin-right:8px;">
                    </i>
                    Aucune photo disponible
                </div>
            </div>
        `;

        return;

    }


    const displayPhotos =
        hotelPhotos.slice(0, 4);


    displayPhotos.forEach(
        (photo, index) => {

            const item =
                document.createElement("div");

            item.className =
                "hotel-gallery-item";


            const image =
                document.createElement("img");

            image.src =
                photo;

            image.alt =
                `Photo de l'établissement ${index + 1}`;

            image.loading =
                index === 0
                    ? "eager"
                    : "lazy";


            item.appendChild(image);


            if (
                index === displayPhotos.length - 1 &&
                hotelPhotos.length > 4
            ) {

                const more =
                    document.createElement("div");

                more.className =
                    "hotel-gallery-more";

                more.innerHTML =
                    `<i class="fa-solid fa-images"></i>
                     ${hotelPhotos.length} photos`;

                item.appendChild(more);

            }


            item.addEventListener(
                "click",
                () => openPhoto(index)
            );


            hotelGallery.appendChild(item);

        }
    );

}


/* =========================================================
   AFFICHER PHOTOS
========================================================= */

function renderPhotos() {

    if (!hotelPhotosGrid) {
        return;
    }


    hotelPhotosGrid.innerHTML = "";


    if (!hotelPhotos.length) {

        hotelPhotosGrid.innerHTML = `
            <p style="color:#888;">
                Aucune photo supplémentaire disponible.
            </p>
        `;

        return;

    }


    hotelPhotos.forEach(
        (photo, index) => {

            const item =
                document.createElement("div");

            item.className =
                "hotel-photo-item";


            const image =
                document.createElement("img");

            image.src =
                photo;

            image.alt =
                `Photo ${index + 1}`;

            image.loading =
                "lazy";


            item.appendChild(image);


            item.addEventListener(
                "click",
                () => openPhoto(index)
            );


            hotelPhotosGrid.appendChild(item);

        }
    );

}


/* =========================================================
   MODAL
========================================================= */

function openPhoto(index) {

    if (
        !hotelPhotos.length ||
        !hotelPhotoModal
    ) {

        return;

    }


    currentPhotoIndex =
        Math.max(
            0,
            Math.min(
                index,
                hotelPhotos.length - 1
            )
        );


    updateModal();


    hotelPhotoModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


function closePhoto() {

    hotelPhotoModal?.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


function updateModal() {

    if (!hotelModalImage) {
        return;
    }


    const photo =
        hotelPhotos[currentPhotoIndex];


    if (!photo) {
        return;
    }


    hotelModalImage.src =
        photo;


    hotelModalImage.alt =
        `Photo ${currentPhotoIndex + 1}`;


    if (hotelPhotoCounter) {

        hotelPhotoCounter.textContent =
            `${currentPhotoIndex + 1} / ${hotelPhotos.length}`;

    }

}


function previousPhoto() {

    if (!hotelPhotos.length) {
        return;
    }

    currentPhotoIndex =
        (
            currentPhotoIndex -
            1 +
            hotelPhotos.length
        ) %
        hotelPhotos.length;

    updateModal();

}


function nextPhoto() {

    if (!hotelPhotos.length) {
        return;
    }

    currentPhotoIndex =
        (
            currentPhotoIndex +
            1
        ) %
        hotelPhotos.length;

    updateModal();

}


/* =========================================================
   CONTACTS
========================================================= */

function renderContacts(data) {

    const phoneValue =
        cleanValue(
            data.telephone ||
            data.phone ||
            data.tel
        );


    const whatsappValue =
        cleanValue(
            data.WhatsApp ||
            data.whatsapp ||
            data.whatsappNumber
        );


    /* ---------------------------------------------
       TÉLÉPHONE
    --------------------------------------------- */

    if (phoneValue) {

        if (hotelPhone) {
            hotelPhone.textContent =
                phoneValue;
        }

        if (hotelPhoneWrapper) {
            hotelPhoneWrapper.classList.remove(
                "hidden"
            );
        }

        if (hotelPhoneButton) {

            hotelPhoneButton.href =
                `tel:${normalizePhone(phoneValue)}`;

            hotelPhoneButton.classList.remove(
                "hidden"
            );

        }

    }

    else {

        hotelPhoneWrapper?.classList.add(
            "hidden"
        );

        hotelPhoneButton?.classList.add(
            "hidden"
        );

    }


    /* ---------------------------------------------
       WHATSAPP
    --------------------------------------------- */

    if (whatsappValue) {

        if (hotelWhatsapp) {
            hotelWhatsapp.textContent =
                whatsappValue;
        }

        if (hotelWhatsappWrapper) {
            hotelWhatsappWrapper.classList.remove(
                "hidden"
            );
        }

        if (hotelWhatsappButton) {

            const url =
                whatsappUrl(
                    whatsappValue
                );

            if (url) {

                hotelWhatsappButton.href =
                    url;

                hotelWhatsappButton.classList.remove(
                    "hidden"
                );

            }

        }

    }

    else {

        hotelWhatsappWrapper?.classList.add(
            "hidden"
        );

        hotelWhatsappButton?.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   AFFICHER LES INFORMATIONS
========================================================= */

function renderHotel(data) {

    const name =
        cleanValue(
            data.name ||
            data.nom ||
            data.title
        ) ||
        "Établissement hôtelier";


    const category =
        cleanValue(
            data.category ||
            data.categorie
        ) ||
        "Hôtel";


    const city =
        cleanValue(
            data.ville ||
            data.city
        ) ||
        "—";


    const commune =
        cleanValue(
            data.commune
        ) ||
        "—";


    const address =
        cleanValue(
            data.adresse ||
            data.address
        ) ||
        "Adresse non renseignée";


    const description =
        cleanValue(
            data.description
        ) ||
        "Aucune description disponible pour cet établissement.";


    const locationParts =
        [
            city,
            commune !== "—"
                ? commune
                : ""
        ]
        .filter(Boolean);


    const locationText =
        locationParts.length
            ? locationParts.join(" · ")
            : "Localisation non renseignée";


    if (hotelName) {
        hotelName.textContent =
            name;
    }


    if (hotelContactName) {
        hotelContactName.textContent =
            name;
    }


    if (hotelCategory) {

        hotelCategory.innerHTML =
            `<i class="fa-solid fa-hotel"></i>
             <span>${category}</span>`;

    }


    if (hotelCategoryDetail) {

        hotelCategoryDetail.textContent =
            category;

    }


    if (hotelLocation) {

        hotelLocation.textContent =
            locationText;

    }


    if (hotelContactLocation) {

        hotelContactLocation.textContent =
            locationText;

    }


    if (hotelDescription) {

        hotelDescription.textContent =
            description;

    }


    if (hotelAddress) {

        hotelAddress.textContent =
            address;

    }


    if (hotelCity) {

        hotelCity.textContent =
            city;

    }


    if (hotelCommune) {

        hotelCommune.textContent =
            commune;

    }


    renderContacts(data);

}


/* =========================================================
   CHARGER L'ÉTABLISSEMENT
========================================================= */

async function loadHotel() {

    if (!hotelId) {

        showError(
            "Établissement introuvable",
            "Aucun identifiant d'établissement n'a été fourni."
        );

        return;

    }


    try {

        console.log(
            "CAMU HÔTEL — recherche :",
            hotelId
        );


        const hotelRef =
            doc(
                db,
                "etablissements_hoteliers",
                hotelId
            );


        const snapshot =
            await getDoc(hotelRef);


        if (!snapshot.exists()) {

            console.warn(
                "CAMU HÔTEL — établissement introuvable :",
                hotelId
            );


            showError(
                "Établissement introuvable",
                "Cet établissement n'existe pas ou n'est plus disponible."
            );

            return;

        }


        const data =
            snapshot.data();


        console.log(
            "CAMU HÔTEL — établissement trouvé :",
            hotelId,
            data
        );


        if (
            data.active === false
        ) {

            showError(
                "Établissement indisponible",
                "Cet établissement n'est actuellement pas disponible."
            );

            return;

        }


        renderHotel(data);


        hotelPhotos =
            extractPhotos(data);


        renderMainGallery();

        renderPhotos();


        hideLoading();

        showContent();


        /* ---------------------------------------------
           TITRE
        --------------------------------------------- */

        document.title =
            `${cleanValue(data.name) || "Établissement"} — CAMU HÔTELS`;


        console.log(
            "CAMU HÔTEL — fiche chargée avec succès."
        );

    }

    catch (error) {

        console.error(
            "CAMU HÔTEL — erreur chargement :",
            error
        );


        showError(
            "Erreur de chargement",
            "Impossible de charger les informations de cet établissement."
        );

    }

}


/* =========================================================
   ÉTAT ERREUR
========================================================= */

function showError(
    title,
    message
) {

    if (hotelLoading) {

        hotelLoading.classList.add(
            "hidden"
        );

    }


    if (hotelContent) {

        hotelContent.classList.add(
            "hidden"
        );

    }


    if (hotelError) {

        hotelError.classList.remove(
            "hidden"
        );

    }


    if (hotelErrorTitle) {

        hotelErrorTitle.textContent =
            title;

    }


    if (hotelErrorMessage) {

        hotelErrorMessage.textContent =
            message;

    }

}


/* =========================================================
   AFFICHAGE
========================================================= */

function hideLoading() {

    hotelLoading?.classList.add(
        "hidden"
    );

}


function showContent() {

    hotelContent?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   ÉVÉNEMENTS MODAL
========================================================= */

hotelPhotoClose?.addEventListener(
    "click",
    closePhoto
);

hotelPhotoPrev?.addEventListener(
    "click",
    previousPhoto
);

hotelPhotoNext?.addEventListener(
    "click",
    nextPhoto
);


hotelPhotoModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            hotelPhotoModal
        ) {

            closePhoto();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            hotelPhotoModal?.classList.contains(
                "hidden"
            )
        ) {

            return;

        }


        if (
            event.key === "Escape"
        ) {

            closePhoto();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            previousPhoto();

        }


        if (
            event.key === "ArrowRight"
        ) {

            nextPhoto();

        }

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

loadHotel();
