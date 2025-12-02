import * as storage from './secureStorage.js';
const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';

// XSS
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// les cinemas
async function loadCinemas() {
  const token = await storage.getToken();
  if (!token) {
    alert('Veuillez vous connecter.');
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/cinemas`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);
    const data = await res.json();
    const cinemas = Array.isArray(data['hydra:member'])
      ? data['hydra:member']
      : Array.isArray(data['member'])
        ? data['member']
        : Array.isArray(data)
          ? data
          : [];

    const select = document.getElementById('cinema-select');
    select.innerHTML = '<option value="">-- Choisir un cinéma --</option>';
    cinemas.forEach(cinema => {
      const option = document.createElement('option');
      option.value = cinema.id;
      option.textContent = escapeHTML(cinema.nom);
      select.appendChild(option);
    });

  } catch (err) {
    console.error('Erreur lors du chargement des cinémas :', err);
    alert('Erreur lors du chargement des cinémas : ' + err.message);
  }
}

// salles selon le cinéma
async function loadSallesByCinema(cinemaId) {
  if (!cinemaId) return;

  const token = await storage.getToken();
  if (!token) {
    alert('Token manquant, veuillez vous reconnecter.');
    window.location.href = 'index.html';
    return;
  }

  try {
    const salleSelect = document.getElementById('salle-select');
    salleSelect.innerHTML = '<option value="">-- Choisir une salle --</option>';

    const res = await fetch(`${API_URL}/salles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);

    const data = await res.json();
    const salles = Array.isArray(data['hydra:member'])
      ? data['hydra:member']
      : Array.isArray(data['member'])
        ? data['member']
        : Array.isArray(data)
          ? data
          : [];

    salles.forEach(salle => {
      let salleCinemaId;
      if (typeof salle.cinema === 'object' && salle.cinema !== null) {
        salleCinemaId = salle.cinema.id ?? salle.cinema['@id']?.split('/').pop();
      } else if (typeof salle.cinema === 'string') {
        salleCinemaId = salle.cinema.split('/').pop();
      }

      if (String(salleCinemaId) === String(cinemaId)) {
        const option = document.createElement('option');
        option.value = salle['@id'];
        option.textContent = `Salle ${escapeHTML(salle.numero)}`;
        salleSelect.appendChild(option);
      }
    });

  } catch (err) {
    console.error('Erreur lors du chargement des salles :', err);
  }
}

// Form
document.getElementById('incident-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = await storage.getToken();
  if (!token) {
    alert('Token manquant, veuillez vous reconnecter.');
    window.location.href = '../index.html';
    return;
  }

  const description = document.getElementById('description').value.trim();
  const salle = document.getElementById('salle-select').value;
  const statut = document.getElementById('statut').value;

  if (!salle) { alert("Veuillez sélectionner une salle."); return; }
  if (!description || /<script.*?>/i.test(description)) { alert("Description invalide."); return; }

  try {
    const res = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/ld+json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ description, salle, statut })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('Erreur API:', errorData || res.statusText);
      alert("Erreur lors de l'ajout de l'incident");
      return;
    }

    alert("Incident ajouté avec succès !");
    document.getElementById('incident-form').reset();
    document.getElementById('salle-select').innerHTML = '<option value="">-- Choisir une salle --</option>';

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'incident :', error);
  }
});

// change de cine je recharge les salles
document.getElementById('cinema-select').addEventListener('change', (e) => {
  loadSallesByCinema(e.target.value);
});

// dEconnexion
async function logout() {
  await storage.removeToken();
  window.location.href = '../index.html';
}

// bouton logout
document.getElementById('logout-btn').addEventListener('click', logout);

// 🚀 Initialisation
loadCinemas();
