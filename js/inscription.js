/* =========================================================
   CAMU SERVICES — INSCRIPTION
   Firebase + Cloudinary
   ESPACES :
   Client
   CAMU IMMO
   CAMU COMMERCE
   CAMU TAXI
   CAMU HÔTELS
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
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
   COLLECTIONS
========================================================= */

const COLLECTIONS = {

    immobilier:
        "agents_immobiliers",

    commerce:
        "etablissements_commerciaux",

    taxi:
        "chauffeurs",

    hotels:
        "etablissements_hoteliers"

};


/* =========================================================
   DOM
========================================================= */

const accountTypeStep =
    document.getElementById("accountTypeStep");

const signupFormWrapper =
    document.getElementById("signupFormWrapper");

const signupForm =
    document.getElementById("signupForm");

const specificFields =
    document.getElementById("specificFields");

const selectedSpaceName =
    document.getElementById("selectedSpaceName");

const selectedSpaceIcon =
    document.getElementById("selectedSpaceIcon");

const changeAccountType =
    document.getElementById("changeAccountType");

const signupMessage =
    document.getElementById("signupMessage");

const signupSubmit =
    document.getElementById("signupSubmit");

const villeSelect =
    document.getElementById("ville");

const signupYear =
    document.getElementById("signupYear");

const signupMenuButton =
    document.getElementById("signupMenuButton");

const signupSidebar =
    document.getElementById("signupSidebar");

const signupOverlay =
    document.getElementById("signupOverlay");


let selectedAccountType = null;


/* =========================================================
   ANNÉE
========================================================= */

if (signupYear) {

    signupYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MENU MOBILE
========================================================= */

if (signupMenuButton) {

    signupMenuButton.addEventListener(
        "click",
        () => {

            signupSidebar?.classList.add("open");

            signupOverlay?.classList.add("open");

        }
    );

}


if (signupOverlay) {

    signupOverlay.addEventListener(
        "click",
        closeMobileMenu
    );

}


function closeMobileMenu() {

    signupSidebar?.classList.remove("open");

    signupOverlay?.classList.remove("open");

}


/* =========================================================
   ESPACES CAMU
========================================================= */

const ACCOUNT_TYPES = {

    client: {

        name:
            "Client",

        icon:
            "fa-solid fa-user"

    },


    immobilier: {

        name:
            "CAMU IMMO",

        icon:
            "fa-solid fa-house"

    },


    commerce: {

        name:
            "CAMU COMMERCE",

        icon:
            "fa-solid fa-store"

    },


    taxi: {

        name:
            "CAMU TAXI",

        icon:
            "fa-solid fa-taxi"

    },


    hotels: {

        name:
            "CAMU HÔTELS",

        icon:
            "fa-solid fa-hotel"

    }

};


/* =========================================================
   CATÉGORIES COMMERCE
========================================================= */

const COMMERCE_CATEGORIES = [

    {
        value: "mode",
        label: "Mode & Vêtements"
    },

    {
        value: "chaussures",
        label: "Chaussures"
    },

    {
        value: "telephones",
        label: "Téléphones & Accessoires"
    },

    {
        value: "informatique",
        label: "Informatique"
    },

    {
        value: "maison",
        label: "Maison & Mobilier"
    },

    {
        value: "beaute",
        label: "Beauté & Cosmétiques"
    },

    {
        value: "alimentation",
        label: "Alimentation"
    },

    {
        value: "boissons",
        label: "Boissons"
    },

    {
        value: "materiaux",
        label: "Matériaux & Bricolage"
    },

    {
        value: "livres",
        label: "Livres & Fournitures"
    },

    {
        value: "enfants",
        label: "Enfants & Jouets"
    },

    {
        value: "bijoux",
        label: "Bijoux & Accessoires"
    },

    {
        value: "autres",
        label: "Autres commerces"
    }

];


/* =========================================================
   TYPES HÔTELS
========================================================= */

const HOTEL_TYPES = [

    "Hôtel",
    "Résidence",
    "Appartement",
    "Maison d'hôtes",
    "Auberge",
    "Lodge",
    "Courte durée",
    "Autre"

];


/* =========================================================
   TYPES DE VÉHICULES POUR CAMU TAXI
========================================================= */

const TAXI_VEHICLE_TYPES = [

    "Taxi / Voiture",

    "Moto-taxi",

    "Minibus",

    "Autre"

];


/* =========================================================
   PHOTO PROFIL
========================================================= */

function ensureProfilePhotoField() {

    if (!signupForm) {
        return;
    }


    if (
        document.getElementById(
            "profilePhoto"
        )
    ) {
        return;
    }


    const fullNameInput =
        document.getElementById(
            "fullName"
        );


    if (!fullNameInput) {
        return;
    }


    const fullNameGroup =
        fullNameInput.closest(
            ".form-group"
        );


    if (!fullNameGroup) {
        return;
    }


    const photoGroup =
        document.createElement(
            "div"
        );


    photoGroup.className =
        "form-group full profile-photo-group";


    photoGroup.innerHTML = `

        <label for="profilePhoto">

            Photo de profil

        </label>


        <input
            type="file"
            id="profilePhoto"
            name="profilePhoto"
            accept="image/jpeg,image/png,image/webp"
        >


        <small>

            JPG, PNG ou WEBP — 5 MB maximum.

        </small>


        <img
            id="profilePhotoPreview"
            class="signup-photo-preview"
            style="display:none;"
            alt="Aperçu de votre photo"
        >

    `;


    fullNameGroup.insertAdjacentElement(
        "afterend",
        photoGroup
    );


    setupProfilePhotoPreview();

}


/* =========================================================
   PHOTO VÉHICULE — UNIQUEMENT CAMU TAXI
========================================================= */

function ensureTaxiVehiclePhotoField() {

    if (
        selectedAccountType !==
        "taxi"
    ) {
        return;
    }


    if (
        document.getElementById(
            "vehiclePhoto"
        )
    ) {
        return;
    }


    const taxiDescription =
        document.getElementById(
            "taxiDescription"
        );


    if (!taxiDescription) {
        return;
    }


    const descriptionGroup =
        taxiDescription.closest(
            ".form-group"
        );


    if (!descriptionGroup) {
        return;
    }


    const photoGroup =
        document.createElement(
            "div"
        );


    photoGroup.className =
        "form-group full";


    photoGroup.innerHTML = `

        <label for="vehiclePhoto">

            Photo du véhicule

        </label>


        <input
            type="file"
            id="vehiclePhoto"
            name="vehiclePhoto"
            accept="image/jpeg,image/png,image/webp"
        >


        <small>

            Ajoutez une photo claire de votre véhicule.
            JPG, PNG ou WEBP — 5 MB maximum.

        </small>


        <img
            id="vehiclePhotoPreview"
            class="signup-photo-preview"
            style="display:none;"
            alt="Aperçu du véhicule"
        >

    `;


    descriptionGroup.insertAdjacentElement(
        "afterend",
        photoGroup
    );


    setupImagePreview(
        "vehiclePhoto",
        "vehiclePhotoPreview"
    );

}


/* =========================================================
   APERÇU PHOTO PROFIL
========================================================= */

function setupProfilePhotoPreview() {

    setupImagePreview(
        "profilePhoto",
        "profilePhotoPreview"
    );

}


/* =========================================================
   APERÇU IMAGE GÉNÉRIQUE
========================================================= */

function setupImagePreview(
    inputId,
    previewId
) {

    const input =
        document.getElementById(
            inputId
        );

    const preview =
        document.getElementById(
            previewId
        );


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (!file) {

                preview.src = "";

                preview.style.display =
                    "none";

                return;

            }


            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                input.value = "";

                preview.src = "";

                preview.style.display =
                    "none";

                showMessage(
                    "Format de photo invalide. Utilisez JPG, PNG ou WEBP.",
                    "error"
                );

                return;

            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                input.value = "";

                preview.src = "";

                preview.style.display =
                    "none";

                showMessage(
                    "La photo ne doit pas dépasser 5 MB.",
                    "error"
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    preview.src =
                        event.target.result;

                    preview.style.display =
                        "block";

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   CHOIX ESPACE
========================================================= */

document
    .querySelectorAll(
        ".account-type-card"
    )
    .forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const type =
                        card.dataset.accountType;


                    selectAccountType(
                        type,
                        card
                    );

                }
            );

        }
    );


/* =========================================================
   SÉLECTION ESPACE
========================================================= */

function selectAccountType(
    type,
    selectedCard = null
) {

    if (
        !ACCOUNT_TYPES[type]
    ) {
        return;
    }


    selectedAccountType =
        type;


    document
        .querySelectorAll(
            ".account-type-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );

            }
        );


    selectedCard?.classList.add(
        "selected"
    );


    const accountInfo =
        ACCOUNT_TYPES[type];


    if (selectedSpaceName) {

        selectedSpaceName.textContent =
            accountInfo.name;

    }


    if (selectedSpaceIcon) {

        selectedSpaceIcon.className =
            accountInfo.icon;

    }


    buildSpecificFields(
        type
    );


    ensureProfilePhotoField();


    if (type === "taxi") {

        ensureTaxiVehiclePhotoField();

    }


    accountTypeStep?.classList.add(
        "hidden"
    );


    signupFormWrapper?.classList.remove(
        "hidden"
    );


    clearMessage();


    closeMobileMenu();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   MODIFIER ESPACE
========================================================= */

if (changeAccountType) {

    changeAccountType.addEventListener(
        "click",
        () => {

            selectedAccountType =
                null;


            signupFormWrapper?.classList.add(
                "hidden"
            );


            accountTypeStep?.classList.remove(
                "hidden"
            );


            if (specificFields) {

                specificFields.innerHTML =
                    "";

            }


            clearMessage();


            window.scrollTo({

                top:
                    (accountTypeStep?.offsetTop || 0) - 20,

                behavior:
                    "smooth"

            });

        }
    );

}


/* =========================================================
   CHAMPS SPÉCIFIQUES
========================================================= */

function buildSpecificFields(
    type
) {

    if (!specificFields) {
        return;
    }


    specificFields.innerHTML =
        "";


    /* =====================================================
       CLIENT
    ====================================================== */

    if (type === "client") {

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-user"></i>

                <div>

                    <h3>
                        Profil utilisateur
                    </h3>

                    <p>
                        Aucun renseignement professionnel supplémentaire n'est nécessaire.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    /* =====================================================
       CAMU IMMO
    ====================================================== */

    if (type === "immobilier") {

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-house"></i>

                <div>

                    <h3>
                        Informations immobilières
                    </h3>

                    <p>
                        Présentez votre activité dans le domaine immobilier.
                    </p>

                </div>

            </div>


            <div class="form-grid">

                <div class="form-group">

                    <label for="immoType">
                        Type de professionnel
                        <span>*</span>
                    </label>

                    <select
                        id="immoType"
                        name="immoType"
                        required
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        <option value="agent">
                            Agent immobilier
                        </option>

                        <option value="agence">
                            Agence immobilière
                        </option>

                        <option value="proprietaire">
                            Propriétaire
                        </option>

                        <option value="promoteur">
                            Promoteur immobilier
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="immoAgency">
                        Nom de l'agence
                    </label>

                    <input
                        type="text"
                        id="immoAgency"
                        name="immoAgency"
                        placeholder="Nom de l'agence"
                    >

                </div>


                <div class="form-group full">

                    <label for="immoDescription">
                        Description
                    </label>

                    <textarea
                        id="immoDescription"
                        name="immoDescription"
                        placeholder="Présentez votre activité..."
                    ></textarea>

                </div>

            </div>

        `;

        return;

    }


    /* =====================================================
       CAMU COMMERCE
    ====================================================== */

    if (type === "commerce") {

        const categoryOptions =
            COMMERCE_CATEGORIES
                .map(
                    category => `

                        <option
                            value="${escapeHtml(category.value)}"
                        >
                            ${escapeHtml(category.label)}
                        </option>

                    `
                )
                .join("");


        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-store"></i>

                <div>

                    <h3>
                        Informations de l'établissement
                    </h3>

                    <p>
                        Ces informations seront utilisées pour présenter votre établissement.
                    </p>

                </div>

            </div>


            <div class="form-grid">

                <div class="form-group full">

                    <label for="commerceName">
                        Nom de l'établissement
                        <span>*</span>
                    </label>

                    <input
                        type="text"
                        id="commerceName"
                        name="commerceName"
                        placeholder="Ex. La Grâce"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="commerceCategory">
                        Catégorie
                        <span>*</span>
                    </label>

                    <select
                        id="commerceCategory"
                        name="commerceCategory"
                        required
                    >

                        <option value="">
                            Sélectionner une catégorie
                        </option>

                        ${categoryOptions}

                    </select>

                </div>


                <div class="form-group">

                    <label for="commerceAddress">
                        Adresse
                    </label>

                    <input
                        type="text"
                        id="commerceAddress"
                        name="commerceAddress"
                        placeholder="Ex. 34, Av Upemba"
                    >

                </div>


                <div class="form-group full">

                    <label for="commerceDescription">
                        Description
                    </label>

                    <textarea
                        id="commerceDescription"
                        name="commerceDescription"
                        placeholder="Décrivez votre établissement..."
                    ></textarea>

                </div>

            </div>

        `;

        return;

    }


    /* =====================================================
       CAMU TAXI
    ====================================================== */

    if (type === "taxi") {

        const taxiVehicleOptions =
            TAXI_VEHICLE_TYPES
                .map(
                    vehicleType => `

                        <option
                            value="${escapeHtml(vehicleType)}"
                        >
                            ${escapeHtml(vehicleType)}
                        </option>

                    `
                )
                .join("");


        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-taxi"></i>

                <div>

                    <h3>
                        Profil chauffeur CAMU TAXI
                    </h3>

                    <p>
                        Ces informations permettront aux clients CAMU de trouver votre profil et de vous contacter sur WhatsApp.
                    </p>

                </div>

            </div>


            <div class="form-grid">


                <!-- QUARTIER -->

                <div class="form-group">

                    <label for="taxiQuartier">
                        Quartier
                        <span>*</span>
                    </label>

                    <input
                        type="text"
                        id="taxiQuartier"
                        name="taxiQuartier"
                        placeholder="Ex. Kenya"
                        required
                    >

                </div>


                <!-- TYPE VÉHICULE -->

                <div class="form-group">

                    <label for="taxiVehicleType">
                        Type de véhicule
                        <span>*</span>
                    </label>

                    <select
                        id="taxiVehicleType"
                        name="taxiVehicleType"
                        required
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        ${taxiVehicleOptions}

                    </select>

                </div>


                <!-- MARQUE -->

                <div class="form-group">

                    <label for="taxiVehicleBrand">
                        Marque / modèle
                        <span>*</span>
                    </label>

                    <input
                        type="text"
                        id="taxiVehicleBrand"
                        name="taxiVehicleBrand"
                        placeholder="Ex. Toyota Corolla"
                        required
                    >

                </div>


                <!-- PLAQUE -->

                <div class="form-group">

                    <label for="taxiVehiclePlate">
                        Plaque d'immatriculation
                        <span>*</span>
                    </label>

                    <input
                        type="text"
                        id="taxiVehiclePlate"
                        name="taxiVehiclePlate"
                        placeholder="Ex. CGO 1234 AB"
                        required
                    >

                </div>


                <!-- DISPONIBILITÉ -->

                <div class="form-group">

                    <label for="taxiAvailability">
                        Disponibilité
                    </label>

                    <select
                        id="taxiAvailability"
                        name="taxiAvailability"
                    >

                        <option value="false">
                            Indisponible
                        </option>

                        <option value="true">
                            Disponible
                        </option>

                    </select>

                </div>


                <!-- DESCRIPTION -->

                <div class="form-group full">

                    <label for="taxiDescription">
                        Présentation
                    </label>

                    <textarea
                        id="taxiDescription"
                        name="taxiDescription"
                        placeholder="Présentez votre service de transport..."
                    ></textarea>

                </div>

            </div>

        `;


        /*
         * Le champ photo du véhicule est ajouté
         * après la construction du formulaire.
         */

        setTimeout(
            ensureTaxiVehiclePhotoField,
            0
        );


        return;

    }


    /* =====================================================
       CAMU HÔTELS
    ====================================================== */

    if (type === "hotels") {

        const hotelOptions =
            HOTEL_TYPES
                .map(
                    hotelType => `

                        <option
                            value="${escapeHtml(hotelType)}"
                        >
                            ${escapeHtml(hotelType)}
                        </option>

                    `
                )
                .join("");


        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-hotel"></i>

                <div>

                    <h3>
                        Informations de l'établissement
                    </h3>

                    <p>
                        Présentez votre hôtel ou votre établissement d'hébergement.
                    </p>

                </div>

            </div>


            <div class="form-grid">


                <div class="form-group full">

                    <label for="hotelName">
                        Nom de l'établissement
                        <span>*</span>
                    </label>

                    <input
                        type="text"
                        id="hotelName"
                        name="hotelName"
                        placeholder="Ex. Hôtel CAMU"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="hotelType">
                        Type d'établissement
                        <span>*</span>
                    </label>

                    <select
                        id="hotelType"
                        name="hotelType"
                        required
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        ${hotelOptions}

                    </select>

                </div>


                <div class="form-group">

                    <label for="hotelAddress">
                        Adresse
                    </label>

                    <input
                        type="text"
                        id="hotelAddress"
                        name="hotelAddress"
                        placeholder="Adresse de l'établissement"
                    >

                </div>


                <div class="form-group full">

                    <label for="hotelDescription">
                        Description
                    </label>

                    <textarea
                        id="hotelDescription"
                        name="hotelDescription"
                        placeholder="Présentez votre établissement..."
                    ></textarea>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   CHARGER LES VILLES DEPUIS FIRESTORE
========================================================= */

async function loadCities() {

    if (!villeSelect) {
        return;
    }


    try {

        villeSelect.innerHTML = `

            <option value="">
                Chargement des villes...
            </option>

        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                if (
                    data.active === false
                ) {
                    return;
                }


                const name =
                    String(
                        data.name || ""
                    ).trim();


                if (!name) {
                    return;
                }


                cities.push({

                    id:
                        documentSnapshot.id,

                    name,

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        cities.sort(
            (a, b) => {

                if (
                    a.order !==
                    b.order
                ) {

                    return (
                        a.order -
                        b.order
                    );

                }


                return a.name.localeCompare(
                    b.name,
                    "fr"
                );

            }
        );


        villeSelect.innerHTML = `

            <option value="">
                Sélectionner votre ville
            </option>

        `;


        cities.forEach(
            city => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city.name;


                option.textContent =
                    city.name;


                villeSelect.appendChild(
                    option
                );

            }
        );


        if (!cities.length) {

            villeSelect.innerHTML = `

                <option value="">
                    Aucune ville disponible
                </option>

            `;

        }

    } catch (error) {

        console.error(
            "CAMU INSCRIPTION — erreur villes :",
            error
        );


        villeSelect.innerHTML = `

            <option value="">
                Impossible de charger les villes
            </option>

        `;

    }

}


/* =========================================================
   RÉCUPÉRER PHOTO PROFIL
========================================================= */

function getSelectedProfilePhoto() {

    const input =
        document.getElementById(
            "profilePhoto"
        );


    return (
        input?.files?.[0] ||
        null
    );

}


/* =========================================================
   RÉCUPÉRER PHOTO VÉHICULE
========================================================= */

function getSelectedVehiclePhoto() {

    const input =
        document.getElementById(
            "vehiclePhoto"
        );


    return (
        input?.files?.[0] ||
        null
    );

}


/* =========================================================
   UPLOAD CLOUDINARY
========================================================= */

async function uploadImage(
    file,
    folder
) {

    if (!file) {
        return "";
    }


    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Format de photo invalide. Utilisez JPG, PNG ou WEBP."
        );

    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        throw new Error(
            "La photo ne doit pas dépasser 5 MB."
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
            CLOUDINARY_UPLOAD_URL,
            {

                method:
                    "POST",

                body:
                    formData

            }
        );


    let result = null;


    try {

        result =
            await response.json();

    } catch {

        result = null;

    }


    if (
        !response.ok ||
        !result?.secure_url
    ) {

        console.error(
            "CAMU INSCRIPTION — Cloudinary :",
            result
        );


        throw new Error(
            "Impossible d'envoyer la photo vers Cloudinary."
        );

    }


    return result.secure_url;

}


/* =========================================================
   SUBMIT INSCRIPTION
========================================================= */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            clearMessage();


            if (!selectedAccountType) {

                showMessage(
                    "Veuillez choisir votre espace.",
                    "error"
                );

                return;

            }


            if (
                !signupForm.checkValidity()
            ) {

                signupForm.reportValidity();

                return;

            }


            const password =
                getValue(
                    "password"
                );


            const confirmPassword =
                getValue(
                    "confirmPassword"
                );


            if (
                password.length < 6
            ) {

                showMessage(
                    "Le mot de passe doit contenir au moins 6 caractères.",
                    "error"
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    "Les deux mots de passe ne correspondent pas.",
                    "error"
                );

                return;

            }


            const terms =
                document.getElementById(
                    "acceptTerms"
                );


            if (
                !terms?.checked
            ) {

                showMessage(
                    "Veuillez accepter les conditions d'utilisation.",
                    "error"
                );

                return;

            }


            setLoading(true);


            try {

                /* =========================================
                   INFORMATIONS COMMUNES
                ========================================== */

                const fullName =
                    getValue(
                        "fullName"
                    );


                const phone =
                    getValue(
                        "phone"
                    );


                const whatsapp =
                    getValue(
                        "whatsapp"
                    ) ||
                    phone;


                const email =
                    getValue(
                        "email"
                    ).toLowerCase();


                const ville =
                    getValue(
                        "ville"
                    );


                const commune =
                    getValue(
                        "commune"
                    );


                const photoFile =
                    getSelectedProfilePhoto();


                /* =========================================
                   COMPTE FIREBASE AUTH
                ========================================== */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* =========================================
                   PHOTO PROFIL
                ========================================== */

                let photoURL = "";


                if (photoFile) {

                    photoURL =
                        await uploadImage(
                            photoFile,
                            "camu-services/profiles"
                        );

                }


                /* =========================================
                   PROFIL AUTH
                ========================================== */

                await updateProfile(
                    user,
                    {

                        displayName:
                            fullName,

                        photoURL:
                            photoURL || null

                    }
                );


                /* =========================================
                   DOCUMENT USERS
                ========================================== */

                const userData = {

                    uid:
                        user.uid,

                    name:
                        fullName,

                    email:
                        email,

                    phone:
                        phone,

                    whatsapp:
                        whatsapp,

                    ville:
                        ville,

                    commune:
                        commune,

                    photoURL:
                        photoURL,

                    accountType:
                        selectedAccountType,

                    accountStatus:
                        selectedAccountType ===
                        "client"
                            ? "active"
                            : "pending",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                };


                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    userData
                );


                /* =========================================
                   PROFIL PROFESSIONNEL
                ========================================== */

                await createProfessionalProfile(
                    user.uid,
                    {

                        fullName,

                        email,

                        phone,

                        whatsapp,

                        ville,

                        commune,

                        photoURL

                    }
                );


                /* =========================================
                   SUCCÈS
                ========================================== */

                showMessage(

                    selectedAccountType ===
                    "client"

                        ? "Votre compte a été créé avec succès."

                        : selectedAccountType ===
                          "taxi"

                            ? "Votre compte CAMU TAXI a été créé. Votre profil sera vérifié avant sa publication."

                            : "Votre compte a été créé. Votre profil professionnel sera vérifié avant sa publication.",

                    "success"

                );


                signupForm.reset();


                const preview =
                    document.getElementById(
                        "profilePhotoPreview"
                    );


                if (preview) {

                    preview.src = "";

                    preview.style.display =
                        "none";

                }


                const vehiclePreview =
                    document.getElementById(
                        "vehiclePhotoPreview"
                    );


                if (vehiclePreview) {

                    vehiclePreview.src = "";

                    vehiclePreview.style.display =
                        "none";

                }


                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1800
                );


            } catch (error) {

                console.error(
                    "CAMU INSCRIPTION — erreur :",
                    error
                );


                let message =
                    "Une erreur est survenue lors de l'inscription.";


                if (
                    error.code ===
                    "auth/email-already-in-use"
                ) {

                    message =
                        "Cette adresse e-mail est déjà utilisée.";

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "L'adresse e-mail est invalide.";

                }

                else if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    message =
                        "Le mot de passe est trop faible.";

                }

                else if (
                    error.code ===
                    "auth/network-request-failed"
                ) {

                    message =
                        "Problème de connexion Internet.";

                }

                else if (
                    error.code ===
                    "permission-denied" ||
                    error.code ===
                    "firestore/permission-denied"
                ) {

                    message =
                        "Le compte a été créé, mais Firestore a refusé l'enregistrement du profil. Vérifiez les règles de sécurité.";

                }

                else if (
                    error?.message
                ) {

                    message =
                        error.message;

                }


                showMessage(
                    message,
                    "error"
                );

            }

            finally {

                setLoading(false);

            }

        }
    );

}


/* =========================================================
   CRÉER PROFIL PROFESSIONNEL
========================================================= */

async function createProfessionalProfile(
    uid,
    common
) {

    const {

        fullName,

        email,

        phone,

        whatsapp,

        ville,

        commune,

        photoURL

    } = common;


    /* =====================================================
       CLIENT
    ====================================================== */

    if (
        selectedAccountType ===
        "client"
    ) {

        return;

    }


    /* =====================================================
       CAMU IMMO
    ====================================================== */

    if (
        selectedAccountType ===
        "immobilier"
    ) {

        const type =
            getValue(
                "immoType"
            );


        const agency =
            getValue(
                "immoAgency"
            );


        const description =
            getValue(
                "immoDescription"
            );


        const profile = {

            uid,

            name:
                fullName,

            email,

            phone,

            WhatsApp:
                whatsapp,

            ville,

            commune,

            type,

            agencyName:
                agency,

            description,

            photoURL,

            active:
                false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                COLLECTIONS.immobilier,
                uid
            ),
            profile
        );


        return;

    }


    /* =====================================================
       CAMU COMMERCE
    ====================================================== */

    if (
        selectedAccountType ===
        "commerce"
    ) {

        const name =
            getValue(
                "commerceName"
            );


        const category =
            getValue(
                "commerceCategory"
            );


        const address =
            getValue(
                "commerceAddress"
            );


        const description =
            getValue(
                "commerceDescription"
            );


        const profile = {

            uid,

            name,

            email,

            phone,

            WhatsApp:
                whatsapp,

            ville,

            commune,

            adresse:
                address,

            category,

            description,

            photoURL,

            active:
                false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                COLLECTIONS.commerce,
                uid
            ),
            profile
        );


        return;

    }


    /* =====================================================
       CAMU TAXI
    ====================================================== */

    if (
        selectedAccountType ===
        "taxi"
    ) {

        const quartier =
            getValue(
                "taxiQuartier"
            );


        const vehicleType =
            getValue(
                "taxiVehicleType"
            );


        const vehicleBrand =
            getValue(
                "taxiVehicleBrand"
            );


        const vehiclePlate =
            getValue(
                "taxiVehiclePlate"
            );


        const availabilityValue =
            getValue(
                "taxiAvailability"
            );


        const description =
            getValue(
                "taxiDescription"
            );


        const vehiclePhotoFile =
            getSelectedVehiclePhoto();


        let photoVehicule = "";


        if (vehiclePhotoFile) {

            photoVehicule =
                await uploadImage(
                    vehiclePhotoFile,
                    "camu-services/taxis"
                );

        }


        const profile = {

            uid,

            name:
                fullName,

            email,

            phone,

            WhatsApp:
                whatsapp,

            ville,

            commune,

            quartier,

            typeProfessionnel:
                "chauffeur",

            typeVehicule:
                vehicleType,

            marqueVehicule:
                vehicleBrand,

            plaque:
                vehiclePlate,

            service:
                "Taxi",

            description,

            photoURL,

            photoVehicule,

            active:
                false,

            disponible:
                availabilityValue ===
                "true",

            latitude:
                null,

            longitude:
                null,

            lastLocationUpdate:
                null,

            rating:
                0,

            totalRatings:
                0,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                COLLECTIONS.taxi,
                uid
            ),
            profile
        );


        return;

    }


    /* =====================================================
       CAMU HÔTELS
    ====================================================== */

    if (
        selectedAccountType ===
        "hotels"
    ) {

        const name =
            getValue(
                "hotelName"
            );


        const type =
            getValue(
                "hotelType"
            );


        const address =
            getValue(
                "hotelAddress"
            );


        const description =
            getValue(
                "hotelDescription"
            );


        const profile = {

            uid,

            name,

            email,

            phone,

            whatsapp,

            ville,

            commune,

            adresse:
                address,

            category:
                type,

            description,

            photoURL,

            active:
                false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                COLLECTIONS.hotels,
                uid
            ),
            profile
        );

    }

}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return String(
        element.value || ""
    ).trim();

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!signupMessage) {
        return;
    }


    signupMessage.textContent =
        message;


    signupMessage.className =
        `signup-message show ${type}`;

}


function clearMessage() {

    if (!signupMessage) {
        return;
    }


    signupMessage.textContent =
        "";


    signupMessage.className =
        "signup-message";

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    loading
) {

    if (!signupSubmit) {
        return;
    }


    signupSubmit.disabled =
        loading;


    const icon =
        signupSubmit.querySelector(
            "i"
        );


    const span =
        signupSubmit.querySelector(
            "span"
        );


    if (loading) {

        if (icon) {

            icon.className =
                "fa-solid fa-spinner fa-spin";

        }


        if (span) {

            span.textContent =
                "Création du compte...";

        }

    }

    else {

        if (icon) {

            icon.className =
                "fa-solid fa-user-plus";

        }


        if (span) {

            span.textContent =
                "Créer mon compte";

        }

    }

}


/* =========================================================
   VISIBILITÉ MOT DE PASSE
========================================================= */

document
    .querySelectorAll(
        ".password-toggle"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.target;


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {
                        return;
                    }


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";


                        button.innerHTML = `

                            <i class="fa-solid fa-eye-slash"></i>

                        `;

                    }

                    else {

                        input.type =
                            "password";


                        button.innerHTML = `

                            <i class="fa-solid fa-eye"></i>

                        `;

                    }

                }
            );

        }
    );


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   INITIALISATION
========================================================= */

ensureProfilePhotoField();

loadCities();


console.log(
    "CAMU INSCRIPTION — formulaire CAMU TAXI initialisé."
);
