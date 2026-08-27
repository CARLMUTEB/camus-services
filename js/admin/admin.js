// =========================================================
// ADMIN — CAMU SERVICES (ULTIME)
// =========================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// =========================================================
// CONFIGURATION
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};

// =========================================================
// INIT
// =========================================================
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =========================================================
// ÉTAT
// =========================================================
let currentUser = null;
let currentProfile = null;
let allAnnonces = [];
let allUsers = [];
let allReports = [];
let chartAnnonces = null;
let chartCategories = null;
let logsCache = [];

// =========================================================
// DOM REFS
// =========================================================
const loadingEl = document.getElementById("admin-loading");
const appEl = document.getElementById("admin-app");
const toast = document.getElementById("admin-toast");

// =========================================================
// TOAST
// =========================================================
function showToast(message, type = "info") {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `admin-toast ${type} show`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), 4000);
}

// =========================================================
// AUTHENTIFICATION
// =========================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/camus-services/";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      showToast("Profil utilisateur introuvable.", "error");
      setTimeout(() => window.location.href = "/camus-services/", 2000);
      return;
    }

    currentProfile = snap.data();
    const role = currentProfile.role || "client";

    if (role !== "admin" && role !== "administrator") {
      showToast("Accès refusé. Vous n'êtes pas administrateur.", "error");
      setTimeout(() => window.location.href = "/camus-services/", 2000);
      return;
    }

    loadingEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    initAdmin();

  } catch (error) {
    console.error("Erreur vérification admin :", error);
    showToast("Erreur lors de la vérification des droits.", "error");
    setTimeout(() => window.location.href = "/camus-services/", 2000);
  }
});

// =========================================================
// INIT ADMIN
// =========================================================
function initAdmin() {
  document.getElementById("admin-name").textContent = currentProfile.displayName || "Administrateur";

  setupNavigation();
  setupButtons();
  setupModal();
  loadAllData();

  // Polling pour les notifications en temps réel (toutes les 30s)
  setInterval(() => {
    checkPendingAndReports();
  }, 30000);

  // Formulaire communiqué
  document.getElementById("communique-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("communique-text-input").value.trim();
    if (!text) {
      showToast("Veuillez écrire un communiqué.", "error");
      return;
    }
    try {
      await addDoc(collection(db, "communiques"), {
        message: text,
        active: true,
        author: currentProfile.displayName || "Administrateur",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await addLog("communique_published", `Publié : "${text.substring(0, 50)}..."`);
      showToast("Communiqué publié avec succès !", "success");
      document.getElementById("communique-text-input").value = "";
      loadCommunique();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la publication.", "error");
    }
  });

  // Export CSV
  document.getElementById("export-btn").addEventListener("click", () => exportCSV(allAnnonces, "annonces"));
  document.getElementById("export-users-btn").addEventListener("click", () => exportCSV(allUsers, "utilisateurs"));
  document.getElementById("export-annonces-btn").addEventListener("click", () => exportCSV(allAnnonces, "annonces"));

  // Clear logs
  document.getElementById("clear-logs-btn").addEventListener("click", async () => {
    if (!confirm("Vider tout l'historique des actions ?")) return;
    try {
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, "admin_logs"));
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      showToast("Historique vidé.", "success");
      loadLogs();
    } catch (error) {
      showToast("Erreur : " + error.message, "error");
    }
  });

  // Filtre annonces
  document.getElementById("annonce-filter").addEventListener("change", () => {
    loadAnnonces();
  });

  // Recherche utilisateurs
  document.getElementById("user-search").addEventListener("input", () => {
    loadUsers();
  });
}

// =========================================================
// NAVIGATION
// =========================================================
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".admin-section");
  const sectionTitles = {
    dashboard: "Tableau de bord",
    users: "Utilisateurs",
    annonces: "Annonces",
    pending: "En attente",
    reports: "Signalements",
    communiques: "Communiqués",
    logs: "Historique"
  };

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      if (!section) return;

      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      sections.forEach((sec) => sec.classList.remove("active"));
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.add("active");

      document.getElementById("section-title").textContent = sectionTitles[section] || section;
      document.getElementById("admin-sidebar").classList.remove("open");

      if (section === "users") loadUsers();
      if (section === "annonces") loadAnnonces();
      if (section === "pending") loadPending();
      if (section === "reports") loadReports();
      if (section === "communiques") loadCommunique();
      if (section === "logs") loadLogs();
    });
  });
}

// =========================================================
// BOUTONS
// =========================================================
function setupButtons() {
  document.getElementById("back-site-btn").addEventListener("click", () => {
    window.location.href = "/camus-services/";
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/camus-services/";
  });

  document.getElementById("refresh-btn").addEventListener("click", () => {
    loadAllData();
    showToast("Données actualisées.", "success");
  });

  document.getElementById("mobile-menu-btn").addEventListener("click", () => {
    document.getElementById("admin-sidebar").classList.toggle("open");
  });

  // Fermer le sidebar en cliquant à l'extérieur (mobile)
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("admin-sidebar");
    const menuBtn = document.getElementById("mobile-menu-btn");
    if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    }
  });
}

// =========================================================
// MODAL ÉDITION
// =========================================================
function setupModal() {
  const modal = document.getElementById("edit-modal");
  const closeBtn = document.getElementById("close-edit-modal");

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  document.getElementById("edit-annonce-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-annonce-id").value;
    const data = {
      title: document.getElementById("edit-title").value.trim(),
      category: document.getElementById("edit-category").value,
      city: document.getElementById("edit-city").value.trim(),
      price: parseFloat(document.getElementById("edit-price").value) || 0,
      description: document.getElementById("edit-description").value.trim(),
      status: document.getElementById("edit-status").value,
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(doc(db, "annonces", id), data);
      await addLog("annonce_edited", `Modifié : ${data.title}`);
      showToast("Annonce modifiée avec succès !", "success");
      modal.classList.add("hidden");
      loadAllData();
    } catch (error) {
      showToast("Erreur : " + error.message, "error");
    }
  });
}

function openEditModal(annonce) {
  document.getElementById("edit-annonce-id").value = annonce.id;
  document.getElementById("edit-title").value = annonce.title || "";
  document.getElementById("edit-category").value = annonce.category || "Autres";
  document.getElementById("edit-city").value = annonce.city || "";
  document.getElementById("edit-price").value = annonce.price || "";
  document.getElementById("edit-description").value = annonce.description || "";
  document.getElementById("edit-status").value = annonce.status || "pending";
  document.getElementById("edit-modal").classList.remove("hidden");
}

// =========================================================
// CHARGEMENT COMPLET
// =========================================================
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadRecentAnnonces(),
    loadAnnonces(),
    loadUsers(),
    loadPending(),
    loadReports(),
    loadCommunique(),
    loadLogs(),
    checkPendingAndReports()
  ]);
  loadCharts();
}

// =========================================================
// STATS
// =========================================================
async function loadStats() {
  try {
    const [usersSnap, annoncesSnap, pendingSnap, proSnap, reportsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "annonces")),
      getDocs(query(collection(db, "annonces"), where("status", "==", "pending"))),
      getDocs(query(collection(db, "users"), where("role", "==", "professional"))),
      getDocs(query(collection(db, "reports"), where("resolved", "==", false)))
    ]);

    document.getElementById("stat-users").textContent = usersSnap.size;
    document.getElementById("stat-annonces").textContent = annoncesSnap.size;
    document.getElementById("stat-pending").textContent = pendingSnap.size;
    document.getElementById("stat-professionals").textContent = proSnap.size;
    document.getElementById("stat-reports").textContent = reportsSnap.size;
    document.getElementById("pending-badge").textContent = pendingSnap.size;
    document.getElementById("reports-badge").textContent = reportsSnap.size;
  } catch (error) {
    console.error("Erreur stats :", error);
  }
}

// =========================================================
// VÉRIFICATION NOTIFICATIONS
// =========================================================
async function checkPendingAndReports() {
  try {
    const [pendingSnap, reportsSnap] = await Promise.all([
      getDocs(query(collection(db, "annonces"), where("status", "==", "pending"))),
      getDocs(query(collection(db, "reports"), where("resolved", "==", false)))
    ]);

    const pendingCount = pendingSnap.size;
    const reportsCount = reportsSnap.size;

    document.getElementById("pending-badge").textContent = pendingCount;
    document.getElementById("reports-badge").textContent = reportsCount;
    document.getElementById("stat-pending").textContent = pendingCount;
    document.getElementById("stat-reports").textContent = reportsCount;

    // Notification toast si nouvelle annonce en attente
    if (pendingCount > 0 && !document.getElementById("admin-app").dataset.notified) {
      showToast(`📢 ${pendingCount} annonce(s) en attente de validation !`, "info");
      document.getElementById("admin-app").dataset.notified = "true";
    }
    if (reportsCount > 0) {
      showToast(`🚨 ${reportsCount} signalement(s) en attente !`, "error");
    }
  } catch (error) {
    console.error("Erreur vérification :", error);
  }
}

// =========================================================
// ANNONCES RÉCENTES
// =========================================================
async function loadRecentAnnonces() {
  const container = document.getElementById("recent-annonces");
  try {
    const q = query(collection(db, "annonces"), orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);
    const annonces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (annonces.length === 0) {
      container.innerHTML = `<div class="empty-state">Aucune annonce récente.</div>`;
      return;
    }

    let html = `<table><thead><tr><th>Titre</th><th>Catégorie</th><th>Ville</th><th>Statut</th></tr></thead><tbody>`;
    annonces.forEach(a => {
      html += `<tr>
        <td>${escapeHTML(a.title || "Sans titre")}</td>
        <td>${escapeHTML(a.category || "-")}</td>
        <td>${escapeHTML(a.city || "-")}</td>
        <td><span class="status-badge ${a.status || 'pending'}">${a.status || "pending"}</span></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// UTILISATEURS (avec pagination)
// =========================================================
let usersPage = 0;
const USERS_PER_PAGE = 10;

async function loadUsers() {
  const container = document.getElementById("users-table");
  const search = document.getElementById("user-search").value.toLowerCase().trim();

  try {
    const snap = await getDocs(collection(db, "users"));
    let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (search) {
      users = users.filter(u =>
        (u.displayName || "").toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search)
      );
    }

    allUsers = users;

    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const start = usersPage * USERS_PER_PAGE;
    const paginated = users.slice(start, start + USERS_PER_PAGE);

    if (paginated.length === 0) {
      container.innerHTML = `<div class="empty-state">Aucun utilisateur.</div>`;
      document.getElementById("users-pagination").innerHTML = "";
      return;
    }

    let html = `<table><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Actions</th></tr></thead><tbody>`;
    paginated.forEach(u => {
      html += `<tr>
        <td>${escapeHTML(u.displayName || "Sans nom")}</td>
        <td>${escapeHTML(u.email || "-")}</td>
        <td>
          <select onchange="window.changeRole('${u.id}', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid #e2e8f0;">
            <option value="client" ${u.role === "client" ? "selected" : ""}>Client</option>
            <option value="professional" ${u.role === "professional" ? "selected" : ""}>Professionnel</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td>
          <button class="action-btn delete" onclick="window.deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

    // Pagination
    renderPagination("users-pagination", usersPage, totalPages, (page) => {
      usersPage = page;
      loadUsers();
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// ANNONCES (avec pagination)
// =========================================================
let annoncesPage = 0;
const ANNONCES_PER_PAGE = 10;

async function loadAnnonces() {
  const container = document.getElementById("annonces-table");
  const filter = document.getElementById("annonce-filter").value;

  try {
    let constraints = [];
    if (filter !== "all") constraints.push(where("status", "==", filter));
    const q = constraints.length ? query(collection(db, "annonces"), ...constraints) : collection(db, "annonces");
    const snap = await getDocs(q);
    const annonces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    allAnnonces = annonces;

    const totalPages = Math.ceil(annonces.length / ANNONCES_PER_PAGE);
    const start = annoncesPage * ANNONCES_PER_PAGE;
    const paginated = annonces.slice(start, start + ANNONCES_PER_PAGE);

    if (paginated.length === 0) {
      container.innerHTML = `<div class="empty-state">Aucune annonce.</div>`;
      document.getElementById("annonces-pagination").innerHTML = "";
      return;
    }

    let html = `<table><thead><tr><th>Titre</th><th>Catégorie</th><th>Ville</th><th>Prix</th><th>Statut</th><th>Actions</th></tr></thead><tbody>`;
    paginated.forEach(a => {
      html += `<tr>
        <td>${escapeHTML(a.title || "Sans titre")}</td>
        <td>${escapeHTML(a.category || "-")}</td>
        <td>${escapeHTML(a.city || "-")}</td>
        <td>${a.price ? `${a.price} $` : "-"}</td>
        <td><span class="status-badge ${a.status || 'pending'}">${a.status || "pending"}</span></td>
        <td>
          <button class="action-btn edit" onclick="window.openEditModal('${a.id}')"><i class="fas fa-edit"></i></button>
          ${a.status === "pending" ? `
            <button class="action-btn approve" onclick="window.approveListing('${a.id}')"><i class="fas fa-check-circle"></i></button>
            <button class="action-btn reject" onclick="window.rejectListing('${a.id}')"><i class="fas fa-times-circle"></i></button>
          ` : ""}
          <button class="action-btn delete" onclick="window.deleteListing('${a.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

    renderPagination("annonces-pagination", annoncesPage, totalPages, (page) => {
      annoncesPage = page;
      loadAnnonces();
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// PAGINATION
// =========================================================
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button ${currentPage === 0 ? "disabled" : ""} onclick="window._goToPage(${currentPage - 1}, '${containerId}')"><i class="fas fa-chevron-left"></i></button>`;

  for (let i = 0; i < totalPages; i++) {
    html += `<button class="${i === currentPage ? "active" : ""}" onclick="window._goToPage(${i}, '${containerId}')">${i + 1}</button>`;
  }

  html += `<button ${currentPage >= totalPages - 1 ? "disabled" : ""} onclick="window._goToPage(${currentPage + 1}, '${containerId}')"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;

  window._goToPage = (page, id) => {
    if (id === "users-pagination") {
      usersPage = page;
      loadUsers();
    } else if (id === "annonces-pagination") {
      annoncesPage = page;
      loadAnnonces();
    }
  };
}

// =========================================================
// EN ATTENTE
// =========================================================
async function loadPending() {
  const container = document.getElementById("pending-list");
  try {
    const q = query(collection(db, "annonces"), where("status", "==", "pending"));
    const snap = await getDocs(q);
    const annonces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (annonces.length === 0) {
      container.innerHTML = `<div class="empty-state">✅ Aucune annonce en attente.</div>`;
      return;
    }

    let html = "";
    annonces.forEach(a => {
      html += `
        <div class="pending-card">
          <h3>${escapeHTML(a.title || "Sans titre")}</h3>
          <div class="meta">${escapeHTML(a.category || "-")} • ${escapeHTML(a.city || "-")} • ${a.price ? a.price + " $" : ""}</div>
          <div class="desc">${escapeHTML((a.description || "").substring(0, 150))}</div>
          <div class="actions">
            <button class="approve-btn" onclick="window.approveListing('${a.id}')"><i class="fas fa-check"></i> Approuver</button>
            <button class="reject-btn" onclick="window.rejectListing('${a.id}')"><i class="fas fa-times"></i> Refuser</button>
            <button class="edit-btn" style="flex:0.5;background:#3b82f6;color:#fff;" onclick="window.openEditModal('${a.id}')"><i class="fas fa-edit"></i></button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// SIGNALEMENTS
// =========================================================
async function loadReports() {
  const container = document.getElementById("reports-list");
  try {
    const q = query(collection(db, "reports"), where("resolved", "==", false), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (reports.length === 0) {
      container.innerHTML = `<div class="empty-state">✅ Aucun signalement en attente.</div>`;
      return;
    }

    let html = "";
    for (const report of reports) {
      let annonce = null;
      if (report.annonceId) {
        const docSnap = await getDoc(doc(db, "annonces", report.annonceId));
        if (docSnap.exists()) annonce = docSnap.data();
      }

      html += `
        <div class="pending-card" style="border-left:4px solid #ef4444;">
          <h3>🚨 ${escapeHTML(annonce?.title || "Annonce supprimée")}</h3>
          <div class="reported-by">Signalé par : ${escapeHTML(report.reporterName || "Anonyme")} • ${report.reason || "Aucune raison"}</div>
          <div class="meta">${escapeHTML(annonce?.category || "-")} • ${escapeHTML(annonce?.city || "-")}</div>
          <div class="desc">${escapeHTML((report.comment || "").substring(0, 100))}</div>
          <div class="actions">
            <button class="approve-btn" onclick="window.resolveReport('${report.id}', 'keep')"><i class="fas fa-check"></i> Conserver</button>
            <button class="reject-btn" onclick="window.resolveReport('${report.id}', 'delete')"><i class="fas fa-trash"></i> Supprimer</button>
            <button class="ignore-btn" onclick="window.resolveReport('${report.id}', 'ignore')"><i class="fas fa-eye-slash"></i> Ignorer</button>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// COMMUNIQUÉ
// =========================================================
async function loadCommunique() {
  const container = document.getElementById("current-communique");
  try {
    const q = query(collection(db, "communiques"), where("active", "==", true), orderBy("createdAt", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      container.innerHTML = `<div style="color:#94a3b8;">Aucun communiqué actif.</div>`;
      return;
    }
    const data = snap.docs[0].data();
    container.innerHTML = `
      <div style="padding:12px;background:#f1f5f9;border-radius:8px;border-left:4px solid #3b82f6;">
        <p style="margin-bottom:4px;">${escapeHTML(data.message || "")}</p>
        <small style="color:#64748b;">Publié par ${escapeHTML(data.author || "Administrateur")}</small>
      </div>
    `;
  } catch (error) {
    console.error(error);
    container.textContent = "Erreur de chargement.";
  }
}

// =========================================================
// LOGS
// =========================================================
async function loadLogs() {
  const container = document.getElementById("logs-container");
  try {
    const q = query(collection(db, "admin_logs"), orderBy("timestamp", "desc"), limit(100));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (logs.length === 0) {
      container.innerHTML = `<div class="empty-state">Aucun historique.</div>`;
      return;
    }

    let html = "";
    logs.forEach(log => {
      const time = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "N/A";
      html += `
        <div class="log-entry">
          <div>
            <span class="log-action">${escapeHTML(log.action || "action")}</span>
            <span class="log-details">${escapeHTML(log.details || "")}</span>
            <span class="log-user">${escapeHTML(log.admin || "Admin")}</span>
          </div>
          <span class="log-time">${time}</span>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="empty-state">Erreur de chargement.</div>`;
  }
}

// =========================================================
// GRAPHIQUES
// =========================================================
async function loadCharts() {
  try {
    // Graphique 1 : Évolution des annonces (30 derniers jours)
    const annoncesSnap = await getDocs(collection(db, "annonces"));
    const annonces = annoncesSnap.docs.map(d => d.data());

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      const count = annonces.filter(a => {
        if (!a.createdAt?.seconds) return false;
        const d = new Date(a.createdAt.seconds * 1000);
        return d.toISOString().split('T')[0] === day;
      }).length;
      last30Days.push({ date: day, count });
    }

    const ctx1 = document.getElementById("chart-annonces").getContext("2d");
    if (chartAnnonces) chartAnnonces.destroy();
    chartAnnonces = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: last30Days.map(d => d.date.substring(5)),
        datasets: [{
          label: 'Annonces publiées',
          data: last30Days.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Graphique 2 : Répartition par catégorie
    const categories = {};
    annonces.forEach(a => {
      const cat = a.category || "Autres";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const ctx2 = document.getElementById("chart-categories").getContext("2d");
    if (chartCategories) chartCategories.destroy();
    chartCategories = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

  } catch (error) {
    console.error("Erreur chargement graphiques :", error);
  }
}

// =========================================================
// EXPORT CSV
// =========================================================
function exportCSV(data, filename) {
  if (!data || data.length === 0) {
    showToast("Aucune donnée à exporter.", "error");
    return;
  }

  const headers = Object.keys(data[0]);
  let csv = headers.join(",") + "\n";

  data.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] || "";
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csv += values.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exporté : ${filename} (${data.length} lignes)`, "success");
}

// =========================================================
// LOGS
// =========================================================
async function addLog(action, details) {
  try {
    await addDoc(collection(db, "admin_logs"), {
      action: action,
      details: details,
      admin: currentProfile.displayName || "Admin",
      adminId: currentUser.uid,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Erreur log :", error);
  }
}

// =========================================================
// ACTIONS ADMIN (exposées globalement)
// =========================================================

// Approuver une annonce
window.approveListing = async (id) => {
  try {
    const snap = await getDoc(doc(db, "annonces", id));
    const data = snap.data();
    await updateDoc(doc(db, "annonces", id), { status: "approved", updatedAt: serverTimestamp() });
    await addLog("annonce_approved", `Approuvée : ${data.title || id}`);
    showToast("Annonce approuvée.", "success");
    loadAllData();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Refuser une annonce
window.rejectListing = async (id) => {
  try {
    const snap = await getDoc(doc(db, "annonces", id));
    const data = snap.data();
    await updateDoc(doc(db, "annonces", id), { status: "rejected", updatedAt: serverTimestamp() });
    await addLog("annonce_rejected", `Refusée : ${data.title || id}`);
    showToast("Annonce refusée.", "success");
    loadAllData();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Supprimer une annonce
window.deleteListing = async (id) => {
  if (!confirm("Supprimer définitivement cette annonce ?")) return;
  try {
    const snap = await getDoc(doc(db, "annonces", id));
    const data = snap.data();
    await deleteDoc(doc(db, "annonces", id));
    await addLog("annonce_deleted", `Supprimée : ${data.title || id}`);
    showToast("Annonce supprimée.", "success");
    loadAllData();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Supprimer un utilisateur
window.deleteUser = async (id) => {
  if (!confirm("Supprimer définitivement cet utilisateur ?")) return;
  try {
    const snap = await getDoc(doc(db, "users", id));
    const data = snap.data();
    await deleteDoc(doc(db, "users", id));
    await addLog("user_deleted", `Supprimé : ${data.displayName || id}`);
    showToast("Utilisateur supprimé.", "success");
    loadAllData();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Changer le rôle d'un utilisateur
window.changeRole = async (userId, newRole) => {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    const data = snap.data();
    await updateDoc(doc(db, "users", userId), { role: newRole, updatedAt: serverTimestamp() });
    await addLog("role_changed", `${data.displayName || userId} → ${newRole}`);
    showToast(`Rôle changé en : ${newRole}`, "success");
    loadUsers();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Résoudre un signalement
window.resolveReport = async (reportId, action) => {
  try {
    const reportSnap = await getDoc(doc(db, "reports", reportId));
    const report = reportSnap.data();

    if (action === "delete" && report.annonceId) {
      await deleteDoc(doc(db, "annonces", report.annonceId));
      await addLog("report_resolved_delete", `Signalement supprimé : ${report.annonceId}`);
    } else if (action === "keep") {
      await addLog("report_resolved_keep", `Signalement conservé : ${report.annonceId}`);
    } else {
      await addLog("report_resolved_ignore", `Signalement ignoré : ${report.annonceId}`);
    }

    await updateDoc(doc(db, "reports", reportId), {
      resolved: true,
      resolvedAt: serverTimestamp(),
      resolvedBy: currentProfile.displayName || "Admin",
      action: action
    });

    showToast(`Signalement ${action === "delete" ? "supprimé" : action === "keep" ? "conservé" : "ignoré"}`, "success");
    loadAllData();
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// Ouvrir le modal d'édition (exposé globalement)
window.openEditModal = async (id) => {
  try {
    const snap = await getDoc(doc(db, "annonces", id));
    if (!snap.exists()) {
      showToast("Annonce introuvable.", "error");
      return;
    }
    openEditModal({ id: snap.id, ...snap.data() });
  } catch (error) {
    showToast("Erreur : " + error.message, "error");
  }
};

// =========================================================
// UTILITAIRES
// =========================================================
function escapeHTML(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
