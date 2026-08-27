/* =========================================================
   CAMU SERVICES — FEATURES (Injection HTML + surcharge)
   ========================================================= */

import {
    getListing,
    getUserConversations,
    sendMessage,
    getMessages,
    getPendingListings,
    approveListing,
    rejectListing,
    createCommunique,
    getListings,
    getCommuniques
} from "./data.js";

import {
    isAuthenticated,
    getUser
} from "./auth.js";

// =========================================================
// 1. MODALE DE DÉTAIL (remplace l'alert)
// =========================================================

function createModal() {
    if (document.getElementById("detailModal")) return;

    const modalHTML = `
        <div id="detailModal" class="modal hidden" aria-hidden="true">
            <div class="modal-overlay" id="detailModalOverlay"></div>
            <div class="modal-content modal-large">
                <button id="closeDetailModal" class="modal-close" type="button">×</button>
                <div id="detailModalBody">
                    <div class="loading-message">Chargement...</div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("closeDetailModal").addEventListener("click", closeModal);
    document.getElementById("detailModalOverlay").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById("detailModal");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function openModal() {
    const modal = document.getElementById("detailModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function renderDetail(listing) {
    const body = document.getElementById("detailModalBody");
    if (!listing) {
        body.innerHTML = `<p class="error-message">Annonce introuvable.</p>`;
        return;
    }

    const image = listing.image || listing.imageUrl || "";
    const price = listing.price !== undefined && listing.price !== null && listing.price !== ""
        ? `${new Intl.NumberFormat("fr-FR").format(listing.price)} $`
        : "Prix sur demande";

    body.innerHTML = `
        <div class="detail-image">
            ${image ? `<img src="${image}" alt="${listing.title || "Annonce"}" />` : `<div class="detail-placeholder">📷</div>`}
        </div>
        <div class="detail-content">
            <span class="detail-category">${listing.category || "Catégorie"}</span>
            <h2>${listing.title || "Annonce"}</h2>
            <p class="detail-description">${listing.description || "Aucune description."}</p>
            <div class="detail-meta">
                <span>📍 ${listing.city || "Localisation"}</span>
                <strong class="detail-price">${price}</strong>
            </div>
            <div class="detail-owner">
                <span>👤 ${listing.ownerName || "Propriétaire inconnu"}</span>
                ${listing.ownerPhone ? `<span>📞 ${listing.ownerPhone}</span>` : ""}
            </div>
            <div class="detail-actions">
                ${isAuthenticated() ? `<button id="detailContactBtn" class="primary-btn">💬 Contacter</button>` : `<button class="primary-btn" disabled>Connectez-vous pour contacter</button>`}
                ${isAuthenticated() ? `<button id="detailReserveBtn" class="secondary-btn">📅 Réserver</button>` : ""}
            </div>
        </div>
    `;

    document.getElementById("detailContactBtn")?.addEventListener("click", () => {
        alert("La fonction chat sera bientôt disponible.");
    });
    document.getElementById("detailReserveBtn")?.addEventListener("click", () => {
        alert("La fonction réservation sera bientôt disponible.");
    });

    openModal();
}

async function handleViewClick(event) {
    const button = event.target.closest(".listing-view-btn");
    if (!button) return;
    const listingId = button.dataset.listingId;
    if (!listingId) {
        alert("ID de l'annonce manquant.");
        return;
    }

    const body = document.getElementById("detailModalBody");
    if (body) body.innerHTML = `<div class="loading-message">Chargement de l'annonce...</div>`;
    openModal();

    const listing = await getListing(listingId);
    if (!listing) {
        body.innerHTML = `<p class="error-message">Impossible de charger l'annonce.</p>`;
        return;
    }
    renderDetail(listing);
}

// =========================================================
// 2. CHAT (interface complète)
// =========================================================

let currentChatId = null;

async function renderChat() {
    const container = document.getElementById("section-chat");
    if (!container) return;

    // Éviter de réinjecter si déjà présent
    if (container.querySelector(".chat-interface")) return;

    container.innerHTML = `
        <div class="chat-interface">
            <div class="chat-sidebar">
                <h3>💬 Conversations</h3>
                <div id="conversationList"></div>
            </div>
            <div class="chat-main">
                <div id="chatMessages" class="chat-messages"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatMessageInput" placeholder="Écrire un message..." />
                    <button id="chatSendBtn" class="primary-btn">Envoyer</button>
                </div>
            </div>
        </div>
    `;

    await loadConversations();

    document.getElementById("chatSendBtn")?.addEventListener("click", () => sendMessageHandler());
    document.getElementById("chatMessageInput")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessageHandler();
    });
}

async function loadConversations() {
    const list = document.getElementById("conversationList");
    if (!list) return;

    if (!isAuthenticated()) {
        list.innerHTML = `<div class="empty-message">Connectez-vous pour voir vos conversations.</div>`;
        return;
    }

    const user = getUser();
    const conversations = await getUserConversations(user.uid);

    if (conversations.length === 0) {
        list.innerHTML = `<div class="empty-message">Aucune conversation.</div>`;
        return;
    }

    list.innerHTML = conversations.map(conv => `
        <button class="conv-item" data-chat-id="${conv.id}">
            <strong>${conv.participants.filter(p => p !== user.uid).join(", ") || "Conversation"}</strong>
            <small>${conv.lastMessage || "Nouvelle conversation"}</small>
        </button>
    `).join("");

    list.querySelectorAll(".conv-item").forEach(btn => {
        btn.addEventListener("click", () => {
            currentChatId = btn.dataset.chatId;
            loadMessages(currentChatId);
        });
    });

    // Charger la première conversation par défaut
    if (conversations.length > 0) {
        currentChatId = conversations[0].id;
        loadMessages(currentChatId);
    }
}

async function loadMessages(chatId) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    container.innerHTML = `<div class="loading-message">Chargement des messages...</div>`;

    const messages = await getMessages(chatId);
    if (messages.length === 0) {
        container.innerHTML = `<div class="empty-message">Aucun message. Envoyez le premier !</div>`;
        return;
    }

    const user = getUser();
    container.innerHTML = messages.map(msg => {
        const isOwn = msg.senderUid === user?.uid;
        return `
            <div class="message-item ${isOwn ? "message-sent" : "message-received"}">
                ${!isOwn ? `<strong>${msg.senderName || "Utilisateur"}</strong>` : ""}
                <p>${msg.text}</p>
                <small>${msg.createdAt?.toDate?.()?.toLocaleTimeString() || ""}</small>
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
}

async function sendMessageHandler() {
    const input = document.getElementById("chatMessageInput");
    const text = input?.value.trim();
    if (!text || !currentChatId) return;

    const user = getUser();
    if (!user) {
        alert("Connectez-vous pour envoyer un message.");
        return;
    }

    const result = await sendMessage(currentChatId, {
        senderUid: user.uid,
        senderName: user.displayName || "Utilisateur",
        text: text
    });

    if (result.success) {
        input.value = "";
        await loadMessages(currentChatId);
        // Mettre à jour la liste des conversations (dernier message)
        await loadConversations();
    } else {
        alert("Erreur : " + result.error);
    }
}

// =========================================================
// 3. ADMINISTRATION (tableau de bord)
// =========================================================

async function renderAdmin() {
    const container = document.getElementById("section-administration");
    if (!container) return;

    if (container.querySelector(".admin-interface")) return;

    container.innerHTML = `
        <div class="admin-interface">
            <h2>🛡️ Tableau de bord</h2>
            <div class="admin-stats" id="adminStats"></div>
            <div class="admin-panels">
                <div class="admin-panel">
                    <h3>📢 Annonces en attente</h3>
                    <div id="adminPendingListings"></div>
                </div>
                <div class="admin-panel">
                    <h3>📰 Publier un communiqué</h3>
                    <form id="adminCommuniqueForm">
                        <input type="text" id="adminCommuniqueTitle" placeholder="Titre du communiqué" />
                        <textarea id="adminCommuniqueMessage" placeholder="Message..." rows="4"></textarea>
                        <button type="submit" class="primary-btn">Publier</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    await loadAdminStats();
    await loadPendingListings();
    setupCommuniqueForm();
}

async function loadAdminStats() {
    const statsContainer = document.getElementById("adminStats");
    if (!statsContainer) return;

    // Récupérer les données
    const listings = await getListings({ listingLimit: 1000 });
    const pending = await getPendingListings();
    const communiques = await getCommuniques();

    statsContainer.innerHTML = `
        <div class="stat-card"><span>📢</span><strong>Total annonces</strong><b>${listings.length}</b></div>
        <div class="stat-card"><span>⏳</span><strong>En attente</strong><b>${pending.length}</b></div>
        <div class="stat-card"><span>📰</span><strong>Communiqués</strong><b>${communiques.length}</b></div>
    `;
}

async function loadPendingListings() {
    const container = document.getElementById("adminPendingListings");
    if (!container) return;

    const pending = await getPendingListings();

    if (pending.length === 0) {
        container.innerHTML = `<div class="empty-message">Aucune annonce en attente.</div>`;
        return;
    }

    container.innerHTML = pending.map(item => `
        <div class="admin-listing-item">
            <span>${item.title}</span>
            <div>
                <button class="approve-btn" data-id="${item.id}">✅ Approuver</button>
                <button class="reject-btn" data-id="${item.id}">❌ Rejeter</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            await approveListing(btn.dataset.id);
            await loadPendingListings();
            await loadAdminStats();
        });
    });

    container.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            await rejectListing(btn.dataset.id);
            await loadPendingListings();
            await loadAdminStats();
        });
    });
}

function setupCommuniqueForm() {
    const form = document.getElementById("adminCommuniqueForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("adminCommuniqueTitle").value.trim();
        const message = document.getElementById("adminCommuniqueMessage").value.trim();

        if (!title || !message) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        const result = await createCommunique({ title, message });
        if (result.success) {
            alert("✅ Communiqué publié avec succès !");
            form.reset();
            await loadAdminStats();
        } else {
            alert("Erreur : " + result.error);
        }
    });
}

// =========================================================
// 4. OBSERVER LES CHANGEMENTS DE SECTION
// =========================================================

function observeSectionChanges() {
    // Écouter les clics sur la navigation
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-section]");
        if (!target) return;
        const section = target.dataset.section;

        // Attendre que app.js ait fini de changer la section
        setTimeout(() => {
            if (section === "chat") renderChat();
            if (section === "administration") renderAdmin();
        }, 200);
    });

    // Si la section est déjà active au chargement
    const activeSection = document.querySelector(".page-section.active");
    if (activeSection) {
        const id = activeSection.id.replace("section-", "");
        setTimeout(() => {
            if (id === "chat") renderChat();
            if (id === "administration") renderAdmin();
        }, 500);
    }
}

// =========================================================
// 5. INITIALISATION
// =========================================================

function init() {
    // Modale de détail
    createModal();
    document.addEventListener("click", handleViewClick);

    // Chat & Admin
    observeSectionChanges();

    console.log("✅ features.js chargé : Modale, Chat, Admin prêts.");
}

// Démarrer
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
