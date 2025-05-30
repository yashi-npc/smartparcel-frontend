// src/api/auth.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/parceltrack'; // Adjust if your port or app name differs

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const logout =()=> {
  // Clear any stored tokens or user data
  localStorage.removeItem('token');
  // redirect to login page
  window.location.href = '/';
};