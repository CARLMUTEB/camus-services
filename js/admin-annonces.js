// =========================================================
// CAMU SERVICES — ADMIN ANNONCES
// Gestion des annonces depuis Firebase Firestore
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const ADMIN_EMAIL = "meschackmuteb@gmail.com";

let allAds = [];


// =========================================================
// ÉLÉMENTS HTML
// =========================================================

const container =
    document.getElementById("adminAdsContainer");

const loading =
    document.getElementById("adsLoading");

const empty =
    document.getElementById("adsEmpty");

const totalCount =
    document.getElementById("adsTotalCount");

const resultCount =
    document.getElementById("adsResultCount");

const searchInput =
    document.getElementById("adminAdsSearch");

const categorySelect =
    document.getElementById("adminAdsCategory");

const citySelect =
    document.getElementById("adminAdsCity");

const resetButton =
    document.getElementById("clearAdminAdsFilters");

const refreshButton =
    document.getElementById("refreshAdsButton");


// =========================================================
// AUTHENTIFICATION ADMIN
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "connexion.html";

        return;
    }


    const userEmail =
        user.email
            ? user.email.toLowerCase()
            : "";


    if (
        userEmail !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        alert(
            "Accès réservé à l'administrateur CAMU SERVICES."
        );

        window.location.href =
            "index.html";

        return;
    }


    await loadAds();

});


// =========================================================
// CHARGER LES ANNONCES
// COLLECTION : annonces
// =========================================================

async function loadAds() {

    try {

        showLoading(true);


        const snapshot =
            await getDocs(
                collection(db, "annonces")
            );


        allAds = [];


        snapshot.forEach((documentSnapshot) => {

            allAds.push({

                id: documentSnapshot.id,

                ...documentSnapshot.data()

            });

        });


        // Trier les annonces :
        // les plus récentes en premier

        allAds.sort((a, b) => {

            const dateA =
                getDateValue(a.createdAt);

            const dateB =
                getDateValue(b.createdAt);

            return dateB - dateA;

        });


        updateTotalCount();


        renderAds(allAds);


    } catch (error) {

        console.error(
            "Erreur lors du chargement des annonces :",
            error
        );


        showError(
            "Impossible de charger les annonces. Vérifie ta connexion à Firebase."
        );


    } finally {

        showLoading(false);

    }

}


// =========================================================
// AFFICHER LES ANNONCES
// =========================================================

function renderAds(ads) {

    if (!container) return;


    container.innerHTML = "";


    if (resultCount) {

        resultCount.textContent =
            `${ads.length} annonce${ads.length > 1 ? "s" : ""}`;

    }


    if (ads.length === 0) {

        if (empty) {

            empty.hidden = false;

        }

        return;

    }


    if (empty) {

        empty.hidden = true;

    }


    ads.forEach((ad) => {

        const card =
            createAdCard(ad);


        container.appendChild(card);

    });

}


// =========================================================
// CRÉER UNE CARTE ANNONCE
// =========================================================

function createAdCard(ad) {

    const card =
        document.createElement("article");


    card.className =
        "admin-ad-card";


    const imageUrl =
        getFirstImage(ad) ||
        "logo.png";


    const title =
        ad.title ||
        ad.name ||
        "Annonce sans titre";


    const category =
        ad.category ||
        "Autres";


    const city =
        ad.city ||
        ad.location ||
        "Ville non précisée";


    const price =
        formatPrice(ad.price);


    const ownerName =
        ad.ownerName ||
        ad.ownerDisplayName ||
        ad.userName ||
        ad.authorName ||
        ad.sellerName ||
        "Utilisateur";


    const ownerEmail =
        ad.ownerEmail ||
        ad.email ||
        "";


    const date =
        formatDate(ad.createdAt);


    const status =
        ad.status ||
        "published";


    card.innerHTML = `

        <div class="admin-ad-image">

            <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(title)}"
                loading="lazy"
            >

        </div>


        <div class="admin-ad-content">

            <div class="admin-ad-top">

                <span class="admin-ad-category">

                    ${escapeHtml(category)}

                </span>


                <span
                    class="admin-ad-status ${escapeHtml(status)}"
                >

                    ${formatStatus(status)}

                </span>

            </div>


            <h3 title="${escapeHtml(title)}">

                ${escapeHtml(title)}

            </h3>


            <div class="admin-ad-meta">

                <span>

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(city)}

                </span>


                <span>

                    <i class="fa-solid fa-user"></i>

                    ${escapeHtml(ownerName)}

                </span>


                ${
                    ownerEmail
                        ? `

                            <span>

                                <i class="fa-solid fa-envelope"></i>

                                ${escapeHtml(ownerEmail)}

                            </span>

                        `
                        : ""
                }


                <span>

                    <i class="fa-regular fa-calendar"></i>

                    ${escapeHtml(date)}

                </span>

            </div>


            <div class="admin-ad-price">

                ${escapeHtml(price)}

            </div>

        </div>


        <div class="admin-ad-actions">


            <!-- VOIR -->

            <a
                href="explorer.html?id=${encodeURIComponent(ad.id)}"
                class="admin-ad-view"
                title="Voir l'annonce"
            >

                <i class="fa-solid fa-eye"></i>

                <span>Voir</span>

            </a>


            <!-- MODIFIER -->

            <button
                type="button"
                class="admin-ad-edit"
                data-id="${escapeHtml(ad.id)}"
                title="Modifier l'annonce"
            >

                <i class="fa-solid fa-pen"></i>

                <span>Modifier</span>

            </button>


            <!-- SUPPRIMER -->

            <button
                type="button"
                class="admin-ad-delete"
                data-id="${escapeHtml(ad.id)}"
                title="Supprimer l'annonce"
            >

                <i class="fa-solid fa-trash"></i>

                <span>Supprimer</span>

            </button>


        </div>

    `;


    // =====================================================
    // IMAGE DE SECOURS
    // =====================================================

    const image =
        card.querySelector("img");


    if (image) {

        image.addEventListener(
            "error",
            () => {

                image.src =
                    "logo.png";

            }
        );

    }


    // =====================================================
    // BOUTON SUPPRIMER
    // =====================================================

    const deleteButton =
        card.querySelector(
            ".admin-ad-delete"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            () => {

                deleteAd(ad.id);

            }
        );

    }


    return card;

}


// =========================================================
// RECHERCHE + FILTRES
// =========================================================

function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categorySelect
            ? categorySelect.value
                .trim()
                .toLowerCase()
            : "";


    const city =
        citySelect
            ? citySelect.value
                .trim()
                .toLowerCase()
            : "";


    const filteredAds =
        allAds.filter((ad) => {


            const title =
                String(
                    ad.title ||
                    ad.name ||
                    ""
                ).toLowerCase();


            const description =
                String(
                    ad.description ||
                    ""
                ).toLowerCase();


            const ownerName =
                String(
                    ad.ownerName ||
                    ad.ownerDisplayName ||
                    ad.userName ||
                    ad.authorName ||
                    ad.sellerName ||
                    ""
                ).toLowerCase();


            const ownerEmail =
                String(
                    ad.ownerEmail ||
                    ad.email ||
                    ""
                ).toLowerCase();


            const adCategory =
                String(
                    ad.category ||
                    ""
                ).toLowerCase();


            const adCity =
                String(
                    ad.city ||
                    ad.location ||
                    ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                title.includes(search) ||
                description.includes(search) ||
                ownerName.includes(search) ||
                ownerEmail.includes(search);


            const matchesCategory =
                !category ||
                adCategory === category;


            const matchesCity =
                !city ||
                adCity === city;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesCity
            );

        });


    renderAds(filteredAds);

}


// =========================================================
// MODIFIER UNE ANNONCE
// =========================================================

const editModal =
    document.getElementById(
        "adminEditModal"
    );


const editForm =
    document.getElementById(
        "adminEditAdForm"
    );


const editClose =
    document.getElementById(
        "adminEditModalClose"
    );


const editCancel =
    document.getElementById(
        "adminEditCancel"
    );


const editOverlay =
    document.getElementById(
        "adminEditModalOverlay"
    );


const editId =
    document.getElementById(
        "editAdId"
    );


const editTitle =
    document.getElementById(
        "editAdTitle"
    );


const editDescription =
    document.getElementById(
        "editAdDescription"
    );


const editPrice =
    document.getElementById(
        "editAdPrice"
    );


const editCategory =
    document.getElementById(
        "editAdCategory"
    );


const editCity =
    document.getElementById(
        "editAdCity"
    );


const editNeighborhood =
    document.getElementById(
        "editAdNeighborhood"
    );


const editWhatsapp =
    document.getElementById(
        "editAdWhatsapp"
    );


const editSave =
    document.getElementById(
        "adminEditSave"
    );


// =========================================================
// OUVRIR LE MODAL
// =========================================================

function openEditModal(adId) {

    const ad =
        allAds.find(
            item => item.id === adId
        );


    if (!ad || !editModal) {

        alert(
            "Annonce introuvable."
        );

        return;
    }


    if (editId) {

        editId.value =
            ad.id;

    }


    if (editTitle) {

        editTitle.value =
            ad.title ||
            ad.name ||
            "";

    }


    if (editDescription) {

        editDescription.value =
            ad.description ||
            "";

    }


    if (editPrice) {

        editPrice.value =
            ad.price ??
            "";

    }


    if (editCategory) {

        editCategory.value =
            String(
                ad.category ||
                "autres"
            ).toLowerCase();

    }


    if (editCity) {

        editCity.value =
            String(
                ad.city ||
                ad.location ||
                "lubumbashi"
            ).toLowerCase();

    }


    if (editNeighborhood) {

        editNeighborhood.value =
            ad.neighborhood ||
            "";

    }


    if (editWhatsapp) {

        editWhatsapp.value =
            ad.whatsapp ||
            ad.ownerWhatsapp ||
            ad.ownerWhatsApp ||
            "";

    }


    editModal.hidden =
        false;


    document.body.classList.add(
        "admin-edit-modal-open"
    );


    setTimeout(() => {

        if (editTitle) {

            editTitle.focus();

        }

    }, 50);

}


// =========================================================
// FERMER LE MODAL
// =========================================================

function closeEditModal() {

    if (!editModal) return;


    editModal.hidden =
        true;


    document.body.classList.remove(
        "admin-edit-modal-open"
    );

}


// =========================================================
// ENREGISTRER LES MODIFICATIONS
// =========================================================

async function saveEditedAd(event) {

    event.preventDefault();


    const adId =
        editId
            ? editId.value.trim()
            : "";


    if (!adId) {

        alert(
            "Identifiant de l'annonce introuvable."
        );

        return;
    }


    const user =
        auth.currentUser;


    if (!user) {

        alert(
            "Votre session a expiré."
        );

        window.location.href =
            "connexion.html";

        return;
    }


    if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        alert(
            "Vous n'avez pas l'autorisation de modifier cette annonce."
        );

        return;
    }


    const title =
        editTitle
            ? editTitle.value.trim()
            : "";


    const description =
        editDescription
            ? editDescription.value.trim()
            : "";


    const price =
        editPrice
            ? editPrice.value.trim()
            : "";


    const category =
        editCategory
            ? editCategory.value.trim()
            : "autres";


    const city =
        editCity
            ? editCity.value.trim()
            : "";


    const neighborhood =
        editNeighborhood
            ? editNeighborhood.value.trim()
            : "";


    const whatsapp =
        editWhatsapp
            ? editWhatsapp.value.trim()
            : "";


    if (
        !title ||
        !description ||
        !category ||
        !city
    ) {

        alert(
            "Veuillez remplir les champs obligatoires."
        );

        return;
    }


    try {

        if (editSave) {

            editSave.disabled =
                true;


            editSave.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement...';

        }


        // =================================================
        // MISE À JOUR FIRESTORE
        // COLLECTION : annonces
        // =================================================

        await updateDoc(

            doc(
                db,
                "annonces",
                adId
            ),

            {

                title,

                description,

                price,

                category,

                city,

                neighborhood,

                whatsapp,

                updatedAt:
                    new Date()

            }

        );


        // =================================================
        // MISE À JOUR LOCALE
        // =================================================

        allAds =
            allAds.map(ad => {

                if (ad.id !== adId) {

                    return ad;

                }


                return {

                    ...ad,

                    title,

                    description,

                    price,

                    category,

                    city,

                    neighborhood,

                    whatsapp,

                    updatedAt:
                        new Date()

                };

            });


        closeEditModal();


        applyFilters();


        alert(
            "Annonce modifiée avec succès."
        );


    } catch (error) {

        console.error(
            "Erreur lors de la modification :",
            error
        );


        alert(
            "Impossible de modifier l'annonce. Vérifie les règles Firestore."
        );


    } finally {

        if (editSave) {

            editSave.disabled =
                false;


            editSave.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications';

        }

    }

}


// =========================================================
// CLIC SUR MODIFIER
// =========================================================

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".admin-ad-edit"
            );


        if (!button) return;


        const adId =
            button.dataset.id;


        if (adId) {

            openEditModal(adId);

        }

    }
);


// =========================================================
// FORMULAIRE MODIFICATION
// =========================================================

if (editForm) {

    editForm.addEventListener(
        "submit",
        saveEditedAd
    );

}


// =========================================================
// FERMETURE MODAL
// =========================================================

if (editClose) {

    editClose.addEventListener(
        "click",
        closeEditModal
    );

}


if (editCancel) {

    editCancel.addEventListener(
        "click",
        closeEditModal
    );

}


if (editOverlay) {

    editOverlay.addEventListener(
        "click",
        closeEditModal
    );

}


// =========================================================
// FERMER AVEC ÉCHAP
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            editModal &&
            !editModal.hidden
        ) {

            closeEditModal();

        }

    }
);


// =========================================================
// SUPPRIMER UNE ANNONCE
// =========================================================

async function deleteAd(adId) {

    if (!adId) return;


    const ad =
        allAds.find(
            item => item.id === adId
        );


    const title =
        ad?.title ||
        ad?.name ||
        "cette annonce";


    const confirmed =
        confirm(
            `Voulez-vous vraiment supprimer "${title}" ?\n\nCette action est irréversible.`
        );


    if (!confirmed) {

        return;

    }


    try {

        const user =
            auth.currentUser;


        if (!user) {

            alert(
                "Votre session a expiré."
            );

            window.location.href =
                "connexion.html";

            return;

        }


        if (
            !user.email ||
            user.email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            alert(
                "Vous n'avez pas l'autorisation de supprimer cette annonce."
            );

            return;

        }


        // =================================================
        // SUPPRESSION FIRESTORE
        // COLLECTION : annonces
        // =================================================

        await deleteDoc(

            doc(
                db,
                "annonces",
                adId
            )

        );


        // =================================================
        // RETIRER L'ANNONCE DE LA LISTE LOCALE
        // =================================================

        allAds =
            allAds.filter(
                item => item.id !== adId
            );


        updateTotalCount();


        applyFilters();


        alert(
            "Annonce supprimée avec succès."
        );


    } catch (error) {

        console.error(
            "Erreur lors de la suppression :",
            error
        );


        alert(
            "Impossible de supprimer l'annonce. Vérifie les règles Firestore."
        );

    }

}


// =========================================================
// TOTAL
// =========================================================

function updateTotalCount() {

    if (totalCount) {

        totalCount.textContent =
            allAds.length;

    }

}


// =========================================================
// ACTUALISER
// =========================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.disabled =
                true;


            const icon =
                refreshButton.querySelector(
                    "i"
                );


            if (icon) {

                icon.classList.add(
                    "fa-spin"
                );

            }


            await loadAds();


            if (icon) {

                icon.classList.remove(
                    "fa-spin"
                );

            }


            refreshButton.disabled =
                false;

        }
    );

}


// =========================================================
// ÉVÉNEMENTS DES FILTRES
// =========================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        applyFilters
    );

}


if (citySelect) {

    citySelect.addEventListener(
        "change",
        applyFilters
    );

}


// =========================================================
// RÉINITIALISER LES FILTRES
// =========================================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        () => {

            if (searchInput) {

                searchInput.value =
                    "";

            }


            if (categorySelect) {

                categorySelect.value =
                    "";

            }


            if (citySelect) {

                citySelect.value =
                    "";

            }


            renderAds(allAds);

        }
    );

}


// =========================================================
// MENU MOBILE ADMIN
// =========================================================

const menuButton =
    document.querySelector(
        ".admin-menu-button"
    );


const sidebar =
    document.querySelector(
        ".admin-sidebar"
    );


const overlay =
    document.querySelector(
        ".admin-sidebar-overlay"
    );


const closeButton =
    document.querySelector(
        ".admin-sidebar-close"
    );


function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    document.body.classList.add(
        "admin-menu-open"
    );

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "admin-menu-open"
    );

}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openSidebar
    );

}


if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeSidebar
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


// =========================================================
// FERMER LE MENU APRÈS CLIC SUR UN LIEN
// =========================================================

document
    .querySelectorAll(
        ".admin-sidebar-nav a"
    )
    .forEach(
        (link) => {

            link.addEventListener(
                "click",
                closeSidebar
            );

        }
    );


// =========================================================
// BOUTON DÉCONNEXION
// =========================================================

const logoutButton =
    document.querySelector(
        ".admin-logout"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const confirmed =
                confirm(
                    "Voulez-vous vous déconnecter ?"
                );


            if (!confirmed) {

                return;

            }


            try {

                await signOut(auth);


                window.location.href =
                    "connexion.html";


            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );


                alert(
                    "Impossible de vous déconnecter."
                );

            }

        }
    );

}


// =========================================================
// UTILITAIRES
// =========================================================

function showLoading(show) {

    if (loading) {

        loading.hidden =
            !show;

    }


    if (show && empty) {

        empty.hidden =
            true;

    }


    if (show && container) {

        container.innerHTML =
            "";

    }

}


function showError(message) {

    if (!container) return;


    if (empty) {

        empty.hidden =
            true;

    }


    container.innerHTML = `

        <div class="admin-ads-empty">

            <div class="admin-empty-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Une erreur est survenue
            </h3>


            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


// =========================================================
// IMAGE PRINCIPALE
// =========================================================

function getFirstImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {

        return ad.images[0];

    }


    if (
        typeof ad.images === "string" &&
        ad.images
    ) {

        return ad.images;

    }


    if (ad.imageUrl) {

        return ad.imageUrl;

    }


    if (ad.imageURL) {

        return ad.imageURL;

    }


    if (ad.photoUrl) {

        return ad.photoUrl;

    }


    if (ad.photoURL) {

        return ad.photoURL;

    }


    return "";

}


// =========================================================
// DATE
// =========================================================

function getDateValue(value) {

    if (!value) {

        return 0;

    }


    // Timestamp Firebase

    if (
        typeof value === "object" &&
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    // Timestamp avec seconds

    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {

        return value.seconds * 1000;

    }


    // Date JavaScript

    if (value instanceof Date) {

        return value.getTime();

    }


    // String / nombre

    const date =
        new Date(value).getTime();


    return Number.isNaN(date)
        ? 0
        : date;

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(value) {

    const timestamp =
        getDateValue(value);


    if (!timestamp) {

        return "Date inconnue";

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(
        new Date(timestamp)
    );

}


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "Prix non précisé";

    }


    const number =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(",", ".")
        );


    if (Number.isNaN(number)) {

        return String(price);

    }


    return (

        new Intl.NumberFormat(
            "fr-FR"
        ).format(number)

        + " $"

    );

}


// =========================================================
// FORMAT STATUT
// =========================================================

function formatStatus(status) {

    const value =
        String(status).toLowerCase();


    if (
        value === "published" ||
        value === "active"
    ) {

        return "Publiée";

    }


    if (
        value === "inactive" ||
        value === "disabled"
    ) {

        return "Désactivée";

    }


    if (
        value === "pending"
    ) {

        return "En attente";

    }


    return status ||
        "Publiée";

}


// =========================================================
// PROTECTION CONTRE HTML INJECTÉ
// =========================================================

function escapeHtml(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
