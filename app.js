// Gestion de la barre latérale (Sidebar)
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }
}

// Fonction de partage
function shareAd(title, id) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: `Regardez cette offre sur CAMU SERVICES : ${title}`,
      url: window.location.href
    }).catch(() => {});
  } else {
    alert("Lien de l'annonce copié !");
  }
}

// Message de notification Toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.zIndex = '1000';
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}
