/* =========================================================
   CAMU SERVICES — APPLICATION PRINCIPALE
   ========================================================= */

import {
    getUser,
    isAuthenticated,
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    observeAuth,
    getUserProfile,
    updateUserProfile
} from "./auth.js";

import {
    getListings,
    getListing,
    createListing,
    addFavorite,
    removeFavorite,
    isFavorite,
    createReservation,
    getUserReservations,
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    getCommuniques,
    createCommunique,
    createConversation,
    sendMessage,
    getMessages,
    getUserConversations,
    listenToMessages,
    getPendingListings,
    approveListing,
    rejectListing
} from "./data.js";

// =========================================================
// ÉTAT DE L'APPLICATION
// =========================================================
const App = {
    state: {
        user: null,
        profile: null,
        currentSection: "accueil",
        listings: [],
        searchResults: [],
        favorites: [],
        reservations: [],
        notifications: [],
        communiques: [],
        currentConversation: null,
        darkMode: false
    },

    // =========================================================
    // INITIALISATION
    // =========================================================
    async init() {
        console.log("CAMU SERVICES — Initialisation...");
        this.setupYear();
        this.setupNavigation();
        this.setupSidebar();
        this.setupSearch();
        this.setupCategories();
        this.setupAuthentication();
        this.setupPublication();
        this.setupProfile();
        this.setupSettings();
        this.setupFooter();
        this.setupLoadMore();
        this.setupAuthObserver();
        await this.loadHomeData();
        console.log("CAMU SERVICES — Application prête.");
    },

    // =========================================================
    // ANNÉE FOOTER
    // =========================================================
    setupYear() {
        const year = document.getElementById("currentYear");
        if (year) year.textContent = new Date().getFullYear();
    },

    // =========================================================
    // SIDEBAR
    // =========================================================
    setupSidebar() {
        const menuBtn = document.getElementById("menuBtn");
        const closeBtn = document.getElementById("closeSidebarBtn");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");

        if (menuBtn) menuBtn.addEventListener("click", () => this.openSidebar());
        if (closeBtn) closeBtn.addEventListener("click", () => this.closeSidebar());
        if (overlay) overlay.addEventListener("click", () => this.closeSidebar());

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeSidebar();
                this.closeAuthModal();
            }
        });
    },

    openSidebar() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const menuBtn = document.getElementById("menuBtn");
        sidebar?.classList.add("open");
        overlay?.classList.add("active");
        document.body.classList.add("sidebar-open");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    },

    closeSidebar() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const menuBtn = document.getElementById("menuBtn");
        sidebar?.classList.remove("open");
        overlay?.classList.remove("active");
        document.body.classList.remove("sidebar-open");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    },

    // =========================================================
    // NAVIGATION
    // =========================================================
    setupNavigation() {
        document.addEventListener("click", (event) => {
            const target = event.target.closest("[data-section]");
            if (!target) return;
            const section = target.dataset.section;
            if (!section) return;
            event.preventDefault();
            this.navigateTo(section);
        });

        const logo = document.getElementById("logoLink");
        logo?.addEventListener("click", (event) => {
            event.preventDefault();
            this.navigateTo("accueil");
        });

        const heroSearchBtn = document.getElementById("heroSearchBtn");
        heroSearchBtn?.addEventListener("click", () => {
            this.navigateTo("recherche");
            setTimeout(() => {
                document.getElementById("advancedSearchInput")?.focus();
            }, 100);
        });
    },

    navigateTo(section) {
        const pageSections = document.querySelectorAll(".page-section");
        pageSections.forEach((el) => el.classList.remove("active"));
        const target = document.getElementById(`section-${section}`);
        if (!target) {
            console.warn("Section introuvable :", section);
            return;
        }
        target.classList.add("active");
        this.state.currentSection = section;

        document.querySelectorAll(".nav-item[data-section], .mobile-nav-item[data-section]")
            .forEach((item) => {
                item.classList.toggle("active", item.dataset.section === section);
            });

        this.closeSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
        this.onSectionOpened(section);
    },

    async onSectionOpened(section) {
        if (section === "favoris") await this.loadFavorites();
        if (section === "reservations") await this.loadReservations();
        if (section === "notifications") await this.loadNotifications();
        if (section === "chat") this.loadChat();
        if (section === "professionnel") await this.loadProfessionalArea();
        if (section === "administration") await this.loadAdministration();
        if (section === "profil") await this.loadProfile();
    },

    // =========================================================
    // AUTHENTIFICATION
    // =========================================================
    setupAuthentication() {
        const profileBtn = document.getElementById("topProfileBtn");
        profileBtn?.addEventListener("click", () => {
            if (isAuthenticated()) {
                this.navigateTo("profil");
            } else {
                this.openAuthModal();
            }
        });

        const closeModal = document.getElementById("closeAuthModal");
        closeModal?.addEventListener("click", () => this.closeAuthModal());

        const modal = document.getElementById("authModal");
        modal?.querySelector(".modal-overlay")?.addEventListener("click", () => this.closeAuthModal());

        const loginForm = document.getElementById("loginForm");
        loginForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("loginEmail")?.value.trim();
            const password = document.getElementById("loginPassword")?.value;
            const result = await loginUser(email, password);
            if (result.success) {
                this.showToast("Connexion réussie.", "success");
                this.closeAuthModal();
            } else {
                this.showToast(result.error, "error");
            }
        });

        const registerBtn = document.getElementById("showRegisterBtn");
        registerBtn?.addEventListener("click", () => this.showRegisterForm());

        const forgotBtn = document.getElementById("forgotPasswordBtn");
        forgotBtn?.addEventListener("click", async () => {
            const email = document.getElementById("loginEmail")?.value.trim();
            if (!email) {
                this.showToast("Veuillez saisir votre email.", "error");
                return;
            }
            const result = await resetPassword(email);
            if (result.success) {
                this.showToast("Un email de réinitialisation a été envoyé.", "success");
            } else {
                this.showToast(result.error, "error");
            }
        });

        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn?.addEventListener("click", async () => {
            if (!isAuthenticated()) {
                this.openAuthModal();
                return;
            }
            const result = await logoutUser();
            if (result.success) {
                this.showToast("Vous êtes déconnecté.", "success");
                this.navigateTo("accueil");
            } else {
                this.showToast(result.error, "error");
            }
        });
    },

    setupAuthObserver() {
        observeAuth(async (user, profile) => {
            this.state.user = user;
            this.state.profile = profile;
            this.updateUserInterface(user, profile);
            if (user) {
                await this.loadNotifications();
                // Charger les préférences
                if (profile?.preferences) {
                    const darkMode = document.getElementById("darkModeSetting");
                    const notif = document.getElementById("notificationSetting");
                    if (darkMode) darkMode.checked = profile.preferences.darkMode || false;
                    if (notif) notif.checked = profile.preferences.notifications !== false;
                    document.body.classList.toggle("dark-mode", profile.preferences.darkMode || false);
                }
            }
        });
    },

    updateUserInterface(user, profile) {
        const name = profile?.displayName || user?.displayName || "Utilisateur";
        const role = profile?.role || "client";

        const topName = document.getElementById("topProfileName");
        const sidebarName = document.getElementById("sidebarProfileName");
        const sidebarRole = document.getElementById("sidebarProfileRole");
        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const profileRole = document.getElementById("profileRole");

        if (!user) {
            if (topName) topName.textContent = "Connexion";
            if (sidebarName) sidebarName.textContent = "Visiteur";
            if (sidebarRole) sidebarRole.textContent = "Visiteur";
            if (profileName) profileName.textContent = "Visiteur";
            if (profileEmail) profileEmail.textContent = "Non connecté";
            if (profileRole) profileRole.textContent = "Visiteur";
            this.hideAdmin();
            return;
        }

        if (topName) topName.textContent = name;
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarRole) sidebarRole.textContent = this.formatRole(role);
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = user.email || "Email non disponible";
        if (profileRole) profileRole.textContent = this.formatRole(role);

        if (role === "admin" || role === "administrator") {
            this.showAdmin();
        } else {
            this.hideAdmin();
        }
    },

    formatRole(role) {
        const roles = {
            client: "Client",
            company: "Professionnel",
            professional: "Professionnel",
            admin: "Administrateur",
            administrator: "Administrateur"
        };
        return roles[role] || "Utilisateur";
    },

    showAdmin() {
        document.getElementById("adminNavBtn")?.classList.remove("hidden");
        document.getElementById("section-administration")?.classList.remove("hidden");
    },

    hideAdmin() {
        document.getElementById("adminNavBtn")?.classList.add("hidden");
        document.getElementById("section-administration")?.classList.add("hidden");
    },

    // =========================================================
    // MODALE CONNEXION / INSCRIPTION
    // =========================================================
    openAuthModal() {
        const modal = document.getElementById("authModal");
        modal?.classList.remove("hidden");
        modal?.setAttribute("aria-hidden", "false");
        // S'assurer que le panneau de connexion est visible
        document.getElementById("loginPanel")?.classList.remove("hidden");
        document.getElementById("loginPanel")?.classList.add("active");
        document.getElementById("registerPanel")?.classList.add("hidden");
        document.getElementById("registerPanel")?.classList.remove("active");
    },

    closeAuthModal() {
        const modal = document.getElementById("authModal");
        modal?.classList.add("hidden");
        modal?.setAttribute("aria-hidden", "true");
    },

    showRegisterForm() {
        const modal = document.getElementById("authModal");
        const content = modal?.querySelector(".modal-content");
        if (!content) return;

        // On remplace le contenu de la modale par le formulaire d'inscription
        content.innerHTML = `
            <button id="closeRegisterModal" class="modal-close" type="button" aria-label="Fermer">×</button>
            <div class="modal-header">
                <h2>Créer un compte</h2>
                <p>Rejoignez CAMU SERVICES.</p>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerName">Nom complet</label>
                    <input id="registerName" type="text" required maxlength="100" placeholder="Votre nom">
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email</label>
                    <input id="registerEmail" type="email" required placeholder="votre@email.com">
                </div>
                <div class="form-group">
                    <label for="registerPassword">Mot de passe</label>
                    <input id="registerPassword" type="password" required minlength="6" placeholder="Minimum 6 caractères">
                </div>
                <div class="form-group">
                    <label for="registerRole">Type de compte</label>
                    <select id="registerRole">
                        <option value="client">Client</option>
                        <option value="professional">Professionnel</option>
                    </select>
                </div>
                <button type="submit" class="primary-btn full-width">Créer mon compte</button>
            </form>
            <div class="auth-links">
                <button id="backToLoginBtn" type="button" class="text-btn">Retour à la connexion</button>
            </div>
        `;

        document.getElementById("closeRegisterModal")?.addEventListener("click", () => this.closeAuthModal());
        document.getElementById("backToLoginBtn")?.addEventListener("click", () => {
            // Recharger la modale avec la connexion (on recharge la page pour simplifier)
            window.location.reload();
        });

        document.getElementById("registerForm")?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const name = document.getElementById("registerName").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value;
            const role = document.getElementById("registerRole").value;

            const result = await registerUser({ email, password, displayName: name, role });
            if (result.success) {
                this.showToast("Compte créé avec succès.", "success");
                this.closeAuthModal();
            } else {
                this.showToast(result.error, "error");
            }
        });
    },

    // =========================================================
    // RECHERCHE
    // =========================================================
    setupSearch() {
        const form = document.getElementById("searchForm");
        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const search = document.getElementById("searchInput")?.value.trim().toLowerCase();
            const city = document.getElementById("citySelect")?.value;
            const category = document.getElementById("categorySelect")?.value;
            await this.performSearch(search, city, category);
        });

        const advancedForm = document.getElementById("advancedSearchForm");
        advancedForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const search = document.getElementById("advancedSearchInput")?.value.trim().toLowerCase();
            const city = document.getElementById("advancedCitySelect")?.value;
            const category = document.getElementById("advancedCategorySelect")?.value;
            await this.performSearch(search, city, category);
        });
    },

    async performSearch(search = "", city = "", category = "") {
        this.navigateTo("recherche");
        const container = document.getElementById("searchResults");
        if (!container) return;

        container.innerHTML = `<div class="loading-message">Recherche en cours...</div>`;

        let listings = await getListings({ city, category, listingLimit: 100 });
        if (search) {
            listings = listings.filter((listing) => {
                const text = `${listing.title || ""} ${listing.description || ""} ${listing.category || ""} ${listing.city || ""}`.toLowerCase();
                return text.includes(search);
            });
        }

        this.state.searchResults = listings;
        this.renderListings(container, listings);
    },

    // =========================================================
    // CATÉGORIES
    // =========================================================
    setupCategories() {
        document.addEventListener("click", async (event) => {
            const card = event.target.closest(".category-card");
            if (!card) return;
            const category = card.dataset.category;
            if (!category) return;
            const categorySelect = document.getElementById("categorySelect");
            if (categorySelect) categorySelect.value = category;
            await this.performSearch("", "", category);
        });
    },

    // =========================================================
    // CHARGEMENT ACCUEIL
    // =========================================================
    async loadHomeData() {
        await this.loadListings();
        await this.loadCommuniques();
    },

    async loadListings() {
        const sponsored = document.getElementById("sponsoredListings");
        const recent = document.getElementById("recentListings");

        try {
            const listings = await getListings({ listingLimit: 100 });
            this.state.listings = listings;

            const sponsoredListings = listings.filter(item => item.sponsored === true || item.featured === true);
            const recentListings = listings.filter(item => !item.sponsored && !item.featured);

            this.renderListings(sponsored, sponsoredListings);
            this.renderListings(recent, recentListings);
        } catch (error) {
            console.error(error);
            if (sponsored) sponsored.innerHTML = `<div class="empty-message">Impossible de charger les annonces.</div>`;
            if (recent) recent.innerHTML = `<div class="empty-message">Impossible de charger les annonces.</div>`;
        }
    },

    // =========================================================
    // AFFICHAGE ANNONCES
    // =========================================================
    renderListings(container, listings) {
        if (!container) return;
        if (!listings || listings.length === 0) {
            container.innerHTML = `<div class="empty-message">Aucune annonce disponible.</div>`;
            return;
        }

        container.innerHTML = listings.map((listing) => this.createListingCard(listing)).join("");
        this.attachListingEvents(container);
    },

    createListingCard(listing) {
        const title = this.escapeHTML(listing.title || "Annonce sans titre");
        const description = this.escapeHTML(listing.description || "");
        const city = this.escapeHTML(listing.city || "");
        const category = this.escapeHTML(listing.category || "");
        const price = listing.price !== undefined && listing.price !== null && listing.price !== ""
            ? `${this.formatPrice(listing.price)}`
            : "Prix sur demande";
        const image = listing.image || listing.imageUrl || (Array.isArray(listing.images) ? listing.images[0] : "");

        return `
            <article class="listing-card" data-listing-id="${this.escapeHTML(listing.id)}">
                <div class="listing-image">
                    ${image ? `<img src="${this.escapeHTML(image)}" alt="${title}" loading="lazy">` : `<div class="listing-placeholder"> </div>`}
                </div>
                <div class="listing-content">
                    <span class="listing-category">${category}</span>
                    <h3>${title}</h3>
                    <p class="listing-description">${description}</p>
                    <div class="listing-meta">
                        <span>${city}</span>
                        <strong>${price}</strong>
                    </div>
                    <div class="listing-actions">
                        <button type="button" class="secondary-btn listing-view-btn" data-listing-id="${this.escapeHTML(listing.id)}">Voir</button>
                        <button type="button" class="favorite-btn" data-favorite-id="${this.escapeHTML(listing.id)}" aria-label="Ajouter aux favoris">❤️</button>
                    </div>
                </div>
            </article>
        `;
    },

    attachListingEvents(container) {
        container.querySelectorAll(".listing-view-btn").forEach((button) => {
            button.addEventListener("click", () => this.showListing(button.dataset.listingId));
        });
        container.querySelectorAll(".favorite-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                await this.toggleFavorite(button.dataset.favoriteId, button);
            });
        });
    },

    async showListing(listingId) {
        const listing = await getListing(listingId);
        if (!listing) {
            this.showToast("Annonce introuvable.", "error");
            return;
        }
        const text = `${listing.title || "Annonce"}\nCatégorie : ${listing.category || "-"}\nVille : ${listing.city || "-"}\nPrix : ${listing.price ? this.formatPrice(listing.price) : "Sur demande"}\n${listing.description || ""}`;
        alert(text);
    },

    // =========================================================
    // FAVORIS
    // =========================================================
    async toggleFavorite(listingId, button) {
        if (!isAuthenticated()) {
            this.showToast("Connectez-vous pour utiliser les favoris.", "info");
            this.openAuthModal();
            return;
        }
        const user = getUser();
        const favorite = await isFavorite(user.uid, listingId);
        if (favorite) {
            const result = await removeFavorite(user.uid, listingId);
            if (result.success) {
                button.classList.remove("active");
                this.showToast("Annonce retirée des favoris.", "success");
            }
        } else {
            const result = await addFavorite(user.uid, listingId);
            if (result.success) {
                button.classList.add("active");
                this.showToast("Annonce ajoutée aux favoris.", "success");
            }
        }
    },

    async loadFavorites() {
        const container = document.getElementById("favoritesListings");
        if (!container) return;
        if (!isAuthenticated()) {
            container.innerHTML = `<div class="empty-message">Connectez-vous pour consulter vos favoris.</div>`;
            return;
        }

        const listings = await getListings({ listingLimit: 100 });
        const favorites = [];
        for (const listing of listings) {
            const favorite = await isFavorite(this.state.user.uid, listing.id);
            if (favorite) favorites.push(listing);
        }
        this.state.favorites = favorites;
        this.renderListings(container, favorites);
    },

    // =========================================================
    // RÉSERVATIONS
    // =========================================================
    async loadReservations() {
        const container = document.getElementById("reservationsContainer");
        if (!container) return;
        if (!isAuthenticated()) {
            container.innerHTML = `<div class="empty-message">Connectez-vous pour voir vos réservations.</div>`;
            return;
        }
        const reservations = await getUserReservations(this.state.user.uid);
        this.state.reservations = reservations;
        if (reservations.length === 0) {
            container.innerHTML = `<div class="empty-message">Aucune réservation.</div>`;
            return;
        }
        container.innerHTML = reservations.map((reservation) => `
            <div class="reservation-card">
                <h3>${this.escapeHTML(reservation.title || "Réservation")}</h3>
                <p>Statut : ${this.escapeHTML(reservation.status || "pending")}</p>
            </div>
        `).join("");
    },

    // =========================================================
    // NOTIFICATIONS
    // =========================================================
    async loadNotifications() {
        if (!isAuthenticated()) return;
        const notifications = await getUserNotifications(this.state.user.uid);
        this.state.notifications = notifications;
        const container = document.getElementById("notificationsContainer");
        if (!container) return;
        if (notifications.length === 0) {
            container.innerHTML = `<div class="empty-message">Aucune notification.</div>`;
            return;
        }
        container.innerHTML = notifications.map((notification) => `
            <div class="notification-item ${notification.read ? "read" : "unread"}">
                <strong>${this.escapeHTML(notification.title || "Notification")}</strong>
                <p>${this.escapeHTML(notification.message || "")}</p>
                ${!notification.read ? `<button type="button" class="text-btn notification-read-btn" data-notification-id="${notification.id}">Marquer comme lue</button>` : ""}
            </div>
        `).join("");

        container.querySelectorAll(".notification-read-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                await markNotificationAsRead(button.dataset.notificationId);
                await this.loadNotifications();
            });
        });
    },

    // =========================================================
    // COMMUNIQUÉS
    // =========================================================
    async loadCommuniques() {
        const container = document.getElementById("communiqueContainer");
        if (!container) return;
        const communiques = await getCommuniques();
        this.state.communiques = communiques;
        if (communiques.length === 0) {
            container.innerHTML = `<div class="empty-message">Aucun communiqué pour le moment.</div>`;
            return;
        }
        container.innerHTML = communiques.map((item) => `
            <div class="communique-card">
                <h3>${this.escapeHTML(item.title || "Communiqué")}</h3>
                <p>${this.escapeHTML(item.message || "")}</p>
            </div>
        `).join("");
    },

    // =========================================================
    // PUBLICATION
    // =========================================================
    setupPublication() {
        const form = document.getElementById("publicationForm");
        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!isAuthenticated()) {
                this.showToast("Connectez-vous pour publier une annonce.", "info");
                this.openAuthModal();
                return;
            }

            const title = document.getElementById("publicationTitle").value.trim();
            const category = document.getElementById("publicationCategory").value;
            const city = document.getElementById("publicationCity").value.trim();
            const price = document.getElementById("publicationPrice").value;
            const description = document.getElementById("publicationDescription").value.trim();

            const result = await createListing({
                title,
                category,
                city,
                price,
                description,
                userId: this.state.user.uid,
                ownerName: this.state.user.displayName || "",
                sponsored: false,
                featured: false,
                status: "approved" // ou "pending" si validation admin
            });

            if (result.success) {
                this.showToast("Annonce publiée avec succès.", "success");
                form.reset();
                await this.loadListings();
                this.navigateTo("accueil");
            } else {
                this.showToast(result.error || "Impossible de publier l'annonce.", "error");
            }
        });
    },

    // =========================================================
    // PROFIL
    // =========================================================
    setupProfile() {
        const form = document.getElementById("profileForm");
        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!isAuthenticated()) {
                this.openAuthModal();
                return;
            }
            const user = getUser();
            const data = {
                displayName: document.getElementById("profileFullName").value.trim(),
                phone: document.getElementById("profilePhone").value.trim(),
                city: document.getElementById("profileCity").value.trim()
            };
            const result = await updateUserProfile(user.uid, data);
            if (result.success) {
                this.showToast("Profil mis à jour !", "success");
                await this.loadProfile();
            } else {
                this.showToast(result.error, "error");
            }
        });
    },

    async loadProfile() {
        if (!isAuthenticated()) return;
        const profile = await getUserProfile();
        if (!profile) return;
        this.state.profile = profile;

        const fullName = document.getElementById("profileFullName");
        const phone = document.getElementById("profilePhone");
        const city = document.getElementById("profileCity");

        if (fullName) fullName.value = profile.displayName || "";
        if (phone) phone.value = profile.phone || "";
        if (city) city.value = profile.city || "";
    },

    // =========================================================
    // CHAT
    // =========================================================
    loadChat() {
        const list = document.getElementById("conversationList");
        const panel = document.getElementById("conversationPanel");
        if (!list || !panel) return;

        if (!isAuthenticated()) {
            list.innerHTML = '<div class="empty-message">Connectez-vous pour utiliser le chat.</div>';
            panel.innerHTML = '<div class="chat-empty"><span>💬</span><h3>Connectez-vous</h3></div>';
            return;
        }

        // Charger les conversations
        getUserConversations(this.state.user.uid).then(conversations => {
            if (conversations.length === 0) {
                list.innerHTML = '<div class="empty-message">Aucune conversation.</div>';
                return;
            }
            list.innerHTML = conversations.map(conv => {
                const other = conv.participants.filter(p => p !== this.state.user.uid).join(', ');
                return `
                    <div class="conversation-item" data-conv-id="${conv.id}">
                        <strong>${this.escapeHTML(other)}</strong>
                        <small>${this.escapeHTML(conv.lastMessage || 'Nouvelle conversation')}</small>
                    </div>
                `;
            }).join('');

            list.querySelectorAll('.conversation-item').forEach(el => {
                el.addEventListener('click', () => {
                    this.openConversation(el.dataset.convId);
                });
            });
        });
    },

    openConversation(convId) {
        const panel = document.getElementById("conversationPanel");
        panel.innerHTML = `
            <div class="chat-messages" id="chatMessages"></div>
            <form id="chatForm" class="chat-form">
                <input type="text" id="chatInput" placeholder="Votre message..." required>
                <button type="submit">Envoyer</button>
            </form>
        `;

        // Écouter les messages
        if (this._unsubscribeChat) this._unsubscribeChat();
        this._unsubscribeChat = listenToMessages(convId, (messages) => {
            const container = document.getElementById("chatMessages");
            if (!container) return;
            container.innerHTML = messages.map(msg => `
                <div class="message ${msg.senderId === this.state.user.uid ? 'own' : 'other'}">
                    <span>${this.escapeHTML(msg.text)}</span>
                    <small>${msg.createdAt?.toDate?.().toLocaleTimeString() || ''}</small>
                </div>
            `).join('');
            container.scrollTop = container.scrollHeight;
        });

        // Envoyer un message
        document.getElementById("chatForm")?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById("chatInput");
            if (!input.value.trim()) return;
            await sendMessage(convId, {
                senderId: this.state.user.uid,
                text: input.value.trim()
            });
            input.value = '';
        });
    },

    // =========================================================
    // ESPACE PROFESSIONNEL
    // =========================================================
    async loadProfessionalArea() {
        if (!isAuthenticated()) {
            this.showToast("Connectez-vous pour accéder à votre espace professionnel.", "info");
            return;
        }

        const listings = await getListings({ listingLimit: 100 });
        const myListings = listings.filter(item => item.userId === this.state.user.uid);
        const count = document.getElementById("myPublicationsCount");
        if (count) count.textContent = myListings.length;

        const reservations = await getUserReservations(this.state.user.uid);
        const reservationCount = document.getElementById("myReservationsCount");
        if (reservationCount) reservationCount.textContent = reservations.length;
    },

    // =========================================================
    // ADMINISTRATION
    // =========================================================
    async loadAdministration() {
        if (!isAuthenticated()) {
            this.navigateTo("accueil");
            this.openAuthModal();
            return;
        }
        const role = this.state.profile?.role;
        if (role !== "admin" && role !== "administrator") {
            this.showToast("Accès réservé à l'administration.", "error");
            this.navigateTo("accueil");
            return;
        }

        // Charger les statistiques
        const allListings = await getListings({ listingLimit: 1000 });
        document.getElementById("adminListingsCount").textContent = allListings.length;

        // Annonces en attente
        const pending = await getPendingListings();
        const pendingContainer = document.getElementById("adminListingsList");
        if (pending.length === 0) {
            pendingContainer.innerHTML = '<div class="empty-message">Aucune annonce en attente.</div>';
        } else {
            pendingContainer.innerHTML = pending.map(item => `
                <div class="admin-listing-item">
                    <span>${this.escapeHTML(item.title)}</span>
                    <button class="approve-btn" data-id="${item.id}">Approuver</button>
                    <button class="reject-btn" data-id="${item.id}">Rejeter</button>
                </div>
            `).join('');
            pendingContainer.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await approveListing(btn.dataset.id);
                    this.loadAdministration();
                    this.showToast("Annonce approuvée.", "success");
                });
            });
            pendingContainer.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await rejectListing(btn.dataset.id);
                    this.loadAdministration();
                    this.showToast("Annonce rejetée.", "success");
                });
            });
        }

        // Gestion du communiqué
        const communiqueForm = document.getElementById("communiqueForm");
        communiqueForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById("communiqueTitle").value.trim();
            const message = document.getElementById("communiqueMessage").value.trim();
            if (!title || !message) {
                this.showToast("Veuillez remplir tous les champs.", "error");
                return;
            }
            await createCommunique({ title, message, author: this.state.user.displayName || "Administration" });
            this.showToast("Communiqué publié.", "success");
            communiqueForm.reset();
            this.loadCommuniques();
        });
    },

    // =========================================================
    // PARAMÈTRES
    // =========================================================
    setupSettings() {
        const darkMode = document.getElementById("darkModeSetting");
        const notif = document.getElementById("notificationSetting");

        darkMode?.addEventListener("change", async () => {
            this.state.darkMode = darkMode.checked;
            document.body.classList.toggle("dark-mode", darkMode.checked);
            if (isAuthenticated()) {
                await updateUserProfile(this.state.user.uid, {
                    preferences: {
                        darkMode: darkMode.checked,
                        notifications: notif?.checked || false
                    }
                });
            }
            localStorage.setItem("camu_dark_mode", darkMode.checked ? "true" : "false");
        });

        notif?.addEventListener("change", async () => {
            if (isAuthenticated()) {
                await updateUserProfile(this.state.user.uid, {
                    preferences: {
                        darkMode: darkMode?.checked || false,
                        notifications: notif.checked
                    }
                });
            }
        });

        // Charger depuis localStorage au démarrage
        const saved = localStorage.getItem("camu_dark_mode");
        if (saved === "true") {
            this.state.darkMode = true;
            if (darkMode) darkMode.checked = true;
            document.body.classList.add("dark-mode");
        }
    },

    // =========================================================
    // FOOTER
    // =========================================================
    setupFooter() {
        document.addEventListener("click", (event) => {
            const button = event.target.closest("[data-footer-action]");
            if (!button) return;
            const action = button.dataset.footerAction;
            const messages = {
                about: "CAMU SERVICES est une plateforme destinée à faciliter la recherche de biens, produits et services.",
                contact: "Les informations de contact seront ajoutées prochainement.",
                conditions: "Les conditions d'utilisation seront disponibles prochainement.",
                privacy: "La politique de confidentialité sera disponible prochainement."
            };
            this.showToast(messages[action] || "Information indisponible.", "info");
        });
    },

    // =========================================================
    // VOIR PLUS
    // =========================================================
    setupLoadMore() {
        const button = document.getElementById("loadMoreBtn");
        button?.addEventListener("click", () => {
            this.showToast("Le chargement progressif des annonces sera activé avec la pagination Firestore.", "info");
        });
    },

    // =========================================================
    // TOAST
    // =========================================================
    showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    // =========================================================
    // PRIX
    // =========================================================
    formatPrice(price) {
        const number = Number(price);
        if (Number.isNaN(number)) return String(price);
        return new Intl.NumberFormat("fr-FR").format(number) + " $";
    },

    // =========================================================
    // SÉCURITÉ HTML
    // =========================================================
    escapeHTML(value) {
        return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
};

// =========================================================
// DÉMARRAGE
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});

export default App;
