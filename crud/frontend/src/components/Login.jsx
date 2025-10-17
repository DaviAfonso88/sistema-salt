import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

export default function Login() {
  const { setCurrentUser, apiUrl } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/login`, { email, password });

      // Supondo que a API retorne { user, token }
      const { user, token } = res.data;

      // Salva no contexto e localStorage
      setCurrentUser(user);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Login realizado com sucesso!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      console.error(err);
      toast.error("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121214]">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="card w-96 p-8 flex flex-col gap-4">
        <h1 className="text-2xl text-center">Login</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mb-2"
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="mb-4"
          disabled={loading}
        />

        <button
          onClick={handleLogin}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
