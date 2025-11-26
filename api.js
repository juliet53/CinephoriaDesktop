const API_URL = 'https://cinephoriaappj-2943b0896e8f.herokuapp.com/api'; 

export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/login_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    return await res.json();
  } catch (err) {
    console.error("Erreur lors du login", err);
    return null;
  }
}