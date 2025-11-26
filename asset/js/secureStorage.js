
export async function setToken(token) {
  await window.electronAPI.saveToken(token);
}

export async function getToken() {
  return await window.electronAPI.getToken();
}

export async function removeToken() {
  await window.electronAPI.deleteToken();
}
 