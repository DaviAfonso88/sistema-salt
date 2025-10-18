import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, token } = await login(email, password);

      toast.success(`Bem-vindo, ${user.name}!`);
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error("Erro ao logar:", err);
      toast.error("Email ou senha inválidos!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#121214] to-[#1f1f22]">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg w-96 border border-white/10">
        <h1 className="text-3xl font-semibold text-center mb-6 text-white">
          Acesse sua conta
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Não tem conta ainda?{" "}
            <button
              onClick={() => navigate("/register")}
              className="hover:text-blue-300 font-medium underline"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
