import { createContext, useState, useEffect } from "react";
import api from "../service/api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Estados iniciais
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);

  // Recupera usuário e token do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      // Valida token no backend
      api
        .get("/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setCurrentUser({ ...res.data, token });
        })
        .catch(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setCurrentUser(null);
        })
        .finally(() => setLoadingUser(false));
    } else {
      setLoadingUser(false);
    }
  }, []);

  // Atualiza localStorage sempre que mudar currentUser
  useEffect(() => {
    if (currentUser) {
      const { token, ...userData } = currentUser;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
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

  // Carrega dados do backend só depois que o usuário estiver logado
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

        setCategories(cat.data || []);
        setFinancials(fin.data || []);
        setCommunications(com.data || []);
        setProjects(proj.data || []);
        setTasks(task.data || []);
        setUsers(usr.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    fetchAll();
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        loadingUser,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
