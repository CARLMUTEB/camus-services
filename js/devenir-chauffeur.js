/* =========================================================
   CAMU SERVICES — DEVENIR CHAUFFEUR CAMU TAXI
   js/devenir-chauffeur.js
   ========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "lc9jiidc";
const CLOUDINARY_UPLOAD_PRESET = "camu_services";

const CLOUDINARY_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;
let existingDriver = null;

let driverLatitude = null;
let driverLongitude = null;

let driverPhotoUrl = "";
let driverVehiclePhotoUrl = "";

let selectedDriverPhoto = null;
let selectedVehiclePhoto = null;


/* =========================================================
   VILLES / COMMUNES
   ========================================================= */

const zonesParVille = {
    "Lubumbashi": [
        "Annexe",
        "Kamalondo",
        "Kampemba",
        "Katuba",
        "Kenya",
        "Lubumbashi",
        "Ruashi"
    ],

    "Likasi": [
        "Kikula",
        "Likasi",
        "Panda",
        "Shituru"
    ],

    "Kolwezi": [
        "Dilala",
        "Manika"
    ],

    "Kipushi": [
        "Kipushi"
    ],

    "Kasumbalesa": [
        "Musumali",
        "Musoshi",
        "Lwina"
    ],

    "Fungurume": [
        "Fungurume"
    ]
};


/* =========================================================
   DOM
   ========================================================= */

const driverForm =
    document.getElementById("driverForm");

const driverLoading =
    document.getElementById("driverLoading");

const driverMessage =
    document.getElementById("driverMessage");

const driverSubmit =
    document.getElementById("driverSubmit");

const driverYear =
    document.getElementById("driverYear");

const driverSidebar =
    document.getElementById("driverSidebar");

const driverOverlay =
    document.getElementById("driverOverlay");

const driverMenuButton =
    document.getElementById("driverMenuButton");

const driverVille =
    document.getElementById("driverVille");

const driverCommune =
    document.getElementById("driverCommune");

const driverGetLocation =
    document.getElementById("driverGetLocation");

const driverLocationStatus =
    document.getElementById("driverLocationStatus");

const driverPhoto =
    document.getElementById("driverPhoto");

const driverVehiclePhoto =
    document.getElementById("driverVehiclePhoto");

const driverPhotoPreview =
    document.getElementById("driverPhotoPreview");

const driverVehiclePhotoPreview =
    document.getElementById("driverVehiclePhotoPreview");

const driverPhotoPlaceholder =
    document.getElementById("driverPhotoPlaceholder");

const driverVehiclePhotoPlaceholder =
    document.getElementById("driverVehiclePhotoPlaceholder");

const driverAvailable =
    document.getElementById("driverAvailable");


/* =========================================================
   ANNÉE
   ========================================================= */

if (driverYear) {
    driverYear.textContent = new Date().getFullYear();
}


/* =========================================================
   SIDEBAR MOBILE
   ========================================================= */

function openSidebar() {
    driverSidebar?.classList.add("open");
    driverOverlay?.classList.add("open");

    driverMenuButton?.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow = "hidden";
}


function closeSidebar() {
    driverSidebar?.classList.remove("open");
    driverOverlay?.classList.remove("open");

    driverMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}


driverMenuButton?.addEventListener(
    "click",
    () => {

        if (
            driverSidebar?.classList.contains("open")
        ) {
            closeSidebar();
        } else {
            openSidebar();
        }

    }
);


driverOverlay?.addEventListener(
    "click",
    closeSidebar
);


document
    .querySelectorAll(".driver-sidebar-nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!driverMessage) return;

    driverMessage.textContent = message;

    driverMessage.className =
        `driver-message ${type}`;

    driverMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function clearMessage() {

    if (!driverMessage) return;

    driverMessage.textContent = "";

    driverMessage.className =
        "driver-message";

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    driverLoading?.classList.remove("hidden");

    driverForm?.classList.add("hidden");
}


function hideLoading() {

    driverLoading?.classList.add("hidden");

    driverForm?.classList.remove("hidden");
}


/* =========================================================
   NORMALISATION
   ========================================================= */

function normalizePhone(value) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, "");
}


function normalizeText(value) {

    return String(value || "")
        .trim();
}


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(
    file,
    folder
) {

    if (!file) {
        return "";
    }

    if (!file.type.startsWith("image/")) {
        throw new Error(
            "Veuillez sélectionner une image valide."
        );
    }

    const maxSize =
        8 * 1024 * 1024;

    if (file.size > maxSize) {

        throw new Error(
            "Chaque image doit faire au maximum 8 Mo."
        );

    }

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
            CLOUDINARY_URL,
            {
                method: "POST",
                body: formData
            }
        );

    if (!response.ok) {

        throw new Error(
            "Impossible d'envoyer l'image."
        );

    }

    const data =
        await response.json();

    if (!data.secure_url) {

        throw new Error(
            "Cloudinary n'a pas retourné l'image."
        );

    }

    return data.secure_url;
}


/* =========================================================
   APERÇU PHOTO
   ========================================================= */

function previewFile(
    file,
    imageElement,
    placeholderElement
) {

    if (!file || !imageElement) {
        return;
    }

    const objectUrl =
        URL.createObjectURL(file);

    imageElement.src =
        objectUrl;

    imageElement.onload = () => {
        URL.revokeObjectURL(objectUrl);
    };

    imageElement.style.display =
        "block";

    if (placeholderElement) {
        placeholderElement.style.display =
            "none";
    }
}


/* =========================================================
   PHOTO CHAUFFEUR
   ========================================================= */

driverPhoto?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        selectedDriverPhoto =
            file;

        previewFile(
            file,
            driverPhotoPreview,
            driverPhotoPlaceholder
        );

    }
);


/* =========================================================
   PHOTO VÉHICULE
   ========================================================= */

driverVehiclePhoto?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        selectedVehiclePhoto =
            file;

        previewFile(
            file,
            driverVehiclePhotoPreview,
            driverVehiclePhotoPlaceholder
        );

    }
);


/* =========================================================
   CHARGER LES VILLES
   ========================================================= */

async function loadCities() {

    if (!driverVille) return;

    try {

        driverVille.innerHTML =
            `<option value="">Chargement...</option>`;

        const snapshot =
            await getDocs(
                collection(db, "villes")
            );

        const cities = [];

        snapshot.forEach(item => {

            const data =
                item.data();

            const name =
                data.nom ||
                data.name ||
                data.ville ||
                item.id;

            if (name) {
                cities.push(
                    String(name).trim()
                );
            }

        });

        /*
         * Si Firestore ne contient pas encore
         * les villes, on utilise les villes
         * principales de CAMU TAXI.
         */

        const fallbackCities =
            Object.keys(zonesParVille);

        const finalCities =
            [
                ...new Set(
                    [
                        ...cities,
                        ...fallbackCities
                    ]
                )
            ].sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "fr"
                    )
            );

        driverVille.innerHTML =
            `<option value="">Sélectionner une ville</option>`;

        finalCities.forEach(city => {

            const option =
                document.createElement("option");

            option.value =
                city;

            option.textContent =
                city;

            driverVille.appendChild(
                option
            );

        });

    } catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );

        driverVille.innerHTML =
            `<option value="">Sélectionner une ville</option>`;

        Object.keys(zonesParVille)
            .forEach(city => {

                const option =
                    document.createElement("option");

                option.value =
                    city;

                option.textContent =
                    city;

                driverVille.appendChild(
                    option
                );

            });

    }
}


/* =========================================================
   COMMUNES
   ========================================================= */

function updateCommunes(
    selectedCommune = ""
) {

    if (!driverCommune) return;

    const ville =
        driverVille?.value;

    const communes =
        zonesParVille[ville] || [];

    /*
     * On garde un champ texte afin de permettre
     * les communes qui ne sont pas encore
     * enregistrées dans la configuration.
     */

    driverCommune.setAttribute(
        "list",
        "driverCommunesList"
    );

    let dataList =
        document.getElementById(
            "driverCommunesList"
        );

    if (!dataList) {

        dataList =
            document.createElement(
                "datalist"
            );

        dataList.id =
            "driverCommunesList";

        document.body.appendChild(
            dataList
        );

    }

    dataList.innerHTML = "";

    communes.forEach(commune => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            commune;

        dataList.appendChild(
            option
        );

    });

    if (selectedCommune) {

        driverCommune.value =
            selectedCommune;

    }

}


driverVille?.addEventListener(
    "change",
    () => updateCommunes()
);


/* =========================================================
   GPS
   ========================================================= */

function getDriverLocation() {

    if (!navigator.geolocation) {

        showMessage(
            "La géolocalisation n'est pas disponible sur cet appareil.",
            "error"
        );

        return;
    }

    if (driverGetLocation) {

        driverGetLocation.disabled =
            true;

        driverGetLocation.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Localisation...</span>
            `;

    }

    if (driverLocationStatus) {

        driverLocationStatus.textContent =
            "Recherche de votre position actuelle...";

    }

    navigator.geolocation.getCurrentPosition(
        position => {

            driverLatitude =
                Number(
                    position.coords.latitude
                );

            driverLongitude =
                Number(
                    position.coords.longitude
                );

            if (driverLocationStatus) {

                driverLocationStatus.textContent =
                    `Position enregistrée : ${driverLatitude.toFixed(5)}, ${driverLongitude.toFixed(5)}`;

            }

            if (driverGetLocation) {

                driverGetLocation.disabled =
                    false;

                driverGetLocation.innerHTML =
                    `
                    <i class="fa-solid fa-check"></i>
                    <span>Position enregistrée</span>
                    `;

            }

            showMessage(
                "Votre position GPS a été enregistrée.",
                "success"
            );

        },

        error => {

            console.error(
                "Erreur GPS :",
                error
            );

            let message =
                "Impossible d'obtenir votre position.";

            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "L'accès à votre position a été refusé. Autorisez la géolocalisation dans votre navigateur.";

            } else if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                message =
                    "Votre position n'est pas disponible actuellement.";

            } else if (
                error.code ===
                error.TIMEOUT
            ) {

                message =
                    "La recherche de votre position a expiré.";

            }

            showMessage(
                message,
                "error"
            );

            if (driverLocationStatus) {

                driverLocationStatus.textContent =
                    "La position GPS n'a pas été enregistrée.";

            }

            if (driverGetLocation) {

                driverGetLocation.disabled =
                    false;

                driverGetLocation.innerHTML =
                    `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    <span>Réessayer</span>
                    `;

            }

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}


driverGetLocation?.addEventListener(
    "click",
    getDriverLocation
);


/* =========================================================
   CHARGER LE PROFIL UTILISATEUR
   ========================================================= */

async function loadUserProfile(
    user
) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(
                userRef
            );

        if (!snapshot.exists()) {
            return;
        }

        const data =
            snapshot.data();

        const name =
            data.fullName ||
            data.name ||
            data.displayName ||
            "";

        const phone =
            data.phone ||
            "";

        const whatsapp =
            data.whatsapp ||
            data.WhatsApp ||
            phone ||
            "";

        const email =
            data.email ||
            user.email ||
            "";

        const ville =
            data.ville ||
            "";

        const commune =
            data.commune ||
            "";

        const quartier =
            data.quartier ||
            "";

        if (
            document.getElementById(
                "driverName"
            )
        ) {
            document.getElementById(
                "driverName"
            ).value = name;
        }

        if (
            document.getElementById(
                "driverPhone"
            )
        ) {
            document.getElementById(
                "driverPhone"
            ).value = phone;
        }

        if (
            document.getElementById(
                "driverWhatsapp"
            )
        ) {
            document.getElementById(
                "driverWhatsapp"
            ).value = whatsapp;
        }

        if (
            document.getElementById(
                "driverEmail"
            )
        ) {
            document.getElementById(
                "driverEmail"
            ).value = email;
        }

        if (
            driverVille &&
            ville
        ) {

            driverVille.value =
                ville;

            updateCommunes(
                commune
            );

        } else if (driverCommune) {

            driverCommune.value =
                commune;

        }

        const quartierInput =
            document.getElementById(
                "driverQuartier"
            );

        if (quartierInput) {

            quartierInput.value =
                quartier;

        }

    } catch (error) {

        console.error(
            "Erreur profil utilisateur :",
            error
        );

    }

}


/* =========================================================
   CHARGER LE PROFIL CHAUFFEUR
   ========================================================= */

async function loadDriverProfile(
    user
) {

    try {

        /*
         * Le document chauffeur utilise l'UID
         * comme identifiant.
         */

        const chauffeurRef =
            doc(
                db,
                "chauffeurs",
                user.uid
            );

        const snapshot =
            await getDoc(
                chauffeurRef
            );

        if (!snapshot.exists()) {

            existingDriver =
                null;

            return;

        }

        existingDriver =
            snapshot.data();

        const data =
            existingDriver;


        /* Identité */

        const nameInput =
            document.getElementById(
                "driverName"
            );

        const phoneInput =
            document.getElementById(
                "driverPhone"
            );

        const whatsappInput =
            document.getElementById(
                "driverWhatsapp"
            );

        const emailInput =
            document.getElementById(
                "driverEmail"
            );

        if (nameInput && data.name) {
            nameInput.value =
                data.name;
        }

        if (phoneInput && data.phone) {
            phoneInput.value =
                data.phone;
        }

        if (
            whatsappInput &&
            (
                data.WhatsApp ||
                data.whatsapp
            )
        ) {

            whatsappInput.value =
                data.WhatsApp ||
                data.whatsapp;

        }

        if (
            emailInput &&
            data.email
        ) {

            emailInput.value =
                data.email;

        }


        /* Localisation */

        if (
            driverVille &&
            data.ville
        ) {

            driverVille.value =
                data.ville;

            updateCommunes(
                data.commune || ""
            );

        } else if (
            driverCommune &&
            data.commune
        ) {

            driverCommune.value =
                data.commune;

        }

        const quartierInput =
            document.getElementById(
                "driverQuartier"
            );

        if (
            quartierInput &&
            data.quartier
        ) {

            quartierInput.value =
                data.quartier;

        }


        /* Véhicule */

        const vehicleType =
            document.getElementById(
                "driverVehicleType"
            );

        const brand =
            document.getElementById(
                "driverBrand"
            );

        const model =
            document.getElementById(
                "driverModel"
            );

        const plate =
            document.getElementById(
                "driverPlate"
            );

        if (
            vehicleType &&
            data.typeVehicule
        ) {

            vehicleType.value =
                data.typeVehicule;

        }

        if (
            brand &&
            data.marqueVehicule
        ) {

            brand.value =
                data.marqueVehicule;

        }

        if (
            model &&
            data.modeleVehicule
        ) {

            model.value =
                data.modeleVehicule;

        }

        if (
            plate &&
            data.plaque
        ) {

            plate.value =
                data.plaque;

        }


        /* Description */

        const description =
            document.getElementById(
                "driverDescription"
            );

        if (
            description &&
            data.description
        ) {

            description.value =
                data.description;

        }


        /* Disponibilité */

        if (
            driverAvailable
        ) {

            driverAvailable.checked =
                data.disponible !== false;

        }


        /* GPS */

        if (
            Number.isFinite(
                Number(data.latitude)
            ) &&
            Number.isFinite(
                Number(data.longitude)
            )
        ) {

            driverLatitude =
                Number(data.latitude);

            driverLongitude =
                Number(data.longitude);

            if (driverLocationStatus) {

                driverLocationStatus.textContent =
                    `Position enregistrée : ${driverLatitude.toFixed(5)}, ${driverLongitude.toFixed(5)}`;

            }

        }


        /* Photo chauffeur */

        if (data.photoURL) {

            driverPhotoUrl =
                data.photoURL;

            if (driverPhotoPreview) {

                driverPhotoPreview.src =
                    data.photoURL;

                driverPhotoPreview.style.display =
                    "block";

            }

            if (driverPhotoPlaceholder) {

                driverPhotoPlaceholder.style.display =
                    "none";

            }

        }


        /* Photo véhicule */

        if (data.photoVehicule) {

            driverVehiclePhotoUrl =
                data.photoVehicule;

            if (
                driverVehiclePhotoPreview
            ) {

                driverVehiclePhotoPreview.src =
                    data.photoVehicule;

                driverVehiclePhotoPreview.style.display =
                    "block";

            }

            if (
                driverVehiclePhotoPlaceholder
            ) {

                driverVehiclePhotoPlaceholder.style.display =
                    "none";

            }

        }

    } catch (error) {

        console.error(
            "Erreur chargement chauffeur :",
            error
        );

    }

}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateForm() {

    const name =
        normalizeText(
            document.getElementById(
                "driverName"
            )?.value
        );

    const phone =
        normalizePhone(
            document.getElementById(
                "driverPhone"
            )?.value
        );

    const whatsapp =
        normalizePhone(
            document.getElementById(
                "driverWhatsapp"
            )?.value
        );

    const ville =
        normalizeText(
            driverVille?.value
        );

    const vehicleType =
        normalizeText(
            document.getElementById(
                "driverVehicleType"
            )?.value
        );

    const brand =
        normalizeText(
            document.getElementById(
                "driverBrand"
            )?.value
        );

    const plate =
        normalizeText(
            document.getElementById(
                "driverPlate"
            )?.value
        );

    const terms =
        document.getElementById(
            "driverTerms"
        )?.checked;


    if (!name) {

        showMessage(
            "Veuillez saisir votre nom complet.",
            "error"
        );

        return false;
    }


    if (!phone) {

        showMessage(
            "Veuillez saisir votre numéro de téléphone.",
            "error"
        );

        return false;
    }


    if (!whatsapp) {

        showMessage(
            "Veuillez saisir votre numéro WhatsApp.",
            "error"
        );

        return false;
    }


    if (!ville) {

        showMessage(
            "Veuillez sélectionner votre ville.",
            "error"
        );

        return false;
    }


    if (!vehicleType) {

        showMessage(
            "Veuillez sélectionner le type de véhicule.",
            "error"
        );

        return false;
    }


    if (!brand) {

        showMessage(
            "Veuillez saisir la marque du véhicule.",
            "error"
        );

        return false;
    }


    if (!plate) {

        showMessage(
            "Veuillez saisir la plaque d'immatriculation.",
            "error"
        );

        return false;
    }


    if (!terms) {

        showMessage(
            "Vous devez accepter les conditions de CAMU TAXI.",
            "error"
        );

        return false;
    }


    return true;
}


/* =========================================================
   ENREGISTREMENT
   ========================================================= */

async function saveDriverProfile(
    user
) {

    if (!validateForm()) {
        return;
    }

    clearMessage();

    driverSubmit.disabled =
        true;

    driverSubmit.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Enregistrement...</span>
        `;


    try {

        const name =
            normalizeText(
                document.getElementById(
                    "driverName"
                ).value
            );

        const phone =
            normalizePhone(
                document.getElementById(
                    "driverPhone"
                ).value
            );

        const whatsapp =
            normalizePhone(
                document.getElementById(
                    "driverWhatsapp"
                ).value
            );

        const email =
            normalizeText(
                document.getElementById(
                    "driverEmail"
                ).value
            ) ||
            user.email ||
            "";

        const ville =
            normalizeText(
                driverVille.value
            );

        const commune =
            normalizeText(
                driverCommune?.value
            );

        const quartier =
            normalizeText(
                document.getElementById(
                    "driverQuartier"
                )?.value
            );

        const typeVehicule =
            normalizeText(
                document.getElementById(
                    "driverVehicleType"
                ).value
            );

        const marqueVehicule =
            normalizeText(
                document.getElementById(
                    "driverBrand"
                ).value
            );

        const modeleVehicule =
            normalizeText(
                document.getElementById(
                    "driverModel"
                ).value
            );

        const plaque =
            normalizeText(
                document.getElementById(
                    "driverPlate"
                ).value
            ).toUpperCase();

        const description =
            normalizeText(
                document.getElementById(
                    "driverDescription"
                ).value
            );

        const disponible =
            driverAvailable?.checked !== false;


        /* =========================================
           UPLOAD PHOTO CHAUFFEUR
        ========================================= */

        if (selectedDriverPhoto) {

            showMessage(
                "Téléversement de la photo du chauffeur...",
                "info"
            );

            driverPhotoUrl =
                await uploadToCloudinary(
                    selectedDriverPhoto,
                    `camu-services/chauffeurs/${user.uid}`
                );

        }


        /* =========================================
           UPLOAD PHOTO VÉHICULE
        ========================================= */

        if (selectedVehiclePhoto) {

            showMessage(
                "Téléversement de la photo du véhicule...",
                "info"
            );

            driverVehiclePhotoUrl =
                await uploadToCloudinary(
                    selectedVehiclePhoto,
                    `camu-services/chauffeurs/${user.uid}`
                );

        }


        /* =========================================
           DONNÉES CHAUFFEUR
        ========================================= */

        const chauffeurData = {

            userId: user.uid,

            name,

            phone,

            WhatsApp: whatsapp,
            whatsapp,

            email,

            ville,
            commune,
            quartier,

            typeVehicule,

            marqueVehicule,
            modeleVehicule,

            plaque,

            description,

            service: "CAMU TAXI",

            photoURL:
                driverPhotoUrl || "",

            photoVehicule:
                driverVehiclePhotoUrl || "",

            active: true,

            disponible,

            latitude:
                driverLatitude,

            longitude:
                driverLongitude,

            lastLocationUpdate:
                (
                    driverLatitude !== null &&
                    driverLongitude !== null
                )
                    ? serverTimestamp()
                    : (
                        existingDriver?.lastLocationUpdate ||
                        null
                    ),

            updatedAt:
                serverTimestamp(),

            createdAt:
                existingDriver?.createdAt ||
                serverTimestamp()

        };


        /* =========================================
           FIRESTORE
        ========================================= */

        const chauffeurRef =
            doc(
                db,
                "chauffeurs",
                user.uid
            );

        await setDoc(
            chauffeurRef,
            chauffeurData,
            {
                merge: true
            }
        );


        existingDriver =
            chauffeurData;

        selectedDriverPhoto =
            null;

        selectedVehiclePhoto =
            null;


        showMessage(
            "Votre profil CAMU TAXI a été enregistré avec succès.",
            "success"
        );


        driverSubmit.innerHTML =
            `
            <i class="fa-solid fa-check"></i>
            <span>Profil enregistré</span>
            `;


        /*
         * Petite pause pour laisser le message
         * de succès être visible.
         */

        setTimeout(
            () => {

                window.location.href =
                    "camu-taxi.html";

            },
            1400
        );


    } catch (error) {

        console.error(
            "Erreur enregistrement chauffeur :",
            error
        );

        let message =
            "Une erreur est survenue pendant l'enregistrement.";

        if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "Vous n'avez pas l'autorisation d'enregistrer votre profil chauffeur. Les règles Firestore doivent autoriser votre propre profil chauffeur.";

        } else if (
            error?.message
        ) {

            message =
                error.message;

        }

        showMessage(
            message,
            "error"
        );

        driverSubmit.disabled =
            false;

        driverSubmit.innerHTML =
            `
            <i class="fa-solid fa-taxi"></i>
            <span>Devenir chauffeur</span>
            `;

    }

}


/* =========================================================
   SUBMIT
   ========================================================= */

driverForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        if (!currentUser) {

            showMessage(
                "Vous devez être connecté pour devenir chauffeur.",
                "error"
            );

            return;
        }

        saveDriverProfile(
            currentUser
        );

    }
);


/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            /*
             * auth-guard.js devrait normalement
             * rediriger automatiquement.
             */

            return;

        }

        currentUser =
            user;

        try {

            showLoading();

            await loadCities();

            await loadUserProfile(
                user
            );

            await loadDriverProfile(
                user
            );

            hideLoading();

        } catch (error) {

            console.error(
                "Initialisation CAMU TAXI :",
                error
            );

            hideLoading();

            showMessage(
                "Impossible de charger votre profil.",
                "error"
            );

        }

    }
);
