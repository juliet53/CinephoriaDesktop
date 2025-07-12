const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';
const token = localStorage.getItem('token');

// Chargement des incidents
async function loadIncidents() {
  try {
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

      const tdSalle = document.createElement('td');
      tdSalle.textContent = salleNum;
      row.appendChild(tdSalle);

      const tdCinema = document.createElement('td');
      tdCinema.textContent = cinemaNom;
      row.appendChild(tdCinema);

      const tdDescription = document.createElement('td');
      tdDescription.textContent = incident.description;
      row.appendChild(tdDescription);

      const tdStatut = document.createElement('td');
      tdStatut.textContent = incident.statut;
      row.appendChild(tdStatut);

      list.appendChild(row);
    });

  } catch (error) {
    console.error('Erreur lors du chargement des incidents :', error);
  }
}

// Chargement des cinémas dans le select
async function loadCinemas() {
  try {
    const res = await fetch(`${API_URL}/cinemas`, {
      headers: {
        Authorization: `Bearer ${token}`
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
      option.textContent = cinema.nom;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Erreur lors du chargement des cinémas :', err);
  }
}

// Chargement des salles selon le cinéma sélectionné
async function loadSallesByCinema(cinemaId) {
  try {
    const salleSelect = document.getElementById('salle-select');
    salleSelect.innerHTML = '<option value="">-- Choisir une salle --</option>';

    if (!cinemaId) {
      console.log('Pas de cinéma sélectionné');
      return;
    }

    const res = await fetch(`${API_URL}/salles`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
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

// Soumission du formulaire d'incident
document.getElementById('incident-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const salle = document.getElementById('salle-select').value;
  const statut = document.getElementById('statut').value;

  if (!salle) {
    alert("Veuillez sélectionner une salle.");
    return;
  }

  if (!description || /<script.*?>/i.test(description)) {
    alert("Description invalide ou potentiellement dangereuse.");
    return;
  }

  const body = JSON.stringify({ description, salle, statut });
  console.log("Données envoyées:", body);

  try {
    const res = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`
      },
      body: body
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

// Mise à jour des salles lors du changement de cinéma
document.getElementById('cinema-select').addEventListener('change', (e) => {
  const selectedCinemaId = e.target.value;
  loadSallesByCinema(selectedCinemaId);
});

// Initialisation
loadCinemas();
loadIncidents();
