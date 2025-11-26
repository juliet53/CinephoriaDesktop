import * as storage from './secureStorage.js';

export async function protectPage(allowedRoles = []) {
  try {
    const token = await storage.getToken();

    // Pas connecté donc Go a la connexion
    if (!token) {
      window.location.href = 'index.html';
      return;
    }

    // Vérifie si le token est expiré
    if (isTokenExpired(token)) {
      alert("Session expirée. Veuillez vous reconnecter.");
      await storage.removeToken();
      window.location.href = 'index.html';
      return;
    }

    // Aucun rôle requis
    if (allowedRoles.length === 0) return;

    // Vérifie les rôles
    const roles = getRolesFromToken(token);
    const hasAccess = roles.some(role => allowedRoles.includes(role));
    if (!hasAccess) {
      alert("Accès refusé.");
      window.location.href = 'index.html';
    }
  } catch (e) {
    console.error('Erreur lors de la protection de la page', e);
    window.location.href = 'index.html';
  }
}

// Vérifie l’expiration du token
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

// Récupère les rôles depuis le token
function getRolesFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roles || [];
  } catch (e) {
    console.error('Impossible de lire les rôles du token', e);
    return [];
  }
}
