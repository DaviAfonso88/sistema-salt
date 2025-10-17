import axios from "axios";

const api = axios.create({
  baseURL: "https://sistema-salt.vercel.app/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
