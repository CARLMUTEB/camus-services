// Fonctions d'ouverture et fermeture du menu latéral (Sidebar)
function openSidebar() {
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// Notification Toast basique
function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #323232;
    color: #fff;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 12px;
    z-index: 1000;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Fonction de partage d'annonce
function shareAd(title, id) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: `Découvrez ce service sur CAMU SERVICES : ${title}`,
      url: window.location.href
    }).catch(() => {});
  } else {
    showToast("Lien copié dans le presse-papier !");
  }
}
