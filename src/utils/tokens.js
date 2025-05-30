// Save JWT token to localStorage
export const setToken = (token) => {
    localStorage.setItem('token',token);
};

// Retrieve the token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove the token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Optionally: decode token to get info (if needed)
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  const payload = token.split('.')[1];
  try {
    return JSON.parse(atob(payload)); // Decodes base64 payload
  } catch (e) {
    console.error('Invalid token');
    return null;
  }
};