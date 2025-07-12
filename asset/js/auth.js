export function protectPage(allowedRoles = []) {
  const token = localStorage.getItem('token');
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');

  // Pas connecté
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Vérifie si le token est expiré
  if (isTokenExpired(token)) {
    alert("Session expirée. Veuillez vous reconnecter.");
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    window.location.href = 'index.html';
    return;
  }

  // Si aucun rôle requis → juste connecté = OK
  if (allowedRoles.length === 0) return;

  // Sinon, on vérifie les rôles
  const hasAccess = roles.some(role => allowedRoles.includes(role));
  if (!hasAccess) {
    alert("Accès refusé.");
    window.location.href = 'index.html';
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch (e) {
    console.error('Token invalide ou illisible', e);
    return true;
  }
}
