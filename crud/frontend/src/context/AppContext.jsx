import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const API_URL = "https://sistema-salt.vercel.app/";

  // Carregar token e usuário do localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (token && user) setCurrentUser({ ...user, token });
  }, []);

  // Salvar token e usuário no localStorage
  useEffect(() => {
    if (currentUser?.token) {
      localStorage.setItem("token", currentUser.token);
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // Config axios com token
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: currentUser ? `Bearer ${currentUser.token}` : "",
    },
  });

  // Carregar dados do backend
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const [catRes, finRes, comRes, projRes, taskRes, userRes] =
          await Promise.all([
            axiosInstance.get("/categories"),
            axiosInstance.get("/financials"),
            axiosInstance.get("/communications"),
            axiosInstance.get("/projects"),
            axiosInstance.get("/tasks"),
            axiosInstance.get("/users"),
          ]);

        setCategories(catRes.data);
        setFinancials(finRes.data);
        setCommunications(comRes.data);
        setProjects(projRes.data);
        setTasks(taskRes.data);
        setUsers(userRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    fetchData();
  }, [currentUser]);

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const { user, token } = res.data;
      setCurrentUser({ ...user, token });
      return true;
    } catch (err) {
      console.error("Erro no login:", err.response?.data?.error || err.message);
      return false;
    }
  };

  // Logout
  const logout = () => setCurrentUser(null);

  return (
    <AppContext.Provider
      value={{
        categories,
        setCategories,
        financials,
        setFinancials,
        communications,
        setCommunications,
        projects,
        setProjects,
        tasks,
        setTasks,
        users,
        setUsers,
        currentUser,
        login,
        logout,
        axiosInstance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
