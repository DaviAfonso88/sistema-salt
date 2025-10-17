import axios from "axios";

const api = axios.create({
  baseURL: "https://sistema-salt.vercel.app/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Adiciona o token automaticamente se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
