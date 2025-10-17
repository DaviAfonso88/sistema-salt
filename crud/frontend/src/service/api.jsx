import axios from "axios";

const api = axios.create({
  baseURL: "sistema-alpha-rouge.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
