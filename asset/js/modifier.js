import * as storage from './secureStorage.js';

const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';
let incidentId = localStorage.getItem('incidentToEdit'); 

// Fonction pour échappe le html
function escapeHTML(str) {
  return str?.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;') || '';
}

// Nettoyage du chemin s'il commence par /api/
if (incidentId && incidentId.startsWith('/')) {
  incidentId = incidentId.replace(/^\/api\//, '');
}


async function loadIncident() {
  if (!incidentId) return;

  try {
    const token = await storage.getToken(); 

    const res = await fetch(`${API_URL}/${incidentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/ld+json',
      }
    });

    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);

    const data = await res.json();
    document.getElementById('description').value = escapeHTML(data.description);
    document.getElementById('statut').value = escapeHTML(data.statut);

  } catch (err) {
    console.error("Erreur lors du chargement :", err);
    alert("Impossible de charger l'incident.");
  }
}

// envoie form
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const statut = document.getElementById('statut').value;

  if (!description || /<script.*?>/i.test(description)) {
    alert("Description invalide ou potentiellement dangereuse.");
    return;
  }

  try {
    const token = await storage.getToken(); 

    const res = await fetch(`${API_URL}/${incidentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
        Accept: 'application/ld+json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ description, statut })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.error("Erreur API :", errData || res.statusText);
      alert("Erreur lors de la mise à jour");
      return;
    }

    alert("Incident modifié !");
    window.location.href = '../public/incidents.html';

  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
  }
});


loadIncident();
