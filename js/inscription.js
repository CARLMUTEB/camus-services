/* =========================================================
   CAMU SERVICES — INSCRIPTION DYNAMIQUE
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
   CONFIGURATION
========================================================= */

const COLLECTIONS = {
    immobilier: "agents_immobiliers",
    commerce: "etablissements_commerciaux",
    vehicules: "chauffeurs",
    hotels: "etablissements_hoteliers"
};


/* =========================================================
   ÉLÉMENTS DOM
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
    signupYear.textContent = new Date().getFullYear();
}


/* =========================================================
   MENU MOBILE
========================================================= */

if (signupMenuButton) {

    signupMenuButton.addEventListener("click", () => {

        signupSidebar.classList.add("open");
        signupOverlay.classList.add("open");

    });

}


if (signupOverlay) {

    signupOverlay.addEventListener("click", closeMobileMenu);

}


function closeMobileMenu() {

    signupSidebar.classList.remove("open");
    signupOverlay.classList.remove("open");

}


/* =========================================================
   INFORMATIONS DES ESPACES
========================================================= */

const ACCOUNT_TYPES = {

    client: {
        name: "Client",
        icon: "fa-solid fa-user"
    },

    immobilier: {
        name: "CAMU IMMO",
        icon: "fa-solid fa-house"
    },

    commerce: {
        name: "CAMU COMMERCE",
        icon: "fa-solid fa-store"
    },

    vehicules: {
        name: "VÉHICULES & TRANSPORT",
        icon: "fa-solid fa-car"
    },

    hotels: {
        name: "HÔTELS & HÉBERGEMENT",
        icon: "fa-solid fa-hotel"
    }

};


/* =========================================================
   CATEGORIES COMMERCE
   IMPORTANT : PAS DE COLLECTION FIRESTORE
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
   CATÉGORIES HÔTELS
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
   CATÉGORIES VÉHICULES
========================================================= */

const VEHICLE_TYPES = [

    "Taxi / Voiture",
    "Moto",
    "Bus / Minibus",
    "Camion",
    "Engin / Machine",
    "Autre"

];


/* =========================================================
   SERVICES VÉHICULES
========================================================= */

const VEHICLE_SERVICES = [

    "Transport de personnes",
    "Transport de marchandises",
    "Taxi",
    "Moto-taxi",
    "Location de véhicules",
    "Vente de véhicules",
    "Autre"

];


/* =========================================================
   CHOIX DU TYPE DE COMPTE
========================================================= */

document
    .querySelectorAll(".account-type-card")
    .forEach(card => {

        card.addEventListener("click", () => {

            const type =
                card.dataset.accountType;

            selectAccountType(type, card);

        });

    });


/* =========================================================
   SÉLECTION ESPACE
========================================================= */

function selectAccountType(type, selectedCard = null) {

    if (!ACCOUNT_TYPES[type]) {
        return;
    }

    selectedAccountType = type;

    document
        .querySelectorAll(".account-type-card")
        .forEach(card => {

            card.classList.remove("selected");

        });

    if (selectedCard) {
        selectedCard.classList.add("selected");
    }

    const accountInfo =
        ACCOUNT_TYPES[type];

    selectedSpaceName.textContent =
        accountInfo.name;

    selectedSpaceIcon.className =
        accountInfo.icon;

    buildSpecificFields(type);

    accountTypeStep.classList.add("hidden");

    signupFormWrapper.classList.remove("hidden");

    clearMessage();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   MODIFIER LE TYPE
========================================================= */

if (changeAccountType) {

    changeAccountType.addEventListener("click", () => {

        selectedAccountType = null;

        signupFormWrapper.classList.add("hidden");

        accountTypeStep.classList.remove("hidden");

        specificFields.innerHTML = "";

        clearMessage();

        window.scrollTo({
            top: accountTypeStep.offsetTop - 20,
            behavior: "smooth"
        });

    });

}


/* =========================================================
   CONSTRUCTION DES CHAMPS
========================================================= */

function buildSpecificFields(type) {

    specificFields.innerHTML = "";


    /* =====================================================
       CLIENT
    ====================================================== */

    if (type === "client") {

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-user"></i>

                <div>
                    <h3>Profil utilisateur</h3>

                    <p>
                        Aucun renseignement professionnel
                        supplémentaire n'est nécessaire.
                    </p>
                </div>

            </div>

        `;

        return;
    }


    /* =====================================================
       IMMOBILIER
    ====================================================== */

    if (type === "immobilier") {

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-house"></i>

                <div>
                    <h3>Informations immobilières</h3>

                    <p>
                        Présentez votre activité dans le domaine
                        immobilier.
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


                <div
                    class="form-group"
                    id="immoAgencyGroup"
                >

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


                <div class="form-group full">

                    <label for="immoPhoto">
                        Photo / Logo
                    </label>

                    <input
                        type="url"
                        id="immoPhoto"
                        name="immoPhoto"
                        placeholder="URL de votre photo ou logo"
                    >

                </div>

            </div>

        `;

        const immoType =
            document.getElementById("immoType");

        if (immoType) {

            immoType.addEventListener("change", () => {

                const agencyGroup =
                    document.getElementById(
                        "immoAgencyGroup"
                    );

                if (
                    immoType.value === "agence"
                    ||
                    immoType.value === "agent"
                ) {

                    agencyGroup.style.display =
                        "flex";

                } else {

                    agencyGroup.style.display =
                        "flex";

                }

            });

        }

        return;
    }


    /* =====================================================
       COMMERCE
    ====================================================== */

    if (type === "commerce") {

        const categoryOptions =
            COMMERCE_CATEGORIES
                .map(category => {

                    return `
                        <option value="${escapeHtml(category.value)}">
                            ${escapeHtml(category.label)}
                        </option>
                    `;

                })
                .join("");

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-store"></i>

                <div>
                    <h3>Informations de l'établissement</h3>

                    <p>
                        Ces informations seront utilisées
                        pour présenter votre établissement.
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


                <div class="form-group full">

                    <label for="commercePhoto">
                        Photo / Logo
                    </label>

                    <input
                        type="url"
                        id="commercePhoto"
                        name="commercePhoto"
                        placeholder="URL de votre photo ou logo"
                    >

                </div>

            </div>

        `;

        return;
    }


    /* =====================================================
       VÉHICULES
    ====================================================== */

    if (type === "vehicules") {

        const vehicleTypes =
            VEHICLE_TYPES
                .map(type => `
                    <option value="${escapeHtml(type)}">
                        ${escapeHtml(type)}
                    </option>
                `)
                .join("");

        const vehicleServices =
            VEHICLE_SERVICES
                .map(service => `
                    <option value="${escapeHtml(service)}">
                        ${escapeHtml(service)}
                    </option>
                `)
                .join("");

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-car"></i>

                <div>
                    <h3>Informations véhicules & transport</h3>

                    <p>
                        Présentez votre véhicule ou votre
                        activité de transport.
                    </p>
                </div>

            </div>


            <div class="form-grid">

                <div class="form-group">

                    <label for="vehicleProfessionalType">
                        Type de professionnel
                        <span>*</span>
                    </label>

                    <select
                        id="vehicleProfessionalType"
                        name="vehicleProfessionalType"
                        required
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        <option value="chauffeur">
                            Chauffeur
                        </option>

                        <option value="proprietaire">
                            Propriétaire de véhicule
                        </option>

                        <option value="agence">
                            Agence automobile
                        </option>

                        <option value="transporteur">
                            Entreprise de transport
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="vehicleType">
                        Type de véhicule
                    </label>

                    <select
                        id="vehicleType"
                        name="vehicleType"
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        ${vehicleTypes}

                    </select>

                </div>


                <div class="form-group">

                    <label for="vehicleBrand">
                        Marque du véhicule
                    </label>

                    <input
                        type="text"
                        id="vehicleBrand"
                        name="vehicleBrand"
                        placeholder="Ex. Nissan"
                    >

                </div>


                <div class="form-group">

                    <label for="vehiclePlate">
                        Plaque d'immatriculation
                    </label>

                    <input
                        type="text"
                        id="vehiclePlate"
                        name="vehiclePlate"
                        placeholder="Ex. AA2243/05"
                    >

                </div>


                <div class="form-group full">

                    <label for="vehicleService">
                        Service proposé
                    </label>

                    <select
                        id="vehicleService"
                        name="vehicleService"
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        ${vehicleServices}

                    </select>

                </div>


                <div class="form-group full">

                    <label for="vehicleDescription">
                        Description
                    </label>

                    <textarea
                        id="vehicleDescription"
                        name="vehicleDescription"
                        placeholder="Présentez votre activité..."
                    ></textarea>

                </div>


                <div class="form-group full">

                    <label for="vehiclePhoto">
                        Photo du véhicule
                    </label>

                    <input
                        type="url"
                        id="vehiclePhoto"
                        name="vehiclePhoto"
                        placeholder="URL de la photo"
                    >

                </div>

            </div>

        `;

        return;
    }


    /* =====================================================
       HÔTELS
    ====================================================== */

    if (type === "hotels") {

        const hotelOptions =
            HOTEL_TYPES
                .map(type => `
                    <option value="${escapeHtml(type)}">
                        ${escapeHtml(type)}
                    </option>
                `)
                .join("");

        specificFields.innerHTML = `

            <div class="form-section-title">

                <i class="fa-solid fa-hotel"></i>

                <div>
                    <h3>Informations de l'établissement</h3>

                    <p>
                        Présentez votre hôtel ou votre
                        établissement d'hébergement.
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


                <div class="form-group full">

                    <label for="hotelPhoto">
                        Photo / Logo
                    </label>

                    <input
                        type="url"
                        id="hotelPhoto"
                        name="hotelPhoto"
                        placeholder="URL de votre photo ou logo"
                    >

                </div>

            </div>

        `;

    }

}


/* =========================================================
   CHARGER LES VILLES
========================================================= */

async function loadCities() {

    try {

        villeSelect.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;

        const snapshot =
            await getDocs(
                collection(db, "villes")
            );

        const cities = [];

        snapshot.forEach(documentSnapshot => {

            const data =
                documentSnapshot.data();

            if (data.active !== false) {

                cities.push({

                    id: documentSnapshot.id,

                    name:
                        String(
                            data.name || ""
                        ).trim(),

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }

        });

        cities.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.name.localeCompare(
                b.name,
                "fr"
            );

        });


        villeSelect.innerHTML = `
            <option value="">
                Sélectionner votre ville
            </option>
        `;


        cities.forEach(city => {

            if (!city.name) {
                return;
            }

            const option =
                document.createElement("option");

            option.value =
                city.name;

            option.textContent =
                city.name;

            villeSelect.appendChild(option);

        });


        if (cities.length === 0) {

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
   SUBMIT
========================================================= */

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
            document.getElementById(
                "password"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (password.length < 6) {

            showMessage(
                "Le mot de passe doit contenir au moins 6 caractères.",
                "error"
            );

            return;
        }


        if (password !== confirmPassword) {

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

        if (!terms.checked) {

            showMessage(
                "Veuillez accepter les conditions d'utilisation.",
                "error"
            );

            return;
        }


        setLoading(true);


        try {

            const fullName =
                getValue("fullName");

            const phone =
                getValue("phone");

            const whatsapp =
                getValue("whatsapp") || phone;

            const email =
                getValue("email").toLowerCase();

            const ville =
                getValue("ville");

            const commune =
                getValue("commune");


            /* =============================================
               CRÉATION DU COMPTE AUTHENTIFICATION
            ============================================== */

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            /* =============================================
               NOM FIREBASE AUTH
            ============================================== */

            await updateProfile(
                user,
                {
                    displayName: fullName
                }
            );


            /* =============================================
               DOCUMENT USERS
            ============================================== */

            const userData = {

                uid: user.uid,

                name: fullName,

                email: email,

                phone: phone,

                whatsapp: whatsapp,

                ville: ville,

                commune: commune,

                accountType:
                    selectedAccountType,

                accountStatus:
                    selectedAccountType === "client"
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


            /* =============================================
               CRÉATION PROFIL SPÉCIFIQUE
            ============================================== */

            await createProfessionalProfile(
                user.uid,
                {
                    fullName,
                    email,
                    phone,
                    whatsapp,
                    ville,
                    commune
                }
            );


            /* =============================================
               SUCCÈS
            ============================================== */

            showMessage(
                selectedAccountType === "client"
                    ? "Votre compte a été créé avec succès."
                    : "Votre compte a été créé. Votre profil professionnel sera vérifié avant sa publication.",
                "success"
            );


            signupForm.reset();


            setTimeout(() => {

                window.location.href =
                    "compte.html";

            }, 1800);


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
                "permission-denied"
            ) {

                message =
                    "Vous n'avez pas l'autorisation nécessaire.";

            }


            showMessage(
                message,
                "error"
            );

        } finally {

            setLoading(false);

        }

    }
);


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
        commune
    } = common;


    /* =====================================================
       CLIENT
    ====================================================== */

    if (
        selectedAccountType === "client"
    ) {

        return;
    }


    /* =====================================================
       IMMOBILIER
    ====================================================== */

    if (
        selectedAccountType === "immobilier"
    ) {

        const type =
            getValue("immoType");

        const agency =
            getValue("immoAgency");

        const description =
            getValue("immoDescription");

        const photoURL =
            getValue("immoPhoto");


        const profile = {

            uid: uid,

            name: fullName,

            email: email,

            phone: phone,

            WhatsApp: whatsapp,

            ville: ville,

            commune: commune,

            type: type,

            agencyName: agency,

            description: description,

            photoURL: photoURL,

            active: false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                "agents_immobiliers",
                uid
            ),
            profile
        );

        return;
    }


    /* =====================================================
       COMMERCE
    ====================================================== */

    if (
        selectedAccountType === "commerce"
    ) {

        const name =
            getValue("commerceName");

        const category =
            getValue("commerceCategory");

        const address =
            getValue("commerceAddress");

        const description =
            getValue("commerceDescription");

        const photoURL =
            getValue("commercePhoto");


        const profile = {

            uid: uid,

            name: name,

            email: email,

            phone: phone,

            WhatsApp: whatsapp,

            ville: ville,

            commune: commune,

            adresse: address,

            category: category,

            description: description,

            photoURL: photoURL,

            active: false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                "etablissements_commerciaux",
                uid
            ),
            profile
        );

        return;
    }


    /* =====================================================
       VÉHICULES
    ====================================================== */

    if (
        selectedAccountType === "vehicules"
    ) {

        const professionalType =
            getValue(
                "vehicleProfessionalType"
            );

        const vehicleType =
            getValue("vehicleType");

        const brand =
            getValue("vehicleBrand");

        const plate =
            getValue("vehiclePlate");

        const service =
            getValue("vehicleService");

        const description =
            getValue("vehicleDescription");

        const photoURL =
            getValue("vehiclePhoto");


        /* =============================================
           AGENCE
        ============================================== */

        if (
            professionalType === "agence"
        ) {

            const profile = {

                uid: uid,

                nom: fullName,

                name: fullName,

                email: email,

                phone: phone,

                whatsapp: whatsapp,

                ville: ville,

                commune: commune,

                description: description,

                logoURL: photoURL,

                services: service,

                active: false,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            await setDoc(
                doc(
                    db,
                    "agences_automobiles",
                    uid
                ),
                profile
            );


            return;
        }


        /* =============================================
           CHAUFFEUR / PROPRIÉTAIRE / TRANSPORTEUR
        ============================================== */

        const profile = {

            uid: uid,

            name: fullName,

            email: email,

            phone: phone,

            WhatsApp: whatsapp,

            ville: ville,

            commune: commune,

            typeProfessionnel:
                professionalType,

            typeVehicule:
                vehicleType,

            marqueVehicule:
                brand,

            plaque:
                plate,

            service:
                service,

            description:
                description,

            photoURL:
                photoURL,

            active: false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                "chauffeurs",
                uid
            ),
            profile
        );


        return;
    }


    /* =====================================================
       HÔTELS
    ====================================================== */

    if (
        selectedAccountType === "hotels"
    ) {

        const name =
            getValue("hotelName");

        const type =
            getValue("hotelType");

        const address =
            getValue("hotelAddress");

        const description =
            getValue("hotelDescription");

        const photoURL =
            getValue("hotelPhoto");


        const profile = {

            uid: uid,

            name: name,

            email: email,

            phone: phone,

            whatsapp: whatsapp,

            ville: ville,

            commune: commune,

            adresse: address,

            category: type,

            description: description,

            photoURL: photoURL,

            active: false,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(
                db,
                "etablissements_hoteliers",
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
        document.getElementById(id);

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

    signupMessage.textContent =
        message;

    signupMessage.className =
        `signup-message show ${type}`;

}


function clearMessage() {

    signupMessage.textContent = "";

    signupMessage.className =
        "signup-message";

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(loading) {

    signupSubmit.disabled =
        loading;

    const icon =
        signupSubmit.querySelector("i");

    const span =
        signupSubmit.querySelector("span");


    if (loading) {

        if (icon) {
            icon.className =
                "fa-solid fa-spinner fa-spin";
        }

        if (span) {
            span.textContent =
                "Création du compte...";
        }

    } else {

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
   PASSWORD VISIBILITY
========================================================= */

document
    .querySelectorAll(".password-toggle")
    .forEach(button => {

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
                    input.type === "password"
                ) {

                    input.type = "text";

                    button.innerHTML =
                        '<i class="fa-solid fa-eye-slash"></i>';

                } else {

                    input.type = "password";

                    button.innerHTML =
                        '<i class="fa-solid fa-eye"></i>';

                }

            }
        );

    });


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   INITIALISATION
========================================================= */

loadCities();

console.log(
    "CAMU INSCRIPTION — formulaire dynamique initialisé."
);
