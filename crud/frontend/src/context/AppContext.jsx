import { createContext, useState, useEffect } from "react";
import api from "../service/api"; // usa o mesmo axios configurado

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Carrega usuário salvo
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (user && token) setCurrentUser({ ...user, token });
  }, []);

  // Atualiza localStorage sempre que mudar
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      localStorage.setItem("token", currentUser.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [currentUser]);

  // Login
  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    const { user, token } = res.data;
    setCurrentUser({ ...user, token });
    return { user, token };
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    localStorage.clear();
  };

  // Carregar dados
  useEffect(() => {
    if (!currentUser) return;

    const fetchAll = async () => {
      try {
        const [cat, fin, com, proj, task, usr] = await Promise.all([
          api.get("/categories"),
          api.get("/financials"),
          api.get("/communications"),
          api.get("/projects"),
          api.get("/tasks"),
          api.get("/users"),
        ]);
        setCategories(cat.data);
        setFinancials(fin.data);
        setCommunications(com.data);
        setProjects(proj.data);
        setTasks(task.data);
        setUsers(usr.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    fetchAll();
  }, [currentUser]);

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
        setCurrentUser,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
