/* =======================================================
   CAMU SERVICES - JAVASCRIPT GLOBAL & UTILITAIRES
   ======================================================= */

// 1. Gestion du volet latéral (Sidebar)
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('active')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// 2. Notifications Toast élégantes (Remplace les alert() classiques)
function showToast(message, icon = "fa-circle-check") {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 50);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 3. Partage fluide d'une annonce
function shareAd(title, id) {
  const shareData = {
    title: title,
    text: `Découvrez le service "${title}" sur CAMU SERVICES !`,
    url: window.location.origin + window.location.pathname + `?ad=${id}`
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareData.url);
    showToast("Lien de l'annonce copié !", "fa-copy");
  }
}
