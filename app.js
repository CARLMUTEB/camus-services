/* =======================================================
   GESTION DU VOLET LATÉRAL (SIDEBAR)
   ======================================================= */
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
