const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api';

// 🔐 Fonction d'échappement XSS
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 🎬 Chargement des cinémas
async function loadCinemas() {
  const token = localStorage.getItem('token'); // <-- Récupérer ici
  console.log('Token envoyé:', token);
  if (!token) {
    console.error('Aucun token. Redirection vers login.');
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
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur HTTP : ${res.status} - ${errorText}`);
    }
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

// 🏟️ Chargement des salles selon le cinéma
async function loadSallesByCinema(cinemaId) {
  if (!cinemaId) return;

  try {
    const token = localStorage.getItem('token'); // <-- Récupérer ici aussi !

    if (!token) {
      alert('Token manquant, veuillez vous reconnecter.');
      window.location.href = 'index.html';
      return;
    }

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

// 📝 Soumission du formulaire
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

  const token = localStorage.getItem('token'); 

  if (!token) {
    alert('Token manquant, veuillez vous reconnecter.');
    window.location.href = '../index.html';
    return;
  }

  const body = JSON.stringify({ description, salle, statut });

  try {
    const res = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`
      },
      body
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

// 🎛️ Changement de cinéma → recharger les salles
document.getElementById('cinema-select').addEventListener('change', (e) => {
  const selectedCinemaId = e.target.value;
  loadSallesByCinema(selectedCinemaId);
});

// Fonction logout (supprime token et redirige)
function logout() {
  localStorage.removeItem('token');
  window.location.href = '../index.html';
}

// 🚀 Initialisation
loadCinemas();
