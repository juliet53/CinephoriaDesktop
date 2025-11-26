import * as storage from './secureStorage.js';

const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';

// Récup token
async function getToken() {
  return await storage.getToken();
}

// les incidents
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
      cell.colSpan = 5;
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

      // Salle numéro
      const tdSalle = document.createElement('td');
      tdSalle.textContent = salleNum;
      row.appendChild(tdSalle);

      // Cinéma nom
      const tdCinema = document.createElement('td');
      tdCinema.textContent = cinemaNom;
      row.appendChild(tdCinema);

      // Description
      const tdDescription = document.createElement('td');
      tdDescription.textContent = incident.description ?? '';
      row.appendChild(tdDescription);

      // Statut
      const tdStatut = document.createElement('td');
      tdStatut.textContent = incident.statut ?? '';
      row.appendChild(tdStatut);

      // Actions (Modifier / Supprimer)
      const tdActions = document.createElement('td');

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn btn-sm btn-warning me-2';
      btnEdit.textContent = 'Modifier';
      btnEdit.addEventListener('click', () => editIncident(incident['@id']));
      tdActions.appendChild(btnEdit);

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn btn-sm btn-danger';
      btnDelete.textContent = 'Supprimer';
      btnDelete.addEventListener('click', () => deleteIncident(incident['@id']));
      tdActions.appendChild(btnDelete);

      row.appendChild(tdActions);
      list.appendChild(row);
    });

  } catch (error) {
    console.error('Erreur lors du chargement des incidents :', error);
  }
}

// Supp un incident
async function deleteIncident(id) {
  if (!confirm("Voulez-vous vraiment supprimer cet incident ?")) return;

  try {
    const token = await getToken();
    const url = id.startsWith('http') ? id : `${API_URL}${id}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);

    alert("Incident supprimé !");
    loadIncidents();
  } catch (err) {
    console.error('Erreur lors de la suppression :', err);
    alert("Erreur lors de la suppression de l'incident.");
  }
}

// Modifier un incident
function editIncident(id) {
  localStorage.setItem('incidentToEdit', id); 
  window.location.href = '../public/modifier.html';
}


loadIncidents();
