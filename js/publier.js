/* =========================================================
   CAMU SERVICES — PUBLICATION DYNAMIQUE
   Firebase + Cloudinary
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
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
   DOM
========================================================= */

const publishLoading =
    document.getElementById("publishLoading");

const publishAccessDenied =
    document.getElementById("publishAccessDenied");

const publishFormContainer =
    document.getElementById("publishFormContainer");

const publishForm =
    document.getElementById("publishForm");

const publishTypeFields =
    document.getElementById("publishTypeFields");

const publishSpecificFields =
    document.getElementById("publishSpecificFields");

const publishVille =
    document.getElementById("publishVille");

const publishCommune =
    document.getElementById("publishCommune");

const publishNeighborhood =
    document.getElementById("publishNeighborhood");

const publishWhatsapp =
    document.getElementById("publishWhatsapp");

const publishPhone =
    document.getElementById("publishPhone");

const publishPhotos =
    document.getElementById("publishPhotos");

const publishPhotoPreview =
    document.getElementById("publishPhotoPreview");

const publishPhotoInfo =
    document.getElementById("publishPhotoInfo");

const publishMessage =
    document.getElementById("publishMessage");

const publishSubmit =
    document.getElementById("publishSubmit");

const publishSpaceName =
    document.getElementById("publishSpaceName");

const publishSpaceIcon =
    document.getElementById("publishSpaceIcon");

const publishHeroTitle =
    document.getElementById("publishHeroTitle");

const publishHeroDescription =
    document.getElementById("publishHeroDescription");

const publishYear =
    document.getElementById("publishYear");


/* =========================================================
   MENU MOBILE
========================================================= */

const publishMenuButton =
    document.getElementById("publishMenuButton");

const publishSidebar =
    document.getElementById("publishSidebar");

const publishOverlay =
    document.getElementById("publishOverlay");


if (publishMenuButton) {

    publishMenuButton.addEventListener(
        "click",
        () => {

            publishSidebar.classList.add("open");

            publishOverlay.classList.add("open");

        }
    );

}


if (publishOverlay) {

    publishOverlay.addEventListener(
        "click",
        closeMobileMenu
    );

}


function closeMobileMenu() {

    publishSidebar.classList.remove("open");

    publishOverlay.classList.remove("open");

}


/* =========================================================
   ANNÉE
========================================================= */

if (publishYear) {

    publishYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   ESPACES
========================================================= */

const ACCOUNT_INFO = {

    client: {

        name: "Client",

        icon: "fa-solid fa-user",

        title: "Publier une demande",

        description:
            "Publiez une demande afin de trouver un produit, un service ou un professionnel."

    },

    immobilier: {

        name: "CAMU IMMO",

        icon: "fa-solid fa-house",

        title: "Publier une annonce immobilière",

        description:
            "Publiez un bien immobilier à vendre ou à louer."

    },

    commerce: {

        name: "CAMU COMMERCE",

        icon: "fa-solid fa-store",

        title: "Publier un produit ou service",

        description:
            "Présentez vos produits ou services à vos clients."

    },

    vehicules: {

        name: "VÉHICULES & TRANSPORT",

        icon: "fa-solid fa-car",

        title: "Publier une annonce véhicule",

        description:
            "Publiez un véhicule, un service de transport ou une offre automobile."

    },

    hotels: {

        name: "HÔTELS & HÉBERGEMENT",

        icon: "fa-solid fa-hotel",

        title: "Publier une offre d'hébergement",

        description:
            "Présentez votre hôtel, logement ou offre d'hébergement."

    }

};


let currentUser = null;

let currentAccountType = null;

let selectedFiles = [];


/* =========================================================
   CATÉGORIES
========================================================= */

const COMMERCE_CATEGORIES = [

    ["mode", "Mode & Vêtements"],
    ["chaussures", "Chaussures"],
    ["telephones", "Téléphones & Accessoires"],
    ["informatique", "Informatique"],
    ["maison", "Maison & Mobilier"],
    ["beaute", "Beauté & Cosmétiques"],
    ["alimentation", "Alimentation"],
    ["boissons", "Boissons"],
    ["materiaux", "Matériaux & Bricolage"],
    ["livres", "Livres & Fournitures"],
    ["enfants", "Enfants & Jouets"],
    ["bijoux", "Bijoux & Accessoires"],
    ["autres", "Autres commerces"]

];


const VEHICLE_TYPES = [

    "Taxi / Voiture",
    "Moto",
    "Bus / Minibus",
    "Camion",
    "Engin / Machine",
    "Autre"

];


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
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser = null;

            showAccessDenied();

            return;

        }


        currentUser = user;


        try {

            await loadUserProfile(user);

        } catch (error) {

            console.error(
                "CAMU PUBLICATION — profil :",
                error
            );

            showMessage(
                "Impossible de récupérer votre profil.",
                "error"
            );

        }

    }
);


/* =========================================================
   PROFIL UTILISATEUR
========================================================= */

async function loadUserProfile(user) {

    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    const userSnapshot =
        await getDoc(userRef);


    if (!userSnapshot.exists()) {

        showMessage(
            "Votre profil CAMU SERVICES est introuvable.",
            "error"
        );

        return;

    }


    const userData =
        userSnapshot.data();


    currentAccountType =
        String(
            userData.accountType || "client"
        )
        .trim()
        .toLowerCase();


    if (
        !ACCOUNT_INFO[currentAccountType]
    ) {

        currentAccountType =
            "client";

    }


    const info =
        ACCOUNT_INFO[currentAccountType];


    publishSpaceName.textContent =
        info.name;

    publishSpaceIcon.className =
        info.icon;

    publishHeroTitle.textContent =
        info.title;

    publishHeroDescription.textContent =
        info.description;


    if (
        userData.phone
        &&
        !publishPhone.value
    ) {

        publishPhone.value =
            userData.phone;

    }


    if (
        userData.whatsapp
        &&
        !publishWhatsapp.value
    ) {

        publishWhatsapp.value =
            userData.whatsapp;

    }


    if (
        userData.ville
    ) {

        await loadCities(
            userData.ville
        );

    } else {

        await loadCities();

    }


    buildPublishTypes();

    buildSpecificFields();

    hideLoading();

}


/* =========================================================
   CHARGER VILLES
========================================================= */

async function loadCities(
    selectedCity = ""
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach(
            citySnapshot => {

                const data =
                    citySnapshot.data();


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


        publishVille.innerHTML = `
            <option value="">
                Sélectionner une ville
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

                if (
                    normalizeText(city.name)
                    ===
                    normalizeText(selectedCity)
                ) {

                    option.selected =
                        true;

                }

                publishVille.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "CAMU PUBLICATION — villes :",
            error
        );


        publishVille.innerHTML = `
            <option value="">
                Impossible de charger les villes
            </option>
        `;

    }

}


/* =========================================================
   TYPES D'ANNONCES
========================================================= */

function buildPublishTypes() {

    publishTypeFields.innerHTML = "";


    let types = [];


    if (
        currentAccountType ===
        "immobilier"
    ) {

        types = [

            ["vente", "Vente", "fa-house-circle-check"],

            ["location", "Location", "fa-key"]

        ];

    }


    else if (
        currentAccountType ===
        "commerce"
    ) {

        types = [

            ["produit", "Produit", "fa-box"],

            ["service", "Service", "fa-hand-holding-heart"]

        ];

    }


    else if (
        currentAccountType ===
        "vehicules"
    ) {

        types = [

            ["vente_vehicule", "Vente de véhicule", "fa-car"],

            ["location", "Location", "fa-key"],

            ["transport", "Transport", "fa-route"],

            ["service_auto", "Service automobile", "fa-screwdriver-wrench"]

        ];

    }


    else if (
        currentAccountType ===
        "hotels"
    ) {

        types = [

            ["hebergement", "Hébergement", "fa-bed"],

            ["location_courte_duree", "Location courte durée", "fa-calendar-days"]

        ];

    }


    else {

        types = [

            ["demande_service", "Demande de service", "fa-hand-holding-heart"],

            ["recherche_produit", "Recherche d'un produit", "fa-magnifying-glass"],

            ["autre_demande", "Autre demande", "fa-circle-question"]

        ];

    }


    types.forEach(
        (type, index) => {

            const [
                value,
                label,
                icon
            ] = type;


            const wrapper =
                document.createElement(
                    "label"
                );


            wrapper.className =
                "publish-type-option";


            wrapper.innerHTML = `

                <input
                    type="radio"
                    name="publishType"
                    value="${escapeHtml(value)}"
                    ${index === 0 ? "checked" : ""}
                >

                <span class="publish-type-option-content">

                    <i class="fa-solid ${escapeHtml(icon)}"></i>

                    <strong>
                        ${escapeHtml(label)}
                    </strong>

                </span>

            `;


            publishTypeFields.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   CHAMPS SPÉCIFIQUES
========================================================= */

function buildSpecificFields() {

    publishSpecificFields.innerHTML = "";


    /* =====================================================
       IMMOBILIER
    ====================================================== */

    if (
        currentAccountType ===
        "immobilier"
    ) {

        publishSpecificFields.innerHTML = `

            <div class="publish-form-group full">

                <label for="publishTitle">
                    Titre de l'annonce <span>*</span>
                </label>

                <input
                    type="text"
                    id="publishTitle"
                    placeholder="Ex. Maison moderne à vendre"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishPropertyType">
                    Type de bien <span>*</span>
                </label>

                <select
                    id="publishPropertyType"
                    required
                >

                    <option value="">
                        Sélectionner
                    </option>

                    <option value="Maison">
                        Maison
                    </option>

                    <option value="Appartement">
                        Appartement
                    </option>

                    <option value="Terrain">
                        Terrain
                    </option>

                    <option value="Bureau">
                        Bureau
                    </option>

                    <option value="Commerce">
                        Local commercial
                    </option>

                    <option value="Autre">
                        Autre
                    </option>

                </select>

            </div>


            <div class="publish-form-group">

                <label for="publishPrice">
                    Prix <span>*</span>
                </label>

                <input
                    type="number"
                    id="publishPrice"
                    min="0"
                    placeholder="Ex. 250"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishCurrency">
                    Devise
                </label>

                <select id="publishCurrency">

                    <option value="USD">
                        USD
                    </option>

                    <option value="CDF">
                        CDF
                    </option>

                </select>

            </div>


            <div class="publish-form-group full">

                <label for="publishDescription">
                    Description <span>*</span>
                </label>

                <textarea
                    id="publishDescription"
                    placeholder="Décrivez le bien immobilier..."
                    required
                ></textarea>

            </div>

        `;

        return;
    }


    /* =====================================================
       COMMERCE
    ====================================================== */

    if (
        currentAccountType ===
        "commerce"
    ) {

        const categories =
            COMMERCE_CATEGORIES
                .map(
                    category => `
                        <option value="${escapeHtml(category[0])}">
                            ${escapeHtml(category[1])}
                        </option>
                    `
                )
                .join("");


        publishSpecificFields.innerHTML = `

            <div class="publish-form-group full">

                <label for="publishTitle">
                    Nom du produit / service <span>*</span>
                </label>

                <input
                    type="text"
                    id="publishTitle"
                    placeholder="Ex. Robe femme"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishCommerceCategory">
                    Catégorie <span>*</span>
                </label>

                <select
                    id="publishCommerceCategory"
                    required
                >

                    <option value="">
                        Sélectionner
                    </option>

                    ${categories}

                </select>

            </div>


            <div class="publish-form-group">

                <label for="publishPrice">
                    Prix <span>*</span>
                </label>

                <input
                    type="number"
                    id="publishPrice"
                    min="0"
                    placeholder="Ex. 25"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishCurrency">
                    Devise
                </label>

                <select id="publishCurrency">

                    <option value="USD">
                        USD
                    </option>

                    <option value="CDF">
                        CDF
                    </option>

                </select>

            </div>


            <div class="publish-form-group full">

                <label for="publishDescription">
                    Description <span>*</span>
                </label>

                <textarea
                    id="publishDescription"
                    placeholder="Décrivez votre produit ou service..."
                    required
                ></textarea>

            </div>

        `;

        return;
    }


    /* =====================================================
       VÉHICULES
    ====================================================== */

    if (
        currentAccountType ===
        "vehicules"
    ) {

        const vehicleOptions =
            VEHICLE_TYPES
                .map(
                    type => `
                        <option value="${escapeHtml(type)}">
                            ${escapeHtml(type)}
                        </option>
                    `
                )
                .join("");


        publishSpecificFields.innerHTML = `

            <div class="publish-form-group full">

                <label for="publishTitle">
                    Titre de l'annonce <span>*</span>
                </label>

                <input
                    type="text"
                    id="publishTitle"
                    placeholder="Ex. Nissan Patrol à vendre"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishVehicleType">
                    Type de véhicule <span>*</span>
                </label>

                <select
                    id="publishVehicleType"
                    required
                >

                    <option value="">
                        Sélectionner
                    </option>

                    ${vehicleOptions}

                </select>

            </div>


            <div class="publish-form-group">

                <label for="publishBrand">
                    Marque
                </label>

                <input
                    type="text"
                    id="publishBrand"
                    placeholder="Ex. Nissan"
                >

            </div>


            <div class="publish-form-group">

                <label for="publishModel">
                    Modèle
                </label>

                <input
                    type="text"
                    id="publishModel"
                    placeholder="Ex. Patrol"
                >

            </div>


            <div class="publish-form-group">

                <label for="publishYearVehicle">
                    Année
                </label>

                <input
                    type="number"
                    id="publishYearVehicle"
                    min="1900"
                    max="2100"
                    placeholder="Ex. 2022"
                >

            </div>


            <div class="publish-form-group">

                <label for="publishPrice">
                    Prix
                </label>

                <input
                    type="number"
                    id="publishPrice"
                    min="0"
                    placeholder="Ex. 15000"
                >

            </div>


            <div class="publish-form-group">

                <label for="publishCurrency">
                    Devise
                </label>

                <select id="publishCurrency">

                    <option value="USD">
                        USD
                    </option>

                    <option value="CDF">
                        CDF
                    </option>

                </select>

            </div>


            <div class="publish-form-group full">

                <label for="publishDescription">
                    Description <span>*</span>
                </label>

                <textarea
                    id="publishDescription"
                    placeholder="Décrivez le véhicule ou le service..."
                    required
                ></textarea>

            </div>

        `;

        return;
    }


    /* =====================================================
       HÔTELS
    ====================================================== */

    if (
        currentAccountType ===
        "hotels"
    ) {

        const hotelOptions =
            HOTEL_TYPES
                .map(
                    type => `
                        <option value="${escapeHtml(type)}">
                            ${escapeHtml(type)}
                        </option>
                    `
                )
                .join("");


        publishSpecificFields.innerHTML = `

            <div class="publish-form-group full">

                <label for="publishTitle">
                    Nom de l'hébergement <span>*</span>
                </label>

                <input
                    type="text"
                    id="publishTitle"
                    placeholder="Ex. Hôtel CAMU"
                    required
                >

            </div>


            <div class="publish-form-group">

                <label for="publishHotelType">
                    Type d'hébergement <span>*</span>
                </label>

                <select
                    id="publishHotelType"
                    required
                >

                    <option value="">
                        Sélectionner
                    </option>

                    ${hotelOptions}

                </select>

            </div>


            <div class="publish-form-group">

                <label for="publishPrice">
                    Prix
                </label>

                <input
                    type="number"
                    id="publishPrice"
                    min="0"
                    placeholder="Prix par nuit"
                >

            </div>


            <div class="publish-form-group">

                <label for="publishCurrency">
                    Devise
                </label>

                <select id="publishCurrency">

                    <option value="USD">
                        USD
                    </option>

                    <option value="CDF">
                        CDF
                    </option>

                </select>

            </div>


            <div class="publish-form-group full">

                <label for="publishDescription">
                    Description <span>*</span>
                </label>

                <textarea
                    id="publishDescription"
                    placeholder="Décrivez l'hébergement..."
                    required
                ></textarea>

            </div>

        `;

        return;
    }


    /* =====================================================
       CLIENT
    ====================================================== */

    publishSpecificFields.innerHTML = `

        <div class="publish-form-group full">

            <label for="publishTitle">
                Titre de la demande <span>*</span>
            </label>

            <input
                type="text"
                id="publishTitle"
                placeholder="Ex. Je cherche un appartement à louer"
                required
            >

        </div>


        <div class="publish-form-group full">

            <label for="publishDescription">
                Description de votre demande <span>*</span>
            </label>

            <textarea
                id="publishDescription"
                placeholder="Expliquez ce que vous recherchez..."
                required
            ></textarea>

        </div>

    `;

}


/* =========================================================
   PHOTOS — SÉLECTION
========================================================= */

publishPhotos.addEventListener(
    "change",
    event => {

        selectedFiles =
            Array.from(
                event.target.files || []
            );


        renderPhotoPreview();

    }
);


/* =========================================================
   APERÇU PHOTOS
========================================================= */

function renderPhotoPreview() {

    publishPhotoPreview.innerHTML = "";


    if (
        selectedFiles.length === 0
    ) {

        publishPhotoInfo.textContent =
            "Vous pouvez sélectionner plusieurs photos.";

        return;

    }


    publishPhotoInfo.textContent =
        `${selectedFiles.length} photo(s) sélectionnée(s).`;


    selectedFiles.forEach(
        file => {

            const reader =
                new FileReader();


            reader.onload = event => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "publish-photo-item";


                item.innerHTML = `

                    <img
                        src="${event.target.result}"
                        alt="Aperçu"
                    >

                `;


                publishPhotoPreview.appendChild(
                    item
                );

            };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   SUBMIT
========================================================= */

publishForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearMessage();


        if (!currentUser) {

            showMessage(
                "Vous devez être connecté pour publier.",
                "error"
            );

            return;

        }


        if (
            !publishForm.checkValidity()
        ) {

            publishForm.reportValidity();

            return;

        }


        const selectedType =
            document.querySelector(
                'input[name="publishType"]:checked'
            );


        if (!selectedType) {

            showMessage(
                "Veuillez choisir le type d'annonce.",
                "error"
            );

            return;

        }


        if (
            selectedFiles.length === 0
            &&
            currentAccountType !== "client"
        ) {

            showMessage(
                "Ajoutez au moins une photo à votre annonce.",
                "error"
            );

            return;

        }


        setLoading(true);


        try {

            /* =============================================
               INFORMATIONS
            ============================================== */

            const title =
                getValue("publishTitle");

            const description =
                getValue("publishDescription");

            const ville =
                getValue("publishVille");

            const commune =
                getValue("publishCommune");

            const neighborhood =
                getValue("publishNeighborhood");

            const whatsapp =
                getValue("publishWhatsapp");

            const phone =
                getValue("publishPhone");

            const publishType =
                selectedType.value;


            /* =============================================
               PHOTOS CLOUDINARY
            ============================================== */

            const imageURLs =
                await uploadImages(
                    selectedFiles
                );


            /* =============================================
               DONNÉES COMMUNES
            ============================================== */

            const data = {

                title: title,

                description: description,

                category:
                    getCategory(),

                publicationType:
                    publishType,

                city: ville,

                commune: commune,

                neighborhood:
                    neighborhood,

                whatsapp:
                    whatsapp,

                phone:
                    phone,

                images:
                    imageURLs,

                imageURL:
                    imageURLs[0] || "",

                imageCount:
                    imageURLs.length,

                userId:
                    currentUser.uid,

                ownerId:
                    currentUser.uid,

                ownerName:
                    currentUser.displayName
                    ||
                    "Utilisateur",

                ownerEmail:
                    currentUser.email
                    ||
                    "",

                accountType:
                    currentAccountType,

                status:
                    "active",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            /* =============================================
               CHAMPS SPÉCIFIQUES
            ============================================== */

            addSpecificData(
                data
            );


            /* =============================================
               FIRESTORE
            ============================================== */

            const annonceRef =
                await addDoc(
                    collection(
                        db,
                        "annonces"
                    ),
                    data
                );


            console.log(
                "CAMU PUBLICATION — annonce créée :",
                annonceRef.id
            );


            showMessage(
                "Votre annonce a été publiée avec succès.",
                "success"
            );


            publishForm.reset();

            selectedFiles = [];

            publishPhotoPreview.innerHTML = "";

            publishPhotoInfo.textContent =
                "Vous pouvez sélectionner plusieurs photos.";


            setTimeout(
                () => {

                    window.location.href =
                        `explorer.html?id=${encodeURIComponent(annonceRef.id)}`;

                },
                1200
            );


        } catch (error) {

            console.error(
                "CAMU PUBLICATION — erreur :",
                error
            );


            showMessage(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }
);


/* =========================================================
   CATÉGORIE
========================================================= */

function getCategory() {

    if (
        currentAccountType ===
        "immobilier"
    ) {

        return "immobilier";

    }


    if (
        currentAccountType ===
        "commerce"
    ) {

        return "commerce";

    }


    if (
        currentAccountType ===
        "vehicules"
    ) {

        return "vehicules";

    }


    if (
        currentAccountType ===
        "hotels"
    ) {

        return "hotels";

    }


    return "demande";

}


/* =========================================================
   DONNÉES SPÉCIFIQUES
========================================================= */

function addSpecificData(data) {


    /* =====================================================
       IMMOBILIER
    ====================================================== */

    if (
        currentAccountType ===
        "immobilier"
    ) {

        data.propertyType =
            getValue(
                "publishPropertyType"
            );

        data.price =
            numberValue(
                "publishPrice"
            );

        data.currency =
            getValue(
                "publishCurrency"
            );

        data.transactionType =
            document.querySelector(
                'input[name="publishType"]:checked'
            )?.value || "";

        return;
    }


    /* =====================================================
       COMMERCE
    ====================================================== */

    if (
        currentAccountType ===
        "commerce"
    ) {

        data.commerceCategory =
            getValue(
                "publishCommerceCategory"
            );

        data.price =
            numberValue(
                "publishPrice"
            );

        data.currency =
            getValue(
                "publishCurrency"
            );

        return;
    }


    /* =====================================================
       VÉHICULES
    ====================================================== */

    if (
        currentAccountType ===
        "vehicules"
    ) {

        data.vehicleType =
            getValue(
                "publishVehicleType"
            );

        data.marque =
            getValue(
                "publishBrand"
            );

        data.modele =
            getValue(
                "publishModel"
            );

        data.annee =
            numberValue(
                "publishYearVehicle"
            );

        data.price =
            numberValue(
                "publishPrice"
            );

        data.currency =
            getValue(
                "publishCurrency"
            );

        data.vehiclePublicationType =
            document.querySelector(
                'input[name="publishType"]:checked'
            )?.value || "";

        return;
    }


    /* =====================================================
       HÔTELS
    ====================================================== */

    if (
        currentAccountType ===
        "hotels"
    ) {

        data.hotelType =
            getValue(
                "publishHotelType"
            );

        data.price =
            numberValue(
                "publishPrice"
            );

        data.currency =
            getValue(
                "publishCurrency"
            );

        return;
    }


    /* =====================================================
       CLIENT
    ====================================================== */

    data.requestType =
        document.querySelector(
            'input[name="publishType"]:checked'
        )?.value || "";

}


/* =========================================================
   CLOUDINARY
========================================================= */

async function uploadImages(
    files
) {

    if (
        files.length === 0
    ) {

        return [];

    }


    const urls = [];


    for (
        const file of files
    ) {

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Un des fichiers sélectionnés n'est pas une image."
            );

        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            throw new Error(
                `L'image "${file.name}" dépasse 10 Mo.`
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


        const response =
            await fetch(
                CLOUDINARY_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
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
            !response.ok
            ||
            !result
            ||
            !result.secure_url
        ) {

            console.error(
                "Cloudinary response :",
                result
            );

            throw new Error(
                `Impossible de téléverser l'image "${file.name}".`
            );

        }


        urls.push(
            result.secure_url
        );

    }


    return urls;

}


/* =========================================================
   UTILS
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


function numberValue(id) {

    const value =
        getValue(id);


    if (!value) {

        return 0;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function normalizeText(value) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   AFFICHAGE
========================================================= */

function hideLoading() {

    publishLoading.classList.add(
        "hidden"
    );

    publishFormContainer.classList.remove(
        "hidden"
    );

}


function showAccessDenied() {

    publishLoading.classList.add(
        "hidden"
    );

    publishAccessDenied.classList.remove(
        "hidden"
    );

    publishFormContainer.classList.add(
        "hidden"
    );

}


function showMessage(
    message,
    type = "error"
) {

    publishMessage.textContent =
        message;

    publishMessage.className =
        `publish-message show ${type}`;

}


function clearMessage() {

    publishMessage.textContent = "";

    publishMessage.className =
        "publish-message";

}


/* =========================================================
   LOADING SUBMIT
========================================================= */

function setLoading(
    loading
) {

    publishSubmit.disabled =
        loading;


    const icon =
        publishSubmit.querySelector("i");

    const span =
        publishSubmit.querySelector("span");


    if (loading) {

        if (icon) {

            icon.className =
                "fa-solid fa-spinner fa-spin";

        }

        if (span) {

            span.textContent =
                "Publication en cours...";

        }

    } else {

        if (icon) {

            icon.className =
                "fa-solid fa-cloud-arrow-up";

        }

        if (span) {

            span.textContent =
                "Publier l'annonce";

        }

    }

}


/* =========================================================
   ERREURS FIREBASE
========================================================= */

function getErrorMessage(
    error
) {

    if (
        error instanceof Error
        &&
        error.message
    ) {

        if (
            error.message.includes(
                "Missing or insufficient permissions"
            )
        ) {

            return "Vous n'avez pas l'autorisation de publier cette annonce.";

        }


        return error.message;

    }


    if (
        error?.code ===
        "permission-denied"
    ) {

        return "Vous n'avez pas l'autorisation de publier cette annonce.";

    }


    return "Une erreur est survenue pendant la publication.";

}


console.log(
    "CAMU PUBLICATION — système dynamique initialisé."
);
