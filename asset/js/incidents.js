import * as storage from './secureStorage.js';
const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';

// 🔹 Fonction pour récupérer le token sécurisé
async function getToken() {
  return await storage.getToken();
}

// Chargement des incidents
async function loadIncidents() {
  try {
    const token = await getToken();

    const res = await fetch(`${API_URL}/incidents`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/ld+json',
      }
    });

    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);

    const data = await res.json();
    const incidents = Array.isArray(data['hydra:member'])
      ? data['hydra:member']
      : Array.isArray(data['member'])
        ? data['member']
        : Array.isArray(data)
          ? data
          : [];

    const list = document.getElementById('incident-list');
    list.innerHTML = '';

    if (incidents.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.className = 'text-center';
      cell.textContent = 'Aucun incident trouvé.';
      row.appendChild(cell);
      list.appendChild(row);
      return;
    }

    incidents.forEach(incident => {
      const salleNum = incident.salle?.numero ?? '(salle inconnue)';
      const cinemaNom = incident.salle?.cinema?.nom ?? '(cinéma inconnu)';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${salleNum}</td>
        <td>${cinemaNom}</td>
        <td>${incident.description}</td>
        <td>${incident.statut}</td>
      `;
      list.appendChild(row);
    });

  } catch (error) {
    console.error('Erreur lors du chargement des incidents :', error);
  }
}

// Chargement des cinémas
async function loadCinemas() {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/cinemas`, {
      headers: { Authorization: `Bearer ${token}` }
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
      option.textContent = cinema.nom;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Erreur lors du chargement des cinémas :', err);
  }
}

// Chargement des salles par cinéma
async function loadSallesByCinema(cinemaId) {
  try {
    const token = await getToken();
    const salleSelect = document.getElementById('salle-select');
    salleSelect.innerHTML = '<option value="">-- Choisir une salle --</option>';

    if (!cinemaId) return;

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
        option.textContent = `Salle ${salle.numero}`;
        salleSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.error('Erreur lors du chargement des salles :', err);
  }
}

// Soumission du formulaire
document.getElementById('incident-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = await getToken();
  const description = document.getElementById('description').value.trim();
  const salle = document.getElementById('salle-select').value;
  const statut = document.getElementById('statut').value;

  if (!salle) { alert("Veuillez sélectionner une salle."); return; }
  if (!description || /<script.*?>/i.test(description)) { alert("Description invalide."); return; }

  try {
    const res = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/ld+json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description, salle, statut })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('Erreur API:', errorData || res.statusText);
      alert("Erreur lors de l'ajout de l'incident");
      return;
    }

    document.getElementById('incident-form').reset();
    document.getElementById('salle-select').innerHTML = '<option value="">-- Choisir une salle --</option>';
    loadIncidents();
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'incident :", error);
  }
});

// Je change mes salle en fonction du cinema
document.getElementById('cinema-select').addEventListener('change', (e) => {
  loadSallesByCinema(e.target.value);
});

// Initialisation
loadCinemas();
loadIncidents();
